import { ProfileStatus } from "../entities/patient.entity";
import { IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ChangePatientStatusDto {
  @ApiProperty({ description: 'New profile status for the patient', enum: ProfileStatus, example: 'Active' })
  @IsNotEmpty()
  @IsEnum(ProfileStatus)
  profileStatus: ProfileStatus;
}