import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  TwilioWhatsAppWebhookDto,
  TwilioStatusCallbackDto,
  ParsedWhatsAppMessage,
} from '../dto/twilio-webhook.dto';
import { WhatsAppIdentityService } from '../services/whatsapp-identity.service';
import { WhatsAppSessionService } from '../services/whatsapp-session.service';
import { WhatsAppRateLimiterService } from '../services/whatsapp-rate-limiter.service';
import { WhatsAppAuditService } from '../services/whatsapp-audit.service';
import { WhatsAppTwilioService } from '../services/whatsapp-twilio.service';
import { WhatsAppFlowService } from '../services/whatsapp-flow.service';

/**
 * Test request DTO for local development
 */
class TestMessageDto {
  from: string;
  body?: string;
  imageUrl?: string;
}

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly identityService: WhatsAppIdentityService,
    private readonly sessionService: WhatsAppSessionService,
    private readonly rateLimiterService: WhatsAppRateLimiterService,
    private readonly auditService: WhatsAppAuditService,
    private readonly twilioService: WhatsAppTwilioService,
    private readonly flowService: WhatsAppFlowService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main webhook endpoint for incoming WhatsApp messages
   * Twilio sends POST requests here when users send messages
   */
  @Post('twilio')
  async handleTwilioWebhook(
    @Body() body: TwilioWhatsAppWebhookDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Validate webhook signature (skip in test mode)
      const webhookUrl = `${this.configService.get('BASE_URL')}/webhooks/whatsapp/twilio`;
      const isValid = this.twilioService.validateWebhookSignature(
        signature || '',
        webhookUrl,
        body as unknown as Record<string, string>,
      );

      if (!isValid && this.configService.get('NODE_ENV') === 'production') {
        this.logger.warn('Invalid Twilio signature');
        res.status(HttpStatus.FORBIDDEN).send('Invalid signature');
        return;
      }

      // 2. Parse the message
      const message = this.parseInboundMessage(body);
      this.logger.log(`Received message from ${message.from}: ${message.type}`);

      // 3. Check rate limits
      const rateCheck = await this.rateLimiterService.checkRateLimit('MESSAGES', message.from);
      if (!rateCheck.allowed) {
        await this.twilioService.sendRateLimitMessage(message.from, rateCheck.message);
        res.status(HttpStatus.OK).send(''); // Twilio expects 200
        return;
      }
      await this.rateLimiterService.recordAction('MESSAGES', message.from);

      // 4. Get or create identity
      const identity = await this.identityService.getOrCreateIdentity(message.from);

      // 5. Check if blocked
      const blockStatus = await this.identityService.isBlocked(message.from);
      if (blockStatus.blocked) {
        await this.twilioService.sendTextMessage(
          message.from,
          `Your account is temporarily blocked. ${blockStatus.reason || ''}\n\nPlease try again later or contact support.`,
        );
        res.status(HttpStatus.OK).send('');
        return;
      }

      // 6. Get or create session
      const session = await this.sessionService.getOrCreateSession(
        message.from,
        identity.patient_id,
      );

      // 7. Check session timeout
      const timeoutCheck = await this.sessionService.checkTimeout(session);
      if (timeoutCheck.expired) {
        await this.twilioService.sendSessionExpired(message.from);
        res.status(HttpStatus.OK).send('');
        return;
      }

      if (timeoutCheck.shouldWarn) {
        await this.twilioService.sendTimeoutWarning(message.from);
        await this.sessionService.markWarningSent(session._id);
      }

      // 8. Log inbound message
      await this.auditService.logInboundMessage(
        {
          from: message.from,
          id: message.messageId,
          timestamp: (message.timestamp.getTime() / 1000).toString(),
          type: message.type,
          body: message.body,
          mediaUrl: message.media?.[0]?.url,
          mediaType: message.media?.[0]?.contentType,
        },
        {
          patient_id: identity.patient_id,
          session_id: session._id,
          current_flow: session.current_flow,
          flow_step: session.flow_step,
        },
      );

      // 9. Route to appropriate handler using flow service
      const response = await this.flowService.processMessage(message, session, identity);

      // 10. Send response (if any)
      if (response) {
        const sentMessage = await this.twilioService.sendTextMessage(message.from, response);

        // Log outbound message
        if (sentMessage) {
          await this.auditService.logOutboundMessage(
            {
              to: message.from,
              id: sentMessage.sid,
              type: 'text',
              body: response,
            },
            {
              patient_id: identity.patient_id,
              session_id: session._id,
              current_flow: session.current_flow,
              flow_step: session.flow_step,
            },
            Date.now() - startTime,
          );
        }
      }

      // 11. Record activity
      await this.identityService.recordActivity(message.from, 'message');

      // Twilio expects empty 200 response
      res.status(HttpStatus.OK).send('');
    } catch (error) {
      this.logger.error('WhatsApp webhook error:', error);

      // Log error
      await this.auditService.logError(body.From || 'unknown', error as Error);

      // Try to send error message to user
      try {
        if (body.From) {
          await this.twilioService.sendErrorMessage(body.From);
        }
      } catch (sendError) {
        this.logger.error('Failed to send error message:', sendError);
      }

      // Still return 200 to Twilio to prevent retries
      res.status(HttpStatus.OK).send('');
    }
  }

  /**
   * Status callback endpoint for message delivery status
   */
  @Post('twilio/status')
  async handleStatusCallback(
    @Body() body: TwilioStatusCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Message ${body.MessageSid} status: ${body.MessageStatus}`);

      // Log failed/undelivered messages
      if (body.MessageStatus === 'failed' || body.MessageStatus === 'undelivered') {
        this.logger.warn(
          `Message delivery failed: ${body.MessageSid} - ${body.ErrorCode}: ${body.ErrorMessage}`,
        );

        await this.auditService.logSecurityEvent(
          body.To,
          {
            type: 'MESSAGE_DELIVERY_FAILED',
            severity: 'LOW',
            details: `${body.ErrorCode}: ${body.ErrorMessage}`,
          },
        );
      }

      res.status(HttpStatus.OK).send('');
    } catch (error) {
      this.logger.error('Status callback error:', error);
      res.status(HttpStatus.OK).send('');
    }
  }

  /**
   * Test endpoint for local development
   * Simulates WhatsApp messages without Twilio
   * Only available in non-production environments
   */
  @Post('test')
  async handleTestMessage(
    @Body() body: TestMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    // Only allow in development/test mode
    if (this.configService.get('NODE_ENV') === 'production') {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        error: 'Test endpoint not available in production',
      });
      return;
    }

    try {
      const { from, body: messageBody, imageUrl } = body;

      if (!from) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Phone number (from) is required',
        });
        return;
      }

      // Normalize phone number
      const normalizedFrom = this.normalizePhoneNumber(from);

      // Create mock message
      const message: ParsedWhatsAppMessage = {
        messageId: `test-${Date.now()}`,
        from: normalizedFrom,
        to: this.configService.get('TWILIO_WHATSAPP_NUMBER') || '+14155238886',
        timestamp: new Date(),
        type: imageUrl ? 'image' : 'text',
        body: messageBody,
        profileName: 'Test User',
        waId: normalizedFrom.replace('+', ''),
      };

      // Add media if image URL provided
      if (imageUrl) {
        message.media = [{
          url: imageUrl,
          contentType: 'image/jpeg',
        }];
      }

      this.logger.log(`[TEST] Received message from ${message.from}: ${message.body || '[image]'}`);

      // Get or create identity
      const identity = await this.identityService.getOrCreateIdentity(message.from);

      // Get or create session
      const session = await this.sessionService.getOrCreateSession(
        message.from,
        identity.patient_id,
      );

      // Process message through flow service
      const response = await this.flowService.processMessage(message, session, identity);

      // Return response (don't actually send via Twilio in test mode)
      res.status(HttpStatus.OK).json({
        success: true,
        testMode: true,
        input: {
          from: message.from,
          body: message.body,
          type: message.type,
        },
        session: {
          id: session._id,
          flow: session.current_flow,
          step: session.flow_step,
        },
        identity: {
          id: identity._id,
          verified: identity.is_verified,
          patientId: identity.patient_id,
        },
        response: response,
      });
    } catch (error) {
      this.logger.error('[TEST] Error processing test message:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get current session state for a phone number (test/debug)
   * Only available in non-production environments
   */
  @Post('test/session')
  async getTestSession(
    @Body() body: { from: string },
    @Res() res: Response,
  ): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'production') {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        error: 'Test endpoint not available in production',
      });
      return;
    }

    try {
      const normalizedFrom = this.normalizePhoneNumber(body.from);

      const identity = await this.identityService.getOrCreateIdentity(normalizedFrom);
      const session = await this.sessionService.getActiveSession(normalizedFrom);

      res.status(HttpStatus.OK).json({
        success: true,
        phone: normalizedFrom,
        identity: {
          id: identity._id,
          verified: identity.is_verified,
          patientId: identity.patient_id,
          blockedAt: identity.blocked_at,
          blockExpiresAt: identity.block_expires_at,
          failedAttempts: identity.failed_verification_attempts,
        },
        session: session ? {
          id: session._id,
          flow: session.current_flow,
          step: session.flow_step,
          flowData: session.flow_data,
          sessionStartedAt: session.session_started_at,
          expiresAt: session.expires_at,
        } : null,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Reset session for a phone number (test/debug)
   * Only available in non-production environments
   */
  @Post('test/reset')
  async resetTestSession(
    @Body() body: { from: string },
    @Res() res: Response,
  ): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'production') {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        error: 'Test endpoint not available in production',
      });
      return;
    }

    try {
      const normalizedFrom = this.normalizePhoneNumber(body.from);

      const session = await this.sessionService.getActiveSession(normalizedFrom);
      if (session) {
        await this.sessionService.resetToIdle(session._id);
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Session reset to IDLE',
        phone: normalizedFrom,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Parse incoming Twilio message to internal format
   */
  private parseInboundMessage(body: TwilioWhatsAppWebhookDto): ParsedWhatsAppMessage {
    const message: ParsedWhatsAppMessage = {
      messageId: body.MessageSid,
      from: this.normalizePhoneNumber(body.From),
      to: this.normalizePhoneNumber(body.To),
      timestamp: new Date(),
      type: 'text',
      body: body.Body,
      profileName: body.ProfileName,
      waId: body.WaId,
    };

    // Check for media
    const numMedia = parseInt(body.NumMedia || '0', 10);
    if (numMedia > 0) {
      message.media = [];
      if (body.MediaUrl0) {
        message.media.push({
          url: body.MediaUrl0,
          contentType: body.MediaContentType0 || 'application/octet-stream',
        });
        message.type = this.getMediaType(body.MediaContentType0 || '');
      }
    }

    // Check for button response
    if (body.ButtonPayload) {
      message.type = 'button';
      message.button = {
        text: body.ButtonText || '',
        payload: body.ButtonPayload,
      };
    }

    // Check for list response
    if (body.ListId) {
      message.type = 'list';
      message.list = {
        id: body.ListId,
        title: body.ListTitle || '',
      };
    }

    // Check for location
    if (body.Latitude && body.Longitude) {
      message.type = 'location';
      message.location = {
        latitude: parseFloat(body.Latitude),
        longitude: parseFloat(body.Longitude),
      };
    }

    return message;
  }

  /**
   * Get media type from content type
   */
  private getMediaType(contentType: string): 'image' | 'document' | 'audio' | 'video' | 'text' {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('application/')) return 'document';
    return 'text';
  }

  /**
   * Normalize phone number
   */
  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace('whatsapp:', '');
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    return normalized;
  }
}
