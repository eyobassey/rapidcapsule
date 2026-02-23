import { IsObject, IsOptional } from 'class-validator';

export class CreateVitalDto {
  @IsOptional()
  @IsObject()
  readonly body_temp: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly body_weight: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly blood_pressure: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly blood_sugar_level: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly pulse_rate: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly spo2: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly steps: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly sleep: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly calories_burned: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly distance: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly respiratory_rate: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly stress_level: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly body_fat: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly active_minutes: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly hydration: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly muscle_mass: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly bone_mass: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly body_water: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly visceral_fat: Record<number, string>;

  @IsOptional()
  @IsObject()
  readonly bmr: Record<number, string>;
}
