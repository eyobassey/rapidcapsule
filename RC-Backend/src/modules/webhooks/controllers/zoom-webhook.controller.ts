import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZoomWebhookService } from '../services/zoom-webhook.service';
import { Zoom } from '../../../common/external/zoom/zoom';
import { ZoomWebhookEventType } from '../entities/zoom-webhook.entity';

@Controller('webhooks/zoom')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);
  private readonly secretToken: string;

  constructor(private readonly zoomWebhookService: ZoomWebhookService) {
    this.secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '';

    if (!this.secretToken) {
      this.logger.warn('ZOOM_WEBHOOK_SECRET_TOKEN is not set - webhook verification disabled');
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleZoomWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-zm-signature') signature: string,
    @Headers('x-zm-request-timestamp') timestamp: string,
    @Body() body: any,
  ) {
    this.logger.log(`Received Zoom webhook: ${body?.event}`);

    // Handle URL validation challenge from Zoom - bypass response interceptor
    if (body?.event === ZoomWebhookEventType.URL_VALIDATION) {
      const validationResponse = this.handleUrlValidation(body);
      return res.status(200).json(validationResponse);
    }

    // Verify webhook signature (if secret token is configured)
    if (this.secretToken) {
      const rawBody = req.rawBody?.toString() || JSON.stringify(body);

      if (!signature || !timestamp) {
        this.logger.warn('Missing signature or timestamp headers');
        throw new UnauthorizedException('Missing required headers');
      }

      const isValid = Zoom.verifyWebhookSignature(
        rawBody,
        signature,
        timestamp,
        this.secretToken,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }
    }

    // Extract event type and payload
    const eventType = body?.event;
    const payload = body?.payload;

    if (!eventType || !payload) {
      this.logger.warn('Invalid webhook payload structure');
      return res.status(200).json({ status: 'ignored', reason: 'invalid_payload' });
    }

    // Process the webhook asynchronously (don't block response)
    this.zoomWebhookService.handleWebhookEvent(eventType, payload).catch((error) => {
      this.logger.error(`Async webhook processing failed: ${error.message}`);
    });

    return res.status(200).json({ status: 'received' });
  }

  /**
   * Handle Zoom URL validation challenge
   * Zoom sends this to verify the webhook endpoint during setup
   */
  private handleUrlValidation(body: any) {
    const plainToken = body?.payload?.plainToken;

    if (!plainToken) {
      this.logger.warn('URL validation missing plainToken');
      return { status: 'error', message: 'missing_plain_token' };
    }

    if (!this.secretToken) {
      this.logger.error('Cannot validate URL: ZOOM_WEBHOOK_SECRET_TOKEN not configured');
      return { status: 'error', message: 'secret_not_configured' };
    }

    const response = Zoom.generateUrlValidationResponse(plainToken, this.secretToken);

    this.logger.log('URL validation challenge completed');
    return response;
  }
}
