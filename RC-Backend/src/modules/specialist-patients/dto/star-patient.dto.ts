import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';

export class StarPatientDto {
  @ApiProperty({ description: 'Whether to star (true) or unstar (false) the patient', example: true })
  @IsBoolean()
  starred: boolean;

  @ApiPropertyOptional({ description: 'Notes about why the patient is starred', example: 'High-risk patient requiring close monitoring' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Categories to tag the starred patient with', example: ['chronic', 'follow-up'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
