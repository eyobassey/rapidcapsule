import { IsOptional, IsArray, IsDate, IsString, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncHealthDataDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
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
  @ArrayMaxSize(500)
  healthData?: Array<{
    type: string;
    value: any;
    date: Date;
    uuid?: string;
    sourceName?: string;
  }>;
}