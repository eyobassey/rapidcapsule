import { UserSettingsDefaults } from '../types/user-settings.types';
import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserSettingDto {
  @ApiProperty({ description: 'User settings defaults configuration', type: () => UserSettingsDefaults })
  @ValidateNested({ each: true })
  @Type(() => UserSettingsDefaults)
  defaults: UserSettingsDefaults;
}
