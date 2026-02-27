import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdminDefaultSettingsTypes } from '../types/settings.types';
import { Types } from 'mongoose';

export class CreateAdminSettingDto {
  @ApiProperty({ description: 'Unique identifier for the admin setting document', example: '507f1f77bcf86cd799439011' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Default platform settings including payment provider configuration', type: () => AdminDefaultSettingsTypes })
  @ValidateNested({ each: true })
  @Type(() => AdminDefaultSettingsTypes)
  defaults: AdminDefaultSettingsTypes;
}
