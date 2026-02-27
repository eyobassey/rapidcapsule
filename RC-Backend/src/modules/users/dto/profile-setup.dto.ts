import { ProfessionalPractice, Profile, Security } from '../types/profile.types';
import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Condition } from '../entities/pre-existing-condition.entity';
import { Type } from 'class-transformer';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { Dependant } from '../entities/dependant.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AllergiesDto {
  @ApiPropertyOptional({ description: 'Whether the patient has any known allergies', example: true })
  @IsOptional()
  has_allergies?: boolean;

  @ApiPropertyOptional({
    description: 'Known drug allergies',
    example: [{ drug_name: 'Penicillin', reaction: 'Rash', severity: 'Moderate' }],
  })
  @IsOptional()
  @IsArray()
  drug_allergies?: Array<{
    drug_name: string;
    reaction?: string;
    severity?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Known food allergies',
    example: [{ food_name: 'Peanuts', reaction: 'Anaphylaxis', severity: 'Severe' }],
  })
  @IsOptional()
  @IsArray()
  food_allergies?: Array<{
    food_name: string;
    reaction?: string;
    severity?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Environmental allergies',
    example: [{ allergen: 'Dust mites', reaction: 'Sneezing', severity: 'Mild' }],
  })
  @IsOptional()
  @IsArray()
  environmental_allergies?: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Other allergies not fitting above categories',
    example: [{ allergen: 'Latex', reaction: 'Contact dermatitis', severity: 'Moderate' }],
  })
  @IsOptional()
  @IsArray()
  other_allergies?: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;
}

export class DeviceIntegrationDto {
  @ApiPropertyOptional({ description: 'Connected health apps', example: ['Apple Health', 'Google Fit'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  health_apps_connected?: string[];

  @ApiPropertyOptional({ description: 'Connected wearable devices', example: ['Apple Watch', 'Fitbit Charge 5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  devices_connected?: string[];

  @ApiPropertyOptional({
    description: 'Data sharing consent toggles',
    example: { vitals_auto_sync: true, activity_tracking: true, sleep_tracking: false },
  })
  @IsOptional()
  @IsObject()
  data_sharing_consents?: {
    vitals_auto_sync?: boolean;
    activity_tracking?: boolean;
    sleep_tracking?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Notification preference toggles for health reminders',
    example: { health_reminders: true, medication_reminders: true, wellness_tips: false },
  })
  @IsOptional()
  @IsObject()
  notification_preferences?: {
    health_reminders?: boolean;
    medication_reminders?: boolean;
    wellness_tips?: boolean;
  };
}

export class MedicalHistoryDto {
  @ApiPropertyOptional({ description: 'List of chronic conditions', example: ['Hypertension', 'Type 2 Diabetes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronic_conditions?: string[];

  @ApiPropertyOptional({
    description: 'Current medications being taken',
    example: [{ name: 'Metformin', strength: '500mg', form: 'Tablet', dosage: '1 tablet', frequency: 'Twice daily', route: 'Oral', reason: 'Type 2 Diabetes', start_date: '2024-01-15' }],
  })
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

  @ApiPropertyOptional({
    description: 'Past surgical procedures',
    example: [{ procedure: 'Appendectomy', year: '2019', notes: 'Laparoscopic, no complications' }],
  })
  @IsOptional()
  @IsArray()
  past_surgeries?: Array<{
    procedure: string;
    year?: string;
    notes?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Family medical history',
    example: [{ condition: 'Hypertension', relation: 'Father' }, { condition: 'Breast Cancer', relation: 'Mother' }],
  })
  @IsOptional()
  @IsArray()
  family_history?: Array<{
    condition: string;
    relation?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Lifestyle habits',
    example: { smoking: 'Never', alcohol: 'Occasional', exercise: 'Moderate', diet: 'Balanced' },
  })
  @IsOptional()
  @IsObject()
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
  };

  @ApiPropertyOptional({
    description: 'Immunization records',
    example: [{ vaccine: 'COVID-19 (Pfizer)', date: '2024-03-15' }, { vaccine: 'Influenza', date: '2025-10-01' }],
  })
  @IsOptional()
  @IsArray()
  immunizations?: Array<{
    vaccine: string;
    date?: string;
  }>;
}

export class ProfileSetupDto {
  @ApiPropertyOptional({ description: 'User profile information (name, gender, address, etc.)', type: Profile })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Profile)
  readonly profile?: Profile;

  @ApiPropertyOptional({ description: 'Pre-existing medical conditions', type: [Condition] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Condition)
  pre_existing_conditions?: Condition[];

  @ApiPropertyOptional({ description: 'Emergency contact persons', type: [EmergencyContact] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContact)
  emergency_contacts?: EmergencyContact[];

  @ApiPropertyOptional({ description: 'Dependants under this patient', type: [Dependant] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Dependant)
  dependants?: Dependant[];

  @ApiPropertyOptional({ description: 'Security settings (security question and answer)', type: Security })
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Security)
  security?: Security;

  @ApiPropertyOptional({ description: 'Professional practice details (specialists only)' })
  @IsOptional()
  @IsObject()
  professional_practice?: Partial<ProfessionalPractice>;

  @ApiPropertyOptional({ description: 'Languages spoken by the user', example: ['English', 'Yoruba', 'Igbo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Specialist category IDs (specialists only)', example: ['64a1b2c3d4e5f6a7b8c9d0e1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialist_categories?: string[];

  @ApiPropertyOptional({ description: 'Detailed medical history', type: MedicalHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  medical_history?: MedicalHistoryDto;

  @ApiPropertyOptional({ description: 'Known allergies', type: AllergiesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AllergiesDto)
  allergies?: AllergiesDto;

  @ApiPropertyOptional({ description: 'Connected health devices and apps', type: DeviceIntegrationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceIntegrationDto)
  device_integration?: DeviceIntegrationDto;

  @ApiPropertyOptional({ description: 'Preferred currency for payments', example: 'NGN', enum: ['USD', 'GBP', 'EUR', 'NGN'] })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'GBP', 'EUR', 'NGN'])
  preferred_currency?: string;
}
