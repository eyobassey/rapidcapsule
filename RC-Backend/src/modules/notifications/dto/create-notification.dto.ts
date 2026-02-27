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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../types/notification.types';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user to receive the notification',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of user receiving the notification',
    enum: UserTypeNotification,
    example: UserTypeNotification.PATIENT,
  })
  @IsEnum(UserTypeNotification)
  user_type: UserTypeNotification;

  @ApiProperty({
    description: 'Category type of the notification',
    enum: NotificationType,
    example: NotificationType.APPOINTMENT_REMINDER,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Title of the notification displayed to the user',
    example: 'Appointment Reminder',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Body message content of the notification',
    example: 'Your appointment with Dr. Adeyemi is in 30 minutes. Please be ready for your video consultation.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata associated with the notification',
    example: { appointment_id: '507f1f77bcf86cd799439022', specialist_name: 'Dr. Adeyemi' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL the user is directed to when they tap/click the notification',
    example: '/appointments/507f1f77bcf86cd799439022',
  })
  @IsOptional()
  @IsString()
  action_url?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the notification',
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Delivery channels for the notification',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({
    description: 'Expiration date after which the notification is no longer relevant',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expires_at?: Date;

  @ApiPropertyOptional({
    description: 'Date and time when the notification should be sent (for scheduled notifications)',
    example: '2026-03-15T09:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduled_for?: Date;

  @ApiPropertyOptional({
    description: 'Whether this notification is scheduled for future delivery',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;
}

export class CreateBulkNotificationDto {
  @ApiProperty({
    description: 'Array of user IDs to receive the bulk notification',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Type of users receiving the bulk notification',
    enum: UserTypeNotification,
    example: UserTypeNotification.PATIENT,
  })
  @IsEnum(UserTypeNotification)
  user_type: UserTypeNotification;

  @ApiProperty({
    description: 'Category type of the notification',
    enum: NotificationType,
    example: NotificationType.SYSTEM_MAINTENANCE,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Title of the bulk notification',
    example: 'Scheduled Maintenance Notice',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Body message content of the bulk notification',
    example: 'Our platform will undergo scheduled maintenance on Saturday 15th March from 2:00 AM to 4:00 AM WAT.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata associated with the bulk notification',
    example: { maintenance_window: '2:00 AM - 4:00 AM WAT', affected_services: ['appointments', 'video_calls'] },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL the user is directed to when they tap/click the notification',
    example: '/announcements/maintenance-march-2026',
  })
  @IsOptional()
  @IsString()
  action_url?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the bulk notification',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Delivery channels for the bulk notification',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}
