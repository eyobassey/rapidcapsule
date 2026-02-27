import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScreeningInstrumentType, ScreeningType } from '../entities/addiction-screening.entity';

export class BeginScreeningDto {
  @ApiProperty({
    description: 'The validated screening instrument to administer',
    enum: ScreeningInstrumentType,
    example: ScreeningInstrumentType.AUDIT,
  })
  @IsEnum(ScreeningInstrumentType)
  readonly instrument: ScreeningInstrumentType;

  @ApiPropertyOptional({
    description: 'How the screening is being administered',
    enum: ScreeningType,
    example: ScreeningType.SELF,
  })
  @IsOptional()
  @IsEnum(ScreeningType)
  readonly screening_type?: ScreeningType;

  @ApiPropertyOptional({
    description: 'Patient ID when a specialist is administering the screening on behalf of a patient',
    example: '663f961ebb4dc1fec5426abc',
  })
  @IsOptional()
  @IsString()
  readonly patient_id?: string;
}
