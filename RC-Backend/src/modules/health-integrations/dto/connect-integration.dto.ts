import { IsEnum, IsOptional, IsArray, IsBoolean, IsObject, IsString, IsIn, ArrayMaxSize } from 'class-validator';
import { IntegrationProvider } from '../schemas/health-integration.schema';

export class ConnectIntegrationDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  dataTypes?: string[];

  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @IsOptional()
  @IsIn(['pull', 'push', 'bidirectional'])
  syncDirection?: 'pull' | 'push' | 'bidirectional';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}