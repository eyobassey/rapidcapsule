import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class EkaChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsMongoId()
  conversation_id?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
