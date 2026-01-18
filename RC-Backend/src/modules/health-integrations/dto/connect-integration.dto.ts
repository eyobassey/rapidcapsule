import { IsEnum, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator';
import { IntegrationProvider } from '../schemas/health-integration.schema';

export class ConnectIntegrationDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsOptional()
  @IsArray()
  dataTypes?: string[];

  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @IsOptional()
  syncDirection?: 'pull' | 'push' | 'bidirectional';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}