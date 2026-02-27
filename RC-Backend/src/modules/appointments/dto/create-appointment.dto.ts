import { IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SharedDocumentDto {
  @ApiProperty({ description: 'Document file name', example: 'blood-test-results.pdf' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'S3 URL of the uploaded document', example: 'https://s3.amazonaws.com/rapidcapsules/docs/blood-test.pdf' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'MIME type of the document', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'File size', example: '2.4MB' })
  @IsOptional()
  @IsString()
  size?: string;
}

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Specialist category ID', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Appointment date', example: '2025-07-20' })
  @IsString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ description: 'Appointment start time (24h format)', example: '10:00' })
  @IsNotEmpty()
  @IsString()
  time: string;

  @ApiPropertyOptional({ description: 'Patient timezone', example: 'Africa/Lagos' })
  @IsOptional()
  timezone: string;

  @ApiProperty({ description: 'Appointment type ID', example: '64b2c3d4e5f6a7b8c9d0e1f2' })
  @IsNotEmpty()
  @IsString()
  appointment_type: string;

  @ApiPropertyOptional({ description: 'Appointment urgency level', example: 'routine', enum: ['routine', 'urgent'] })
  @IsOptional()
  @IsString()
  @IsIn(['routine', 'urgent'])
  urgency: string;

  @ApiPropertyOptional({ description: 'Meeting channel preference', example: 'zoom' })
  @IsOptional()
  @IsString()
  meeting_channel: string;

  @ApiProperty({ description: 'Selected specialist ID', example: '64c3d4e5f6a7b8c9d0e1f2a3' })
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  specialist: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Notes from patient about their condition', example: 'I have been experiencing recurring headaches for a week' })
  @IsOptional()
  @IsString()
  patient_notes?: string;

  @ApiPropertyOptional({ description: 'Link to a related health checkup result', example: '64d4e5f6a7b8c9d0e1f2a3b4' })
  @IsOptional()
  @IsString()
  health_checkup_id?: string;

  @ApiPropertyOptional({ description: 'Documents shared with the specialist', type: [SharedDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SharedDocumentDto)
  shared_documents?: SharedDocumentDto[];

  @ApiPropertyOptional({ description: 'Appointment fee in smallest currency unit (e.g., kobo)', example: 15000 })
  @IsOptional()
  @IsNumber()
  appointment_fee?: number;

  @ApiPropertyOptional({ description: 'Payment method', example: 'wallet', enum: ['wallet', 'card'] })
  @IsOptional()
  @IsString()
  @IsIn(['wallet', 'card'])
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Saved card ID for card payment', example: '64e5f6a7b8c9d0e1f2a3b4c5' })
  @IsOptional()
  @IsString()
  cardId?: string;
}
