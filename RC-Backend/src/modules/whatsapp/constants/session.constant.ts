/**
 * Session configuration for WhatsApp conversations
 */
export const SESSION_CONFIG = {
  // Idle timeout - session expires after 30 minutes of inactivity
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes

  // Maximum session duration - absolute limit regardless of activity
  MAX_SESSION_DURATION_MS: 4 * 60 * 60 * 1000, // 4 hours

  // Warning before timeout - send warning 5 minutes before expiry
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  // Re-verification period - require re-verification after 90 days
  REVERIFICATION_PERIOD_DAYS: 90,

  // OTP validity period
  OTP_VALIDITY_MS: 10 * 60 * 1000, // 10 minutes

  // Maximum OTP attempts before block
  MAX_OTP_ATTEMPTS: 5,

  // Block duration after failed attempts
  BLOCK_DURATION_HOURS: 24,
};
