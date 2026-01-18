import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class TransferCreditsDto {
  @IsString()
  @IsNotEmpty()
  recipient_id: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  credits: number;
}

export class SearchPatientsDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
