import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class GovernmentIdDto {
  @ApiPropertyOptional({ description: 'Type of government-issued ID', example: 'national_id', enum: ['passport', 'national_id', 'drivers_license'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'ID document number', example: 'A12345678' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ description: 'Document expiry date', example: '2028-12-31' })
  @IsOptional()
  @IsString()
  expiry?: string;

  @ApiPropertyOptional({ description: 'S3 URL to uploaded document scan', example: 'https://s3.amazonaws.com/rapidcapsules/docs/gov-id.pdf' })
  @IsOptional()
  @IsString()
  document_url?: string;

  @ApiPropertyOptional({ description: 'Verification status', example: 'pending', enum: ['pending', 'verified', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;
}

class MedicalLicenseDto {
  @ApiPropertyOptional({ description: 'Medical license number', example: 'MDCN/2020/12345' })
  @IsOptional()
  @IsString()
  license_number?: string;

  @ApiPropertyOptional({ description: 'Issuing regulatory body', example: 'mdcn', enum: ['mdcn', 'nmcn', 'pcn', 'other'] })
  @IsOptional()
  @IsString()
  issuing_body?: string;

  @ApiPropertyOptional({ description: 'S3 URL to uploaded license document', example: 'https://s3.amazonaws.com/rapidcapsules/docs/medical-license.pdf' })
  @IsOptional()
  @IsString()
  document_url?: string;

  @ApiPropertyOptional({ description: 'Verification status', example: 'pending', enum: ['pending', 'verified', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;
}

class RegistryCheckDto {
  @ApiPropertyOptional({ description: 'Registry verification status', example: 'pending', enum: ['pending', 'verified', 'failed'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Name of the professional registry checked', example: 'MDCN Registry' })
  @IsOptional()
  @IsString()
  registry_name?: string;
}

export class UpdateIdentityVerificationDto {
  @ApiPropertyOptional({ description: 'Government-issued ID details', type: GovernmentIdDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GovernmentIdDto)
  government_id?: GovernmentIdDto;

  @ApiPropertyOptional({ description: 'Medical license details (specialists only)', type: MedicalLicenseDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MedicalLicenseDto)
  medical_license?: MedicalLicenseDto;

  @ApiPropertyOptional({ description: 'Professional registry verification result', type: RegistryCheckDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RegistryCheckDto)
  registry_check?: RegistryCheckDto;

  @ApiPropertyOptional({ description: 'Hash of combined credentials for integrity check', example: 'sha256:abc123def456...' })
  @IsOptional()
  @IsString()
  credential_hash?: string;
}
