import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubstanceType,
  RouteOfAdministration,
  UseFrequency,
  CareLevel,
} from '../entities/recovery-profile.entity';

export class SubstanceHistoryDto {
  @ApiProperty({
    description: 'Type of substance used',
    enum: SubstanceType,
    example: SubstanceType.ALCOHOL,
  })
  @IsNotEmpty()
  @IsEnum(SubstanceType)
  readonly substance: SubstanceType;

  @ApiPropertyOptional({
    description: 'Whether this is the primary substance of concern',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly is_primary?: boolean;

  @ApiPropertyOptional({
    description: 'Age at which the patient first used this substance',
    example: 19,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly age_of_first_use?: number;

  @ApiPropertyOptional({
    description: 'Total number of years the patient has used this substance',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly years_of_use?: number;

  @ApiPropertyOptional({
    description: 'How the substance is administered',
    enum: RouteOfAdministration,
    example: RouteOfAdministration.ORAL,
  })
  @IsOptional()
  @IsEnum(RouteOfAdministration)
  readonly route_of_administration?: RouteOfAdministration;

  @ApiPropertyOptional({
    description: 'Frequency of use at its peak',
    enum: UseFrequency,
    example: UseFrequency.DAILY,
  })
  @IsOptional()
  @IsEnum(UseFrequency)
  readonly frequency_at_peak?: UseFrequency;

  @ApiPropertyOptional({
    description: 'ISO 8601 date of last use of the substance',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly last_use_date?: string;

  @ApiPropertyOptional({
    description: 'Quantity consumed at peak usage (e.g. "a bottle of ogogoro daily")',
    example: '6 bottles of beer per sitting',
  })
  @IsOptional()
  @IsString()
  readonly quantity_at_peak?: string;

  @ApiPropertyOptional({
    description: 'Number of previous treatment attempts for this substance',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly previous_treatment_attempts?: number;

  @ApiPropertyOptional({
    description: 'Types of previous treatments attempted',
    example: ['outpatient counselling', 'AA meetings', 'faith-based programme'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly previous_treatment_types?: string[];
}

export class ConsentDto {
  @ApiPropertyOptional({
    description: 'Consent to receive recovery treatment through the platform',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly treatment_consent?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to share recovery data with care team members',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly data_sharing_consent?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to contact the emergency contact during a crisis',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly emergency_contact_consent?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to wearable device vitals monitoring',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly wearable_monitoring_consent?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to interact with the AI recovery companion (Eka)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly ai_companion_consent?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to use anonymised data for research purposes',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly research_consent?: boolean;
}

export class CreateRecoveryProfileDto {
  @ApiProperty({
    description: 'List of substances the patient has used, with usage details for each',
    type: [SubstanceHistoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubstanceHistoryDto)
  readonly substance_use_history: SubstanceHistoryDto[];

  @ApiPropertyOptional({
    description: 'ISO 8601 date when the patient started or intends to start sobriety',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly sobriety_start_date?: string;

  @ApiPropertyOptional({
    description: 'Level of care recommended or selected for the patient',
    enum: CareLevel,
    example: CareLevel.OUTPATIENT,
  })
  @IsOptional()
  @IsEnum(CareLevel)
  readonly care_level?: CareLevel;

  @ApiPropertyOptional({
    description: 'Consent flags for various aspects of the recovery programme',
    type: ConsentDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsentDto)
  readonly consent?: ConsentDto;
}
