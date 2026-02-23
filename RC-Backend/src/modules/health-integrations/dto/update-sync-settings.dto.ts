import { IsOptional, IsBoolean, IsArray, IsString, IsIn, ArrayMaxSize } from 'class-validator';

export class UpdateSyncSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @IsOptional()
  @IsIn(['pull', 'push', 'bidirectional'])
  syncDirection?: 'pull' | 'push' | 'bidirectional';

  @IsOptional()
  @IsIn(['hourly', 'daily', 'weekly', 'manual'])
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'manual';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  dataTypes?: string[];
}