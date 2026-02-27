import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalDto {
  @ApiPropertyOptional({ description: 'Body temperature reading {value, unit}', example: { 0: '36.5°C' } })
  @IsOptional()
  @IsObject()
  readonly body_temp: Record<number, string>;

  @ApiPropertyOptional({ description: 'Body weight reading', example: { 0: '72 kg' } })
  @IsOptional()
  @IsObject()
  readonly body_weight: Record<number, string>;

  @ApiPropertyOptional({ description: 'Blood pressure reading (systolic/diastolic)', example: { 0: '120/80 mmHg' } })
  @IsOptional()
  @IsObject()
  readonly blood_pressure: Record<number, string>;

  @ApiPropertyOptional({ description: 'Blood sugar/glucose level', example: { 0: '95 mg/dL' } })
  @IsOptional()
  @IsObject()
  readonly blood_sugar_level: Record<number, string>;

  @ApiPropertyOptional({ description: 'Pulse/heart rate', example: { 0: '72 bpm' } })
  @IsOptional()
  @IsObject()
  readonly pulse_rate: Record<number, string>;

  @ApiPropertyOptional({ description: 'Blood oxygen saturation (SpO2)', example: { 0: '98%' } })
  @IsOptional()
  @IsObject()
  readonly spo2: Record<number, string>;

  @ApiPropertyOptional({ description: 'Daily step count', example: { 0: '8500' } })
  @IsOptional()
  @IsObject()
  readonly steps: Record<number, string>;

  @ApiPropertyOptional({ description: 'Sleep duration', example: { 0: '7.5 hours' } })
  @IsOptional()
  @IsObject()
  readonly sleep: Record<number, string>;

  @ApiPropertyOptional({ description: 'Calories burned', example: { 0: '2100 kcal' } })
  @IsOptional()
  @IsObject()
  readonly calories_burned: Record<number, string>;

  @ApiPropertyOptional({ description: 'Distance covered', example: { 0: '5.2 km' } })
  @IsOptional()
  @IsObject()
  readonly distance: Record<number, string>;

  @ApiPropertyOptional({ description: 'Respiratory rate', example: { 0: '16 breaths/min' } })
  @IsOptional()
  @IsObject()
  readonly respiratory_rate: Record<number, string>;

  @ApiPropertyOptional({ description: 'Stress level (1-10)', example: { 0: '4' } })
  @IsOptional()
  @IsObject()
  readonly stress_level: Record<number, string>;

  @ApiPropertyOptional({ description: 'Body fat percentage', example: { 0: '22%' } })
  @IsOptional()
  @IsObject()
  readonly body_fat: Record<number, string>;

  @ApiPropertyOptional({ description: 'Active minutes', example: { 0: '45 min' } })
  @IsOptional()
  @IsObject()
  readonly active_minutes: Record<number, string>;

  @ApiPropertyOptional({ description: 'Hydration level', example: { 0: '2.5 L' } })
  @IsOptional()
  @IsObject()
  readonly hydration: Record<number, string>;

  @ApiPropertyOptional({ description: 'Muscle mass', example: { 0: '35 kg' } })
  @IsOptional()
  @IsObject()
  readonly muscle_mass: Record<number, string>;

  @ApiPropertyOptional({ description: 'Bone mass', example: { 0: '3.2 kg' } })
  @IsOptional()
  @IsObject()
  readonly bone_mass: Record<number, string>;

  @ApiPropertyOptional({ description: 'Body water percentage', example: { 0: '55%' } })
  @IsOptional()
  @IsObject()
  readonly body_water: Record<number, string>;

  @ApiPropertyOptional({ description: 'Visceral fat level', example: { 0: '8' } })
  @IsOptional()
  @IsObject()
  readonly visceral_fat: Record<number, string>;

  @ApiPropertyOptional({ description: 'Basal metabolic rate', example: { 0: '1650 kcal' } })
  @IsOptional()
  @IsObject()
  readonly bmr: Record<number, string>;
}
