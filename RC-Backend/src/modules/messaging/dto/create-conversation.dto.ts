import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'The user ID of the other participant' })
  @IsNotEmpty()
  @IsString()
  participant_id: string;
}
