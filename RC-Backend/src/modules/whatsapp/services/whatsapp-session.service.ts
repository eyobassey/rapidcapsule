import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppSession,
  WhatsAppSessionDocument,
  FlowType,
} from '../entities/whatsapp-session.entity';
import { SESSION_CONFIG } from '../constants/session.constant';

export interface SessionTimeoutResult {
  expired: boolean;
  message?: string;
  shouldWarn?: boolean;
}

@Injectable()
export class WhatsAppSessionService {
  private readonly logger = new Logger(WhatsAppSessionService.name);

  constructor(
    @InjectModel(WhatsAppSession.name)
    private sessionModel: Model<WhatsAppSessionDocument>,
  ) {}

  /**
   * Get or create session for a WhatsApp number
   */
  async getOrCreateSession(
    whatsappNumber: string,
    patientId?: Types.ObjectId,
  ): Promise<WhatsAppSessionDocument> {
    const now = new Date();

    // Find existing active session
    let session = await this.sessionModel.findOne({
      whatsapp_number: whatsappNumber,
      is_expired: false,
      expires_at: { $gt: now },
    });

    if (session) {
      // Update last activity
      session.last_message_at = now;
      session.expires_at = new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS);
      session.messages_in_session += 1;
      if (patientId && !session.patient_id) {
        session.patient_id = patientId;
      }
      await session.save();
      return session;
    }

    // Create new session
    session = await this.sessionModel.create({
      whatsapp_number: whatsappNumber,
      patient_id: patientId,
      current_flow: FlowType.IDLE,
      flow_step: 0,
      flow_data: {},
      last_message_at: now,
      session_started_at: now,
      expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
      messages_in_session: 1,
    });

    this.logger.log(`Created new session for ${whatsappNumber}`);
    return session;
  }

  /**
   * Get active session for a WhatsApp number
   */
  async getActiveSession(whatsappNumber: string): Promise<WhatsAppSessionDocument | null> {
    const now = new Date();
    return this.sessionModel.findOne({
      whatsapp_number: whatsappNumber,
      is_expired: false,
      expires_at: { $gt: now },
    });
  }

  /**
   * Check if session has timed out
   */
  async checkTimeout(session: WhatsAppSessionDocument): Promise<SessionTimeoutResult> {
    const now = new Date();
    const timeSinceActivity = now.getTime() - session.last_message_at.getTime();

    // Check absolute max session duration
    const sessionDuration = now.getTime() - session.session_started_at.getTime();
    if (sessionDuration > SESSION_CONFIG.MAX_SESSION_DURATION_MS) {
      await this.expireSession(session, 'MAX_DURATION_EXCEEDED');
      return {
        expired: true,
        message: "Your session has ended (maximum 4 hours). Please send 'hi' to start a new session.",
      };
    }

    // Check idle timeout
    if (timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
      await this.expireSession(session, 'IDLE_TIMEOUT');
      return {
        expired: true,
        message: "Your session has expired due to inactivity. Please send 'hi' to start a new session.",
      };
    }

    // Check if approaching timeout (for active flows)
    if (
      session.current_flow !== FlowType.IDLE &&
      !session.timeout_warning_sent &&
      timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT_MS - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS
    ) {
      return {
        expired: false,
        shouldWarn: true,
      };
    }

    return { expired: false };
  }

  /**
   * Update session flow
   */
  async updateFlow(
    sessionId: Types.ObjectId,
    flow: FlowType,
    step: number,
    data?: Record<string, any>,
  ): Promise<WhatsAppSessionDocument | null> {
    const now = new Date();
    const update: any = {
      current_flow: flow,
      flow_step: step,
      last_message_at: now,
      timeout_warning_sent: false,
      expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
    };

    if (data !== undefined) {
      update.flow_data = data;
    }

    return this.sessionModel.findByIdAndUpdate(sessionId, { $set: update }, { new: true });
  }

  /**
   * Increment flow step
   */
  async incrementFlowStep(sessionId: Types.ObjectId): Promise<WhatsAppSessionDocument | null> {
    const now = new Date();
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $inc: { flow_step: 1 },
        $set: {
          last_message_at: now,
          expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
        },
      },
      { new: true },
    );
  }

  /**
   * Add data to current flow
   */
  async addFlowData(
    sessionId: Types.ObjectId,
    key: string,
    value: any,
  ): Promise<WhatsAppSessionDocument | null> {
    const now = new Date();
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          [`flow_data.${key}`]: value,
          last_message_at: now,
          expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
        },
      },
      { new: true },
    );
  }

  /**
   * Get flow data value
   */
  async getFlowData(sessionId: Types.ObjectId, key: string): Promise<any> {
    const session = await this.sessionModel.findById(sessionId);
    return session?.flow_data?.[key];
  }

  /**
   * Reset session to idle
   */
  async resetToIdle(sessionId: Types.ObjectId): Promise<WhatsAppSessionDocument | null> {
    const now = new Date();
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          current_flow: FlowType.IDLE,
          flow_step: 0,
          flow_data: {},
          last_message_at: now,
          expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
          timeout_warning_sent: false,
          is_human_takeover: false,
        },
        $unset: {
          assigned_pharmacist: 1,
          handoff_at: 1,
          handoff_reason: 1,
        },
      },
      { new: true },
    );
  }

  /**
   * Set expected responses for button/list messages
   */
  async setExpectedResponses(
    sessionId: Types.ObjectId,
    messageId: string,
    messageType: string,
    responses: string[],
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: sessionId },
      {
        $set: {
          last_bot_message_id: messageId,
          last_bot_message_type: messageType,
          expected_responses: responses,
        },
      },
    );
  }

  /**
   * Check if response is expected
   */
  async isExpectedResponse(sessionId: Types.ObjectId, response: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.expected_responses?.length) return true; // No restrictions
    return session.expected_responses.includes(response);
  }

  /**
   * Assign pharmacist for human handoff
   */
  async assignPharmacist(
    sessionId: Types.ObjectId,
    pharmacistId: Types.ObjectId,
    reason: string,
  ): Promise<WhatsAppSessionDocument | null> {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          current_flow: FlowType.PHARMACIST_CHAT,
          assigned_pharmacist: pharmacistId,
          handoff_at: new Date(),
          handoff_reason: reason,
          is_human_takeover: true,
        },
      },
      { new: true },
    );
  }

  /**
   * Release pharmacist handoff
   */
  async releasePharmacist(sessionId: Types.ObjectId): Promise<WhatsAppSessionDocument | null> {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          current_flow: FlowType.IDLE,
          is_human_takeover: false,
        },
        $unset: {
          assigned_pharmacist: 1,
          handoff_at: 1,
          handoff_reason: 1,
        },
      },
      { new: true },
    );
  }

  /**
   * Get sessions assigned to a pharmacist
   */
  async getPharmacistSessions(pharmacistId: Types.ObjectId): Promise<WhatsAppSessionDocument[]> {
    return this.sessionModel.find({
      assigned_pharmacist: pharmacistId,
      is_expired: false,
      is_human_takeover: true,
    });
  }

  /**
   * Mark timeout warning as sent
   */
  async markWarningSent(sessionId: Types.ObjectId): Promise<void> {
    await this.sessionModel.updateOne({ _id: sessionId }, { $set: { timeout_warning_sent: true } });
  }

  /**
   * Expire a session
   */
  private async expireSession(session: WhatsAppSessionDocument, reason: string): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: session._id },
      {
        $set: {
          is_expired: true,
          current_flow: FlowType.IDLE,
          flow_step: 0,
          flow_data: {},
        },
      },
    );

    this.logger.log(`Session expired for ${session.whatsapp_number}: ${reason}`);
  }

  /**
   * Force expire session by ID
   */
  async forceExpire(sessionId: Types.ObjectId): Promise<void> {
    const session = await this.sessionModel.findById(sessionId);
    if (session) {
      await this.expireSession(session, 'FORCE_EXPIRED');
    }
  }

  /**
   * Get session statistics for a number
   */
  async getSessionStats(whatsappNumber: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    averageSessionDuration: number;
  }> {
    const sessions = await this.sessionModel.find({ whatsapp_number: whatsappNumber });

    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages_in_session, 0);

    let totalDuration = 0;
    for (const session of sessions) {
      const endTime = session.is_expired ? session.updated_at : new Date();
      totalDuration += endTime.getTime() - session.session_started_at.getTime();
    }

    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    return {
      totalSessions,
      totalMessages,
      averageSessionDuration,
    };
  }
}
