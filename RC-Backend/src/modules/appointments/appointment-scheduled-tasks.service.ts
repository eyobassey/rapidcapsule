import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  AttendanceStatus,
  MeetingChannel,
} from './entities/appointment.entity';
import { Zoom } from '../../common/external/zoom/zoom';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { appointmentReminderEmail } from '../../core/emails/mails/appointmentReminderEmail';
import { AppointmentEscrowService } from '../accounting/services/appointment-escrow.service';

@Injectable()
export class AppointmentScheduledTasksService {
  private readonly logger = new Logger(AppointmentScheduledTasksService.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly zoom: Zoom,
    private readonly generalHelpers: GeneralHelpers,
    private readonly appointmentEscrowService: AppointmentEscrowService,
  ) {}

  /**
   * Run every 30 minutes to intelligently handle past appointments
   * Smart missed logic:
   * - For Zoom meetings: Check Zoom API for actual attendance before marking as missed
   * - For non-Zoom: Mark as missed after grace period
   *
   * An appointment is considered missed if:
   * - Status is OPEN
   * - Start time has passed the grace period (2 hours)
   * - No one attended (verified via Zoom API for Zoom meetings)
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async handleMissedAppointments(): Promise<void> {
    this.logger.log('Starting smart missed appointments check...');

    try {
      // Grace period: 2 hours after scheduled start time (allows for late starts)
      const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
      const cutoffTime = new Date(Date.now() - gracePeriodMs);

      // Find all OPEN appointments that have passed the grace period
      const openAppointments = await this.appointmentModel.find({
        status: AppointmentStatus.OPEN,
        start_time: { $lt: cutoffTime },
      });

      this.logger.log(`Found ${openAppointments.length} OPEN appointments past grace period`);

      let completedCount = 0;
      let missedCount = 0;

      for (const appointment of openAppointments) {
        try {
          const result = await this.processAppointmentStatus(appointment);
          if (result === 'completed') completedCount++;
          if (result === 'missed') missedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to process appointment ${appointment._id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Processed appointments: ${completedCount} marked COMPLETED, ${missedCount} marked MISSED`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process missed appointments: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process individual appointment to determine if it was completed or missed
   */
  private async processAppointmentStatus(
    appointment: AppointmentDocument,
  ): Promise<'completed' | 'missed' | 'unchanged'> {
    const meetingChannel = appointment.meeting_channel || MeetingChannel.ZOOM;

    // For Zoom meetings, check actual attendance via API
    if (meetingChannel === MeetingChannel.ZOOM && appointment.meeting_id) {
      return await this.processZoomAppointment(appointment);
    }

    // For non-Zoom meetings, mark as missed (no way to verify attendance)
    // In the future, could add WhatsApp/phone call verification
    await this.appointmentModel.updateOne(
      { _id: appointment._id },
      {
        status: AppointmentStatus.MISSED,
        'attendance.attendance_status': AttendanceStatus.NONE,
        updated_at: new Date(),
      },
    );

    // Settle escrow for no-show (specialist still gets paid, platform gets fees)
    if (appointment.escrow?.status === 'held') {
      try {
        const settleBatch = await this.appointmentEscrowService.settleAppointmentFunds({
          appointment_id: appointment._id.toString(),
          settlement_type: 'no_show',
        });
        this.logger.log(`Escrow settled (no-show) for missed non-Zoom appointment ${appointment._id}`);

        // Update appointment with settlement details
        await this.appointmentModel.updateOne(
          { _id: appointment._id },
          {
            'escrow.status': 'settled',
            'escrow.settled_at': new Date(),
            'escrow.settlement_batch_id': settleBatch.batch_id,
            'escrow.settlement_type': 'no_show',
          },
        );
      } catch (escrowError) {
        this.logger.error(
          `Failed to settle escrow for missed appointment ${appointment._id}: ${escrowError.message}`,
        );
      }
    }

    return 'missed';
  }

  /**
   * Process Zoom appointment by checking actual attendance via Zoom API
   */
  private async processZoomAppointment(
    appointment: AppointmentDocument,
  ): Promise<'completed' | 'missed' | 'unchanged'> {
    const meetingId = appointment.meeting_id;
    const meetingUuid = appointment.meeting_platform_data?.zoom_meeting_uuid;

    // Use UUID if available (more reliable for past meetings)
    const meetingIdToUse = meetingUuid || meetingId;

    this.logger.debug(`Checking Zoom attendance for meeting ${meetingIdToUse}`);

    // Fetch participants from Zoom API
    const participants = await this.zoom.getPastMeetingParticipants(meetingIdToUse);

    if (participants.length > 0) {
      // Meeting was attended - determine attendance status and mark as completed
      const attendanceStatus = this.determineAttendanceStatus(appointment, participants);

      // Map participants to our schema
      const mappedParticipants = participants.map((p) => ({
        participant_id: p.id || p.user_id,
        name: p.name,
        email: p.user_email,
        user_type: this.determineUserType(appointment, p.user_email),
        join_time: p.join_time ? new Date(p.join_time) : null,
        leave_time: p.leave_time ? new Date(p.leave_time) : null,
        duration_minutes: p.duration,
      }));

      // Calculate total duration from participants
      const totalDuration = participants.reduce((sum, p) => sum + (p.duration || 0), 0);
      const avgDuration = Math.round(totalDuration / participants.length);

      await this.appointmentModel.updateOne(
        { _id: appointment._id },
        {
          status: AppointmentStatus.COMPLETED,
          'attendance.attendance_status': attendanceStatus,
          'attendance.patient_joined': attendanceStatus === AttendanceStatus.PATIENT_ONLY || attendanceStatus === AttendanceStatus.BOTH,
          'attendance.specialist_joined': attendanceStatus === AttendanceStatus.SPECIALIST_ONLY || attendanceStatus === AttendanceStatus.BOTH,
          'attendance.both_joined': attendanceStatus === AttendanceStatus.BOTH,
          participants: mappedParticipants,
          'call_duration.time_taken': avgDuration,
          'call_duration.unit': 'Minutes',
          'call_duration.formatted_string': `${avgDuration} Minutes`,
          updated_at: new Date(),
        },
      );

      // Settle escrow if funds were held (release to specialist and platform)
      if (appointment.escrow?.status === 'held') {
        try {
          const settleBatch = await this.appointmentEscrowService.settleAppointmentFunds({
            appointment_id: appointment._id.toString(),
            settlement_type: 'completed',
          });
          this.logger.log(`Escrow settled for completed appointment ${appointment._id}`);

          // Update appointment with settlement details
          await this.appointmentModel.updateOne(
            { _id: appointment._id },
            {
              'escrow.status': 'settled',
              'escrow.settled_at': new Date(),
              'escrow.settlement_batch_id': settleBatch.batch_id,
              'escrow.settlement_type': 'completed',
            },
          );
        } catch (escrowError) {
          this.logger.error(
            `Failed to settle escrow for appointment ${appointment._id}: ${escrowError.message}`,
          );
        }
      }

      this.logger.log(
        `Appointment ${appointment._id} marked COMPLETED (attendance: ${attendanceStatus}, ${participants.length} participants)`,
      );

      return 'completed';
    }

    // No participants found - truly missed
    await this.appointmentModel.updateOne(
      { _id: appointment._id },
      {
        status: AppointmentStatus.MISSED,
        'attendance.attendance_status': AttendanceStatus.NONE,
        updated_at: new Date(),
      },
    );

    // Settle escrow for no-show (specialist still gets paid, platform gets fees)
    if (appointment.escrow?.status === 'held') {
      try {
        const settleBatch = await this.appointmentEscrowService.settleAppointmentFunds({
          appointment_id: appointment._id.toString(),
          settlement_type: 'no_show',
        });
        this.logger.log(`Escrow settled (no-show) for missed appointment ${appointment._id}`);

        // Update appointment with settlement details
        await this.appointmentModel.updateOne(
          { _id: appointment._id },
          {
            'escrow.status': 'settled',
            'escrow.settled_at': new Date(),
            'escrow.settlement_batch_id': settleBatch.batch_id,
            'escrow.settlement_type': 'no_show',
          },
        );
      } catch (escrowError) {
        this.logger.error(
          `Failed to settle escrow for missed appointment ${appointment._id}: ${escrowError.message}`,
        );
      }
    }

    this.logger.log(`Appointment ${appointment._id} marked MISSED (no participants found)`);

    return 'missed';
  }

  /**
   * Determine user type based on email matching
   */
  private determineUserType(
    appointment: AppointmentDocument,
    email: string,
  ): 'patient' | 'specialist' | 'unknown' {
    if (!email) return 'unknown';

    // Get populated user emails if available
    const patientEmail = (appointment.patient as any)?.profile?.contact?.email;
    const specialistEmail = (appointment.specialist as any)?.profile?.contact?.email;

    if (patientEmail && email.toLowerCase() === patientEmail.toLowerCase()) {
      return 'patient';
    }
    if (specialistEmail && email.toLowerCase() === specialistEmail.toLowerCase()) {
      return 'specialist';
    }

    return 'unknown';
  }

  /**
   * Determine attendance status from participants list
   */
  private determineAttendanceStatus(
    appointment: AppointmentDocument,
    participants: any[],
  ): AttendanceStatus {
    if (participants.length === 0) {
      return AttendanceStatus.NONE;
    }

    let patientJoined = false;
    let specialistJoined = false;

    for (const p of participants) {
      const userType = this.determineUserType(appointment, p.user_email);
      if (userType === 'patient') patientJoined = true;
      if (userType === 'specialist') specialistJoined = true;
    }

    if (patientJoined && specialistJoined) return AttendanceStatus.BOTH;
    if (patientJoined) return AttendanceStatus.PATIENT_ONLY;
    if (specialistJoined) return AttendanceStatus.SPECIALIST_ONLY;

    // If participants exist but couldn't match emails, assume both joined if 2+ participants
    return participants.length >= 2 ? AttendanceStatus.BOTH : AttendanceStatus.NONE;
  }

  /**
   * Run daily at midnight to generate appointment stats/reports
   * Can be extended to send summary emails, generate reports, etc.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAppointmentStats(): Promise<void> {
    this.logger.log('Starting daily appointment stats job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get yesterday's stats
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [totalYesterday, completedYesterday, missedYesterday, cancelledYesterday] =
        await Promise.all([
          this.appointmentModel.countDocuments({
            start_time: { $gte: yesterday, $lt: today },
          }),
          this.appointmentModel.countDocuments({
            start_time: { $gte: yesterday, $lt: today },
            status: 'COMPLETED',
          }),
          this.appointmentModel.countDocuments({
            start_time: { $gte: yesterday, $lt: today },
            status: 'MISSED',
          }),
          this.appointmentModel.countDocuments({
            start_time: { $gte: yesterday, $lt: today },
            status: 'CANCELLED',
          }),
        ]);

      this.logger.log(
        `Yesterday's appointment stats: Total=${totalYesterday}, Completed=${completedYesterday}, Missed=${missedYesterday}, Cancelled=${cancelledYesterday}`,
      );

      // Get today's upcoming appointments
      const upcomingToday = await this.appointmentModel.countDocuments({
        start_time: { $gte: today, $lt: tomorrow },
        status: 'OPEN',
      });

      this.logger.log(`Today's upcoming appointments: ${upcomingToday}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate daily appointment stats: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Run every hour to send appointment reminder emails
   * Checks appointments based on their reminder_settings timing
   */
  @Cron('0 0 * * * *') // Every hour at minute 0
  async sendAppointmentReminders(): Promise<void> {
    this.logger.log('Starting appointment reminder check...');

    try {
      // Define timing windows in hours
      const timingHours = {
        '24h': 24,
        '12h': 12,
        '6h': 6,
        '3h': 3,
        '1h': 1,
      };

      let emailsSent = 0;

      for (const [timing, hours] of Object.entries(timingHours)) {
        // Calculate the time window for this reminder timing
        // We check appointments starting in (hours - 0.5) to (hours + 0.5) from now
        const now = new Date();
        const windowStart = new Date(now.getTime() + (hours - 0.5) * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + (hours + 0.5) * 60 * 60 * 1000);

        // Find appointments with email reminders enabled for this timing
        // that haven't had reminders sent yet
        const appointments = await this.appointmentModel
          .find({
            status: AppointmentStatus.OPEN,
            start_time: { $gte: windowStart, $lt: windowEnd },
            'reminder_settings.email.enabled': true,
            'reminder_settings.email.timing': timing,
            email_reminder_sent: { $ne: true }, // Track if reminder was sent
          })
          .populate('patient specialist', 'profile');

        this.logger.log(
          `Found ${appointments.length} appointments needing ${timing} email reminders`,
        );

        for (const appointment of appointments) {
          try {
            await this.sendReminderEmail(appointment);

            // Mark reminder as sent
            await this.appointmentModel.updateOne(
              { _id: appointment._id },
              { email_reminder_sent: true },
            );

            emailsSent++;
          } catch (error) {
            this.logger.error(
              `Failed to send reminder for appointment ${appointment._id}: ${error.message}`,
            );
          }
        }
      }

      this.logger.log(`Sent ${emailsSent} reminder emails`);
    } catch (error) {
      this.logger.error(
        `Failed to process appointment reminders: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send reminder email to both patient and specialist
   */
  private async sendReminderEmail(appointment: AppointmentDocument): Promise<void> {
    const patient = appointment.patient as any;
    const specialist = appointment.specialist as any;

    const patientEmail = patient?.profile?.contact?.email;
    const specialistEmail = specialist?.profile?.contact?.email;
    const patientName = `${patient?.profile?.first_name || ''} ${patient?.profile?.last_name || ''}`.trim();
    const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim();

    const startTime = new Date(appointment.start_time);
    const formattedDate = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send to patient
    if (patientEmail) {
      const emailHtml = appointmentReminderEmail({
        recipientName: patientName || 'Patient',
        appointmentDate: formattedDate,
        appointmentTime: formattedTime,
        otherPartyName: specialistName,
        appointmentType: appointment.appointment_type || 'Consultation',
        joinUrl: appointment.join_url,
        meetingChannel: appointment.meeting_channel || 'zoom',
        isSpecialist: false,
      });
      await this.generalHelpers.sendEmail(
        patientEmail,
        '⏰ Appointment Reminder - Rapid Capsule',
        emailHtml,
      );
      this.logger.debug(`Sent reminder email to patient: ${patientEmail}`);
    }

    // Send to specialist
    if (specialistEmail) {
      const emailHtml = appointmentReminderEmail({
        recipientName: specialistName || 'Doctor',
        appointmentDate: formattedDate,
        appointmentTime: formattedTime,
        otherPartyName: patientName,
        appointmentType: appointment.appointment_type || 'Consultation',
        joinUrl: appointment.start_url || appointment.join_url,
        meetingChannel: appointment.meeting_channel || 'zoom',
        isSpecialist: true,
      });
      await this.generalHelpers.sendEmail(
        specialistEmail,
        '⏰ Appointment Reminder - Rapid Capsule',
        emailHtml,
      );
      this.logger.debug(`Sent reminder email to specialist: ${specialistEmail}`);
    }
  }
}
