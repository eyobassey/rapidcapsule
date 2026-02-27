import { Types } from 'mongoose';
import { IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ description: 'Rating score from 1 to 5', example: 4, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @Max(5)
  @Min(1)
  readonly rating: number;

  @ApiPropertyOptional({ description: 'Optional review message', example: 'Dr. Obi was very professional and thorough in the consultation' })
  @IsOptional()
  readonly message: string;

  @ApiProperty({ description: 'Specialist user ID being rated', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  readonly specialist: Types.ObjectId;
}
