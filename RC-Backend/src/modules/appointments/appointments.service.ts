import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isEmpty } from 'lodash';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { InjectModel } from '@nestjs/mongoose';
import ical, {
  ICalAttendeeData,
  ICalAttendeeStatus,
  ICalAttendeeType,
  ICalCalendarMethod,
  ICalEventStatus,
} from 'ical-generator';
import { Model, Types } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './entities/appointment.entity';
import { MeetingStatus, Zoom } from '../../common/external/zoom/zoom';
import { GoogleCalendar } from '../../common/external/google-calendar/google-calendar';
import { UsersService } from '../users/users.service';
import { IJwtPayload } from '../auth/types/jwt-payload.type';
import { ClinicalNotesService } from '../clinical-notes/clinical-notes.service';
import * as moment from 'moment';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { appointmentScheduleEmail } from '../../core/emails/mails/appointmentScheduleEmail';
import { FAILED, PENDING, SUCCESS } from '../../core/constants';
import {
  countDocuments,
  create,
  find,
  findAndCountAll,
  findById,
  updateOne,
  updateOneAndReturn,
  upsert,
} from 'src/common/crud/crud';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { User, UserDocument, UserType } from '../users/entities/user.entity';
import { ICalendarType } from './types/appointment.types';
import { Messages } from '../../core/messages/messages';
import { QueryDto } from '../../common/helpers/url-query.dto';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import { PaymentsService } from '../payments/payments.service';
import { Status } from '../payments/entities/payment.entity';
import { QueryStatus } from './types/query.types';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ReferSpecialistDto } from './dto/refer-specialist.dto';
import {
  AppointmentReferral,
  AppointmentReferralDocument,
} from './entities/referral.entity';
import { MeetingNotesDto } from './dto/meeting-notes.dto';
import {
  AvailableSpecialistDto,
  RatingFilter,
} from './dto/available-specialist.dto';
import { AvailableTimesDto } from './dto/available-times.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { HealthCheckupService } from '../health-checkup/health-checkup.service';
import { AdvancedHealthScoreService } from '../advanced-health-score/advanced-health-score.service';
import { VitalsService } from '../vitals/vitals.service';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
} from '../prescriptions/entities/specialist-prescription.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
  VerificationStatus,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  PharmacyOrderStatus,
  PharmacyOrderType,
} from '../pharmacy/entities/pharmacy-order.entity';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(AppointmentReferral.name)
    private referralModel: Model<AppointmentReferralDocument>,
    @InjectModel(SpecialistPrescription.name)
    private specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private patientPrescriptionUploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(PharmacyOrder.name)
    private pharmacyOrderModel: Model<PharmacyOrderDocument>,
    private readonly zoom: Zoom,
    private readonly usersService: UsersService,
    private readonly generalHelpers: GeneralHelpers,
    private readonly taskCron: TaskScheduler,
    private readonly paymentHandler: PaymentHandler,
    private readonly adminSettingsService: AdminSettingsService,
    private readonly paymentService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly clinicalNotesService: ClinicalNotesService,
    private readonly healthCheckupService: HealthCheckupService,
    private readonly advancedHealthScoreService: AdvancedHealthScoreService,
    private readonly vitalsService: VitalsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}
  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
    currentUser: IJwtPayload,
  ) {
    const subscription = await this.subscriptionsService.getActiveSubscription(
      currentUser.sub,
    );
    const { date, time, meeting_channel } = createAppointmentDto;
    const appointmentStartTime = moment(`${date} ${time}`, true).toDate();

    // Prevent booking appointments in the past
    if (appointmentStartTime < new Date()) {
      throw new BadRequestException(
        'Cannot book appointment in the past. Please select a future date and time.'
      );
    }

    const appointment = await create(this.appointmentModel, {
      ...createAppointmentDto,
      start_time: appointmentStartTime,
      patient: currentUser.sub,
      meeting_class: subscription?.planId?.name || 'Free',
      meeting_channel: meeting_channel || 'zoom', // Default to zoom if not specified
    });

    // Handle meeting channel-specific logic
    if (appointment.meeting_channel === 'zoom') {
      return await this.scheduleZoomMeeting(appointment);
    } else if (appointment.meeting_channel === 'whatsapp') {
      return await this.scheduleWhatsAppMeeting(appointment);
    } else if (appointment.meeting_channel === 'google_meet') {
      return await this.scheduleGoogleMeet(appointment);
    } else if (appointment.meeting_channel === 'microsoft_teams') {
      return await this.scheduleTeamsMeeting(appointment);
    }

    // For phone and in_person, no meeting link needed
    await updateOne(
      this.appointmentModel,
      { _id: appointment._id },
      { payment_status: Status.SUCCESSFUL },
    );

    return appointment;
  }

  async createAppointmentBySpecialist(
    createSpecialistAppointmentDto: any,
    specialistId: Types.ObjectId,
  ) {
    const {
      patient_id,
      category,
      appointment_date,
      start_time,
      duration_minutes,
      timezone,
      appointment_type,
      consultation_fee,
      patient_notes,
      private_notes,
      status,
      meeting_channel,
    } = createSpecialistAppointmentDto;

    // Validate appointment time
    const appointmentStartTime = new Date(start_time);
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + (duration_minutes || 30) * 60000);
    const now = new Date();

    // Prevent booking appointments in the past
    if (appointmentStartTime < now) {
      throw new BadRequestException(
        'Cannot create appointment in the past. Please select a future date and time.'
      );
    }

    // Check for double booking - prevent specialist from having two appointments at the same time

    const conflictingAppointment = await this.appointmentModel.findOne({
      specialist: specialistId,
      status: { $in: ['OPEN', 'ONGOING'] },
      $or: [
        // New appointment starts during existing appointment
        {
          start_time: { $lte: appointmentStartTime },
          $expr: {
            $gte: [
              { $add: ['$start_time', { $multiply: ['$duration_minutes', 60000] }] },
              appointmentStartTime
            ]
          }
        },
        // New appointment ends during existing appointment
        {
          start_time: { $lte: appointmentEndTime },
          $expr: {
            $gte: [
              { $add: ['$start_time', { $multiply: ['$duration_minutes', 60000] }] },
              appointmentEndTime
            ]
          }
        },
        // New appointment completely encompasses existing appointment
        {
          start_time: { $gte: appointmentStartTime, $lte: appointmentEndTime }
        }
      ]
    }).exec();

    if (conflictingAppointment) {
      throw new BadRequestException(
        `You already have an appointment scheduled at this time. Please choose a different time slot.`
      );
    }

    // Get patient's subscription for meeting_class
    const subscription = await this.subscriptionsService.getActiveSubscription(
      patient_id,
    );

    const appointment = await create(this.appointmentModel, {
      category: category || 'General',
      start_time: new Date(start_time),
      timezone: timezone || 'UTC',
      appointment_type,
      patient: patient_id,
      specialist: specialistId,
      appointment_fee: consultation_fee || 0,
      meeting_class: subscription?.planId?.name || 'Free',
      meeting_channel: meeting_channel || 'zoom', // Default to Zoom if not specified
      patient_notes,
      private_notes,
      duration_minutes: duration_minutes || 30,
      status: status || 'OPEN',
      payment_status: 'SUCCESSFUL', // Specialist-created appointments are pre-approved
    });

    // Handle meeting channel-specific logic (same as patient-created appointments)
    try {
      if (appointment.meeting_channel === 'zoom') {
        return await this.scheduleZoomMeeting(appointment);
      } else if (appointment.meeting_channel === 'whatsapp') {
        return await this.scheduleWhatsAppMeeting(appointment);
      } else if (appointment.meeting_channel === 'google_meet') {
        return await this.scheduleGoogleMeet(appointment);
      } else if (appointment.meeting_channel === 'microsoft_teams') {
        return await this.scheduleTeamsMeeting(appointment);
      }

      // For phone and in_person, just return appointment and send notifications
      // Get users for notification
      const [specialist, patient] = await Promise.all([
        this.usersService.findById(specialistId),
        this.usersService.findById(patient_id),
      ]);

      const topic = `Appointment Between ${specialist.profile.first_name} and ${patient.profile.first_name}`;

      // Send appointment confirmation emails
      await this.taskCron.addCron(
        this.sendScheduledAppointment({
          patient,
          specialist,
          start_time: appointment.start_time,
          topic,
          link: { join_url: '', start_url: '' }, // No link for phone/in-person
          call_duration: String(duration_minutes || 30),
          appointmentId: appointment._id,
          meeting_channel: appointment.meeting_channel || 'zoom',
          appointment_type: appointment.appointment_type,
          patient_notes: appointment.patient_notes,
        }),
        `${Date.now()}-sendSpecialistAppointmentMail`,
      );

      return appointment;
    } catch (error) {
      this.logger.error(
        `Failed to setup meeting for specialist appointment: ${error.message}`,
      );
      // Return appointment even if meeting setup fails
      return appointment;
    }
  }

  async findOneAppointment(
    appointmentId: Types.ObjectId,
  ): Promise<AppointmentDocument> {
    const appointment = await findById(this.appointmentModel, appointmentId);
    if (!appointment)
      throw new NotFoundException(Messages.APPOINTMENT_NOT_FOUND);
    return appointment;
  }

  async updateAppointment(query: any, fieldsToUpdate: any) {
    return await updateOneAndReturn(
      this.appointmentModel,
      { ...query },
      { ...fieldsToUpdate },
    );
  }

  async cancelAppointment(cancelAppointmentDto: CancelAppointmentDto) {
    const { appointmentId } = cancelAppointmentDto;
    const appointment = await this.findOneAppointment(appointmentId);
    const meetingChannel = appointment.meeting_channel || 'zoom';

    let cancelled = false;

    try {
      if (meetingChannel === 'google_meet' && appointment.meeting_id) {
        // Cancel Google Calendar event
        const googleCalendar = new GoogleCalendar();
        await googleCalendar.cancelEvent(appointment.meeting_id);
        cancelled = true;
        this.logger.log('Google Meet event cancelled successfully');
      } else if (meetingChannel === 'zoom' && appointment.meeting_id) {
        // Cancel Zoom meeting
        const response = await this.zoom.cancelMeeting(
          appointment.meeting_id,
          MeetingStatus.END,
        );
        cancelled = response.statusCode === 204;
        this.logger.log('Zoom meeting cancelled successfully');
      } else {
        // For other channels (WhatsApp, Phone, In-person), just mark as cancelled
        cancelled = true;
      }
    } catch (error) {
      this.logger.error(`Failed to cancel ${meetingChannel} meeting:`, error.message);
      // Mark as cancelled anyway
      cancelled = true;
    }

    if (cancelled) {
      await this.updateAppointment(
        { _id: appointmentId },
        { status: AppointmentStatus.CANCELLED },
      );
    }

    return appointment;
  }

  async rescheduleAppointment(
    rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    const { appointmentId, time, date } = rescheduleAppointmentDto;
    const appointment = await this.findOneAppointment(appointmentId);
    const [specialist, patient, subscription] = await Promise.all([
      this.usersService.findById(appointment.specialist),
      this.usersService.findById(appointment.patient),
      this.subscriptionsService.getActiveSubscription(appointment.patient),
    ]);
    const topic = `Appointment Rescheduled Between ${specialist.profile.first_name} and ${patient.profile.first_name}`;
    const startTime = moment(`${date} ${time}`, true).toDate();

    // Try to reschedule meeting based on channel, but don't fail if service is unavailable
    let meetingRescheduled = false;
    const meetingChannel = appointment.meeting_channel || 'zoom';

    try {
      if (meetingChannel === 'google_meet' && appointment.meeting_id) {
        // Reschedule Google Calendar event
        const duration = subscription?.planId?.call_duration || '30';
        const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

        const googleCalendar = new GoogleCalendar();
        await googleCalendar.updateEvent(appointment.meeting_id, {
          summary: topic,
          start_time: startTime,
          end_time: endTime,
        });
        meetingRescheduled = true;
        this.logger.log('Google Meet event rescheduled successfully');
      } else if (meetingChannel === 'zoom' && appointment.meeting_id) {
        // Reschedule Zoom meeting
        const response = await this.zoom.rescheduleMeeting({
          meetingId: appointment.meeting_id,
          topic,
          start_time: startTime,
          duration: subscription?.planId?.call_duration || '5',
        });
        meetingRescheduled = response.statusCode === 204;
        this.logger.log('Zoom meeting rescheduled successfully');
      }
    } catch (error) {
      this.logger.error(`Failed to reschedule ${meetingChannel} meeting, updating appointment without platform sync:`, error.message);
      // Continue with rescheduling even if platform API fails
    }

    // Update appointment in database regardless of Zoom status
    // Keep status as OPEN since rescheduled appointments are still active
    // Track reschedule timestamp for analytics
    await this.updateAppointment(
      { _id: appointmentId },
      { start_time: startTime, rescheduled_at: new Date() },
    );

    // Send notification emails
    await this.taskCron.addCron(
      this.sendScheduledAppointment({
        patient,
        specialist,
        start_time: startTime,
        topic,
        link: {
          join_url: appointment.join_url,
          start_url: appointment.start_url,
        },
        call_duration: subscription?.planId?.call_duration,
        appointmentId: appointment._id,
        meeting_channel: appointment.meeting_channel || 'zoom',
        appointment_type: appointment.appointment_type,
        patient_notes: appointment.patient_notes,
      }),
      `${Date.now()}-sendRescheduleAppointmentMail`,
    );

    return appointment;
  }

  async scheduleZoomMeeting(appointment: AppointmentDocument) {
    const [specialist, patient] = await Promise.all([
      this.usersService.findById(appointment.specialist),
      this.usersService.findById(appointment.patient),
    ]);
    const subscription = await this.subscriptionsService.getActiveSubscription(
      patient.id,
    );
    const topic = `Appointment Between ${specialist.profile.first_name} and ${patient.profile.first_name}`;
    const response = await this.zoom.createMeeting({
      start_time: appointment.start_time,
      topic,
      duration: subscription?.planId?.call_duration ?? '5',
    });

    if (response.status === SUCCESS) {
      const { join_url, start_url, id } = response.data;
      await updateOne(
        this.appointmentModel,
        { _id: appointment._id },
        {
          meeting_id: id,
          join_url,
          start_url,
          payment_status: Status.SUCCESSFUL,
        },
      );
      await this.taskCron.addCron(
        this.sendScheduledAppointment({
          patient,
          specialist,
          start_time: appointment.start_time,
          topic,
          link: { join_url, start_url },
          call_duration: subscription?.planId?.call_duration,
          appointmentId: appointment._id,
          meeting_channel: 'zoom',
          appointment_type: appointment.appointment_type,
          patient_notes: appointment.patient_notes,
        }),
        `${Date.now()}-sendScheduleAppointmentMail`,
      );

      return appointment;
    }
    return appointment;
  }

  /**
   * Schedule WhatsApp meeting using wa.me link
   * Week 3 Implementation
   */
  async scheduleWhatsAppMeeting(appointment: AppointmentDocument) {
    const [specialist, patient] = await Promise.all([
      this.usersService.findById(appointment.specialist),
      this.usersService.findById(appointment.patient),
    ]);
    const subscription = await this.subscriptionsService.getActiveSubscription(
      patient.id,
    );

    // Get WhatsApp number from specialist profile (using phone number)
    // TODO: In Week 3 Phase 2, add specialist preferences UI to configure WhatsApp number
    const phoneNumber = specialist.profile?.contact?.phone?.number;
    const countryCode = specialist.profile?.contact?.phone?.country_code || '234'; // Default to Nigeria
    const whatsappNumber = phoneNumber ? `${countryCode}${phoneNumber}` : null;

    if (!whatsappNumber) {
      this.logger.warn(
        `Specialist ${specialist.id} has no WhatsApp number configured`,
      );
      throw new BadRequestException(
        'Specialist has not configured WhatsApp for consultations. Please choose another meeting channel.',
      );
    }

    // Format WhatsApp number (remove spaces, dashes, add country code if needed)
    const formattedNumber = whatsappNumber.replace(/[\s\-\(\)]/g, '');
    const appointmentDate = moment(appointment.start_time).format(
      'MMMM Do YYYY, h:mm A',
    );
    const patientName = `${patient.profile.first_name} ${patient.profile.last_name}`;
    const message = `Hello Dr. ${specialist.profile.first_name}, this is ${patientName}. I have an appointment with you on ${appointmentDate}.`;

    // Generate wa.me link
    const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

    // Save WhatsApp link to appointment
    await updateOne(
      this.appointmentModel,
      { _id: appointment._id },
      {
        join_url: whatsappLink,
        meeting_platform_data: {
          whatsapp_number: formattedNumber,
          specialist_name: specialist.full_name,
        },
        payment_status: Status.SUCCESSFUL,
      },
    );

    // Send appointment confirmation email
    const topic = `WhatsApp Consultation with ${specialist.profile.first_name}`;
    await this.taskCron.addCron(
      this.sendScheduledAppointment({
        patient,
        specialist,
        start_time: appointment.start_time,
        topic,
        link: { join_url: whatsappLink, start_url: whatsappLink },
        call_duration: subscription?.planId?.call_duration,
        appointmentId: appointment._id,
        meeting_channel: 'whatsapp',
      }),
      `${Date.now()}-sendWhatsAppAppointmentMail`,
    );

    this.logger.log(
      `WhatsApp meeting scheduled for appointment ${appointment._id}`,
    );
    return appointment;
  }

  /**
   * Schedule Google Meet via Google Calendar API
   * Week 3 Implementation
   */
  async scheduleGoogleMeet(appointment: AppointmentDocument) {
    try {
      const patient = await this.usersService.findById(
        appointment.patient,
      );
      const specialist = await this.usersService.findById(
        appointment.specialist,
      );

      if (!patient || !specialist) {
        throw new NotFoundException('Patient or specialist not found');
      }

      const subscription = await this.subscriptionsService.getActiveSubscription(
        specialist._id,
      );

      // Calculate end time based on call duration
      const duration = subscription?.planId?.call_duration || '30';
      const startTime = new Date(appointment.start_time);
      const endTime = new Date(
        startTime.getTime() + parseInt(duration) * 60000,
      );

      const googleCalendar = new GoogleCalendar();
      const calendarEvent = await googleCalendar.createEvent({
        summary: `Healthcare Consultation - ${specialist.profile.first_name} ${specialist.profile.last_name}`,
        description: `Virtual healthcare consultation between ${patient.profile.first_name} ${patient.profile.last_name} (Patient) and ${specialist.profile.first_name} ${specialist.profile.last_name} (Specialist).\n\nAppointment Type: ${appointment.appointment_type || 'General Consultation'}\n${appointment.patient_notes ? `\nNotes: ${appointment.patient_notes}` : ''}`,
        start_time: startTime,
        end_time: endTime,
        attendees: [
          {
            email: patient.profile.contact.email,
            displayName: `${patient.profile.first_name} ${patient.profile.last_name}`,
          },
          {
            email: specialist.profile.contact.email,
            displayName: `Dr. ${specialist.profile.first_name} ${specialist.profile.last_name}`,
          },
        ],
        conferenceData: true,
      });

      // Use meetingUrl if available, otherwise use htmlLink as fallback
      const meetingLink = calendarEvent.meetingUrl || calendarEvent.htmlLink || '';

      // Update appointment with Google Meet details
      await updateOne(
        this.appointmentModel,
        { _id: appointment._id },
        {
          join_url: meetingLink,
          start_url: meetingLink, // Same URL for Google Meet
          meeting_id: calendarEvent.eventId,
          meeting_platform_data: {
            calendarEventId: calendarEvent.eventId,
            htmlLink: calendarEvent.htmlLink,
            meetingUrl: calendarEvent.meetingUrl,
          },
          payment_status: Status.SUCCESSFUL,
        },
      );

      // Send appointment confirmation email
      const topic = `Google Meet Consultation with ${specialist.profile.first_name}`;
      await this.taskCron.addCron(
        this.sendScheduledAppointment({
          patient,
          specialist,
          start_time: appointment.start_time,
          topic,
          link: {
            join_url: meetingLink,
            start_url: meetingLink,
          },
          call_duration: subscription?.planId?.call_duration,
          appointmentId: appointment._id,
          meeting_channel: 'google_meet',
          appointment_type: appointment.appointment_type,
          patient_notes: appointment.patient_notes,
        }),
        `${Date.now()}-sendGoogleMeetAppointmentMail`,
      );

      this.logger.log(
        `Google Meet created successfully: ${calendarEvent.meetingUrl}`,
      );

      return appointment;
    } catch (error) {
      this.logger.error(
        `Failed to create Google Meet meeting: ${error.message}`,
      );
      this.logger.error(error.stack);

      // Mark appointment as successful even if Google Meet fails
      // Users will still receive calendar invite via email
      await updateOne(
        this.appointmentModel,
        { _id: appointment._id },
        { payment_status: Status.SUCCESSFUL },
      );

      throw new InternalServerErrorException(
        'Failed to create Google Meet meeting. Please try again or contact support.',
      );
    }
  }

  /**
   * Schedule Microsoft Teams meeting via Graph API
   * Week 4 Implementation
   */
  async scheduleTeamsMeeting(appointment: AppointmentDocument) {
    // TODO: Implement Microsoft Graph API integration
    // For now, mark appointment as successful and notify users
    this.logger.warn(
      'Microsoft Teams integration not yet implemented - marking appointment as successful',
    );

    await updateOne(
      this.appointmentModel,
      { _id: appointment._id },
      { payment_status: Status.SUCCESSFUL },
    );

    return appointment;
  }

  generateICalendar({
    patient,
    specialist,
    start_time,
    topic,
    link,
    call_duration,
    appointmentId,
  }: ICalendarType) {
    const DURATION = call_duration || 5;
    const attendees = this.getAttendees([patient, specialist]);

    const cal = ical({
      name: topic,
      method: ICalCalendarMethod.REQUEST,
      events: [
        {
          id: <string>(<unknown>appointmentId),
          start: start_time,
          end: moment(start_time).add(DURATION, 'm').toDate(),
          summary: `${specialist.full_name} and ${patient.full_name}`,
          location: 'Zoom',
          timezone: 'Africa/Lagos',
          description: `${topic}\n\n Join the meeting via this zoom link ${link.join_url}`,
          status: ICalEventStatus.CONFIRMED,
          attendees,
        },
      ],
    });
    const attachments = [
      {
        filename: `invite.ics`,
        content: cal.toString(),
        contentType: 'text/calendar',
      },
    ];
    this.logger.log(`Finished generating ics attachment`);
    return { attendees, attachments };
  }

  sendScheduledAppointment({
    patient,
    specialist,
    start_time,
    topic,
    link,
    call_duration,
    appointmentId,
    meeting_channel,
    appointment_type,
    patient_notes,
  }: ICalendarType) {
    this.logger.log(`Getting generated ical attachment`);
    const { attachments, attendees } = this.generateICalendar({
      patient,
      specialist,
      start_time,
      topic,
      link,
      call_duration,
      appointmentId,
    });
    const { join_url, start_url } = link;

    // Format appointment date for email
    const appointmentDate = moment(start_time).format('MMMM Do YYYY, h:mm A');

    for (const attendee of attendees) {
      const isPatient = patient.profile.contact.email === attendee.email;
      this.generalHelpers.generateEmailAndSend({
        email: <string>attendee.email,
        subject: topic,
        emailBody: appointmentScheduleEmail(
          isPatient ? join_url : start_url,
          attendees,
          meeting_channel || 'zoom',
          appointmentDate,
          appointment_type,
          patient_notes,
        ),
        attachments,
      });
      this.logger.log(`Sent appointment invite to ${attendee.name}`);
    }
    return true;
  }

  getAttendees(participants: User[]): ICalAttendeeData[] {
    return participants.map(({ profile, full_name }) => ({
      email: profile.contact.email,
      name: full_name,
      mailto: profile.contact.email,
      status: ICalAttendeeStatus.NEEDSACTION,
      rsvp: true,
      type: ICalAttendeeType.INDIVIDUAL,
    }));
  }

  async verifyTransaction(reference: string) {
    const response = await this.paymentHandler.verifyTransaction(reference);
    try {
      switch (response?.data?.status) {
        case SUCCESS:
          const appointmentId = response.data.metadata.appointment_id;
          const appointment = await this.findOneAppointment(appointmentId);
          await this.scheduleZoomMeeting(appointment);
          await this.paymentService.updatePayment(reference, {
            status: Status.SUCCESSFUL,
            metadata: {
              appointment_id: appointmentId,
            },
          });
          return await this.findOneAppointment(appointmentId);
        case FAILED:
          const appointmentId1 = response.data.metadata.appointment_id;
          await this.updateAppointment(
            { _id: appointmentId1 },
            {
              payment_status: Status.FAILED,
            },
          );
          await this.paymentService.updatePayment(reference, {
            status: Status.FAILED,
            metadata: {
              appointment_id: appointmentId1,
            },
          });
          return await this.findOneAppointment(appointmentId1);
        case PENDING:
          const appointmentId2 = response.data.metadata?.appointment_id;
          return await this.findOneAppointment(appointmentId2);
        default:
          const appointmentId3 = response.data.metadata?.appointment_id;
          return await this.findOneAppointment(appointmentId3);
      }
    } catch (e) {
      this.logger.error('An error occurred verifying appointment', e);
      throw new InternalServerErrorException(e, 'An error occurred');
    }
  }

  async getPatientAppointments(
    userId: Types.ObjectId,
    queryStatus: QueryStatus,
  ) {
    const { status } = queryStatus || {};
    const now = new Date();

    // MISSED: appointments that are explicitly MISSED OR OPEN status with start_time in the past
    if (status === 'MISSED') {
      return await find(this.appointmentModel, {
        patient: userId,
        $or: [
          { status: 'MISSED' },
          { status: 'NO_SHOW' },
          { status: 'OPEN', start_time: { $lt: now } },
        ],
      });
    }

    // For OPEN status, filter to only show future appointments (upcoming)
    // For COMPLETED/CANCELLED, show past appointments (history)
    const dateFilter = status === 'OPEN'
      ? { start_time: { $gte: now } }
      : status === 'COMPLETED' || status === 'CANCELLED'
        ? { start_time: { $lt: now } }
        : {};

    return await find(this.appointmentModel, {
      patient: userId,
      ...(!isEmpty(status) && { status }),
      ...dateFilter,
    });
  }

  async rateAppointment(
    appointmentId: string,
    patientId: Types.ObjectId,
    score: number,
    review?: string,
  ) {
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.patient.toString() !== patientId.toString()) {
      throw new ForbiddenException('You can only rate your own appointments');
    }
    if (appointment.rating?.score) {
      throw new BadRequestException('Appointment already rated');
    }

    await this.appointmentModel.findByIdAndUpdate(appointmentId, {
      $set: {
        rating: {
          score,
          review: review || undefined,
          rated_at: new Date(),
        },
      },
    });

    // Recalculate specialist's average rating
    const specialistAppointments = await this.appointmentModel.find({
      specialist: appointment.specialist,
      'rating.score': { $exists: true, $gt: 0 },
    }).select('rating.score').lean();

    if (specialistAppointments.length > 0) {
      const totalScore = specialistAppointments.reduce(
        (sum, a: any) => sum + (a.rating?.score || 0), 0,
      );
      const avgRating = parseFloat((totalScore / specialistAppointments.length).toFixed(1));
      await this.usersService.updateOne(
        appointment.specialist,
        { average_rating: avgRating },
      );
    }

    return appointment;
  }

  async getSpecialistAppointments(
    userId: Types.ObjectId,
    queryStatus: QueryStatus,
  ) {
    const { status } = queryStatus || {};
    const now = new Date();

    let appointments: AppointmentDocument[];

    // MISSED: appointments that are explicitly MISSED OR OPEN status with start_time in the past
    if (status === 'MISSED') {
      appointments = await this.appointmentModel
        .find({
          specialist: userId,
          $or: [
            { status: 'MISSED' },
            { status: 'NO_SHOW' },
            { status: 'OPEN', start_time: { $lt: now } },
          ],
        })
        .populate('patient', 'profile email')
        .populate('specialist', 'profile email')
        .exec();
    } else {
      // For OPEN status, filter to only show future appointments (upcoming)
      // For COMPLETED/CANCELLED, show past appointments (history)
      const dateFilter = status === 'OPEN'
        ? { start_time: { $gte: now } }
        : status === 'COMPLETED' || status === 'CANCELLED'
          ? { start_time: { $lt: now } }
          : {};

      appointments = await this.appointmentModel
        .find({
          specialist: userId,
          ...(status && { status }),
          ...dateFilter,
        })
        .populate('patient', 'profile email')
        .populate('specialist', 'profile email')
        .exec();
    }

    // Presign patient profile photos from S3
    const presignedAppointments = await this.presignAppointmentProfilePhotos(appointments);

    // Batch check which patients have health data
    const patientIds = [...new Set(
      presignedAppointments
        .map((a: any) => a.patient?._id)
        .filter(Boolean)
    )];

    if (patientIds.length > 0) {
      const [patientsWithCheckups, patientsWithVitals] = await Promise.all([
        this.healthCheckupService.getPatientsWithCheckups(patientIds),
        this.vitalsService.getPatientsWithVitals(patientIds),
      ]);

      for (const appointment of presignedAppointments as any[]) {
        const pid = appointment.patient?._id?.toString();
        appointment.patient_has_health_data = pid
          ? (patientsWithCheckups.has(pid) || patientsWithVitals.has(pid))
          : false;
      }
    }

    return presignedAppointments;
  }

  /**
   * Presign S3 profile photos for populated appointments
   */
  private async presignAppointmentProfilePhotos(appointments: AppointmentDocument[]): Promise<any[]> {
    const presignedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentObj: any = appointment.toObject ? appointment.toObject() : appointment;

        // Presign patient profile photo if it exists and is an S3 URL
        if (appointmentObj.patient?.profile?.profile_photo) {
          const photoUrl = appointmentObj.patient.profile.profile_photo;
          // Check if it's an S3 URL (not a Google/OAuth URL)
          if (photoUrl.includes('amazonaws.com') || photoUrl.includes('s3.')) {
            try {
              appointmentObj.patient.profile.profile_photo = await this.fileUploadHelper.getPresignedUrl(photoUrl, 3600);
            } catch (e) {
              this.logger.error(`Error presigning patient profile photo: ${e.message}`);
            }
          }
        }

        // Also check profile_image field
        if (appointmentObj.patient?.profile?.profile_image) {
          const photoUrl = appointmentObj.patient.profile.profile_image;
          if (photoUrl.includes('amazonaws.com') || photoUrl.includes('s3.')) {
            try {
              appointmentObj.patient.profile.profile_image = await this.fileUploadHelper.getPresignedUrl(photoUrl, 3600);
            } catch (e) {
              this.logger.error(`Error presigning patient profile image: ${e.message}`);
            }
          }
        }

        return appointmentObj;
      })
    );

    return presignedAppointments;
  }

  async getAppointments(query) {
    return (await find(this.appointmentModel, {
      ...query,
    })) as AppointmentDocument[];
  }

  convertTimeIntoStringFormatted(time_taken) {
    const hours = Math.floor(time_taken / 60);
    const minutes = time_taken % 60;
    const seconds = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  async calculateAppointmentFees(
    specialistId: Types.ObjectId,
    totalMinutes: string | number,
  ): Promise<number> {
    const specialist = await this.usersService.findById(specialistId);
    const adminSetting = await this.adminSettingsService.findOne();
    const rate = adminSetting.specialist_rates.find(
      ({ category, specialization, rate }) => {
        if (
          specialist?.professional_practice?.category === category &&
          specialist?.professional_practice?.area_of_specialty ===
            specialization
        ) {
          return rate;
        }
      },
    );
    if (rate) return +totalMinutes * +rate.rate.number;
    return 0;
  }

  async endAppointment(appointmentId: Types.ObjectId) {
    const appointment = await this.findOneAppointment(appointmentId);
    const response = await this.zoom.getPastMeetingDetails(
      appointment.meeting_id,
    );
    if (response.status === SUCCESS) {
      const minutesUsed = response.data.total_minutes;
      await this.updateAppointment(
        { _id: appointmentId },
        {
          status: AppointmentStatus.COMPLETED,
          call_duration: {
            time_taken: minutesUsed,
            unit: 'Minutes',
            formatted_string: this.convertTimeIntoStringFormatted(
              response?.data?.total_minutes,
            ),
          },
          appointment_fee: await this.calculateAppointmentFees(
            appointment.specialist,
            minutesUsed,
          ),
        },
      );

      // Automatically fetch clinical notes from Zoom if available
      try {
        await this.clinicalNotesService.fetchZoomClinicalNotes(
          appointmentId.toString(),
        );
        this.logger.log(
          `Clinical notes fetched for appointment ${appointmentId}`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to fetch clinical notes for appointment ${appointmentId}: ${error.message}`,
        );
        // Continue anyway - clinical notes are optional
      }
    }
    return appointment;
  }

  async getAllAppointments(query: QueryDto) {
    const { currentPage, pageLimit, filterBy, search } = query;
    const { limit, offset } = this.generalHelpers.calcLimitAndOffset(
      +currentPage,
      pageLimit,
    );

    let result: { appointments: AppointmentDocument[]; count: number };

    if (search) {
      result = await this.searchAppointments(filterBy, limit, offset, search);
    } else {
      result = await this.queryAppointments(filterBy, limit, offset);
    }

    return this.generalHelpers.paginate(
      result.appointments,
      +currentPage,
      limit,
      result.count,
    );
  }

  async queryAppointments(
    filterBy: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ appointments: AppointmentDocument[]; count: number }> {
    const query = {
      ...(filterBy && filterBy === 'All' ? {} : { status: filterBy }),
    };
    const appointments = (await findAndCountAll({
      model: this.appointmentModel,
      query,
      limit,
      offset,
    })) as AppointmentDocument[];
    return {
      appointments,
      count: await countDocuments(this.appointmentModel, { ...query }),
    };
  }

  async searchAppointments(
    filterBy: string | undefined,
    limit: number,
    offset: number,
    search: string,
  ): Promise<{ appointments: AppointmentDocument[]; count: number }> {
    const query = {
      ...(filterBy && filterBy === 'All' ? {} : { status: filterBy }),
      $text: { $search: search },
    };
    const appointments = (await findAndCountAll({
      model: this.appointmentModel,
      query,
      limit,
      offset,
      displayScore: true,
    })) as AppointmentDocument[];
    return {
      appointments,
      count: await countDocuments(this.appointmentModel, { ...query }),
    };
  }

  async getOneAppointment(appointmentId: string) {
    const appointment = await findById(
      this.appointmentModel,
      <Types.ObjectId>(<unknown>appointmentId),
    );
    if (!appointment) throw new NotFoundException(Messages.NOT_FOUND);
    return appointment;
  }

  async referPatientToSpecialist(
    referSpecialistDto: ReferSpecialistDto,
    userId: Types.ObjectId,
  ) {
    return await create(this.referralModel, {
      ...referSpecialistDto,
      referred_by: userId,
    });
  }

  async getSpecialistReferrals(userId) {
    return await find(
      this.referralModel,
      { 'specialists.id': userId },
      { populate: 'appointment' },
    );
  }

  async addMeetingNotes(meetingNotesDto: MeetingNotesDto) {
    return await upsert(
      this.appointmentModel,
      { _id: meetingNotesDto.appointmentId },
      { $push: { notes: { ...meetingNotesDto } } },
    );
  }

  async updatePrivateNotes(appointmentId: string, specialistId: string, privateNotes: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.specialist?.toString() !== specialistId) {
      throw new BadRequestException('Unauthorized: Not your appointment');
    }
    appointment.private_notes = privateNotes;
    await appointment.save({ validateBeforeSave: false });
    return { private_notes: appointment.private_notes };
  }

  async uploadDocument(
    appointmentId: string,
    specialistId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.specialist?.toString() !== specialistId) {
      throw new BadRequestException('Unauthorized: Not your appointment');
    }
    const url = await this.fileUploadHelper.uploadToS3(file.buffer, file.originalname);
    const doc = {
      name: file.originalname,
      url,
      type: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.includes('pdf') ? 'pdf' : 'doc',
      size: this.formatFileSize(file.size),
      shared_by: 'specialist',
      uploaded_at: new Date(),
    };
    if (!appointment.shared_documents) {
      appointment.shared_documents = [];
    }
    appointment.shared_documents.push(doc);
    await appointment.save({ validateBeforeSave: false });
    // Presign the URL for immediate display
    try {
      doc.url = await this.fileUploadHelper.getPresignedUrl(url);
    } catch (e) {}
    return doc;
  }

  async getDocuments(appointmentId: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    const docs = appointment.shared_documents || [];
    // Presign all URLs
    for (const doc of docs) {
      if (doc.url) {
        try {
          doc.url = await this.fileUploadHelper.getPresignedUrl(doc.url);
        } catch (e) {}
      }
    }
    return docs;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  isTimeInRange(
    preferredTime: moment.MomentInput,
    startTime: moment.MomentInput,
    endTime: moment.MomentInput,
  ) {
    const format = 'HH:mm:ss';
    const time = moment(preferredTime, format);
    const beforeTime = moment(startTime, format);
    const afterTime = moment(endTime, format);
    return time.isBetween(beforeTime, afterTime, undefined, '[]');
  }

  ratingsQuery(rating: RatingFilter) {
    switch (rating) {
      case RatingFilter.ONE_STAR_AND_ABOVE:
        return { average_rating: { $gte: 1 } };
      case RatingFilter.TWO_STARS_AND_ABOVE:
        return { average_rating: { $gte: 2 } };
      case RatingFilter.THREE_STARS_AND_ABOVE:
        return { average_rating: { $gte: 3 } };
      case RatingFilter.FOUR_STARS_AND_ABOVE:
        return { average_rating: { $gte: 4 } };
      case RatingFilter.FIVE_STARS:
        return { average_rating: { $eq: 5 } };
    }
  }

  async getAvailableSpecialists(
    availableSpecialistQueryDto: AvailableSpecialistDto,
  ) {
    const {
      specialist_category,
      professional_category,
      availabilityDates,
      rating,
      time_zone,
      gender,
    } = availableSpecialistQueryDto || {};
    // find all specialist of that professional category and get their Ids
    const specialists = await this.usersService.findAllUsers({
      user_type: UserType.SPECIALIST,
      'professional_practice.category': professional_category,
      'professional_practice.area_of_specialty': specialist_category,
      ...(rating && this.ratingsQuery(rating)),
    });
    const specialistIds = specialists.map(({ _id }) => _id);

    // If no availabilityDates provided, return all matching specialists
    if (!availabilityDates || !availabilityDates.length) {
      return this.getSpecialistDetails(specialistIds);
    }

    // Use the ids to fetch their preferences
    // If (gender / rating), filter specialists whose preferences those fields
    const preferences = await this.usersService.getPreferences({
      userId: specialistIds,
      ...(gender && { 'preferences.gender': gender }),
      ...(time_zone && { 'preferences.timezone': time_zone }),
    });

    /**
     * Fetch the specialists that their preference day and time
     * falls between the patient preferred day and time for the appointment
     **/
    const result: { [x: string]: UserDocument[] } = {};
    await Promise.all(
      availabilityDates.map(async ({ date, time }) => {
        const daysOfTheWeek = this.generalHelpers.daysOfTheWeek();
        const preferredDay = daysOfTheWeek[moment(date).isoWeekday()];
        const availablePreferences = preferences.filter(
          ({ time_availability }) =>
            time_availability.find(
              ({ day, start_time, end_time }) =>
                day === preferredDay &&
                this.isTimeInRange(time, start_time, end_time),
            ),
        );
        const userIds = availablePreferences.map(({ userId }) => userId);
        const availableSpecialists = await this.filterAvailableSpecialists(
          userIds,
          date,
          time,
        );

        result[moment(date).format('YYYY-MM-DD')] =
          await this.getSpecialistDetails(availableSpecialists);
      }),
    );
    // Send the remaining specialist to the client
    return result;
  }

  async filterAvailableSpecialists(
    userIds: Types.ObjectId[],
    date: Date,
    time: string,
  ) {
    const availableSpecialists: Types.ObjectId[] = [];
    for (const userId of userIds) {
      const appointments = await this.getAppointments({
        specialist: userId,
        $or: [
          { status: AppointmentStatus.OPEN },
          { status: AppointmentStatus.ONGOING },
        ],
        start_time: {
          $gte: new Date(new Date(date).setHours(0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59)),
        },
      });

      const isAvailable =
        !appointments?.length ||
        !appointments?.some(({ start_time }) => {
          const endTime = moment(start_time).add(1, 'hour').format('HH:mm');
          return this.isTimeInRange(time, start_time, endTime);
        });

      if (isAvailable) {
        availableSpecialists.push(userId);
      }
    }

    return availableSpecialists;
  }

  async getSpecialistDetails(userIds: Types.ObjectId[]) {
    return this.usersService.findAllUsers(
      {
        _id: userIds,
      },
      [
        'profile.first_name',
        'profile.last_name',
        'profile.profile_image',
        'profile.gender',
        'average_rating',
        'professional_practice',
      ],
    );
  }

  async getAvailableTimes(availableTimesDto: AvailableTimesDto) {
    const { preferredDates } = availableTimesDto;
    const result: { [x: string]: string[] } = {};
    await Promise.all(
      preferredDates.map(async ({ date }) => {
        const daysOfTheWeek = this.generalHelpers.daysOfTheWeek();
        const preferredDay = daysOfTheWeek[moment(date).isoWeekday()];
        const preferences = await this.usersService.getPreferences({
          'time_availability.day': preferredDay,
        });

        const timeSlots = preferences.map(
          ({ time_availability }) => time_availability,
        );
        const timeIntervals: Set<string> = new Set();

        for (const slots of timeSlots) {
          for (const slot of slots) {
            if (slot.day === preferredDay) {
              const startTime = moment(slot.start_time, 'HH:mm');
              const endTime = moment(slot.end_time, 'HH:mm');

              // Generate 30-minute time intervals within start_time and end_time
              const interval = moment.duration(30, 'minutes');
              const currentTime = startTime.clone();

              // Adjust the start time to the nearest 30-minute interval
              const adjustedStartTime = currentTime.add(
                Math.ceil(startTime.minutes() / 30) * 30 - startTime.minutes(),
                'minutes',
              );

              while (adjustedStartTime.isSameOrBefore(endTime)) {
                const time = adjustedStartTime.format('HH:mm');
                timeIntervals.add(time);
                adjustedStartTime.add(interval);
              }
            }
          }
        }
        result[moment(date).format('YYYY-MM-DD')] = Array.from(timeIntervals);
      }),
    );
    return result;
  }

  async appointmentsDataCount(
    userId: Types.ObjectId,
    status: AppointmentStatus,
    created_at: { $gte: Date; $lt: Date },
  ) {
    return countDocuments(this.appointmentModel, {
      specialist: userId,
      status,
      created_at,
    });
  }

  async aggregatedData(userId: Types.ObjectId) {
    const [completed, rescheduled, lastMonthCompleted, lastMonthRescheduled] =
      await Promise.all([
        this.appointmentsDataCount(userId, AppointmentStatus.COMPLETED, {
          $gte: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate(),
        }),
        // Count rescheduled appointments by rescheduled_at timestamp
        this.rescheduledAppointmentsCount(userId, {
          $gte: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate(),
        }),
        this.appointmentsDataCount(userId, AppointmentStatus.COMPLETED, {
          $gte: moment().subtract(1, 'month').startOf('month').toDate(),
          $lt: moment().subtract(1, 'month').endOf('month').toDate(),
        }),
        // Count rescheduled appointments by rescheduled_at timestamp
        this.rescheduledAppointmentsCount(userId, {
          $gte: moment().subtract(1, 'month').startOf('month').toDate(),
          $lt: moment().subtract(1, 'month').endOf('month').toDate(),
        }),
      ]);
    return {
      completedAppointments: completed,
      completedAppointmentsLastMonth: lastMonthCompleted,
      rescheduledAppointments: rescheduled,
      rescheduledAppointmentsLastMonth: lastMonthRescheduled,
    };
  }

  async rescheduledAppointmentsCount(
    userId: Types.ObjectId,
    rescheduled_at: { $gte: Date; $lt: Date },
  ) {
    return countDocuments(this.appointmentModel, {
      specialist: userId,
      rescheduled_at: { $exists: true, ...rescheduled_at },
    });
  }

  async nextAppointment(userId: Types.ObjectId) {
    return this.appointmentModel
      .findOne(
        {
          specialist: userId,
          status: AppointmentStatus.OPEN,
          start_time: { $gte: new Date() } // Only future appointments
        },
        null,
        {
          sort: { start_time: 1 }, // Sort by start time ascending (earliest first)
        },
      )
      .populate('patient', 'profile email')
      .exec();
  }

  /**
   * Get patient health profile for specialist view
   * Includes health checkups, health scores, and recent vitals
   */
  async getPatientHealthProfile(patientId: string) {
    const userIdObj = new Types.ObjectId(patientId);

    try {
      // Fetch health data in parallel
      const [healthCheckups, advancedScores, vitals, user] = await Promise.all([
        this.healthCheckupService.getHealthCheckupHistory(patientId, 1, 5),
        this.advancedHealthScoreService.getAssessmentHistory(patientId, 1, 5),
        this.vitalsService.getMostRecentVitals(userIdObj),
        this.usersService.findById(userIdObj),
      ]);

      // Extract the most recent advanced score
      const latestAdvancedScore = advancedScores.assessments?.[0] || null;

      // Format health checkups for display
      const formattedCheckups = healthCheckups.checkups?.map((checkup: any) => ({
        id: checkup._id,
        date: checkup.created_at,
        health_check_for: checkup.health_check_for,
        symptoms: this.extractSymptoms(checkup),
        conditions: this.extractConditions(checkup),
        triage_level: checkup.response?.data?.triage_level,
        has_emergency_evidence: checkup.response?.data?.has_emergency_evidence,
      })) || [];

      const userProfile = user?.profile as any;

      return {
        patient: {
          id: user?._id,
          name: user ? `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() : 'Unknown',
          profile_image: userProfile?.profile_image || userProfile?.profile_photo,
          age: userProfile?.date_of_birth ? this.calculateAge(userProfile.date_of_birth) : null,
          gender: userProfile?.gender,
        },
        health_scores: {
          basic_score: null, // Basic score is calculated client-side from vitals
          advanced_score: latestAdvancedScore?.report?.overall_score || null,
          advanced_status: latestAdvancedScore?.report?.overall_status || null,
          advanced_summary: latestAdvancedScore?.report?.overall_summary || null,
          domain_scores: latestAdvancedScore?.report?.domain_scores || null,
          last_assessment_date: latestAdvancedScore?.created_at || null,
        },
        health_checkups: formattedCheckups,
        checkup_count: healthCheckups.pagination?.total_count || 0,
        vitals: this.formatVitals(vitals),
        medical_history: {
          conditions: userProfile?.medical_history?.conditions || [],
          allergies: userProfile?.medical_history?.allergies || [],
          medications: userProfile?.medical_history?.medications || [],
        },
        has_health_data: formattedCheckups.length > 0 || latestAdvancedScore !== null,
      };
    } catch (error) {
      this.logger.error(`Error fetching patient health profile: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch patient health profile');
    }
  }

  /**
   * Get comprehensive patient health records for specialist full-page view
   * Includes all health checkups, advanced scores, vitals history, and appointment history
   */
  async getPatientFullHealthRecords(
    patientId: string,
    pagination: {
      checkupsPage: number;
      checkupsLimit: number;
      scoresPage: number;
      scoresLimit: number;
      appointmentsPage: number;
      appointmentsLimit: number;
    },
  ) {
    const userIdObj = new Types.ObjectId(patientId);

    try {
      // Fetch all health data in parallel
      const [
        healthCheckups,
        advancedScores,
        vitals,
        user,
        appointments,
        appointmentCount,
      ] = await Promise.all([
        this.healthCheckupService.getHealthCheckupHistory(
          patientId,
          pagination.checkupsPage,
          pagination.checkupsLimit,
        ),
        this.advancedHealthScoreService.getAssessmentHistory(
          patientId,
          pagination.scoresPage,
          pagination.scoresLimit,
        ),
        this.vitalsService.findUserVitals(userIdObj),
        this.usersService.findById(userIdObj),
        this.appointmentModel
          .find({ patient: userIdObj })
          .sort({ start_time: -1 })
          .skip((pagination.appointmentsPage - 1) * pagination.appointmentsLimit)
          .limit(pagination.appointmentsLimit)
          .populate('specialist', 'profile email')
          .exec(),
        countDocuments(this.appointmentModel, { patient: userIdObj }),
      ]);

      const userProfile = user?.profile as any;

      // Format health checkups with full details
      const formattedCheckups = healthCheckups.checkups?.map((checkup: any) => ({
        id: checkup._id,
        date: checkup.created_at,
        health_check_for: checkup.health_check_for,
        symptoms: this.extractSymptoms(checkup),
        conditions: checkup.response?.data?.conditions?.map((c: any) => ({
          name: c.common_name || c.name,
          probability: c.probability,
          category: c.category,
        })) || [],
        triage_level: checkup.response?.data?.triage_level,
        has_emergency_evidence: checkup.response?.data?.has_emergency_evidence,
        specialist_recommendations: checkup.response?.data?.specialist_recommendations || [],
        question_count: checkup.response?.data?.question?.items?.length || 0,
        // Include AI summary if available
        ai_summary: checkup.claude_summary?.content ? {
          overview: checkup.claude_summary.content.overview,
          key_findings: checkup.claude_summary.content.key_findings || [],
          recommendations: checkup.claude_summary.content.recommendations || [],
          when_to_seek_care: checkup.claude_summary.content.when_to_seek_care,
          conditions_explained: checkup.claude_summary.content.possible_conditions_explained || [],
        } : null,
        interview_duration: checkup.interview_duration,
      })) || [];

      // Format advanced health scores with full reports
      const formattedAdvancedScores = advancedScores.assessments?.map((score: any) => ({
        id: score._id,
        date: score.created_at,
        status: score.status,
        overall_score: score.report?.overall_score,
        overall_status: score.report?.overall_status,
        overall_summary: score.report?.overall_summary,
        domain_scores: score.report?.domain_scores,
        key_findings: score.report?.key_findings || [],
        recommendations: score.report?.recommendations || [],
      })) || [];

      // Format appointments with notes
      const formattedAppointments = appointments.map((apt: any) => {
        const specialistProfile = apt.specialist?.profile as any;
        return {
          id: apt._id,
          date: apt.start_time,
          status: apt.status,
          appointment_type: apt.appointment_type,
          specialist: {
            name: specialistProfile
              ? `${specialistProfile.first_name || ''} ${specialistProfile.last_name || ''}`.trim()
              : 'Unknown',
            specialty: specialistProfile?.specialty || 'General',
          },
          notes: apt.notes || null,
          call_duration: apt.call_duration || null,
          cancellation_reason: apt.cancellation_reason || null,
        };
      });

      // Get basic health score from stored value
      const storedBasicScore = user?.basic_health_score;

      return {
        patient: {
          id: user?._id,
          name: user
            ? `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim()
            : 'Unknown',
          email: (user as any)?.email,
          profile_image: userProfile?.profile_image || userProfile?.profile_photo,
          age: userProfile?.date_of_birth ? this.calculateAge(userProfile.date_of_birth) : null,
          gender: userProfile?.gender,
          phone: userProfile?.phone_number,
          date_of_birth: userProfile?.date_of_birth,
        },
        health_scores: {
          basic: {
            score: storedBasicScore?.score ?? null,
            status: storedBasicScore?.status ?? null,
            breakdown: storedBasicScore?.breakdown ?? null,
            updated_at: storedBasicScore?.updated_at ?? null,
          },
          advanced: {
            latest_score: advancedScores.assessments?.[0]?.report?.overall_score ?? null,
            latest_status: advancedScores.assessments?.[0]?.report?.overall_status ?? null,
            total_assessments: advancedScores.total || 0,
          },
        },
        health_checkups: {
          items: formattedCheckups,
          pagination: {
            page: pagination.checkupsPage,
            limit: pagination.checkupsLimit,
            total: healthCheckups.pagination?.total_count || 0,
            total_pages: healthCheckups.pagination?.total_pages || 0,
          },
        },
        advanced_scores: {
          items: formattedAdvancedScores,
          pagination: {
            page: pagination.scoresPage,
            limit: pagination.scoresLimit,
            total: advancedScores.total || 0,
            total_pages: advancedScores.total_pages || 0,
          },
        },
        appointments: {
          items: formattedAppointments,
          pagination: {
            page: pagination.appointmentsPage,
            limit: pagination.appointmentsLimit,
            total: appointmentCount,
            total_pages: Math.ceil(appointmentCount / pagination.appointmentsLimit),
          },
        },
        vitals: this.formatVitalsForFrontend(vitals),
        medical_profile: {
          height: userProfile?.basic_health_info?.height || null,
          weight: userProfile?.basic_health_info?.weight || null,
          blood_type: userProfile?.basic_health_info?.blood_type || null,
          pre_existing_conditions: user?.pre_existing_conditions || [],
          allergies: userProfile?.medical_history?.allergies || [],
          medications: userProfile?.medical_history?.medications || [],
          is_smoker: userProfile?.health_risk_factors?.is_smoker || 'Unknown',
          has_recent_injuries: userProfile?.health_risk_factors?.has_recent_injuries || 'Unknown',
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching patient full health records: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch patient health records');
    }
  }

  /**
   * Get patient prescriptions for specialist view
   */
  async getPatientPrescriptions(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientIdObj = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    try {
      // Fetch prescriptions for this patient (exclude drafts)
      const [prescriptions, total] = await Promise.all([
        this.specialistPrescriptionModel
          .find({
            patient_id: patientIdObj,
            status: { $ne: 'draft' }, // Exclude drafts
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .populate('specialist_id', 'profile email')
          .populate('pharmacy_id', 'name address')
          .lean(),
        this.specialistPrescriptionModel.countDocuments({
          patient_id: patientIdObj,
          status: { $ne: 'draft' },
        }),
      ]);

      // Format prescriptions for display
      const formattedPrescriptions = prescriptions.map((rx: any) => {
        const specialist = rx.specialist_id;
        const specialistProfile = specialist?.profile as any;

        return {
          id: rx._id,
          prescription_number: rx.prescription_number,
          date: rx.created_at,
          status: rx.status,
          payment_status: rx.payment_status,
          // Specialist info
          specialist: {
            id: specialist?._id,
            name: specialistProfile
              ? `${specialistProfile.first_name || ''} ${specialistProfile.last_name || ''}`.trim()
              : 'Unknown',
            specialty: specialistProfile?.specialty || 'General',
          },
          // Items summary
          items: rx.items?.map((item: any) => ({
            drug_name: item.drug_name,
            generic_name: item.generic_name,
            drug_strength: item.drug_strength,
            quantity: item.quantity,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })) || [],
          item_count: rx.items?.length || 0,
          // Pricing
          subtotal: rx.subtotal,
          delivery_fee: rx.delivery_fee,
          total_amount: rx.total_amount,
          currency: rx.currency || 'NGN',
          // Fulfillment info
          pharmacy: rx.pharmacy_id ? {
            id: rx.pharmacy_id._id,
            name: rx.pharmacy_id.name,
          } : null,
          // Dates
          paid_at: rx.paid_at,
          dispensed_at: rx.dispensed_at,
          delivered_at: rx.delivered_at,
          // Refill info
          is_refillable: rx.is_refillable,
          refill_count: rx.refill_count,
          refills_used: rx.refills_used,
          next_refill_date: rx.next_refill_date,
          // Notes
          clinical_notes: rx.clinical_notes,
          patient_notes: rx.patient_notes,
        };
      });

      // Calculate summary stats
      const activePrescriptions = prescriptions.filter((rx: any) =>
        ['pending_payment', 'paid', 'processing', 'dispensed', 'shipped'].includes(rx.status)
      ).length;

      const completedPrescriptions = prescriptions.filter((rx: any) =>
        rx.status === 'delivered'
      ).length;

      return {
        prescriptions: formattedPrescriptions,
        stats: {
          total: total,
          active: activePrescriptions,
          completed: completedPrescriptions,
        },
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching patient prescriptions: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch patient prescriptions');
    }
  }

  /**
   * Get patient's uploaded prescriptions (external prescriptions from other doctors)
   * For specialist view
   */
  async getPatientUploadedPrescriptions(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientIdObj = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    try {
      const [uploads, total] = await Promise.all([
        this.patientPrescriptionUploadModel
          .find({
            patient: patientIdObj,
            is_deleted: { $ne: true },
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.patientPrescriptionUploadModel.countDocuments({
          patient: patientIdObj,
          is_deleted: { $ne: true },
        }),
      ]);

      // Format uploads for display
      const formattedUploads = uploads.map((upload: any) => ({
        id: upload._id,
        prescription_number: upload.prescription_number,
        date: upload.created_at,
        // File info
        filename: upload.original_filename,
        file_url: upload.s3_url,
        file_type: upload.mimetype,
        upload_source: upload.upload_source,
        // Status
        processing_status: upload.processing_status,
        verification_status: upload.verification_status,
        // OCR extracted data
        doctor_name: upload.ocr_data?.doctor_name,
        clinic_name: upload.ocr_data?.clinic_name,
        prescription_date: upload.ocr_data?.prescription_date,
        medications: upload.ocr_data?.medications || [],
        // Verified medications
        verified_medications: upload.verified_medications || [],
        // Validity
        valid_from: upload.valid_from,
        valid_until: upload.valid_until,
        is_expired: upload.is_expired,
        // Usage
        usage_count: upload.usage_count || 0,
        max_usage: upload.max_usage,
        // Review info
        review_notes: upload.review_notes,
        rejection_reason: upload.rejection_reason,
        reviewed_at: upload.reviewed_at,
        // Fraud detection (for specialist awareness)
        fraud_score: upload.fraud_score,
        has_fraud_flags: upload.fraud_flags?.length > 0,
      }));

      // Calculate stats
      const approved = uploads.filter((u: any) => u.verification_status === VerificationStatus.APPROVED).length;
      const pending = uploads.filter((u: any) =>
        [VerificationStatus.PENDING, VerificationStatus.TIER1_PROCESSING, VerificationStatus.TIER2_PROCESSING, VerificationStatus.PHARMACIST_REVIEW].includes(u.verification_status)
      ).length;
      const rejected = uploads.filter((u: any) => u.verification_status === VerificationStatus.REJECTED).length;

      return {
        uploads: formattedUploads,
        stats: {
          total,
          approved,
          pending,
          rejected,
        },
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching patient uploaded prescriptions: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch patient uploaded prescriptions');
    }
  }

  /**
   * Get patient's pharmacy orders (medication purchases)
   * For specialist view - includes both prescription and OTC orders
   */
  async getPatientPharmacyOrders(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientIdObj = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    try {
      const [orders, total] = await Promise.all([
        this.pharmacyOrderModel
          .find({ patient: patientIdObj })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .populate('pharmacy', 'name address phone')
          .lean(),
        this.pharmacyOrderModel.countDocuments({ patient: patientIdObj }),
      ]);

      // Format orders for display
      const formattedOrders = orders.map((order: any) => ({
        id: order._id,
        order_number: order.order_number,
        date: order.created_at,
        order_type: order.order_type,
        status: order.status,
        payment_status: order.payment_status,
        // Pharmacy info
        pharmacy: order.pharmacy ? {
          id: order.pharmacy._id,
          name: order.pharmacy.name,
          address: order.pharmacy.address,
        } : null,
        // Items
        items: order.items?.map((item: any) => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.strength,
          dosage_form: item.dosage_form,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          requires_prescription: item.requires_prescription,
          dosage_instructions: item.dosage_instructions,
        })) || [],
        item_count: order.items?.length || 0,
        // Pricing
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount,
        currency: 'NGN',
        // Delivery
        delivery_method: order.delivery_method,
        delivery_address: order.delivery_address ? {
          address: order.delivery_address.address,
          city: order.delivery_address.city,
          state: order.delivery_address.state,
        } : null,
        estimated_delivery: order.estimated_delivery_date,
        actual_delivery: order.actual_delivery_date,
        tracking_number: order.delivery_tracking_number,
        // Pickup
        is_pickup: order.is_pickup_order,
        pickup_code: order.pickup_code,
        picked_up_at: order.picked_up_at,
        // Dates
        paid_at: order.paid_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at || order.actual_delivery_date,
        // Notes
        patient_notes: order.patient_notes,
        special_instructions: order.special_instructions,
      }));

      // Calculate stats
      const prescriptionOrders = orders.filter((o: any) =>
        o.order_type === PharmacyOrderType.PRESCRIPTION || o.order_type === PharmacyOrderType.MIXED
      ).length;
      const otcOrders = orders.filter((o: any) => o.order_type === PharmacyOrderType.OTC).length;
      const completed = orders.filter((o: any) =>
        [PharmacyOrderStatus.DELIVERED, PharmacyOrderStatus.COMPLETED].includes(o.status)
      ).length;
      const active = orders.filter((o: any) =>
        [PharmacyOrderStatus.PENDING, PharmacyOrderStatus.CONFIRMED, PharmacyOrderStatus.PROCESSING,
         PharmacyOrderStatus.READY_FOR_PICKUP, PharmacyOrderStatus.OUT_FOR_DELIVERY].includes(o.status)
      ).length;

      return {
        orders: formattedOrders,
        stats: {
          total,
          prescription_orders: prescriptionOrders,
          otc_orders: otcOrders,
          completed,
          active,
        },
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching patient pharmacy orders: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch patient pharmacy orders');
    }
  }

  /**
   * Get appointment statistics for admin dashboard
   */
  async getAppointmentStats() {
    const now = new Date();
    const startOfToday = moment().startOf('day').toDate();
    const endOfToday = moment().endOf('day').toDate();
    const startOfWeek = moment().startOf('week').toDate();
    const endOfWeek = moment().endOf('week').toDate();

    try {
      const [
        liveNow,
        todayCount,
        thisWeekCount,
        totalCount,
        cancelledThisMonth,
        totalThisMonth,
      ] = await Promise.all([
        // Live appointments (ONGOING status)
        countDocuments(this.appointmentModel, {
          status: AppointmentStatus.ONGOING,
        }),
        // Today's appointments
        countDocuments(this.appointmentModel, {
          start_time: { $gte: startOfToday, $lte: endOfToday },
        }),
        // This week's appointments
        countDocuments(this.appointmentModel, {
          start_time: { $gte: startOfWeek, $lte: endOfWeek },
        }),
        // Total appointments
        countDocuments(this.appointmentModel, {}),
        // Cancelled this month
        countDocuments(this.appointmentModel, {
          status: AppointmentStatus.CANCELLED,
          created_at: {
            $gte: moment().startOf('month').toDate(),
            $lte: moment().endOf('month').toDate(),
          },
        }),
        // Total this month
        countDocuments(this.appointmentModel, {
          created_at: {
            $gte: moment().startOf('month').toDate(),
            $lte: moment().endOf('month').toDate(),
          },
        }),
      ]);

      // Calculate cancellation rate
      const cancellationRate = totalThisMonth > 0
        ? ((cancelledThisMonth / totalThisMonth) * 100).toFixed(1)
        : '0';

      return {
        live_now: liveNow,
        today: todayCount,
        this_week: thisWeekCount,
        total: totalCount,
        cancellation_rate: parseFloat(cancellationRate),
        cancelled_this_month: cancelledThisMonth,
        total_this_month: totalThisMonth,
      };
    } catch (error) {
      this.logger.error(`Error fetching appointment stats: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch appointment statistics');
    }
  }

  /**
   * Get health scores for a patient (for patient entry page in booking flow)
   */
  async getPatientHealthScores(patientId: string) {
    try {
      const [healthCheckups, advancedScores] = await Promise.all([
        this.healthCheckupService.getHealthCheckupHistory(patientId, 1, 10),
        this.advancedHealthScoreService.getAssessmentHistory(patientId, 1, 1),
      ]);

      const latestAdvancedScore = advancedScores.assessments?.[0] || null;

      return {
        has_checkups: (healthCheckups.pagination?.total_count || 0) > 0,
        checkup_count: healthCheckups.pagination?.total_count || 0,
        has_basic_score: false, // Basic score is calculated client-side
        basic_score: null,
        has_advanced_score: latestAdvancedScore !== null,
        advanced_score: latestAdvancedScore?.report?.overall_score || null,
      };
    } catch (error) {
      this.logger.error(`Error fetching patient health scores: ${error.message}`);
      return {
        has_checkups: false,
        checkup_count: 0,
        has_basic_score: false,
        basic_score: null,
        has_advanced_score: false,
        advanced_score: null,
      };
    }
  }

  // Helper methods for health profile

  private extractSymptoms(checkup: any): Array<{ name: string; duration?: string; source?: string }> {
    const evidence = checkup?.request?.evidence || [];
    return evidence
      .filter((e: any) => e.choice_id === 'present')
      .slice(0, 8)
      .map((e: any) => {
        // Try to get the symptom name from various possible fields
        let name = e.common_name || e.name;

        // If no name, try to format the ID into readable text
        if (!name && e.id) {
          // Convert IDs like "s_21" or "p_17" to more readable format
          // Or try to extract meaningful text from underscore-separated IDs
          name = e.id
            .replace(/^[sp]_\d+$/, '') // Remove pure ID patterns like s_21, p_17
            .replace(/_/g, ' ')
            .trim();
        }

        // If still no name, mark as unknown
        if (!name) {
          name = 'Reported symptom';
        }

        // Format duration if available
        let duration: string | undefined;
        if (e.duration) {
          if (typeof e.duration === 'object' && e.duration.value && e.duration.unit) {
            duration = `${e.duration.value} ${e.duration.unit}${e.duration.value > 1 ? 's' : ''}`;
          } else if (typeof e.duration === 'string') {
            duration = e.duration;
          }
        }

        return {
          name,
          duration,
          source: e.source || undefined,
        };
      })
      .filter((s: any) => s.name && s.name !== 'Reported symptom' || true); // Keep all but prioritize named ones
  }

  private extractConditions(checkup: any): Array<{ name: string; probability: number }> {
    const conditions = checkup?.response?.data?.conditions || [];
    return conditions.slice(0, 3).map((c: any) => ({
      name: c.common_name || c.name || 'Unknown condition',
      probability: Math.round((c.probability || 0) * 100),
    }));
  }

  private calculateAge(dateOfBirth: Date | string): number {
    return moment().diff(moment(dateOfBirth), 'years');
  }

  private formatVitals(vitals: any): any {
    if (!vitals || Object.keys(vitals).length === 0) {
      return null;
    }

    const formatted: any = {};

    if (vitals.blood_pressure) {
      formatted.blood_pressure = {
        systolic: vitals.blood_pressure.systolic,
        diastolic: vitals.blood_pressure.diastolic,
        unit: 'mmHg',
        updated_at: vitals.blood_pressure.updatedAt,
      };
    }

    if (vitals.pulse_rate) {
      formatted.heart_rate = {
        value: vitals.pulse_rate.rate,
        unit: 'bpm',
        updated_at: vitals.pulse_rate.updatedAt,
      };
    }

    if (vitals.body_temp) {
      formatted.temperature = {
        value: vitals.body_temp.temp,
        unit: vitals.body_temp.unit || '°C',
        updated_at: vitals.body_temp.updatedAt,
      };
    }

    if (vitals.body_weight) {
      formatted.weight = {
        value: vitals.body_weight.weight,
        unit: vitals.body_weight.unit || 'kg',
        updated_at: vitals.body_weight.updatedAt,
      };
    }

    if (vitals.blood_sugar_level) {
      formatted.blood_sugar = {
        value: vitals.blood_sugar_level.level,
        unit: 'mg/dL',
        updated_at: vitals.blood_sugar_level.updatedAt,
      };
    }

    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  /**
   * Get comprehensive appointment details for specialist view
   * Includes patient info with presigned photo, vitals, health checkups, scores, and previous appointments
   */
  async getAppointmentDetailsForSpecialist(appointmentId: string, specialistId: Types.ObjectId) {
    try {
      const appointmentIdObj = new Types.ObjectId(appointmentId);

      // Get appointment with populated data (include basic_health_score from User)
      const appointment = await this.appointmentModel
        .findOne({ _id: appointmentIdObj })
        .populate('patient', 'profile email full_name pre_existing_conditions basic_health_score')
        .populate('specialist', 'profile email')
        .exec();

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const patientId = appointment.patient._id.toString();
      const patientProfile = (appointment.patient as any).profile;

      // Fetch all data in parallel
      const [vitals, healthCheckups, advancedScores, previousAppointments] = await Promise.all([
        this.vitalsService.findUserVitals(appointment.patient._id as any),
        this.healthCheckupService.getHealthCheckupHistory(patientId, 1, 10),
        this.advancedHealthScoreService.getAssessmentHistory(patientId, 1, 1),
        this.appointmentModel.find({
          patient: appointment.patient._id,
          specialist: specialistId,
          _id: { $ne: appointmentIdObj },
          status: 'COMPLETED',
        }).sort({ start_time: -1 }).limit(5).exec(),
      ]);

      // Presign profile photo if it's from S3
      let presignedProfilePhoto = patientProfile?.profile_photo || patientProfile?.profile_image || null;
      if (presignedProfilePhoto && (presignedProfilePhoto.includes('amazonaws.com') || presignedProfilePhoto.includes('s3.'))) {
        try {
          presignedProfilePhoto = await this.fileUploadHelper.getPresignedUrl(presignedProfilePhoto, 3600);
        } catch (e) {
          this.logger.error(`Error presigning profile photo: ${e.message}`);
        }
      }

      // Get basic health score from stored value in User document (single source of truth)
      // This is updated automatically when vitals, profile, or health checkups change
      const storedBasicScore = (appointment.patient as any).basic_health_score;
      const basicHealthScore = storedBasicScore?.score ?? null;

      // Format vitals for frontend
      const formattedVitals = this.formatVitalsForFrontend(vitals);

      // Get latest advanced score
      const latestAdvancedScore = advancedScores.assessments?.[0] || null;

      // Format health checkups - filter out incomplete ones (no conditions/diagnosis)
      const formattedCheckups = healthCheckups.checkups
        ?.filter((checkup: any) => {
          // Only include checkups that have conditions in the response
          const conditions = checkup.response?.data?.conditions;
          return conditions && conditions.length > 0;
        })
        ?.map((checkup: any) => ({
          _id: checkup._id,
          created_at: checkup.created_at,
          health_check_for: checkup.health_check_for,
          request: checkup.request,
          response: checkup.response,
          symptoms: this.extractSymptoms(checkup),
          conditions: this.extractConditions(checkup),
          triage_level: checkup.response?.data?.triage_level,
          has_emergency_evidence: checkup.response?.data?.has_emergency_evidence,
        })) || [];

      return {
        appointment: {
          _id: appointment._id,
          start_time: appointment.start_time,
          status: appointment.status,
          meeting_channel: appointment.meeting_channel,
          meeting_type: appointment.appointment_type || 'Video and audio',
          join_url: appointment.join_url,
          start_url: appointment.start_url,
          patient_notes: appointment.patient_notes,
          notes: appointment.notes,
        },
        patient: {
          _id: appointment.patient._id,
          full_name: (appointment.patient as any).full_name,
          first_name: patientProfile?.first_name || '',
          last_name: patientProfile?.last_name || '',
          profile_image: presignedProfilePhoto,
          gender: patientProfile?.gender || 'Unknown',
          date_of_birth: patientProfile?.date_of_birth,
          age: patientProfile?.date_of_birth ? this.calculateAge(patientProfile.date_of_birth) : null,
          height: patientProfile?.basic_health_info?.height || null,
          weight: patientProfile?.basic_health_info?.weight || null,
          weight_status: patientProfile?.health_risk_factors?.weight_status || null,
          is_smoker: patientProfile?.health_risk_factors?.is_smoker || 'Unknown',
          medical_history: (appointment.patient as any).pre_existing_conditions || [],
        },
        health_scores: {
          basic: basicHealthScore,
          basic_status: storedBasicScore?.status || null,
          basic_breakdown: storedBasicScore?.breakdown || null,
          basic_updated_at: storedBasicScore?.updated_at || null,
          advanced: latestAdvancedScore?.report?.overall_score || null,
          advanced_status: latestAdvancedScore?.report?.overall_status || null,
          advanced_details: latestAdvancedScore?.report ? {
            ...latestAdvancedScore.report,
            created_at: latestAdvancedScore.created_at,
            _id: latestAdvancedScore._id,
          } : null,
        },
        vitals: formattedVitals,
        health_checkups: formattedCheckups,
        checkup_count: formattedCheckups.length,
        previous_appointments: previousAppointments.map(apt => ({
          _id: apt._id,
          start_time: apt.start_time,
          status: apt.status,
          notes: apt.notes,
          call_duration: apt.call_duration,
        })),
        has_health_data: formattedCheckups.length > 0 || basicHealthScore !== null || latestAdvancedScore !== null,
      };
    } catch (error) {
      this.logger.error(`Error fetching appointment details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate basic health score from vitals, profile, and health checkups
   * This matches the client-side calculation logic exactly
   */
  private calculateBasicHealthScore(vitals: any, profile: any, healthCheckups: any[] = []): number | null {
    // Helper to get most recent vital by updatedAt
    const getMostRecent = (arr: any[]) => {
      if (!arr || arr.length === 0) return null;
      return arr.reduce((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateA > dateB ? a : b;
      });
    };

    // Check data completeness (need at least 2 items to show a score)
    const hasVitals = vitals && (
      vitals.blood_pressure?.length > 0 ||
      vitals.body_temp?.length > 0 ||
      vitals.pulse_rate?.length > 0 ||
      vitals.blood_sugar_level?.length > 0
    );
    const hasHeightWeight = profile?.basic_health_info?.height?.value && profile?.basic_health_info?.weight?.value;
    const hasCheckups = healthCheckups && healthCheckups.length > 0;

    let completedItems = 0;
    if (hasHeightWeight) completedItems++;
    if (hasVitals) completedItems++;
    if (hasCheckups) completedItems++;

    // Need at least 2 items to calculate score (matching frontend logic)
    if (completedItems < 2) {
      return null;
    }

    let score = 100;

    // 1. BMI scoring (matching frontend: -15 severe, -10 obese, -5 overweight, -8 underweight)
    const weight = profile?.basic_health_info?.weight?.value;
    const height = profile?.basic_health_info?.height?.value;
    if (weight && height) {
      const heightM = height > 3 ? height / 100 : height;
      const bmi = weight / (heightM * heightM);
      if (bmi >= 35) {
        score -= 15; // Severe obesity
      } else if (bmi >= 30) {
        score -= 10; // Obesity
      } else if (bmi >= 25) {
        score -= 5; // Overweight
      } else if (bmi < 18.5) {
        score -= 8; // Underweight
      }
    }

    // 2. Blood Pressure scoring (matching frontend thresholds)
    if (vitals?.blood_pressure?.length > 0) {
      const bp = getMostRecent(vitals.blood_pressure);
      const bpValue = bp?.value || '';
      const parts = bpValue.split('/');
      if (parts.length === 2) {
        const systolic = parseInt(parts[0]);
        const diastolic = parseInt(parts[1]);
        if (!isNaN(systolic) && !isNaN(diastolic)) {
          if (systolic >= 180 || diastolic >= 120) {
            score -= 15; // Hypertensive crisis
          } else if (systolic >= 140 || diastolic >= 90) {
            score -= 12; // High Stage 2
          } else if (systolic >= 130 || diastolic > 80) {
            score -= 7; // High Stage 1
          } else if (systolic >= 120 || diastolic === 80) {
            score -= 3; // Elevated
          } else if (systolic < 90 || diastolic < 60) {
            score -= 5; // Low
          }
        }
      }
    }

    // 3. Pulse Rate scoring (matching frontend)
    if (vitals?.pulse_rate?.length > 0) {
      const pr = getMostRecent(vitals.pulse_rate);
      const pulse = pr?.rate || pr?.value;
      if (pulse) {
        const rate = parseInt(pulse);
        if (!isNaN(rate)) {
          if (rate < 40 || rate > 120) {
            score -= 10; // Severe
          } else if (rate < 50 || rate > 110) {
            score -= 7; // Moderate
          } else if (rate < 60 || rate > 100) {
            score -= 3; // Mild
          }
        }
      }
    }

    // 4. Body Temperature scoring (matching frontend)
    if (vitals?.body_temp?.length > 0) {
      const bt = getMostRecent(vitals.body_temp);
      let tempC = bt?.temp || bt?.value;
      if (tempC) {
        tempC = parseFloat(tempC);
        // Convert Fahrenheit to Celsius if needed (assume F if > 50)
        if (tempC > 50) {
          tempC = (tempC - 32) * 5 / 9;
        }
        if (!isNaN(tempC)) {
          if (tempC < 35 || tempC > 39) {
            score -= 10; // Severe
          } else if (tempC > 38) {
            score -= 7; // Fever
          } else if (tempC > 37.2) {
            score -= 3; // Low-grade fever
          } else if (tempC < 36.1) {
            score -= 2; // Slightly low
          }
        }
      }
    }

    // 5. Blood Sugar scoring (matching frontend)
    if (vitals?.blood_sugar_level?.length > 0) {
      const bs = getMostRecent(vitals.blood_sugar_level);
      let sugarMgDl = bs?.level || bs?.value;
      if (sugarMgDl) {
        sugarMgDl = parseFloat(sugarMgDl);
        // Convert mmol/L to mg/dL if value is too low (mmol/L is typically < 30)
        if (sugarMgDl < 30) {
          sugarMgDl = sugarMgDl * 18;
        }
        if (!isNaN(sugarMgDl)) {
          if (sugarMgDl < 54 || sugarMgDl > 200) {
            score -= 10; // Severe
          } else if (sugarMgDl < 70 || sugarMgDl > 125) {
            score -= 7; // High/Low
          } else if (sugarMgDl > 100) {
            score -= 4; // Pre-diabetic
          }
        }
      }
    }

    // 6. Triage Score from Health Checkups (matching frontend logic)
    if (healthCheckups && healthCheckups.length > 0) {
      const recentCheckup = healthCheckups.find(c =>
        c.response?.data?.triage_level || c.triage_level
      );
      if (recentCheckup) {
        const triageLevel = recentCheckup.response?.data?.triage_level || recentCheckup.triage_level;
        const checkupDate = new Date(recentCheckup.created_at || recentCheckup.createdAt);
        const daysSinceCheckup = (Date.now() - checkupDate.getTime()) / (1000 * 60 * 60 * 24);

        // Recovery detection: self_care = no penalty
        // If checkup is older than 14 days, assume recovered
        if (triageLevel !== 'self_care' && daysSinceCheckup <= 14) {
          if (triageLevel === 'emergency' || triageLevel === 'emergency_ambulance') {
            score -= 20;
          } else if (triageLevel === 'consultation_24') {
            score -= 12;
          } else if (triageLevel === 'consultation') {
            score -= 7;
          } else {
            score -= 3;
          }
        }
      }
    }

    // 7. Risk Factors scoring (matching frontend)
    const healthRiskFactors = profile?.health_risk_factors || {};

    // Smoking
    if (healthRiskFactors.is_smoker && healthRiskFactors.is_smoker !== 'No') {
      score -= 5;
    }

    // Recent injuries
    if (healthRiskFactors.has_recent_injuries && healthRiskFactors.has_recent_injuries !== 'No') {
      score -= 3;
    }

    // Age-based risk
    if (profile?.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age >= 65) {
        score -= 3;
      } else if (age >= 45) {
        score -= 1;
      }
    }

    // Pre-existing conditions
    const conditions = profile?.pre_existing_conditions || [];
    if (conditions.length > 0) {
      const conditionPoints = Math.min(conditions.length * 2, 6); // Max -6 points
      score -= conditionPoints;
    }

    // 8. Data Completeness Bonus (matching frontend)
    let bonusPoints = 0;
    if (hasVitals) bonusPoints += 2;
    if (hasCheckups) {
      const recentCheckup = healthCheckups[0];
      const checkupDate = new Date(recentCheckup?.created_at || recentCheckup?.createdAt);
      const daysSinceCheckup = (Date.now() - checkupDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCheckup <= 90) {
        bonusPoints += 2;
      }
    }
    if (hasHeightWeight) bonusPoints += 1;
    score += bonusPoints;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Format vitals data for frontend consumption (array format)
   * Sorts each vital type by updatedAt descending (most recent first)
   */
  private formatVitalsForFrontend(vitals: any): any {
    if (!vitals || Object.keys(vitals).length === 0) {
      return {};
    }

    const formatted: any = {};

    // Helper to sort by updatedAt descending (most recent first)
    const sortByDateDesc = (arr: any[]) => {
      return [...arr].sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
    };

    if (vitals.blood_pressure?.length > 0) {
      formatted.blood_pressure = sortByDateDesc(vitals.blood_pressure).map((bp: any) => ({
        value: bp.systolic && bp.diastolic ? `${bp.systolic}/${bp.diastolic}` : bp.value,
        unit: 'mmHg',
        updatedAt: bp.updatedAt,
      }));
    }

    if (vitals.pulse_rate?.length > 0) {
      formatted.pulse_rate = sortByDateDesc(vitals.pulse_rate).map((pr: any) => ({
        value: pr.rate || pr.value,
        unit: 'bpm',
        updatedAt: pr.updatedAt,
      }));
    }

    if (vitals.blood_sugar_level?.length > 0) {
      formatted.blood_sugar_level = sortByDateDesc(vitals.blood_sugar_level).map((bs: any) => ({
        value: bs.level || bs.value,
        unit: 'mg/dL',
        updatedAt: bs.updatedAt,
      }));
    }

    if (vitals.body_temp?.length > 0) {
      formatted.body_temp = sortByDateDesc(vitals.body_temp).map((bt: any) => ({
        value: bt.temp || bt.value,
        unit: bt.unit || '°C',
        updatedAt: bt.updatedAt,
      }));
    }

    if (vitals.body_weight?.length > 0) {
      formatted.body_weight = sortByDateDesc(vitals.body_weight).map((bw: any) => ({
        value: bw.value || bw.weight,
        unit: bw.unit || 'kg',
        updatedAt: bw.updatedAt,
      }));
    }

    return formatted;
  }
}
