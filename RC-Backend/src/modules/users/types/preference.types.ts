export class Preferences {
  gender: string;
  language: string;
  timezone: string;
}

export class TimeAvailability {
  day: string;
  start_time: string;
  end_time: string;
  slot_type?: string; // 'routine' | 'urgent' | 'both' | 'break'
}

// Rate card types
export class ConsultationRate {
  enabled: boolean;
  routine_rate?: number;
  urgent_rate?: number;
  flat_rate?: number; // For chat consultation
  review_fee?: number; // For prescription review
}

export class RateCards {
  currency: string; // 'NGN' | 'USD'
  video_consultation: ConsultationRate;
  audio_consultation: ConsultationRate;
  chat_consultation: ConsultationRate;
  prescription_review: ConsultationRate;
  platform_fee_percent: number; // Default 10
  payment_processing_percent: number; // Default 1.5
  payment_processing_fixed: number; // Default 100 NGN
}

// Two-Factor Authentication settings
export class TwoFactorSettings {
  email: boolean;
  sms: boolean;
  authenticator_app: boolean;
}

// Notification channel settings for a single event type
export class NotificationChannels {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
}

// Full notification preferences matrix
export class NotificationPreferences {
  new_appointment: NotificationChannels;
  urgent_triage: NotificationChannels;
  earnings: NotificationChannels;
}

// Consultation channel integrations
export class ChannelIntegrations {
  rapid_video: boolean;
  zoom: boolean;
  whatsapp: boolean;
}

// Privacy and data processing consents
export class PrivacyConsents {
  ndpr: boolean;
  ai_processing: boolean;
}
