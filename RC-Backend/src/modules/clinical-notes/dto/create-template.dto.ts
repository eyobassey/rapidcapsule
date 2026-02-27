import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Name of the clinical note template',
    example: 'General Consultation Template',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template content with placeholder structure for clinical notes',
    example:
      'Chief Complaint: [CC]\nHPI: [History]\nExam: [Findings]\nAssessment: [Diagnosis]\nPlan: [Treatment]',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Category to organize the template',
    example: 'General Medicine',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Whether the template is visible to other specialists',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is the default template for the specialist',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for filtering and searching templates',
    example: ['consultation', 'general', 'SOAP'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
