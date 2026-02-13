import { PartialType } from '@nestjs/swagger';
import { ProfileSetupDto } from './profile-setup.dto';

export class UpdateUserProfileDto extends PartialType(ProfileSetupDto) {}
