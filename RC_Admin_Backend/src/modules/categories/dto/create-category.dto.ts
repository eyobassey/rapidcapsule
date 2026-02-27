import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Cardiology' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'List of specializations under this category', example: ['Interventional Cardiology', 'Electrophysiology', 'Heart Failure'] })
  @IsNotEmpty()
  @IsArray()
  specializations: string[];
}
