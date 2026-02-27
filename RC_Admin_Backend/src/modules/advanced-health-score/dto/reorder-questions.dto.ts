import { IsArray, IsNotEmpty, IsString, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QuestionOrderDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the question to reorder', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: 'New display position for the question (1-based)', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  new_order: number;
}

export class ReorderQuestionsDto {
  @ApiProperty({ description: 'Array of question IDs with their new display order positions', type: [QuestionOrderDto], example: [{ question_id: '507f1f77bcf86cd799439011', new_order: 1 }, { question_id: '507f1f77bcf86cd799439012', new_order: 2 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[];
}
