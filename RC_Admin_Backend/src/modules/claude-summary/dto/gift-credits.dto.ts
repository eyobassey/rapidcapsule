import { IsString, IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GiftCreditsDto {
  @ApiProperty({ description: 'Number of summary credits to gift to the patient', example: 10, minimum: 1 })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: 'Number of days until the gifted credits expire. If omitted, credits never expire.', example: 90, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number; // Optional - if not set, credits never expire

  @ApiProperty({ description: 'Administrative reason for gifting credits (recorded in audit log)', example: 'Compensating patient for service disruption during scheduled maintenance' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'MongoDB ObjectId of the admin performing this action', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  admin_id: string;
}

export class GiftUnlimitedDto {
  @ApiProperty({ description: 'Number of days the unlimited access will last', example: 30, minimum: 1 })
  @IsNumber()
  @Min(1)
  duration_days: number;

  @ApiProperty({ description: 'Administrative reason for granting unlimited access', example: 'VIP patient onboarding - complimentary 30-day unlimited access' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'MongoDB ObjectId of the admin performing this action', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  admin_id: string;
}

export class RevokeGiftedCreditsDto {
  @ApiProperty({ description: 'Administrative reason for revoking the gifted credits', example: 'Credits were gifted in error - patient already had an active unlimited plan' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'MongoDB ObjectId of the admin performing this action', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  admin_id: string;
}
