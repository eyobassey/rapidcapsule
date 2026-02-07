import { IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  read_at?: Date;
}

export class MarkAsReadDto {
  @IsBoolean()
  is_read: boolean;
}

export class MarkMultipleAsReadDto {
  @IsOptional()
  notification_ids?: string[];

  @IsOptional()
  @IsBoolean()
  mark_all?: boolean;
}
