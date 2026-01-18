import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * DTO for incoming Twilio WhatsApp webhook
 * Twilio sends data as form-urlencoded
 */
export class TwilioWhatsAppWebhookDto {
  // Message identifiers
  @IsString()
  MessageSid: string;

  @IsString()
  SmsSid: string;

  @IsString()
  AccountSid: string;

  // Sender info
  @IsString()
  From: string; // Format: whatsapp:+1234567890

  @IsString()
  To: string; // Format: whatsapp:+0987654321

  // Message content
  @IsOptional()
  @IsString()
  Body?: string;

  // Media (if image/document sent)
  @IsOptional()
  @IsString()
  NumMedia?: string;

  @IsOptional()
  @IsString()
  MediaContentType0?: string;

  @IsOptional()
  @IsString()
  MediaUrl0?: string;

  // Additional media fields (up to 10)
  @IsOptional()
  @IsString()
  MediaContentType1?: string;

  @IsOptional()
  @IsString()
  MediaUrl1?: string;

  // Profile info
  @IsOptional()
  @IsString()
  ProfileName?: string;

  // WhatsApp specific
  @IsOptional()
  @IsString()
  WaId?: string; // WhatsApp ID (phone number without +)

  // Button/List response
  @IsOptional()
  @IsString()
  ButtonText?: string;

  @IsOptional()
  @IsString()
  ButtonPayload?: string;

  @IsOptional()
  @IsString()
  ListId?: string;

  @IsOptional()
  @IsString()
  ListTitle?: string;

  // Location (if shared)
  @IsOptional()
  @IsString()
  Latitude?: string;

  @IsOptional()
  @IsString()
  Longitude?: string;

  // Status callback fields (for delivery receipts)
  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @IsOptional()
  @IsString()
  MessageStatus?: string;

  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @IsOptional()
  @IsString()
  ErrorMessage?: string;
}

/**
 * Parsed message for internal use
 */
export interface ParsedWhatsAppMessage {
  messageId: string;
  from: string; // Normalized phone number (E.164)
  to: string;
  timestamp: Date;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'button' | 'list';
  body?: string;
  media?: {
    url: string;
    contentType: string;
  }[];
  button?: {
    text: string;
    payload: string;
  };
  list?: {
    id: string;
    title: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  profileName?: string;
  waId?: string;
}

/**
 * Status callback webhook
 */
export class TwilioStatusCallbackDto {
  @IsString()
  MessageSid: string;

  @IsString()
  MessageStatus: string; // queued, sent, delivered, read, failed, undelivered

  @IsString()
  AccountSid: string;

  @IsString()
  From: string;

  @IsString()
  To: string;

  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @IsOptional()
  @IsString()
  ErrorMessage?: string;
}
