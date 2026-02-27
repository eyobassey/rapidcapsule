import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for incoming Twilio WhatsApp webhook
 * Twilio sends data as form-urlencoded
 */
export class TwilioWhatsAppWebhookDto {
  // Message identifiers
  @ApiProperty({ description: 'Unique Twilio message SID', example: 'SM1234567890abcdef1234567890abcdef' })
  @IsString()
  MessageSid: string;

  @ApiProperty({ description: 'SMS SID (same as MessageSid for WhatsApp)', example: 'SM1234567890abcdef1234567890abcdef' })
  @IsString()
  SmsSid: string;

  @ApiProperty({ description: 'Twilio account SID', example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  AccountSid: string;

  // Sender info
  @ApiProperty({ description: 'Sender phone number in WhatsApp format', example: 'whatsapp:+2348012345678' })
  @IsString()
  From: string; // Format: whatsapp:+1234567890

  @ApiProperty({ description: 'Recipient phone number in WhatsApp format', example: 'whatsapp:+14155238886' })
  @IsString()
  To: string; // Format: whatsapp:+0987654321

  // Message content
  @ApiPropertyOptional({ description: 'Text body of the incoming message', example: 'Hello, I need help with my prescription' })
  @IsOptional()
  @IsString()
  Body?: string;

  // Media (if image/document sent)
  @ApiPropertyOptional({ description: 'Number of media attachments in the message', example: '1' })
  @IsOptional()
  @IsString()
  NumMedia?: string;

  @ApiPropertyOptional({ description: 'MIME type of the first media attachment', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  MediaContentType0?: string;

  @ApiPropertyOptional({ description: 'URL of the first media attachment', example: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages/SM456/Media/ME789' })
  @IsOptional()
  @IsString()
  MediaUrl0?: string;

  // Additional media fields (up to 10)
  @ApiPropertyOptional({ description: 'MIME type of the second media attachment', example: 'image/png' })
  @IsOptional()
  @IsString()
  MediaContentType1?: string;

  @ApiPropertyOptional({ description: 'URL of the second media attachment', example: 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages/SM456/Media/ME790' })
  @IsOptional()
  @IsString()
  MediaUrl1?: string;

  // Profile info
  @ApiPropertyOptional({ description: 'WhatsApp profile display name of the sender', example: 'John Doe' })
  @IsOptional()
  @IsString()
  ProfileName?: string;

  // WhatsApp specific
  @ApiPropertyOptional({ description: 'WhatsApp ID (phone number without the + prefix)', example: '2348012345678' })
  @IsOptional()
  @IsString()
  WaId?: string; // WhatsApp ID (phone number without +)

  // Button/List response
  @ApiPropertyOptional({ description: 'Display text of the button the user tapped', example: 'Order Medicine' })
  @IsOptional()
  @IsString()
  ButtonText?: string;

  @ApiPropertyOptional({ description: 'Payload value of the button the user tapped', example: 'ORDER_MEDICINE' })
  @IsOptional()
  @IsString()
  ButtonPayload?: string;

  @ApiPropertyOptional({ description: 'ID of the list item the user selected', example: 'item_prescription_refill' })
  @IsOptional()
  @IsString()
  ListId?: string;

  @ApiPropertyOptional({ description: 'Title of the list item the user selected', example: 'Prescription Refill' })
  @IsOptional()
  @IsString()
  ListTitle?: string;

  // Location (if shared)
  @ApiPropertyOptional({ description: 'Latitude of the shared location', example: '6.5244' })
  @IsOptional()
  @IsString()
  Latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude of the shared location', example: '3.3792' })
  @IsOptional()
  @IsString()
  Longitude?: string;

  // Status callback fields (for delivery receipts)
  @ApiPropertyOptional({ description: 'SMS delivery status', example: 'delivered' })
  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @ApiPropertyOptional({ description: 'Message delivery status', example: 'delivered' })
  @IsOptional()
  @IsString()
  MessageStatus?: string;

  @ApiPropertyOptional({ description: 'Twilio error code if message delivery failed', example: '30007' })
  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @ApiPropertyOptional({ description: 'Human-readable error message if delivery failed', example: 'Message filtered by carrier' })
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
  @ApiProperty({ description: 'Unique Twilio message SID', example: 'SM1234567890abcdef1234567890abcdef' })
  @IsString()
  MessageSid: string;

  @ApiProperty({ description: 'Current delivery status of the message', example: 'delivered' })
  @IsString()
  MessageStatus: string; // queued, sent, delivered, read, failed, undelivered

  @ApiProperty({ description: 'Twilio account SID', example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  AccountSid: string;

  @ApiProperty({ description: 'Sender phone number in WhatsApp format', example: 'whatsapp:+14155238886' })
  @IsString()
  From: string;

  @ApiProperty({ description: 'Recipient phone number in WhatsApp format', example: 'whatsapp:+2348012345678' })
  @IsString()
  To: string;

  @ApiPropertyOptional({ description: 'Twilio error code if message delivery failed', example: '30007' })
  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @ApiPropertyOptional({ description: 'Human-readable error message if delivery failed', example: 'Message filtered by carrier' })
  @IsOptional()
  @IsString()
  ErrorMessage?: string;
}
