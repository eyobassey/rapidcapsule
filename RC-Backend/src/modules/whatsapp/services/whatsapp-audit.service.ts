import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  WhatsAppAuditLog,
  WhatsAppAuditLogDocument,
  MessageDirection,
  MessageType,
  RetentionCategory,
} from '../entities/whatsapp-audit-log.entity';

export interface AuditContext {
  patient_id?: Types.ObjectId;
  session_id?: Types.ObjectId;
  current_flow?: string;
  flow_step?: number;
  is_prescription_flow?: boolean;
  is_controlled_substance?: boolean;
  prescription_id?: Types.ObjectId;
  order_id?: Types.ObjectId;
}

export interface InboundMessageData {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string;
  buttonId?: string;
  listId?: string;
}

export interface OutboundMessageData {
  to: string;
  id: string;
  type: string;
  body?: string;
  templateName?: string;
}

@Injectable()
export class WhatsAppAuditService {
  private readonly logger = new Logger(WhatsAppAuditService.name);

  // PII patterns to redact
  private readonly PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{10,11}\b/g, // Phone numbers
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone format XXX-XXX-XXXX
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card
    /\b\d{2}\/\d{2}\/\d{2,4}\b/g, // Dates
  ];

  constructor(
    @InjectModel(WhatsAppAuditLog.name)
    private auditLogModel: Model<WhatsAppAuditLogDocument>,
  ) {}

  /**
   * Log inbound message from WhatsApp
   */
  async logInboundMessage(
    message: InboundMessageData,
    context: AuditContext,
    processingTimeMs?: number,
  ): Promise<WhatsAppAuditLogDocument> {
    const messageType = this.mapMessageType(message.type);
    const retentionCategory = this.determineRetentionCategory(context);

    const log = await this.auditLogModel.create({
      whatsapp_number: this.normalizePhoneNumber(message.from),
      patient_id: context.patient_id,
      session_id: context.session_id,
      message_id: message.id,
      direction: MessageDirection.INBOUND,
      message_type: messageType,
      content_hash: this.hashContent(message.body || ''),
      content_preview: this.redactPII(this.getPreview(message.body || '')),
      has_media: !!message.mediaUrl,
      media_type: message.mediaType,
      flow_context: context.current_flow,
      flow_step: context.flow_step,
      prescription_id: context.prescription_id,
      order_id: context.order_id,
      is_prescription_related: context.is_prescription_flow || false,
      is_controlled_substance: context.is_controlled_substance || false,
      contains_phi: true, // Assume all healthcare messages contain PHI
      wa_timestamp: new Date(parseInt(message.timestamp) * 1000),
      processing_time_ms: processingTimeMs,
      retention_category: retentionCategory,
      retain_until: this.calculateRetentionDate(retentionCategory),
    });

    return log;
  }

  /**
   * Log outbound message to WhatsApp
   */
  async logOutboundMessage(
    message: OutboundMessageData,
    context: AuditContext,
    processingTimeMs?: number,
  ): Promise<WhatsAppAuditLogDocument> {
    const messageType = this.mapMessageType(message.type);
    const retentionCategory = this.determineRetentionCategory(context);

    const log = await this.auditLogModel.create({
      whatsapp_number: this.normalizePhoneNumber(message.to),
      patient_id: context.patient_id,
      session_id: context.session_id,
      message_id: message.id,
      direction: MessageDirection.OUTBOUND,
      message_type: messageType,
      content_hash: this.hashContent(message.body || message.templateName || ''),
      content_preview: this.redactPII(this.getPreview(message.body || `[Template: ${message.templateName}]`)),
      flow_context: context.current_flow,
      flow_step: context.flow_step,
      prescription_id: context.prescription_id,
      order_id: context.order_id,
      is_prescription_related: context.is_prescription_flow || false,
      is_controlled_substance: context.is_controlled_substance || false,
      contains_phi: true,
      processing_time_ms: processingTimeMs,
      retention_category: retentionCategory,
      retain_until: this.calculateRetentionDate(retentionCategory),
    });

    return log;
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    whatsappNumber: string,
    event: {
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      details: string;
    },
    context?: AuditContext,
  ): Promise<void> {
    await this.auditLogModel.create({
      whatsapp_number: this.normalizePhoneNumber(whatsappNumber),
      patient_id: context?.patient_id,
      session_id: context?.session_id,
      direction: MessageDirection.INBOUND,
      message_type: MessageType.TEXT,
      content_preview: `[SECURITY] ${event.type}: ${event.details}`,
      security_flags: [event.type],
      flow_context: context?.current_flow || 'SECURITY_EVENT',
      retention_category: RetentionCategory.STANDARD,
      retain_until: this.calculateRetentionDate(RetentionCategory.STANDARD),
    });

    // Log critical events
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      this.logger.warn(`Security event for ${whatsappNumber}: ${event.type} - ${event.details}`);
    }
  }

  /**
   * Log action taken
   */
  async logAction(
    whatsappNumber: string,
    action: string,
    context: AuditContext,
    details?: string,
  ): Promise<void> {
    await this.auditLogModel.create({
      whatsapp_number: this.normalizePhoneNumber(whatsappNumber),
      patient_id: context.patient_id,
      session_id: context.session_id,
      direction: MessageDirection.OUTBOUND,
      message_type: MessageType.TEXT,
      action_taken: action,
      content_preview: details ? this.redactPII(this.getPreview(details)) : `[ACTION] ${action}`,
      flow_context: context.current_flow,
      flow_step: context.flow_step,
      prescription_id: context.prescription_id,
      order_id: context.order_id,
      is_prescription_related: context.is_prescription_flow || false,
      is_controlled_substance: context.is_controlled_substance || false,
      retention_category: this.determineRetentionCategory(context),
      retain_until: this.calculateRetentionDate(this.determineRetentionCategory(context)),
    });
  }

  /**
   * Log error
   */
  async logError(
    whatsappNumber: string,
    error: Error,
    context?: AuditContext,
  ): Promise<void> {
    await this.auditLogModel.create({
      whatsapp_number: this.normalizePhoneNumber(whatsappNumber),
      patient_id: context?.patient_id,
      session_id: context?.session_id,
      direction: MessageDirection.INBOUND,
      message_type: MessageType.TEXT,
      content_preview: `[ERROR] ${error.message}`,
      had_error: true,
      error_message: error.message,
      flow_context: context?.current_flow || 'ERROR',
      retention_category: RetentionCategory.STANDARD,
      retain_until: this.calculateRetentionDate(RetentionCategory.STANDARD),
    });

    this.logger.error(`WhatsApp error for ${whatsappNumber}: ${error.message}`, error.stack);
  }

  /**
   * Get audit trail for a patient
   */
  async getPatientAuditTrail(
    patientId: Types.ObjectId,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    },
  ): Promise<{ logs: WhatsAppAuditLogDocument[]; total: number }> {
    const query: any = { patient_id: patientId };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 100),
      this.auditLogModel.countDocuments(query),
    ]);

    return { logs, total };
  }

  /**
   * Get audit trail for a prescription
   */
  async getPrescriptionAuditTrail(prescriptionId: Types.ObjectId): Promise<WhatsAppAuditLogDocument[]> {
    return this.auditLogModel.find({ prescription_id: prescriptionId }).sort({ timestamp: 1 });
  }

  /**
   * Get audit trail for an order
   */
  async getOrderAuditTrail(orderId: Types.ObjectId): Promise<WhatsAppAuditLogDocument[]> {
    return this.auditLogModel.find({ order_id: orderId }).sort({ timestamp: 1 });
  }

  /**
   * Get security events for a number
   */
  async getSecurityEvents(
    whatsappNumber: string,
    days: number = 30,
  ): Promise<WhatsAppAuditLogDocument[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.auditLogModel
      .find({
        whatsapp_number: this.normalizePhoneNumber(whatsappNumber),
        security_flags: { $exists: true, $ne: [] },
        timestamp: { $gte: startDate },
      })
      .sort({ timestamp: -1 });
  }

  /**
   * Get controlled substance audit logs
   */
  async getControlledSubstanceLogs(
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<WhatsAppAuditLogDocument[]> {
    const query: any = { is_controlled_substance: true };

    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    return this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 1000);
  }

  // Helper methods
  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace('whatsapp:', '');
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    return normalized;
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getPreview(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  private redactPII(content: string): string {
    let redacted = content;
    for (const pattern of this.PII_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  private mapMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      document: MessageType.DOCUMENT,
      audio: MessageType.AUDIO,
      video: MessageType.VIDEO,
      button: MessageType.BUTTON_RESPONSE,
      interactive: MessageType.INTERACTIVE,
      list: MessageType.LIST_RESPONSE,
      template: MessageType.TEMPLATE,
    };
    return typeMap[type?.toLowerCase()] || MessageType.TEXT;
  }

  private determineRetentionCategory(context: AuditContext): RetentionCategory {
    if (context.is_controlled_substance) return RetentionCategory.CONTROLLED;
    if (context.is_prescription_flow || context.prescription_id) return RetentionCategory.PRESCRIPTION;
    return RetentionCategory.STANDARD;
  }

  private calculateRetentionDate(category: RetentionCategory): Date {
    const retentionYears: Record<RetentionCategory, number> = {
      [RetentionCategory.CONTROLLED]: 10,
      [RetentionCategory.PRESCRIPTION]: 7,
      [RetentionCategory.STANDARD]: 2,
    };
    const years = retentionYears[category];
    return new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000);
  }
}
