import { IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsOptional()
  description?: string;
}

// Response DTO for upload
export class UploadDocumentResponseDto {
  document_id: string;
  original_name: string;
  file_type: string;
  s3_url: string;
  uploaded_at: Date;
}
