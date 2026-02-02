import { Type } from 'class-transformer';
import { IsArray, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TimesParam {
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;
}

export class AvailableTimesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimesParam)
  preferredDates: TimesParam[];

  @IsOptional()
  @IsMongoId()
  specialistId?: string;

  @IsOptional()
  @IsMongoId()
  patientId?: string; // Check for patient's existing appointments to prevent double-booking

  @IsOptional()
  @IsString()
  @IsIn(['routine', 'urgent'])
  urgency?: string; // Filter slots by urgency type (also includes 'both' slots)
}
