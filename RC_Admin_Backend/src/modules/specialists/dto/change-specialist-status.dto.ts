import { ProfileStatus } from "../../patients/entities/patient.entity";
import { IsEnum, IsNotEmpty } from "class-validator";

export class ChangeSpecialistStatusDto {
  @IsNotEmpty()
  @IsEnum(ProfileStatus)
  profileStatus: ProfileStatus;
}
