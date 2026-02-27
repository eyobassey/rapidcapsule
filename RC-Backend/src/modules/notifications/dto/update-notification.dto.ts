import { IsBoolean, IsOptional, IsDate, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Whether the notification has been read by the user',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when the notification was read',
    example: '2026-03-01T14:30:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  read_at?: Date;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Set to true to mark the notification as read',
    example: true,
  })
  @IsBoolean()
  is_read: boolean;
}

export class MarkMultipleAsReadDto {
  @ApiPropertyOptional({
    description: 'Array of notification IDs to mark as read. If omitted, use mark_all instead.',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notification_ids?: string[];

  @ApiPropertyOptional({
    description: 'Set to true to mark all notifications as read for the authenticated user',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  mark_all?: boolean;
}
