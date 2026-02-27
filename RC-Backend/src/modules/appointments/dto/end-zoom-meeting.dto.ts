import { Types } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndZoomMeetingDto {
  @ApiProperty({ description: 'ID of the appointment whose meeting to end', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsNotEmpty()
  @IsString()
  readonly appointmentId: Types.ObjectId;
}
