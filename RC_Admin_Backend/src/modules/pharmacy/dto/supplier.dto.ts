import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDate,
  ValidateNested,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentTerms, SupplierStatus } from '../entities/supplier.entity';

class ContactDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  alternate_phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contact_person_title?: string;

  @IsOptional()
  @IsString()
  contact_person_phone?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;
}

class LicenseDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  issuing_authority?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  issue_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @IsOptional()
  @IsString()
  document_url?: string;
}

class BankingDto {
  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  account_name?: string;

  @IsOptional()
  @IsString()
  bank_code?: string;
}

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseDto)
  license?: LicenseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankingDto)
  banking?: BankingDto;

  @IsOptional()
  @IsEnum(PaymentTerms)
  payment_terms?: PaymentTerms;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  product_categories?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseDto)
  license?: LicenseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankingDto)
  banking?: BankingDto;

  @IsOptional()
  @IsEnum(PaymentTerms)
  payment_terms?: PaymentTerms;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_balance?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  product_categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ChangeSupplierStatusDto {
  @IsEnum(SupplierStatus)
  status: SupplierStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifySupplierLicenseDto {
  @IsBoolean()
  is_verified: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SupplierQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  licenseExpiringSoon?: boolean;
}
