/**
 * Drug Classification Enums
 * Based on regulatory requirements and purchase flow controls
 */

/**
 * Purchase type determines the buying flow required
 */
export enum PurchaseType {
  OTC_GENERAL = 'OTC_GENERAL', // Direct purchase, quantity limits only
  OTC_RESTRICTED = 'OTC_RESTRICTED', // Direct + health screening questionnaire
  PHARMACY_ONLY = 'PHARMACY_ONLY', // Direct + mandatory pharmacist consultation
  PRESCRIPTION_ONLY = 'PRESCRIPTION_ONLY', // Requires valid prescription
  CONTROLLED = 'CONTROLLED', // E-prescription only, enhanced validation
}

/**
 * Schedule class for regulatory compliance
 */
export enum ScheduleClass {
  OTC = 'OTC', // Over-the-counter
  RX_ONLY = 'RX_ONLY', // Prescription only (non-controlled)
  SCHEDULE_V = 'SCHEDULE_V', // Lowest potential for abuse
  SCHEDULE_IV = 'SCHEDULE_IV', // Low potential for abuse
  SCHEDULE_III = 'SCHEDULE_III', // Moderate potential for abuse
  SCHEDULE_II = 'SCHEDULE_II', // High potential for abuse
}

/**
 * Dosage form of the medication
 */
export enum DosageForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  SUSPENSION = 'SUSPENSION',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  GEL = 'GEL',
  DROPS = 'DROPS',
  INHALER = 'INHALER',
  PATCH = 'PATCH',
  SUPPOSITORY = 'SUPPOSITORY',
  POWDER = 'POWDER',
  SOLUTION = 'SOLUTION',
  SPRAY = 'SPRAY',
  LOZENGE = 'LOZENGE',
  GRANULES = 'GRANULES',
  EFFERVESCENT = 'EFFERVESCENT',
  CHEWABLE = 'CHEWABLE',
  SUBLINGUAL = 'SUBLINGUAL',
}

/**
 * Drug categories for browsing/filtering
 */
export enum DrugCategory {
  PAIN_RELIEF = 'PAIN_RELIEF',
  COLD_AND_FLU = 'COLD_AND_FLU',
  ALLERGIES = 'ALLERGIES',
  DIGESTIVE_HEALTH = 'DIGESTIVE_HEALTH',
  VITAMINS_SUPPLEMENTS = 'VITAMINS_SUPPLEMENTS',
  FIRST_AID = 'FIRST_AID',
  SKIN_CARE = 'SKIN_CARE',
  EYE_CARE = 'EYE_CARE',
  EAR_CARE = 'EAR_CARE',
  ORAL_CARE = 'ORAL_CARE',
  RESPIRATORY = 'RESPIRATORY',
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  DIABETES = 'DIABETES',
  ANTIBIOTICS = 'ANTIBIOTICS',
  ANTIFUNGALS = 'ANTIFUNGALS',
  ANTIVIRALS = 'ANTIVIRALS',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  HORMONES = 'HORMONES',
  WOMENS_HEALTH = 'WOMENS_HEALTH',
  MENS_HEALTH = 'MENS_HEALTH',
  CHILDREN_HEALTH = 'CHILDREN_HEALTH',
  SEXUAL_HEALTH = 'SEXUAL_HEALTH',
  SLEEP_AIDS = 'SLEEP_AIDS',
  WEIGHT_MANAGEMENT = 'WEIGHT_MANAGEMENT',
  SMOKING_CESSATION = 'SMOKING_CESSATION',
  EMERGENCY_CONTRACEPTION = 'EMERGENCY_CONTRACEPTION',
  MEDICAL_DEVICES = 'MEDICAL_DEVICES',
  OTHER = 'OTHER',
}

/**
 * Drug status for availability
 */
export enum DrugStatus {
  ACTIVE = 'ACTIVE', // Available for purchase
  INACTIVE = 'INACTIVE', // Not available (discontinued, etc.)
  OUT_OF_STOCK = 'OUT_OF_STOCK', // Temporarily unavailable
  RECALLED = 'RECALLED', // Product recall
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Awaiting regulatory approval
}
