import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Phone, Relationship } from '../types/profile.types';

@Schema({ versionKey: false, _id: false })
export class EmergencyContact {
  @Prop({ type: String, required: true })
  first_name: string;

  @Prop({ type: String, required: true })
  last_name: string;

  @Prop(
    raw({
      country_code: { type: String, required: false },
      number: {
        type: String,
        required: false,
        minLength: 10,
        maxLength: 10,
      },
    }),
  )
  phone: Phone;

  // Alternative phone number
  @Prop(
    raw({
      country_code: { type: String, required: false },
      number: { type: String, required: false },
    }),
  )
  alternate_phone: Phone;

  @Prop({
    type: String,
    required: false,
  })
  email: string;

  @Prop({
    type: String,
    required: false,
  })
  address1: string;

  @Prop({
    type: String,
  })
  address2?: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  country: string;

  @Prop({
    type: String,
    required: false,
  })
  zip_code: string;

  @Prop({
    type: String,
    required: false,
    enum: {
      values: [
        Relationship.AUNTY,
        Relationship.BROTHER,
        Relationship.FATHER,
        Relationship.HUSBAND,
        Relationship.MOTHER,
        Relationship.SISTER,
        Relationship.WIFE,
        Relationship.UNCLE,
        Relationship.SON,
        Relationship.DAUGHTER,
        Relationship.CHILD,
        Relationship.FRIEND,
        Relationship.OTHER,
      ],
      message: '{VALUE} is not supported',
    },
  })
  relationship: Relationship;

  // Is this the primary emergency contact
  @Prop({ type: Boolean, default: false })
  is_primary: boolean;

  // Does this contact have the same address as the patient
  @Prop({ type: Boolean, default: false })
  same_as_patient: boolean;

  // Can this contact make medical decisions on behalf of the patient
  @Prop({ type: Boolean, default: false })
  can_make_medical_decisions: boolean;

  // Notification preferences for this contact
  @Prop(
    raw({
      notify_on_emergency: { type: Boolean, default: true },
      notify_on_appointments: { type: Boolean, default: false },
      notify_on_prescriptions: { type: Boolean, default: false },
      preferred_contact_method: { type: String, enum: ['phone', 'email', 'sms', 'whatsapp'], default: 'phone' },
    }),
  )
  notification_preferences: {
    notify_on_emergency: boolean;
    notify_on_appointments: boolean;
    notify_on_prescriptions: boolean;
    preferred_contact_method: string;
  };

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}
export const EmergencyContactSchema =
  SchemaFactory.createForClass(EmergencyContact);
