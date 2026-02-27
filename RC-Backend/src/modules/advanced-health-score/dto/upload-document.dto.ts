import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Description of the uploaded document', example: 'Blood test results from General Hospital Lagos' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Response DTO for upload
export class UploadDocumentResponseDto {
  @ApiProperty({ description: 'Unique document ID', example: 'doc_abc123' })
  document_id: string;

  @ApiProperty({ description: 'Original file name', example: 'blood_test_results.pdf' })
  original_name: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'application/pdf' })
  file_type: string;

  @ApiProperty({ description: 'S3 URL of the uploaded document', example: 'https://s3.amazonaws.com/rapidcapsules/documents/blood_test_results.pdf' })
  s3_url: string;

  @ApiProperty({ description: 'Upload timestamp', example: '2025-09-15T10:30:00.000Z' })
  uploaded_at: Date;
}
