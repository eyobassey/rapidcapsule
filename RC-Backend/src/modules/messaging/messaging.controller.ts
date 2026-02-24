import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';
import { MessagingRestrictionGuard } from './guards/messaging-restriction.guard';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { QueryMessagesDto, QueryConversationsDto } from './dto/query-messages.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Messaging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  // ===================== CONVERSATIONS =====================

  @Post('conversations')
  @UseGuards(MessagingRestrictionGuard)
  @ApiOperation({ summary: 'Create or find a conversation with another user' })
  async createConversation(@Body() dto: CreateConversationDto, @Request() req) {
    const result = await this.messagingService.createOrFindConversation(
      req.user.sub,
      req.user.user_type,
      dto,
      req.ip,
    );

    // Ensure both participants' sockets join the conversation room
    const convId = (result as any)?._id?.toString() || (result as any)?.id;
    if (convId) {
      this.messagingGateway.joinUserToConversation(req.user.sub, convId);
      this.messagingGateway.joinUserToConversation(dto.participant_id, convId);
    }

    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the authenticated user' })
  async getConversations(@Query() query: QueryConversationsDto, @Request() req) {
    // Send welcome message on first visit (no-op if already sent)
    await this.messagingService.sendWelcomeMessageIfNeeded(req.user.sub, req.user.user_type);
    const result = await this.messagingService.getConversations(req.user.sub, query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('conversations/:id')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversation(@Param('id') id: string) {
    const result = await this.messagingService.getConversation(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('conversations/:id/archive')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Archive a conversation' })
  async archiveConversation(@Param('id') id: string, @Request() req) {
    const result = await this.messagingService.archiveConversation(
      req.user.sub,
      req.user.user_type,
      id,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ===================== MESSAGES =====================

  @Get('conversations/:id/messages')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get messages in a conversation (cursor-based pagination)' })
  async getMessages(@Param('id') id: string, @Query() query: QueryMessagesDto) {
    const result = await this.messagingService.getMessages(id, query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('conversations/:id/messages')
  @UseGuards(ConversationParticipantGuard, MessagingRestrictionGuard)
  @ApiOperation({ summary: 'Send a text message in a conversation' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Request() req,
  ) {
    const result = await this.messagingService.sendMessage(
      req.user.sub,
      req.user.user_type,
      id,
      dto,
    );

    // Emit real-time event to all participants in the conversation
    const updatedConv = await this.messagingService.getConversation(id);
    this.messagingGateway.emitNewMessage(id, result, updatedConv);

    // Process link previews asynchronously (don't block the response)
    const messageId = result?._id?.toString();
    if (messageId && dto.content && dto.content.match(/https?:\/\//)) {
      this.messagingService.processLinkPreviews(messageId).then((updated) => {
        if (updated) {
          this.messagingGateway.emitMessageUpdated(id, updated);
        }
      }).catch(() => {});
    }

    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Post('conversations/:id/messages/attachment')
  @UseGuards(ConversationParticipantGuard, MessagingRestrictionGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file attachment and send as message' })
  async sendAttachment(
    @Param('id') id: string,
    @Body() dto: UploadAttachmentDto,
    @UploadedFiles() files: { file?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Request() req,
  ) {
    const file = files.file?.[0];
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const thumbnail = files.thumbnail?.[0];
    const result = await this.messagingService.sendAttachment(
      req.user.sub,
      req.user.user_type,
      id,
      dto,
      file,
      thumbnail,
    );

    // Emit real-time event to all participants in the conversation
    const updatedConv = await this.messagingService.getConversation(id);
    this.messagingGateway.emitNewMessage(id, result, updatedConv);

    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Patch('conversations/:id/read')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const result = await this.messagingService.markAsRead(
      req.user.sub,
      req.user.user_type,
      id,
    );

    // Notify other participants that their messages have been read
    this.messagingGateway.emitMessagesRead(id, req.user.sub);

    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Soft-delete a message (sender only)' })
  async deleteMessage(@Param('id') id: string, @Request() req) {
    const result = await this.messagingService.deleteMessage(
      req.user.sub,
      req.user.user_type,
      id,
    );

    // Emit real-time deletion event
    if (result.conversation_id) {
      this.messagingGateway.emitMessageDeleted(result.conversation_id, id);
    }

    return sendSuccessResponse(Messages.DELETED, result);
  }

  // ===================== DOWNLOADS =====================

  @Get('conversations/:id/messages/:messageId/download')
  @UseGuards(ConversationParticipantGuard)
  @ApiOperation({ summary: 'Get presigned download URL for a message attachment' })
  async getDownloadUrl(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req,
  ) {
    const result = await this.messagingService.getDownloadUrl(
      req.user.sub,
      req.user.user_type,
      id,
      messageId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ===================== USER SEARCH =====================

  @Get('users/search')
  @ApiOperation({ summary: 'Search users by name or email for starting a new conversation' })
  async searchUsers(@Query('q') query: string, @Request() req) {
    if (!query || query.trim().length < 2) {
      return sendSuccessResponse(Messages.RETRIEVED, []);
    }
    const result = await this.messagingService.searchUsers(req.user.sub, query.trim());
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get contacts — specialists/patients from past appointments' })
  async getMyContacts(@Request() req) {
    const result = await this.messagingService.getMyContacts(req.user.sub, req.user.user_type);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ===================== RESTRICTIONS =====================

  @Get('my-restrictions')
  @ApiOperation({ summary: 'Get current user messaging restrictions' })
  async getMyRestrictions(@Request() req) {
    const user = await this.messagingService.getUserRestrictions(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, user);
  }

  // ===================== CONSENT =====================

  @Post('consent')
  @ApiOperation({ summary: 'Record messaging consent for the authenticated user' })
  async recordConsent(@Request() req) {
    const result = await this.messagingService.recordConsent(req.user.sub, req.ip);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get('consent')
  @ApiOperation({ summary: 'Check if user has given messaging consent' })
  async checkConsent(@Request() req) {
    const hasConsent = await this.messagingService.hasConsent(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, { has_consent: hasConsent });
  }
}
