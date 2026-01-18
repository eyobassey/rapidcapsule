import { IsString, IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';

export class GiftCreditsDto {
  @IsNumber()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number; // Optional - if not set, credits never expire

  @IsString()
  reason: string;

  @IsMongoId()
  admin_id: string;
}

export class GiftUnlimitedDto {
  @IsNumber()
  @Min(1)
  duration_days: number;

  @IsString()
  reason: string;

  @IsMongoId()
  admin_id: string;
}

export class RevokeGiftedCreditsDto {
  @IsString()
  reason: string;

  @IsMongoId()
  admin_id: string;
}
