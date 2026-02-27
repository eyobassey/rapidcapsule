import { ProfileStatus } from "../../patients/entities/patient.entity";
import { IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ChangeSpecialistStatusDto {
  @ApiProperty({ description: 'New profile status for the specialist', enum: ProfileStatus, example: 'Active' })
  @IsNotEmpty()
  @IsEnum(ProfileStatus)
  profileStatus: ProfileStatus;
}
