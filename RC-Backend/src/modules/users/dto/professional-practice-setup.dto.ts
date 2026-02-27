import {
  Documents,
  PaymentStructure,
  ProfessionalPractice,
  Profile,
  Security,
} from '../types/profile.types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalPracticeSetupDto {
  @ApiProperty({ description: 'Specialist personal profile information', type: Profile })
  @ValidateNested({ each: true })
  @Type(() => Profile)
  readonly profile: Profile;

  @ApiProperty({ description: 'Professional practice details (qualifications, specializations, experience)', type: ProfessionalPractice })
  @ValidateNested({ each: true })
  @Type(() => ProfessionalPractice)
  professional_practice: ProfessionalPractice;

  @ApiProperty({ description: 'Professional certification and qualification documents', type: [Documents] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Documents)
  documents: Documents[];

  @ApiProperty({ description: 'Preferred payment structure', enum: PaymentStructure, example: 'per_consultation' })
  @IsNotEmpty()
  @IsEnum(PaymentStructure)
  payment_structure: PaymentStructure;

  @ApiProperty({ description: 'Security question and answer for account recovery', type: Security })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Security)
  security: Security;
}
