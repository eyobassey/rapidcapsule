/**
 * Pharmacy-related Enums
 */

/**
 * Pharmacy verification status
 */
export enum PharmacyVerificationStatus {
  PENDING = 'PENDING', // Awaiting verification
  UNDER_REVIEW = 'UNDER_REVIEW', // Documents being reviewed
  VERIFIED = 'VERIFIED', // Fully verified and active
  SUSPENDED = 'SUSPENDED', // Temporarily suspended
  REJECTED = 'REJECTED', // Verification failed
  EXPIRED = 'EXPIRED', // License/registration expired
}

/**
 * Pharmacy document types for verification
 */
export enum PharmacyDocumentType {
  PHARMACY_LICENSE = 'PHARMACY_LICENSE', // PCN license
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION', // CAC registration
  NAFDAC_REGISTRATION = 'NAFDAC_REGISTRATION', // NAFDAC premises registration
  TAX_CERTIFICATE = 'TAX_CERTIFICATE', // Tax clearance
  SUPERINTENDENT_PHARMACIST_LICENSE = 'SUPERINTENDENT_PHARMACIST_LICENSE',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS', // Utility bill, etc.
  BANK_STATEMENT = 'BANK_STATEMENT', // For payout verification
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
  RETAIL = 'RETAIL', // Standard retail pharmacy
  HOSPITAL = 'HOSPITAL', // Hospital-based pharmacy
  COMMUNITY = 'COMMUNITY', // Community pharmacy
  ONLINE = 'ONLINE', // Online-only pharmacy
  COMPOUNDING = 'COMPOUNDING', // Compounding pharmacy
}
