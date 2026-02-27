import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferCreditsDto {
  @ApiProperty({ description: 'User ID of the credit recipient', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  recipient_id: string;

  @ApiProperty({ description: 'Number of credits to transfer (1-100)', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(100)
  credits: number;
}

export class SearchPatientsDto {
  @ApiProperty({ description: 'Search query for patient name or email', example: 'Adaeze' })
  @IsString()
  @IsNotEmpty()
  query: string;
}
