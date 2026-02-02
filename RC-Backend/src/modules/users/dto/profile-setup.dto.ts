import { ProfessionalPractice, Profile, Security } from '../types/profile.types';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Condition } from '../entities/pre-existing-condition.entity';
import { Type } from 'class-transformer';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { Dependant } from '../entities/dependant.entity';

export class AllergiesDto {
  @IsOptional()
  has_allergies?: boolean;

  @IsOptional()
  @IsArray()
  drug_allergies?: Array<{
    drug_name: string;
    reaction?: string;
    severity?: string;
  }>;

  @IsOptional()
  @IsArray()
  food_allergies?: Array<{
    food_name: string;
    reaction?: string;
    severity?: string;
  }>;

  @IsOptional()
  @IsArray()
  environmental_allergies?: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;

  @IsOptional()
  @IsArray()
  other_allergies?: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;
}

export class DeviceIntegrationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  health_apps_connected?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  devices_connected?: string[];

  @IsOptional()
  @IsObject()
  data_sharing_consents?: {
    vitals_auto_sync?: boolean;
    activity_tracking?: boolean;
    sleep_tracking?: boolean;
  };

  @IsOptional()
  @IsObject()
  notification_preferences?: {
    health_reminders?: boolean;
    medication_reminders?: boolean;
    wellness_tips?: boolean;
  };
}

export class MedicalHistoryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronic_conditions?: string[];

  @IsOptional()
  @IsArray()
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

  @IsOptional()
  @IsArray()
  past_surgeries?: Array<{
    procedure: string;
    year?: string;
    notes?: string;
  }>;

  @IsOptional()
  @IsArray()
  family_history?: Array<{
    condition: string;
    relation?: string;
  }>;

  @IsOptional()
  @IsObject()
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
  };

  @IsOptional()
  @IsArray()
  immunizations?: Array<{
    vaccine: string;
    date?: string;
  }>;
}

export class ProfileSetupDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Profile)
  readonly profile?: Profile;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Condition)
  pre_existing_conditions?: Condition[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContact)
  emergency_contacts?: EmergencyContact[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Dependant)
  dependants?: Dependant[];

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Security)
  security?: Security;

  @IsOptional()
  @IsObject()
  professional_practice?: Partial<ProfessionalPractice>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialist_categories?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  medical_history?: MedicalHistoryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AllergiesDto)
  allergies?: AllergiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceIntegrationDto)
  device_integration?: DeviceIntegrationDto;
}
