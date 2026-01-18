/**
 * Rate limiting configuration for WhatsApp actions
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Prescription uploads
  PRESCRIPTION_UPLOAD: {
    per_number_per_day: 5,
    per_number_per_hour: 3,
  },

  // Order creation
  ORDER_CREATION: {
    per_number_per_day: 10,
    per_number_per_hour: 5,
  },

  // High-value orders (> ₦50,000)
  HIGH_VALUE_ORDER: {
    per_number_per_day: 3,
    per_number_per_hour: 2,
  },

  // Messages (spam prevention)
  MESSAGES: {
    per_number_per_hour: 200,
    per_minute: 20,
  },

  // Media uploads
  MEDIA_UPLOAD: {
    per_number_per_hour: 30,
    per_number_per_day: 100,
  },

  // Verification attempts
  VERIFICATION_ATTEMPT: {
    per_number_per_hour: 5,
    per_number_per_day: 10,
  },

  // Controlled substance requests (extra strict)
  CONTROLLED_SUBSTANCE: {
    per_number_per_week: 2,
    per_number_per_day: 1,
  },

  // Support/pharmacist chat requests
  SUPPORT_REQUEST: {
    per_number_per_hour: 3,
    per_number_per_day: 10,
  },
};

export interface RateLimitConfig {
  per_minute?: number;
  per_number_per_hour?: number;
  per_number_per_day?: number;
  per_number_per_week?: number;
}
