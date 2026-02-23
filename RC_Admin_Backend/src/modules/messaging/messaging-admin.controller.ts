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
  @ApiOperation({ summary: 'List all conversations (filterable)' })
  async getConversations(
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messagingAdminService.getConversations({
      type,
      userId,
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
}
