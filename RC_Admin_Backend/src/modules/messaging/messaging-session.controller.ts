import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingSessionService } from './messaging-session.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingSessionController {
  constructor(
    private readonly messagingSessionService: MessagingSessionService,
  ) {}

  @Post('session')
  @ApiOperation({
    summary:
      'Initialize admin messaging session (creates shadow user + returns patient-backend-compatible JWT)',
  })
  async initSession(@Request() req) {
    const result = await this.messagingSessionService.initSession(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }
}
