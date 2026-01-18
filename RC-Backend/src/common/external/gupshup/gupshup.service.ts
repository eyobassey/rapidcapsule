import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GupshupMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface GupshupTextMessage {
  type: 'text';
  text: string;
  previewUrl?: boolean;
}

export interface GupshupImageMessage {
  type: 'image';
  originalUrl: string;
  previewUrl?: string;
  caption?: string;
}

export interface GupshupDocumentMessage {
  type: 'file';
  url: string;
  filename: string;
}

export type GupshupMessage = GupshupTextMessage | GupshupImageMessage | GupshupDocumentMessage;

@Injectable()
export class GupshupService {
  private readonly logger = new Logger(GupshupService.name);
  private readonly apiUrl = 'https://api.gupshup.io/wa/api/v1/msg';
  private readonly apiKey: string;
  private readonly appName: string;
  private readonly sourceNumber: string;
  private readonly isSandbox: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GUPSHUP_API_KEY') || '';
    this.appName = this.configService.get<string>('GUPSHUP_APP_NAME') || '';
    this.sourceNumber = this.configService.get<string>('GUPSHUP_SOURCE_NUMBER') || '';
    this.isSandbox = this.configService.get<string>('GUPSHUP_SANDBOX') === 'true';

    if (!this.apiKey) {
      this.logger.warn('GUPSHUP_API_KEY not configured');
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendTextMessage(
    destination: string,
    text: string,
  ): Promise<GupshupMessageResponse> {
    const message: GupshupTextMessage = {
      type: 'text',
      text,
    };
    return this.sendMessage(destination, message);
  }

  /**
   * Send an image message via WhatsApp
   */
  async sendImageMessage(
    destination: string,
    imageUrl: string,
    caption?: string,
  ): Promise<GupshupMessageResponse> {
    const message: GupshupImageMessage = {
      type: 'image',
      originalUrl: imageUrl,
      caption,
    };
    return this.sendMessage(destination, message);
  }

  /**
   * Send a document/file via WhatsApp
   */
  async sendDocumentMessage(
    destination: string,
    fileUrl: string,
    filename: string,
  ): Promise<GupshupMessageResponse> {
    const message: GupshupDocumentMessage = {
      type: 'file',
      url: fileUrl,
      filename,
    };
    return this.sendMessage(destination, message);
  }

  /**
   * Send a message via Gupshup WhatsApp API
   */
  async sendMessage(
    destination: string,
    message: GupshupMessage,
  ): Promise<GupshupMessageResponse> {
    if (!this.apiKey) {
      this.logger.error('Gupshup API key not configured');
      return { success: false, error: 'Gupshup API key not configured' };
    }

    // Format destination number (remove + and spaces)
    const formattedDestination = destination.replace(/[\s+\-]/g, '');

    try {
      const params = new URLSearchParams();
      params.append('channel', 'whatsapp');
      params.append('source', this.sourceNumber);
      params.append('destination', formattedDestination);
      params.append('src.name', this.appName);
      params.append('message', JSON.stringify(message));

      this.logger.log(`Sending WhatsApp message to ${formattedDestination}`);

      const response = await axios.post(this.apiUrl, params.toString(), {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data?.status === 'submitted') {
        this.logger.log(`Message sent successfully: ${response.data.messageId}`);
        return {
          success: true,
          messageId: response.data.messageId,
        };
      }

      this.logger.warn(`Unexpected response: ${JSON.stringify(response.data)}`);
      return {
        success: false,
        error: response.data?.message || 'Unknown error',
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      this.logger.error(`Failed to send WhatsApp message: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send a template message (for messages outside 24-hour window)
   */
  async sendTemplateMessage(
    destination: string,
    templateId: string,
    params: string[] = [],
  ): Promise<GupshupMessageResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'Gupshup API key not configured' };
    }

    const formattedDestination = destination.replace(/[\s+\-]/g, '');

    try {
      const templateMessage = {
        id: templateId,
        params: params,
      };

      const requestParams = new URLSearchParams();
      requestParams.append('channel', 'whatsapp');
      requestParams.append('source', this.sourceNumber);
      requestParams.append('destination', formattedDestination);
      requestParams.append('src.name', this.appName);
      requestParams.append('template', JSON.stringify(templateMessage));

      const response = await axios.post(
        'https://api.gupshup.io/wa/api/v1/template/msg',
        requestParams.toString(),
        {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data?.status === 'submitted') {
        return {
          success: true,
          messageId: response.data.messageId,
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Unknown error',
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      this.logger.error(`Failed to send template message: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if Gupshup is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.sourceNumber && this.appName);
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): { configured: boolean; sandbox: boolean; source: string } {
    return {
      configured: this.isConfigured(),
      sandbox: this.isSandbox,
      source: this.sourceNumber ? `${this.sourceNumber.slice(0, 4)}****` : 'not set',
    };
  }
}
