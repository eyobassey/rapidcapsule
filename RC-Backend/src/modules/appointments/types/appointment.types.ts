import { User } from '../../users/entities/user.entity';
import { Types } from 'mongoose';

export type ICalendarType = {
  readonly patient: User;
  readonly specialist: User;
  readonly start_time: Date;
  readonly topic: string;
  readonly call_duration?: string;
  readonly link: Record<string, string>;
  readonly appointmentId: Types.ObjectId;
  readonly meeting_channel?: string;
  readonly appointment_type?: string;
  readonly patient_notes?: string;
  readonly urgency?: string;
  readonly timezone?: string;
  // Extended fields for comprehensive email
  readonly consultation_fee?: number;
  readonly platform_fee?: number;
  readonly total_amount?: number;
  readonly payment_source?: string;
  readonly clinical_flags?: string[];
  readonly pre_visit_instructions?: string;
  readonly created_by_specialist?: boolean;
};
