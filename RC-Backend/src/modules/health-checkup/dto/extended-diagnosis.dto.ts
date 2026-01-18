import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ExtendedDiagnosisDto {
  @IsString()
  interview_token: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  min_probability?: number = 0.01; // Lower threshold to get more conditions

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50)
  limit?: number = 30; // Maximum number of conditions to return
}