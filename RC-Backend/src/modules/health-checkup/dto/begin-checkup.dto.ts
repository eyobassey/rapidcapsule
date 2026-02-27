import { CheckupOwner } from '../entities/health-checkup.entity';
import { Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BeginCheckupDto {
  @ApiProperty({ description: 'Who is the health checkup for', enum: CheckupOwner, example: 'Self' })
  @IsEnum(CheckupOwner)
  health_check_for: CheckupOwner;

  @ApiProperty({ description: 'ID of the user or dependant being checked (required for Self/Dependant)', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @ValidateIf(
    (e) =>
      e.health_check_for === CheckupOwner.SELF ||
      e.health_check_for === CheckupOwner.DEPENDANT,
  )
  @IsNotEmpty()
  @IsString()
  checkup_owner_id: Types.ObjectId;
}
