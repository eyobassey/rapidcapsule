import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingAdminService } from './messaging-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingAdminController {
  constructor(
    private readonly messagingAdminService: MessagingAdminService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations (filterable by type, email, or name)' })
  async getConversations(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messagingAdminService.getConversations({
      type,
      search,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'View full conversation details' })
  async getConversation(@Param('id') id: string) {
    const result = await this.messagingAdminService.getConversation(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (paginated)' })
  async getConversationMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messagingAdminService.getConversationMessages(
      id,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Platform messaging statistics' })
  async getStats() {
    const result = await this.messagingAdminService.getStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Search messaging audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messagingAdminService.getAuditLogs({
      userId,
      action,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('conversations/:id/messages/:messageId/download/:attachmentIndex')
  @ApiOperation({ summary: 'Get presigned download URL for an attachment' })
  async getAttachmentDownloadUrl(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Param('attachmentIndex') attachmentIndex: string,
  ) {
    const result = await this.messagingAdminService.getAttachmentDownloadUrl(
      id,
      messageId,
      parseInt(attachmentIndex),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('conversations/:id/export')
  @ApiOperation({ summary: 'Export full conversation transcript (JSON or CSV)' })
  async exportConversation(
    @Param('id') id: string,
    @Query('format') format?: string,
  ) {
    const result = await this.messagingAdminService.exportConversation(
      id,
      format === 'csv' ? 'csv' : 'json',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
