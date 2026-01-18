import { QueueType, QueuePriority } from '../entities/whatsapp-prescription-queue.entity';

/**
 * SLA configuration for prescription queue processing
 */
export const SLA_CONFIG: Record<QueueType, Record<QueuePriority, number>> = {
  // OCR Review - moderate urgency
  [QueueType.OCR_REVIEW]: {
    [QueuePriority.LOW]: 4 * 60, // 4 hours
    [QueuePriority.NORMAL]: 2 * 60, // 2 hours
    [QueuePriority.HIGH]: 60, // 1 hour
    [QueuePriority.URGENT]: 30, // 30 minutes
  },

  // Manual Entry - lower urgency, takes more time
  [QueueType.MANUAL_ENTRY]: {
    [QueuePriority.LOW]: 8 * 60, // 8 hours
    [QueuePriority.NORMAL]: 4 * 60, // 4 hours
    [QueuePriority.HIGH]: 2 * 60, // 2 hours
    [QueuePriority.URGENT]: 60, // 1 hour
  },

  // Controlled Substance - high urgency, needs careful review
  [QueueType.CONTROLLED_SUBSTANCE]: {
    [QueuePriority.LOW]: 4 * 60, // 4 hours
    [QueuePriority.NORMAL]: 2 * 60, // 2 hours
    [QueuePriority.HIGH]: 60, // 1 hour
    [QueuePriority.URGENT]: 30, // 30 minutes
  },

  // Verification Failed - needs quick attention
  [QueueType.VERIFICATION_FAILED]: {
    [QueuePriority.LOW]: 2 * 60, // 2 hours
    [QueuePriority.NORMAL]: 60, // 1 hour
    [QueuePriority.HIGH]: 30, // 30 minutes
    [QueuePriority.URGENT]: 15, // 15 minutes
  },

  // Pharmacist Escalation - urgent by nature
  [QueueType.PHARMACIST_ESCALATION]: {
    [QueuePriority.LOW]: 60, // 1 hour
    [QueuePriority.NORMAL]: 30, // 30 minutes
    [QueuePriority.HIGH]: 15, // 15 minutes
    [QueuePriority.URGENT]: 10, // 10 minutes
  },

  // Clarification Response - patient already waiting
  [QueueType.CLARIFICATION_RESPONSE]: {
    [QueuePriority.LOW]: 2 * 60, // 2 hours
    [QueuePriority.NORMAL]: 60, // 1 hour
    [QueuePriority.HIGH]: 30, // 30 minutes
    [QueuePriority.URGENT]: 15, // 15 minutes
  },
};

/**
 * Get SLA deadline in minutes for a queue item
 */
export function getSLAMinutes(queueType: QueueType, priority: QueuePriority): number {
  return SLA_CONFIG[queueType]?.[priority] || 120; // Default 2 hours
}

/**
 * Calculate SLA deadline date
 */
export function calculateSLADeadline(queueType: QueueType, priority: QueuePriority): Date {
  const minutes = getSLAMinutes(queueType, priority);
  return new Date(Date.now() + minutes * 60 * 1000);
}
