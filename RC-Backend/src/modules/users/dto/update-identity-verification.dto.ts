import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class GovernmentIdDto {
  @IsOptional()
  @IsString()
  type?: string; // 'passport', 'national_id', 'drivers_license'

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  expiry?: string;

  @IsOptional()
  @IsString()
  document_url?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'pending', 'verified', 'rejected'
}

class MedicalLicenseDto {
  @IsOptional()
  @IsString()
  license_number?: string;

  @IsOptional()
  @IsString()
  issuing_body?: string; // 'mdcn', 'nmcn', 'pcn', 'other'

  @IsOptional()
  @IsString()
  document_url?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class RegistryCheckDto {
  @IsOptional()
  @IsString()
  status?: string; // 'pending', 'verified', 'failed'

  @IsOptional()
  @IsString()
  registry_name?: string;
}

export class UpdateIdentityVerificationDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GovernmentIdDto)
  government_id?: GovernmentIdDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MedicalLicenseDto)
  medical_license?: MedicalLicenseDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RegistryCheckDto)
  registry_check?: RegistryCheckDto;

  @IsOptional()
  @IsString()
  credential_hash?: string;
}
