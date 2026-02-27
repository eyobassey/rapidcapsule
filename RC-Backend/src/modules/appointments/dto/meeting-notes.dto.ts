import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class MeetingNotesDto {
  @ApiProperty({ description: 'Meeting notes content (Markdown supported)', example: 'Patient presents with persistent headache for 3 days. Recommended paracetamol 500mg twice daily.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'ID of the appointment', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsNotEmpty()
  appointmentId: Types.ObjectId;
}
