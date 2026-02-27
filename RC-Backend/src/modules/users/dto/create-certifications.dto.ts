import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Documents } from '../types/profile.types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificationsDto {
  @ApiPropertyOptional({
    description: 'List of professional certification documents',
    type: [Documents],
    example: [{ title: 'MBBS Certificate', file_url: 'https://s3.amazonaws.com/rapidcapsules/docs/mbbs-cert.pdf', year: '2018' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Documents)
  documents?: Documents[];
}
