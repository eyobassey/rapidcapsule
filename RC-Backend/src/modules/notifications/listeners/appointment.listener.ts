import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
  AppointmentEventPayload,
} from '../types/notification.types';

@Injectable()
export class AppointmentListener {
  private readonly logger = new Logger(AppointmentListener.name);

  constructor(
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: AppointmentEventPayload): Promise<void> {
    this.logger.log(`Handling appointment.created event for ${payload.appointmentId}`);

    try {
      await this.orchestratorService.notifyAppointmentBooked({
        patientId: payload.patientId,
        specialistId: payload.specialistId,
        appointmentId: payload.appointmentId,
        date: payload.date,
        specialistName: payload.specialistName || 'your specialist',
        patientName: payload.patientName || 'A patient',
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.created: ${error.message}`);
    }
  }

  @OnEvent('appointment.confirmed')
  async handleAppointmentConfirmed(payload: AppointmentEventPayload): Promise<void> {
    this.logger.log(`Handling appointment.confirmed event for ${payload.appointmentId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${payload.specialistName} on ${new Date(payload.date).toLocaleDateString()} has been confirmed.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/patient/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.confirmed: ${error.message}`);
    }
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: AppointmentEventPayload & { cancelledBy?: string; reason?: string }): Promise<void> {
    this.logger.log(`Handling appointment.cancelled event for ${payload.appointmentId}`);

    try {
      // Notify patient
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `Your appointment with Dr. ${payload.specialistName} has been cancelled.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
        data: { appointmentId: payload.appointmentId, reason: payload.reason },
        action_url: `/app/patient/appointments`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });

      // Notify specialist
      await this.orchestratorService.sendNotification({
        userId: payload.specialistId,
        user_type: UserTypeNotification.SPECIALIST,
        type: NotificationType.APPOINTMENT_CANCELLED,
        title: 'Appointment Cancelled',
        message: `Appointment with ${payload.patientName} has been cancelled.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
        data: { appointmentId: payload.appointmentId, reason: payload.reason },
        action_url: `/app/specialist/appointments`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.cancelled: ${error.message}`);
    }
  }

  @OnEvent('appointment.rescheduled')
  async handleAppointmentRescheduled(payload: AppointmentEventPayload & { oldDate?: Date; newDate: Date }): Promise<void> {
    this.logger.log(`Handling appointment.rescheduled event for ${payload.appointmentId}`);

    try {
      // Notify patient
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_RESCHEDULED,
        title: 'Appointment Rescheduled',
        message: `Your appointment with Dr. ${payload.specialistName} has been rescheduled to ${new Date(payload.newDate).toLocaleDateString()}.`,
        data: { appointmentId: payload.appointmentId, newDate: payload.newDate },
        action_url: `/app/patient/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      });

      // Notify specialist
      await this.orchestratorService.sendNotification({
        userId: payload.specialistId,
        user_type: UserTypeNotification.SPECIALIST,
        type: NotificationType.APPOINTMENT_RESCHEDULED,
        title: 'Appointment Rescheduled',
        message: `Appointment with ${payload.patientName} has been rescheduled to ${new Date(payload.newDate).toLocaleDateString()}.`,
        data: { appointmentId: payload.appointmentId, newDate: payload.newDate },
        action_url: `/app/specialist/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.rescheduled: ${error.message}`);
    }
  }

  @OnEvent('appointment.reminder')
  async handleAppointmentReminder(payload: AppointmentEventPayload & { minutesBefore: number }): Promise<void> {
    this.logger.log(`Handling appointment.reminder event for ${payload.appointmentId}`);

    try {
      const timeText = payload.minutesBefore >= 60
        ? `${Math.floor(payload.minutesBefore / 60)} hour(s)`
        : `${payload.minutesBefore} minutes`;

      // Remind patient
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Appointment Reminder',
        message: `Your appointment with Dr. ${payload.specialistName} starts in ${timeText}.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/patient/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.WHATSAPP],
      });

      // Remind specialist
      await this.orchestratorService.sendNotification({
        userId: payload.specialistId,
        user_type: UserTypeNotification.SPECIALIST,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Upcoming Appointment',
        message: `Your appointment with ${payload.patientName} starts in ${timeText}.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/specialist/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.reminder: ${error.message}`);
    }
  }

  @OnEvent('appointment.started')
  async handleAppointmentStarted(payload: AppointmentEventPayload & { meetingUrl?: string }): Promise<void> {
    this.logger.log(`Handling appointment.started event for ${payload.appointmentId}`);

    try {
      // Notify patient
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_STARTED,
        title: 'Appointment Started',
        message: `Your appointment with Dr. ${payload.specialistName} is starting now. Click to join.`,
        data: { appointmentId: payload.appointmentId, meetingUrl: payload.meetingUrl },
        action_url: payload.meetingUrl || `/app/patient/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.URGENT,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.started: ${error.message}`);
    }
  }

  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(payload: AppointmentEventPayload): Promise<void> {
    this.logger.log(`Handling appointment.completed event for ${payload.appointmentId}`);

    try {
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_COMPLETED,
        title: 'Appointment Completed',
        message: `Your appointment with Dr. ${payload.specialistName} has been completed. Please leave a review.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/patient/appointments/${payload.appointmentId}/review`,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.completed: ${error.message}`);
    }
  }

  @OnEvent('appointment.missed')
  async handleAppointmentMissed(payload: AppointmentEventPayload): Promise<void> {
    this.logger.log(`Handling appointment.missed event for ${payload.appointmentId}`);

    try {
      // Notify patient
      await this.orchestratorService.sendNotification({
        userId: payload.patientId,
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.APPOINTMENT_MISSED,
        title: 'Missed Appointment',
        message: `You missed your appointment with Dr. ${payload.specialistName}. Please reschedule.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/patient/appointments`,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });

      // Notify specialist
      await this.orchestratorService.sendNotification({
        userId: payload.specialistId,
        user_type: UserTypeNotification.SPECIALIST,
        type: NotificationType.APPOINTMENT_MISSED,
        title: 'Patient No-Show',
        message: `${payload.patientName} missed their appointment.`,
        data: { appointmentId: payload.appointmentId },
        action_url: `/app/specialist/appointments/${payload.appointmentId}`,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP],
      });
    } catch (error) {
      this.logger.error(`Failed to handle appointment.missed: ${error.message}`);
    }
  }
}
