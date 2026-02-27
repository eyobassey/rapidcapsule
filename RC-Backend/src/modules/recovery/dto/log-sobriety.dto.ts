import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RelapseDetailsDto {
  @ApiPropertyOptional({
    description: 'The substance that was used during the relapse',
    example: 'alcohol',
  })
  @IsOptional()
  @IsString()
  readonly substance?: string;

  @ApiPropertyOptional({
    description: 'Amount consumed during the relapse',
    example: '3 bottles of Star lager',
  })
  @IsOptional()
  @IsString()
  readonly amount?: string;

  @ApiPropertyOptional({
    description: 'What triggered the relapse',
    example: 'Attended an owambe party with old friends',
  })
  @IsOptional()
  @IsString()
  readonly trigger?: string;

  @ApiPropertyOptional({
    description: 'Where the relapse occurred',
    example: 'A bar in Surulere, Lagos',
  })
  @IsOptional()
  @IsString()
  readonly location?: string;

  @ApiPropertyOptional({
    description: 'Whether the relapse was planned or impulsive',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly was_planned?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the patient sought help after the relapse',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly sought_help_after?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes about the relapse incident',
    example: 'I called my sponsor immediately after and went to an AA meeting the next morning',
  })
  @IsOptional()
  @IsString()
  readonly notes?: string;
}

export class LogSobrietyDto {
  @ApiProperty({
    description: 'ISO 8601 date for this daily log entry',
    example: '2026-02-27T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  readonly log_date: string;

  @ApiProperty({
    description: 'Whether the patient remained sober for the entire day',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  readonly sober_today: boolean;

  @ApiPropertyOptional({
    description: 'Self-reported mood score for the day (1 = very low, 10 = excellent)',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly mood_score?: number;

  @ApiPropertyOptional({
    description: 'Intensity of cravings experienced (0 = none, 10 = unbearable)',
    example: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  readonly craving_intensity?: number;

  @ApiPropertyOptional({
    description: 'List of substances the patient craved during the day',
    example: ['alcohol', 'tobacco'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly substances_craved?: string[];

  @ApiPropertyOptional({
    description: 'Self-reported energy level (1 = very low, 10 = very high)',
    example: 6,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly energy_level?: number;

  @ApiPropertyOptional({
    description: 'Self-reported sleep quality (1 = very poor, 10 = excellent)',
    example: 8,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly sleep_quality?: number;

  @ApiPropertyOptional({
    description: 'Number of hours slept',
    example: 7.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly sleep_hours?: number;

  @ApiPropertyOptional({
    description: 'Self-reported anxiety level (1 = calm, 10 = extreme anxiety)',
    example: 4,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  readonly anxiety_level?: number;

  @ApiPropertyOptional({
    description: 'Triggers the patient encountered during the day',
    example: ['stress at work', 'social gathering with alcohol'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly triggers_encountered?: string[];

  @ApiPropertyOptional({
    description: 'Coping strategies the patient used to manage cravings or triggers',
    example: ['deep breathing', 'called my sponsor', 'went for a walk'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly coping_strategies_used?: string[];

  @ApiPropertyOptional({
    description: 'Whether prescribed medications were taken as directed',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly medications_taken?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the patient attended a support group meeting or therapy session',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly attended_meeting_or_session?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the patient exercised during the day',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly exercised?: boolean;

  @ApiPropertyOptional({
    description: 'A gratitude note for the day to reinforce positive thinking',
    example: 'Grateful for the support of my family and being 45 days sober',
  })
  @IsOptional()
  @IsString()
  readonly gratitude_note?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or reflections for the day',
    example: 'Felt stronger today. The morning jog really helped clear my mind.',
  })
  @IsOptional()
  @IsString()
  readonly notes?: string;

  @ApiPropertyOptional({
    description: 'Details about a relapse if sober_today is false',
    type: RelapseDetailsDto,
  })
  @IsOptional()
  @IsObject()
  readonly relapse_details?: RelapseDetailsDto;
}
