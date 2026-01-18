import {
  BadRequestException,
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

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(AppointmentReferral.name)
    private referralModel: Model<AppointmentReferralDocument>,
    private readonly zoom: Zoom,
    private readonly usersService: UsersService,
    private readonly generalHelpers: GeneralHelpers,
    private readonly taskCron: TaskScheduler,
    private readonly paymentHandler: PaymentHandler,
    private readonly adminSettingsService: AdminSettingsService,
    private readonly paymentService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly clinicalNotesService: ClinicalNotesService,
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
    return await find(this.appointmentModel, {
      patient: userId,
      ...(!isEmpty(status) && { status }),
    });
  }

  async getSpecialistAppointments(
    userId: Types.ObjectId,
    queryStatus: QueryStatus,
  ) {
    const { status } = queryStatus || {};
    return await this.appointmentModel
      .find({
        specialist: userId,
        ...(status && { status }),
      })
      .populate('patient', 'profile email')
      .populate('specialist', 'profile email')
      .exec();
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
        'average_rating',
        'professional_practice.years_of_practice',
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
}
