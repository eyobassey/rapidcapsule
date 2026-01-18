import { IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';

export class UpdateSyncSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @IsOptional()
  syncDirection?: 'pull' | 'push' | 'bidirectional';

  @IsOptional()
  @IsString()
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'manual';

  @IsOptional()
  @IsArray()
  dataTypes?: string[];
}