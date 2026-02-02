import { IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

class SharedDocumentDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsString()
  @IsNotEmpty()
  date: Date;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsOptional()
  timezone: string;

  @IsNotEmpty()
  @IsString()
  appointment_type: string;

  @IsOptional()
  @IsString()
  @IsIn(['routine', 'urgent'])
  urgency: string;

  @IsOptional()
  @IsString()
  meeting_channel: string;

  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  specialist: Types.ObjectId;

  @IsOptional()
  @IsString()
  patient_notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SharedDocumentDto)
  shared_documents?: SharedDocumentDto[];

  @IsOptional()
  @IsNumber()
  appointment_fee?: number;

  @IsOptional()
  @IsString()
  @IsIn(['wallet', 'card'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  cardId?: string;
}
