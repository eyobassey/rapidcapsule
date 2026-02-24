import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MessagingBroadcastService } from './messaging-broadcast.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingBroadcastController {
  constructor(
    private readonly broadcastService: MessagingBroadcastService,
  ) {}

  @Post('broadcast')
  @ApiOperation({
    summary:
      'Start a broadcast (returns immediately with broadcast ID for progress tracking)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async broadcast(
    @Request() req,
    @Body()
    body: {
      recipient_ids?: string | string[];
      recipient_type?: 'Patient' | 'Specialist' | 'all';
      content?: string;
      attachment_type?: string;
    },
    @UploadedFiles()
    files?: {
      file?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    // Parse recipient_ids: may arrive as JSON string from FormData
    let recipientIds: string[] | undefined;
    if (body.recipient_ids) {
      if (typeof body.recipient_ids === 'string') {
        try {
          recipientIds = JSON.parse(body.recipient_ids);
        } catch {
          recipientIds = [body.recipient_ids];
        }
      } else {
        recipientIds = body.recipient_ids;
      }
    }

    const result = await this.broadcastService.broadcast(req.user.sub, {
      recipient_ids: recipientIds,
      recipient_type: body.recipient_type as any,
      content: body.content || '',
      file: files?.file?.[0],
      thumbnail: files?.thumbnail?.[0],
      attachment_type: body.attachment_type,
    });

    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get('broadcast/:id')
  @ApiOperation({ summary: 'Get broadcast progress/status' })
  async getBroadcastStatus(@Param('id') id: string) {
    const result = await this.broadcastService.getBroadcastStatus(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('broadcast/:id/cancel')
  @ApiOperation({ summary: 'Cancel an in-progress broadcast' })
  async cancelBroadcast(@Param('id') id: string) {
    const result = await this.broadcastService.cancelBroadcast(id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get('broadcasts')
  @ApiOperation({ summary: 'List broadcast history for the current admin' })
  async getBroadcastHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.broadcastService.getBroadcastHistory(
      req.user.sub,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
