import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Gender, Relationship } from '../types/profile.types';

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum Genotype {
  AA = 'AA',
  AS = 'AS',
  SS = 'SS',
  AC = 'AC',
  SC = 'SC',
  CC = 'CC',
}

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening',
}

@Schema({ versionKey: false, _id: false })
export class DependantAllergy {
  @Prop({ type: String, required: true })
  allergen: string;

  @Prop({ type: String, enum: ['drug', 'food', 'environmental', 'other'], default: 'other' })
  type: string;

  @Prop({ type: String })
  reaction: string;

  @Prop({
    type: String,
    enum: Object.values(AllergySeverity),
    default: AllergySeverity.MODERATE,
  })
  severity: AllergySeverity;

  @Prop({ type: Date })
  diagnosed_date: Date;
}

@Schema({ versionKey: false, _id: false })
export class DependantMedicalCondition {
  @Prop({ type: String, required: true })
  condition_name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Date })
  diagnosed_date: Date;

  @Prop({ type: String, enum: ['active', 'resolved', 'managed'], default: 'active' })
  status: string;

  @Prop({ type: String })
  treating_physician: string;

  @Prop({ type: [String], default: [] })
  current_treatments: string[];
}

@Schema({ versionKey: false, _id: false })
export class Dependant {
  @Prop({ type: String, required: true })
  first_name: string;

  @Prop({ type: String, required: true })
  last_name: string;

  @Prop({ type: String })
  profile_image: string;

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
  phone: string;

  @Prop(
    raw({
      height: {
        value: { type: Number },
        unit: { type: String, default: 'cm' },
      },
      weight: {
        value: { type: Number },
        unit: { type: String, default: 'kg' },
      },
    }),
  )
  basic_health_info: {
    height: { value: number; unit: string };
    weight: { value: number; unit: string };
  };

  @Prop({
    type: String,
    enum: Object.values(BloodType),
  })
  blood_type: BloodType;

  @Prop({
    type: String,
    enum: Object.values(Genotype),
  })
  genotype: Genotype;

  @Prop({
    required: false,
    type: String,
    trim: true,
    lowercase: true,
  })
  email?: string;

  @Prop({
    type: Date,
    required: false,
  })
  date_of_birth: Date;

  @Prop({
    required: true,
    type: String,
    enum: {
      values: [Gender.FEMALE, Gender.MALE],
      message: '{VALUE} is not supported',
    },
  })
  gender: Gender;

  @Prop({
    type: String,
  })
  address1: string;

  @Prop({
    type: String,
  })
  address2: string;

  @Prop({ type: String })
  city: string;

  @Prop({
    type: String,
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

  @Prop({
    type: String,
  })
  state: string;

  @Prop({
    type: String,
  })
  country: string;

  @Prop({
    type: String,
  })
  zip_code: string;

  // Allergies for this dependant
  @Prop({ type: [Object], default: [] })
  allergies: DependantAllergy[];

  // Medical conditions for this dependant
  @Prop({ type: [Object], default: [] })
  medical_conditions: DependantMedicalCondition[];

  // Primary care physician for this dependant
  @Prop({ type: String })
  primary_physician: string;

  // Insurance information
  @Prop(
    raw({
      provider: { type: String },
      policy_number: { type: String },
      group_number: { type: String },
      is_primary_holder: { type: Boolean, default: false },
    }),
  )
  insurance: {
    provider: string;
    policy_number: string;
    group_number: string;
    is_primary_holder: boolean;
  };

  // Notes
  @Prop({ type: String })
  notes: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}
export const DependantSchema = SchemaFactory.createForClass(Dependant);
