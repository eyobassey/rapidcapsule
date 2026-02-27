import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Award } from '../types/profile.types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAwardDto {
  @ApiPropertyOptional({
    description: 'List of professional awards and recognitions',
    type: [Award],
    example: [{ title: 'Best Resident Physician', year: '2022', issuing_body: 'Nigerian Medical Association' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Award)
  awards?: Award[];
}
