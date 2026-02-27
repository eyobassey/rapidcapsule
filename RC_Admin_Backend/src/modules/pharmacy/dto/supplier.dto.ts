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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTerms, SupplierStatus } from '../entities/supplier.entity';

class ContactDto {
  @ApiPropertyOptional({ description: 'Primary phone number', example: '+234 801 234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Alternate phone number', example: '+234 802 345 6789' })
  @IsOptional()
  @IsString()
  alternate_phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'orders@emzorpharma.com.ng' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Name of primary contact person', example: 'Adebayo Ogundimu' })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiPropertyOptional({ description: 'Title of the contact person', example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  contact_person_title?: string;

  @ApiPropertyOptional({ description: 'Direct phone for the contact person', example: '+234 803 456 7890' })
  @IsOptional()
  @IsString()
  contact_person_phone?: string;

  @ApiPropertyOptional({ description: 'Company website URL', example: 'https://www.emzorpharma.com' })
  @IsOptional()
  @IsString()
  website?: string;
}

class AddressDto {
  @ApiPropertyOptional({ description: 'Street address', example: '3/5 Iddo Road, Oyingbo' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or region', example: 'Lagos' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal or ZIP code', example: '102273' })
  @IsOptional()
  @IsString()
  postal_code?: string;
}

class LicenseDto {
  @ApiPropertyOptional({ description: 'License or registration number', example: 'PCN/RET/LAG/2025/0456' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ description: 'Type of license', example: 'Wholesale Pharmaceutical License' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Issuing regulatory authority', example: 'Pharmacists Council of Nigeria (PCN)' })
  @IsOptional()
  @IsString()
  issuing_authority?: string;

  @ApiPropertyOptional({ description: 'Date the license was issued', example: '2025-01-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  issue_date?: Date;

  @ApiPropertyOptional({ description: 'License expiry date', example: '2026-01-14T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiry_date?: Date;

  @ApiPropertyOptional({ description: 'URL to uploaded license document', example: 'https://rapidcapsules.s3.us-east-2.amazonaws.com/suppliers/licenses/emzor-pcn-2025.pdf' })
  @IsOptional()
  @IsString()
  document_url?: string;
}

class BankingDto {
  @ApiPropertyOptional({ description: 'Bank name', example: 'Guaranty Trust Bank' })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ description: 'Bank account number', example: '0123456789' })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiPropertyOptional({ description: 'Account holder name', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsOptional()
  @IsString()
  account_name?: string;

  @ApiPropertyOptional({ description: 'Bank code for payment processing', example: '058' })
  @IsOptional()
  @IsString()
  bank_code?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ description: 'Full legal name of the supplier', example: 'Emzor Pharmaceutical Industries Ltd' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Short or display name', example: 'Emzor' })
  @IsOptional()
  @IsString()
  short_name?: string;

  @ApiPropertyOptional({ description: 'Description of the supplier', example: 'Leading Nigerian pharmaceutical manufacturer producing analgesics, antibiotics, and antimalarials.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Contact information', type: ContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiPropertyOptional({ description: 'Physical address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Pharmaceutical license details', type: LicenseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseDto)
  license?: LicenseDto;

  @ApiPropertyOptional({ description: 'Banking information for payments', type: BankingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankingDto)
  banking?: BankingDto;

  @ApiPropertyOptional({ description: 'Agreed payment terms', enum: PaymentTerms, example: 'net_30' })
  @IsOptional()
  @IsEnum(PaymentTerms)
  payment_terms?: PaymentTerms;

  @ApiPropertyOptional({ description: 'Credit limit in NGN', example: 5000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @ApiPropertyOptional({ description: 'Product category ObjectIds supplied', example: ['65a1b2c3d4e5f6a7b8c9d0e2', '65a1b2c3d4e5f6a7b8c9d0e3'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  product_categories?: string[];

  @ApiPropertyOptional({ description: 'Internal notes about the supplier', example: 'Reliable delivery. Average lead time 3-5 business days within Lagos.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Full legal name of the supplier', example: 'Fidson Healthcare Plc' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Short or display name', example: 'Fidson' })
  @IsOptional()
  @IsString()
  short_name?: string;

  @ApiPropertyOptional({ description: 'Description of the supplier', example: 'Nigerian pharmaceutical company specializing in branded generics and OTC medicines.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated contact information', type: ContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiPropertyOptional({ description: 'Updated physical address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Updated license details', type: LicenseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseDto)
  license?: LicenseDto;

  @ApiPropertyOptional({ description: 'Updated banking information', type: BankingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankingDto)
  banking?: BankingDto;

  @ApiPropertyOptional({ description: 'Updated payment terms', enum: PaymentTerms, example: 'net_60' })
  @IsOptional()
  @IsEnum(PaymentTerms)
  payment_terms?: PaymentTerms;

  @ApiPropertyOptional({ description: 'Updated credit limit in NGN', example: 7500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @ApiPropertyOptional({ description: 'Current outstanding balance in NGN', example: 1250000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_balance?: number;

  @ApiPropertyOptional({ description: 'Updated product category ObjectIds', example: ['65a1b2c3d4e5f6a7b8c9d0e2'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  product_categories?: string[];

  @ApiPropertyOptional({ description: 'Supplier rating (0-5)', example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Internal notes about the supplier', example: 'Updated payment terms agreed Q2 2025.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the supplier is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ChangeSupplierStatusDto {
  @ApiProperty({ description: 'New supplier status', enum: SupplierStatus, example: 'active' })
  @IsEnum(SupplierStatus)
  status: SupplierStatus;

  @ApiPropertyOptional({ description: 'Reason for the status change', example: 'License verified and approved by compliance team' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifySupplierLicenseDto {
  @ApiProperty({ description: 'Whether the license has been verified', example: true })
  @IsBoolean()
  is_verified: boolean;

  @ApiPropertyOptional({ description: 'Verification notes', example: 'PCN license confirmed valid via online portal. Expires Jan 2026.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SupplierQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term to filter suppliers by name', example: 'Emzor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier status', enum: SupplierStatus, example: 'active' })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Filter by product category ObjectId', example: '65a1b2c3d4e5f6a7b8c9d0e2' })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({ description: 'Include inactive suppliers in results', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;

  @ApiPropertyOptional({ description: 'Only return suppliers with licenses expiring soon', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  licenseExpiringSoon?: boolean;
}
