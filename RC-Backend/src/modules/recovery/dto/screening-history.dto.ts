import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScreeningInstrumentType } from '../entities/addiction-screening.entity';

export class ScreeningHistoryDto {
  @ApiPropertyOptional({
    description: 'Filter results by screening instrument type',
    enum: ScreeningInstrumentType,
    example: ScreeningInstrumentType.AUDIT,
  })
  @IsOptional()
  @IsEnum(ScreeningInstrumentType)
  readonly instrument?: ScreeningInstrumentType;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  readonly page?: number;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  readonly limit?: number;

  @ApiPropertyOptional({
    description: 'Sort order for results by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  readonly sortOrder?: 'asc' | 'desc';
}
