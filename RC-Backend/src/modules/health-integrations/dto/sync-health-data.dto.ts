import { IsOptional, IsArray, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncHealthDataDto {
  @IsOptional()
  @IsArray()
  dataTypes?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  healthData?: Array<{
    type: string;
    value: any;
    date: Date;
    uuid?: string;
    sourceName?: string;
  }>;
}