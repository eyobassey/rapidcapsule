/**
 * Pharmacy-related Enums
 */

/**
 * Pharmacy verification status
 */
export enum PharmacyVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Pharmacy document types for verification
 */
export enum PharmacyDocumentType {
  PHARMACY_LICENSE = 'PHARMACY_LICENSE',
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  NAFDAC_REGISTRATION = 'NAFDAC_REGISTRATION',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  SUPERINTENDENT_PHARMACIST_LICENSE = 'SUPERINTENDENT_PHARMACIST_LICENSE',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  BANK_STATEMENT = 'BANK_STATEMENT',
  OTHER = 'OTHER',
}

/**
 * Days of the week for operating hours
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

/**
 * Payment methods accepted by pharmacy
 */
export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  WALLET = 'WALLET',
  INSURANCE = 'INSURANCE',
}

/**
 * Pharmacy type classification
 */
export enum PharmacyType {
  RETAIL = 'RETAIL',
  HOSPITAL = 'HOSPITAL',
  COMMUNITY = 'COMMUNITY',
  ONLINE = 'ONLINE',
  COMPOUNDING = 'COMPOUNDING',
}
