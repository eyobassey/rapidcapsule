import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  Award,
  BloodType,
  Documents,
  Gender,
  Genotype,
  MaritalStatus,
  PaymentStructure,
  ProfessionalPractice,
  Profile,
  Relationship,
  Security,
  SpecialistCategories,
} from '../types/profile.types';
import { Condition } from './pre-existing-condition.entity';
import { EmergencyContact } from './emergency-contact.entity';
import { Dependant } from './dependant.entity';
import * as moment from 'moment';

export type UserDocument = HydratedDocument<User>;

export enum UserType {
  PATIENT = 'Patient',
  SPECIALIST = 'Specialist',
}

export enum RegMedium {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  LOCAL = 'LOCAL',
}

export enum ProfileStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  CANCELLED = 'Cancelled',
  SUSPENDED = 'Suspended',
}

export enum VerificationStatus {
  VERIFIED = 'Verified',
  UNVERIFIED = 'Unverified',
  SUSPENDED = 'Suspended',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { getters: true, virtuals: true },
})
export class User {
  @Prop(
    raw({
      first_name: { type: String, required: true, minLength: 3, trim: true },
      last_name: { type: String, required: true, minLength: 3, trim: true },
      gender: {
        required: false,
        type: String,
        enum: {
          values: [Gender.FEMALE, Gender.MALE],
          message: '{VALUE} is not supported',
        },
      },
      date_of_birth: {
        required: false,
        type: Date,
        get: (v) => moment(v).format('YYYY-MM-DD'),
      },
      password: {
        required: false,
        type: String,
        // validate: {
        //   validator: function (v) {
        //     return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(
        //       v,
        //     );
        //   },
        //   message: (props) => `${props.value} does not meet password criteria!`,
        // },
      },
      marital_status: {
        type: String,
        enum: {
          values: [
            MaritalStatus.DIVORCED,
            MaritalStatus.SINGLE,
            MaritalStatus.MARRIED,
            MaritalStatus.WIDOW,
            MaritalStatus.WIDOWER,
          ],
        },
      },
      contact: {
        email: {
          required: true,
          type: String,
          trim: true,
          lowercase: true,
          unique: true,
          // validate: {
          //   validator: function (v) {
          //     return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
          //   },
          //   message: (props) => `${props.value} is not a valid email!`,
          // },
        },
        phone: {
          country_code: { type: String, required: false },
          number: {
            type: String,
            required: false,
            minLength: 10,
            maxLength: 10,
            unique: true,
            sparse: true,
          },
        },
        address1: { type: String },
        address2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zip_code: { type: String },
        is_diaspora: { type: Boolean, default: false },
        practice_type: { type: String }, // 'clinic', 'home_office', 'virtual_only'
      },
      basic_health_info: {
        height: {
          value: { type: Number },
          unit: { type: String },
        },
        weight: {
          value: { type: Number },
          unit: { type: String },
        },
      },
      health_risk_factors: {
        is_smoker: { type: String },
        weight_status: { type: String },
        has_recent_injuries: { type: String },
        alcohol_consumption: { type: String, enum: ['never', 'occasional', 'moderate', 'heavy'] },
        exercise_frequency: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
        diet_type: { type: String },
        sleep_hours: { type: Number },
        stress_level: { type: String, enum: ['low', 'moderate', 'high', 'very_high'] },
      },
      blood_type: {
        type: String,
        enum: Object.values(BloodType),
      },
      genotype: {
        type: String,
        enum: Object.values(Genotype),
      },
      occupation: { type: String },
      primary_physician: { type: String },
      preferred_pharmacy: { type: String },
      twoFA_secret: { type: String, required: false },
      profile_photo: { type: String, required: false },
    }),
  )
  profile: Profile;

  @Prop({
    required: true,
    type: String,
    default: UserType.PATIENT,
    enum: {
      values: [UserType.PATIENT, UserType.SPECIALIST],
      message: '{VALUE} is not supported',
    },
  })
  user_type: UserType;

  @Prop({ type: Boolean, default: false })
  terms: boolean;

  @Prop({ type: Boolean, default: false })
  marketing: boolean;

  @Prop({ type: Boolean, default: false })
  is_email_verified: boolean;

  @Prop({ type: Date })
  email_verified_at: Date;

  @Prop({ type: Boolean, default: false })
  is_phone_verified: boolean;

  @Prop({ type: Boolean, default: false })
  is_auth_app_enabled: boolean;

  @Prop({ type: Date })
  phone_verified_at: Date;

  @Prop({
    required: true,
    type: String,
    default: RegMedium.LOCAL,
    enum: {
      values: [RegMedium.APPLE, RegMedium.GOOGLE, RegMedium.LOCAL],
      message: '{VALUE} is not supported',
    },
  })
  reg_medium: RegMedium;

  @Prop(
    raw([
      {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        phone: {
          country_code: { type: String, required: false },
          number: {
            type: String,
            required: false,
            minLength: 10,
            maxLength: 10,
          },
        },
        address1: { type: String },
        address2: { type: String },
        relationship: {
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
              Relationship.FRIEND,
            ],
            message: '{VALUE} is not supported',
          },
        },
        zip_code: { type: String },
        state: { type: String },
        country: { type: String },
      },
    ]),
  )
  emergency_contacts?: EmergencyContact[];

  @Prop(
    raw([
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        start_date: { type: Date, get: (v) => moment(v).format('YYYY-MM-DD') },
        end_date: { type: Date, get: (v) => moment(v).format('YYYY-MM-DD') },
        is_condition_exists: { type: Boolean, default: false },
        file: [
          {
            file_type: { type: String },
            original_name: { type: String },
            url: { type: String },
          },
        ],
      },
    ]),
  )
  pre_existing_conditions?: Condition[];

  @Prop(
    raw({
      chronic_conditions: [{ type: String }],
      current_medications: [
        {
          name: { type: String },
          strength: { type: String },
          form: { type: String },
          dosage: { type: String },
          frequency: { type: String },
          route: { type: String },
          reason: { type: String },
          start_date: { type: String },
        },
      ],
      past_surgeries: [
        {
          procedure: { type: String },
          year: { type: String },
          notes: { type: String },
        },
      ],
      family_history: [
        {
          condition: { type: String },
          relation: { type: String },
        },
      ],
      lifestyle: {
        smoking: { type: String },
        alcohol: { type: String },
        exercise: { type: String },
        diet: { type: String },
      },
      immunizations: [
        {
          vaccine: { type: String },
          date: { type: String },
        },
      ],
    }),
  )
  medical_history?: {
    chronic_conditions?: string[];
    current_medications?: Array<{
      name: string;
      strength?: string;
      form?: string;
      dosage?: string;
      frequency?: string;
      route?: string;
      reason?: string;
      start_date?: string;
    }>;
    past_surgeries?: Array<{
      procedure: string;
      year?: string;
      notes?: string;
    }>;
    family_history?: Array<{
      condition: string;
      relation?: string;
    }>;
    lifestyle?: {
      smoking?: string;
      alcohol?: string;
      exercise?: string;
      diet?: string;
    };
    immunizations?: Array<{
      vaccine: string;
      date?: string;
    }>;
  };

  @Prop(
    raw({
      has_allergies: { type: Boolean },
      drug_allergies: [
        {
          drug_name: { type: String },
          reaction: { type: String },
          severity: { type: String },
        },
      ],
      food_allergies: [
        {
          food_name: { type: String },
          reaction: { type: String },
          severity: { type: String },
        },
      ],
      environmental_allergies: [
        {
          allergen: { type: String },
          reaction: { type: String },
          severity: { type: String },
        },
      ],
      other_allergies: [
        {
          allergen: { type: String },
          reaction: { type: String },
          severity: { type: String },
        },
      ],
    }),
  )
  allergies?: {
    has_allergies?: boolean;
    drug_allergies?: Array<{
      drug_name: string;
      reaction?: string;
      severity?: string;
    }>;
    food_allergies?: Array<{
      food_name: string;
      reaction?: string;
      severity?: string;
    }>;
    environmental_allergies?: Array<{
      allergen: string;
      reaction?: string;
      severity?: string;
    }>;
    other_allergies?: Array<{
      allergen: string;
      reaction?: string;
      severity?: string;
    }>;
  };

  @Prop(
    raw({
      health_apps_connected: [{ type: String }],
      devices_connected: [{ type: String }],
      data_sharing_consents: {
        vitals_auto_sync: { type: Boolean, default: false },
        activity_tracking: { type: Boolean, default: false },
        sleep_tracking: { type: Boolean, default: false },
      },
      notification_preferences: {
        health_reminders: { type: Boolean, default: true },
        medication_reminders: { type: Boolean, default: true },
        wellness_tips: { type: Boolean, default: true },
      },
    }),
  )
  device_integration?: {
    health_apps_connected?: string[];
    devices_connected?: string[];
    data_sharing_consents?: {
      vitals_auto_sync?: boolean;
      activity_tracking?: boolean;
      sleep_tracking?: boolean;
    };
    notification_preferences?: {
      health_reminders?: boolean;
      medication_reminders?: boolean;
      wellness_tips?: boolean;
    };
  };

  @Prop(
    raw([
      {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        contact: {
          phone: {
            country_code: { type: String, required: false },
            number: {
              type: String,
              required: false,
              minLength: 10,
              maxLength: 10,
            },
          },
          email: { type: String },
          address1: { type: String },
          address2: { type: String },
          state: { type: String },
          country: { type: String },
          zip_code: { type: String },
        },
        basic_health_info: {
          height: {
            value: { type: Number },
            unit: { type: String },
          },
          weight: {
            value: { type: Number },
            unit: { type: String },
          },
        },
        blood_type: {
          type: String,
          enum: {
            values: Object.values(BloodType),
            message: '{VALUE} is not supported',
          },
        },
        genotype: {
          type: String,
          enum: {
            values: Object.values(Genotype),
            message: '{VALUE} is not supported',
          },
        },
        date_of_birth: {
          type: Date,
          get: (v) => moment(v).format('YYYY-MM-DD'),
        },
        gender: {
          type: String,
          enum: {
            values: [Gender.FEMALE, Gender.MALE],
            message: '{VALUE} is not supported',
          },
        },
        relationship: {
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
        },
      },
    ]),
  )
  dependants?: Dependant[];
  full_name: string;

  @Prop(
    raw({
      plan_name: { type: String },
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      updatedAt: { type: Date },
    }),
  )
  plan: any;

  @Prop(
    raw({
      category: {
        type: String,
        enum: {
          values: [
            SpecialistCategories.THERAPIST,
            SpecialistCategories.MEDICAL_DOCTOR,
            SpecialistCategories.CARE_GIVER,
            SpecialistCategories.DIETITIAN,
            SpecialistCategories.LAB_TECHNICIAN,
            SpecialistCategories.PHARMACIST,
          ],
        },
      },
      area_of_specialty: { type: String },
      university: {
        name: { type: String },
        start_year: { type: String },
        end_year: { type: String },
      },
      place_of_housemanship: {
        name: { type: String },
        start_year: { type: Date },
        end_year: { type: Date },
      },
      license_number: { type: String },
      years_of_practice: { type: String },
    }),
  )
  professional_practice?: ProfessionalPractice;

  // Array of specialist category IDs for multi-select specializations
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialistCategory' }],
    default: [],
  })
  specialist_categories: mongoose.Types.ObjectId[];

  // Array of language IDs for communication languages
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
    default: [],
  })
  languages: mongoose.Types.ObjectId[];

  @Prop({ type: String })
  payment_structure: PaymentStructure;

  @Prop(
    raw([
      {
        type_of_document: { type: String },
        url: { type: String },
        file_type: { type: String },
        original_name: { type: String },
      },
    ]),
  )
  documents: Documents[];

  @Prop(
    raw([
      {
        title: { type: String },
        description: { type: String },
        date: { type: String },
        file: [
          {
            file_type: { type: String },
            original_name: { type: String },
            url: { type: String },
          },
        ],
      },
    ]),
  )
  awards: Award[];

  @Prop({ type: String, default: 0 })
  earnings: string;

  @Prop({ type: Number, default: 0 })
  average_rating: number;

  @Prop({
    type: String,
    enum: {
      values: [
        VerificationStatus.SUSPENDED,
        VerificationStatus.VERIFIED,
        VerificationStatus.UNVERIFIED,
      ],
    },
    default: VerificationStatus.UNVERIFIED,
  })
  verification_status: VerificationStatus;

  @Prop({
    type: String,
    enum: {
      values: [
        ProfileStatus.ACTIVE,
        ProfileStatus.CANCELLED,
        ProfileStatus.INACTIVE,
        ProfileStatus.SUSPENDED,
      ],
    },
    default: ProfileStatus.ACTIVE,
  })
  status: ProfileStatus;

  @Prop(
    raw({
      question: { type: String },
      answer: { type: String },
      _id: { required: false },
    }),
  )
  security: Security;

  @Prop(
    raw([
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        label: { type: String, required: true }, // e.g., "Home", "Office", "Other"
        recipient_name: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, default: 'Nigeria' },
        postal_code: { type: String },
        additional_info: { type: String },
        is_default: { type: Boolean, default: false },
        created_at: { type: Date, default: Date.now },
      },
    ]),
  )
  delivery_addresses?: DeliveryAddressEntry[];

  @Prop({ type: Boolean, default: false })
  enable_claude_health_summary: boolean;

  @Prop(
    raw({
      score: { type: Number },
      status: { type: String }, // 'excellent', 'good', 'fair', 'poor', 'incomplete'
      breakdown: {
        bmi: { points: { type: Number }, status: { type: String }, message: { type: String } },
        bloodPressure: { points: { type: Number }, status: { type: String }, message: { type: String } },
        pulseRate: { points: { type: Number }, status: { type: String }, message: { type: String } },
        temperature: { points: { type: Number }, status: { type: String }, message: { type: String } },
        bloodSugar: { points: { type: Number }, status: { type: String }, message: { type: String } },
        triage: { points: { type: Number }, status: { type: String }, message: { type: String } },
        riskFactors: { points: { type: Number }, factors: [{ type: Object }], message: { type: String } },
        dataCompleteness: { points: { type: Number }, completeness: { type: Number }, message: { type: String } },
      },
      updated_at: { type: Date },
    }),
  )
  basic_health_score?: {
    score: number | null;
    status: string;
    breakdown: any;
    updated_at: Date;
  };

  // Identity verification for specialists
  @Prop(
    raw({
      government_id: {
        type: { type: String }, // 'passport', 'national_id', 'drivers_license'
        number: { type: String },
        expiry: { type: String },
        document_url: { type: String },
        status: { type: String, default: 'pending' }, // 'pending', 'verified', 'rejected'
        verified_at: { type: Date },
        rejection_reason: { type: String },
      },
      medical_license: {
        license_number: { type: String },
        issuing_body: { type: String }, // 'mdcn', 'nmcn', 'pcn', 'other'
        document_url: { type: String },
        status: { type: String, default: 'pending' },
        verified_at: { type: Date },
        rejection_reason: { type: String },
      },
      registry_check: {
        status: { type: String, default: 'pending' }, // 'pending', 'verified', 'failed'
        verified_at: { type: Date },
        registry_name: { type: String },
        registry_response: { type: Object },
      },
      credential_hash: { type: String }, // SHA-256 hash for blockchain-style verification display
      overall_status: { type: String, default: 'pending' }, // 'pending', 'verified', 'rejected'
      submitted_at: { type: Date },
      reviewed_at: { type: Date },
      reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }),
  )
  identity_verification?: IdentityVerification;
}

export interface IdentityVerification {
  government_id?: {
    type?: string;
    number?: string;
    expiry?: string;
    document_url?: string;
    status?: string;
    verified_at?: Date;
    rejection_reason?: string;
  };
  medical_license?: {
    license_number?: string;
    issuing_body?: string;
    document_url?: string;
    status?: string;
    verified_at?: Date;
    rejection_reason?: string;
  };
  registry_check?: {
    status?: string;
    verified_at?: Date;
    registry_name?: string;
    registry_response?: any;
  };
  credential_hash?: string;
  overall_status?: string;
  submitted_at?: Date;
  reviewed_at?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
}

export interface DeliveryAddressEntry {
  _id?: mongoose.Types.ObjectId;
  label: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  additional_info?: string;
  is_default: boolean;
  created_at?: Date;
}

const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual('full_name').get(function (this: UserDocument) {
  return `${this.profile.first_name} ${this.profile.last_name}`;
});

UserSchema.index({
  'profile.first_name': 'text',
  'profile.last_name': 'text',
  'profile.contact.email': 'text',
  'professional_practice.category': 'text',
  'profile.gender': 'text',
  user_type: 'text',
});

export { UserSchema };
