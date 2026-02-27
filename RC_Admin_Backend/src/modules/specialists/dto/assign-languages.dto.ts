import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class AssignLanguagesDto {
  @ApiProperty({ description: 'Array of language IDs to assign', example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  language_ids: Types.ObjectId[];
}

export class AssignCategoriesDto {
  @ApiProperty({ description: 'Array of specialist category IDs to assign', example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  category_ids: Types.ObjectId[];
}
