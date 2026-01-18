import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RiskFactorsDto {
  @IsNotEmpty()
  @IsNumber()
  age: number;

  @IsOptional()
  @IsString()
  interview_token?: string;
}
