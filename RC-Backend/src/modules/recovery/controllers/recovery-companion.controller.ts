import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecoveryCompanionService } from '../services/recovery-companion.service';
import { CompanionMessageDto, StartCompanionDto } from '../dto/companion-message.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - AI Companion')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/companion')
export class RecoveryCompanionController {
  constructor(
    private readonly companionService: RecoveryCompanionService,
  ) {}

  @ApiOperation({
    summary: 'Start a new companion conversation',
    description:
      'Initiates a new AI recovery companion session. Optionally accepts context about the patient\'s current situation to personalise the conversation from the start.',
  })
  @ApiResponse({ status: 201, description: 'New companion session created with initial AI greeting' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post('start')
  async startConversation(@Body() dto: StartCompanionDto, @Request() req) {
    const result = await this.companionService.startConversation(
      req.user.sub,
      dto.context,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Send a message to the AI companion',
    description:
      'Sends a message within an existing companion session and receives an AI response. The companion provides empathetic support, coping strategies, and recovery guidance.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The MongoDB ObjectId of the companion session',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 201, description: 'Message sent and AI response returned' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post(':sessionId/message')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompanionMessageDto,
    @Request() req,
  ) {
    const result = await this.companionService.sendMessage(
      sessionId,
      dto.message,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'End a companion conversation',
    description:
      'Ends an active companion session. The AI generates a closing summary and the session is marked as completed.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The MongoDB ObjectId of the companion session to end',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Session ended with closing summary' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post(':sessionId/end')
  async endConversation(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    const result = await this.companionService.endConversation(
      sessionId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Get daily check-in prompt',
    description:
      'Returns a personalised daily check-in prompt based on the patient\'s recovery stage, recent mood/craving trends, and time since last check-in.',
  })
  @ApiResponse({ status: 200, description: 'Personalised check-in prompt returned' })
  @Get('check-in-prompt')
  async getDailyCheckInPrompt(@Request() req) {
    const result = await this.companionService.getDailyCheckInPrompt(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get guided meditation exercise',
    description:
      'Returns a text-based guided meditation or grounding exercise personalised to the patient\'s current recovery state. Automatically selects the most appropriate exercise type based on recent craving and anxiety levels.',
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    description: 'Preferred duration in minutes (default: 5)',
    example: '5',
  })
  @ApiResponse({ status: 200, description: 'Guided meditation script returned' })
  @Get('meditation')
  async getGuidedMeditation(
    @Query('duration') duration: string,
    @Request() req,
  ) {
    const result = await this.companionService.getGuidedMeditation(
      req.user.sub,
      duration ? parseInt(duration) : 5,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get a companion conversation',
    description:
      'Retrieves the full conversation history for a specific companion session, including all messages, timestamps, and the session summary if ended.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The MongoDB ObjectId of the companion session',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Full conversation history returned' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get(':sessionId')
  async getConversation(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    const result = await this.companionService.getConversation(
      sessionId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get recent companion sessions',
    description:
      'Retrieves a list of the patient\'s most recent companion sessions, ordered by date descending. Useful for displaying session history in the UI.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of sessions to return (default: 10)',
    example: '10',
  })
  @ApiResponse({ status: 200, description: 'List of recent sessions returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get()
  async getRecentSessions(
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.companionService.getRecentSessions(
      req.user.sub,
      limit ? parseInt(limit) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
