import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../types/notification.types';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(UserTypeNotification)
  user_type: UserTypeNotification;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  action_url?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expires_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduled_for?: Date;

  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;
}

export class CreateBulkNotificationDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(UserTypeNotification)
  user_type: UserTypeNotification;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  action_url?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}
