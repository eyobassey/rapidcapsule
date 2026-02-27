import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class SetPreferencesDto {
  @ApiProperty({
    description: 'Preferred age range of patients to support',
    example: '18-35',
  })
  @IsNotEmpty()
  @IsString()
  age_range: string;

  @ApiProperty({
    description: 'Preferred patient gender to support',
    example: 'Female',
  })
  @IsNotEmpty()
  @IsString()
  gender: string;

  @ApiProperty({
    description: 'Preferred location or region for donations',
    example: 'Lagos, Nigeria',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Treatment classification preference',
    example: 'Chronic Illness',
  })
  @IsNotEmpty()
  @IsString()
  treatment_class: string;

  @ApiProperty({
    description: 'Type of donation the lifeguard wishes to make',
    example: 'One-time',
  })
  @IsNotEmpty()
  @IsString()
  donation_type: string;

  @ApiProperty({
    description: 'Currency for the donation amount',
    example: 'NGN',
  })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Amount to donate in the specified currency',
    example: 5000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount_donated: number;

  @ApiProperty({
    description: 'MongoDB ObjectId of the saved payment card to charge',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsNotEmpty()
  @IsString()
  cardId: Types.ObjectId;
}
