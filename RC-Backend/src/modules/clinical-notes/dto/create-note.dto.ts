import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    description: 'ID of the appointment this note belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({
    description: 'Clinical note content written by the specialist',
    example:
      'Patient presents with persistent cough for 5 days. No fever. Lungs clear on auscultation. Prescribed amoxicillin 500mg TID for 7 days.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Whether the clinical note is finalized',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
