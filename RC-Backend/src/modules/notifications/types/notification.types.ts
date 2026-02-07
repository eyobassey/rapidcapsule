export enum NotificationType {
  // Appointments
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  APPOINTMENT_MISSED = 'appointment_missed',
  APPOINTMENT_STARTED = 'appointment_started',

  // Prescriptions
  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_READY = 'prescription_ready',
  PRESCRIPTION_PAYMENT_REQUIRED = 'prescription_payment_required',
  PRESCRIPTION_SHIPPED = 'prescription_shipped',
  PRESCRIPTION_DELIVERED = 'prescription_delivered',

  // Pharmacy Orders
  PHARMACY_ORDER_PLACED = 'pharmacy_order_placed',
  PHARMACY_ORDER_CONFIRMED = 'pharmacy_order_confirmed',
  PHARMACY_ORDER_PROCESSING = 'pharmacy_order_processing',
  PHARMACY_ORDER_SHIPPED = 'pharmacy_order_shipped',
  PHARMACY_ORDER_DELIVERED = 'pharmacy_order_delivered',
  PHARMACY_ORDER_CANCELLED = 'pharmacy_order_cancelled',

  // Payments
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  WALLET_CREDITED = 'wallet_credited',
  WALLET_DEBITED = 'wallet_debited',
  EARNINGS_AVAILABLE = 'earnings_available',
  REFUND_PROCESSED = 'refund_processed',

  // Health
  HEALTH_CHECKUP_COMPLETE = 'health_checkup_complete',
  HEALTH_SCORE_UPDATED = 'health_score_updated',
  VITALS_ALERT = 'vitals_alert',
  VITALS_REMINDER = 'vitals_reminder',

  // System
  ACCOUNT_VERIFIED = 'account_verified',
  PROFILE_UPDATE_REQUIRED = 'profile_update_required',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  PROMOTIONAL = 'promotional',
  WELCOME = 'welcome',

  // Specialist-specific
  NEW_PATIENT_ASSIGNED = 'new_patient_assigned',
  PATIENT_MESSAGE = 'patient_message',
  REVIEW_RECEIVED = 'review_received',

  // Admin-specific
  NEW_USER_REGISTERED = 'new_user_registered',
  SPECIALIST_VERIFICATION_PENDING = 'specialist_verification_pending',
  SUPPORT_TICKET = 'support_ticket',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum UserTypeNotification {
  PATIENT = 'patient',
  SPECIALIST = 'specialist',
  ADMIN = 'admin',
}

export interface DeliveryStatusEntry {
  channel: NotificationChannel;
  status: DeliveryStatus;
  sent_at?: Date;
  delivered_at?: Date;
  error?: string;
}

export interface NotificationPreferences {
  // Appointment notifications
  appointment_reminders?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };
  appointment_updates?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };

  // Payment notifications
  payment_updates?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };

  // Health notifications
  health_reminders?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };
  vitals_alerts?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };

  // Prescription/Pharmacy notifications
  prescription_updates?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };

  // Marketing
  promotional?: {
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };

  // Global quiet hours
  quiet_hours?: {
    enabled?: boolean;
    start?: string; // e.g., "22:00"
    end?: string; // e.g., "07:00"
    timezone?: string;
  };
}

export interface CreateNotificationPayload {
  userId: string;
  user_type: UserTypeNotification;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  expires_at?: Date;
  scheduled_for?: Date;
}

export interface NotificationEventPayload {
  notification: any;
  channels: NotificationChannel[];
}

// Event payloads for different notification triggers
export interface AppointmentEventPayload {
  appointmentId: string;
  patientId: string;
  specialistId: string;
  date: Date;
  type: string;
  specialistName?: string;
  patientName?: string;
  reason?: string;
}

export interface PaymentEventPayload {
  paymentId: string;
  userId: string;
  amount: number;
  currency?: string;
  type: string;
  description?: string;
}

export interface PrescriptionEventPayload {
  prescriptionId: string;
  patientId: string;
  specialistId?: string;
  status: string;
  medications?: string[];
}

export interface HealthCheckupEventPayload {
  checkupId: string;
  userId: string;
  triageLevel?: string;
  conditions?: string[];
}
