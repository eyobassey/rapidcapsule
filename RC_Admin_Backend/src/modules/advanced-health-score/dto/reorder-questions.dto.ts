import { IsArray, IsNotEmpty, IsString, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOrderDto {
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsNumber()
  @Min(1)
  new_order: number;
}

export class ReorderQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[];
}
