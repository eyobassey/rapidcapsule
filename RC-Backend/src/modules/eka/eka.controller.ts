import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EkaService } from './eka.service';
import { EkaChatDto } from './dto/eka.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';

@ApiTags('Eka AI Companion')
@ApiBearerAuth('JWT-auth')
@Controller('eka')
@UseGuards(JwtAuthGuard)
export class EkaController {
  constructor(private readonly ekaService: EkaService) {}

  @ApiOperation({
    summary: 'Send a message to Eka AI',
    description: 'Sends a user message to the Eka AI companion and returns a Server-Sent Events (SSE) stream with the AI response chunks. Supports continuing existing conversations via conversation_id.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream of AI response chunks (text/event-stream)' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @Post('chat')
  async chat(@Body() dto: EkaChatDto, @Req() req: any, @Res() res: any) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const chunk of this.ekaService.chat(dto, req.user.sub)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'An unexpected error occurred.' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @ApiOperation({
    summary: 'List conversations',
    description: 'Retrieves all Eka AI conversations for the authenticated user. Optionally filter by tag.',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter conversations by tag (e.g. health-checkup, prescription)',
    example: 'health-checkup',
  })
  @ApiResponse({ status: 200, description: 'List of conversations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @Get('conversations')
  async getConversations(@Req() req: any, @Query('tag') tag?: string) {
    const conversations = await this.ekaService.getConversations(req.user.sub, tag);
    return sendSuccessResponse('Conversations retrieved', conversations);
  }

  @ApiOperation({
    summary: 'Get a conversation by ID',
    description: 'Retrieves a single Eka AI conversation including its full message history.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the conversation',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @ApiResponse({ status: 200, description: 'Conversation with messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Req() req: any) {
    const conversation = await this.ekaService.getConversation(id, req.user.sub);
    return sendSuccessResponse('Conversation retrieved', conversation);
  }

  @ApiOperation({
    summary: 'Rename a conversation',
    description: 'Updates the title of an existing Eka AI conversation.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the conversation to rename',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @ApiResponse({ status: 200, description: 'Conversation renamed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @Patch('conversations/:id')
  async renameConversation(@Param('id') id: string, @Body() body: { title: string }, @Req() req: any) {
    const result = await this.ekaService.renameConversation(id, req.user.sub, body.title);
    return sendSuccessResponse('Conversation renamed', result);
  }

  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Permanently deletes an Eka AI conversation and all its messages.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the conversation to delete',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Req() req: any) {
    const result = await this.ekaService.deleteConversation(id, req.user.sub);
    return sendSuccessResponse('Conversation deleted', result);
  }

  @ApiOperation({
    summary: 'Upload a prescription image or PDF',
    description: 'Uploads a prescription file (JPEG, PNG, WebP, or PDF up to 10 MB) for Eka AI to analyse and extract medication details.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Prescription uploaded and processed successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @Post('upload-prescription')
  @UseInterceptors(
    FileInterceptor('prescription', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPEG, PNG, WebP, PDF',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.ekaService.uploadPrescriptionFile(
      req.user.sub,
      file,
    );
    return sendSuccessResponse('Prescription uploaded', result);
  }

  @ApiOperation({
    summary: 'Clear stale health checkup phases',
    description: 'Clears any incomplete or stale health checkup phases for the authenticated user, allowing them to start a fresh checkup via Eka.',
  })
  @ApiResponse({ status: 200, description: 'Checkup phases cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @Post('clear-checkup-phase')
  async clearCheckupPhase(@Req() req: any) {
    await this.ekaService.clearStaleCheckupPhases(req.user.sub);
    return sendSuccessResponse('Checkup phases cleared', {});
  }

  @ApiOperation({
    summary: 'Add a symptom to a health checkup session',
    description: 'Adds a symptom to the avatar-based health checkup session managed through Eka AI. Requires the Infermedica symptom ID, name, and common name.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Health checkup session identifier',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @ApiResponse({ status: 200, description: 'Symptom added to the checkup session' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Checkup session not found' })
  @Post('checkup/:sessionId/symptoms')
  async addCheckupSymptom(
    @Param('sessionId') sessionId: string,
    @Body() body: { id: string; name: string; common_name: string },
    @Req() req: any,
  ) {
    const result = await this.ekaService.addAvatarSymptom(sessionId, req.user.sub, body);
    return sendSuccessResponse('Symptom added', result);
  }

  @ApiOperation({
    summary: 'Remove a symptom from a health checkup session',
    description: 'Removes a previously added symptom from the avatar-based health checkup session managed through Eka AI.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Health checkup session identifier',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  @ApiParam({
    name: 'symptomId',
    description: 'Infermedica symptom ID to remove',
    example: 's_21',
  })
  @ApiResponse({ status: 200, description: 'Symptom removed from the checkup session' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Session or symptom not found' })
  @Delete('checkup/:sessionId/symptoms/:symptomId')
  async removeCheckupSymptom(
    @Param('sessionId') sessionId: string,
    @Param('symptomId') symptomId: string,
    @Req() req: any,
  ) {
    const result = await this.ekaService.removeAvatarSymptom(sessionId, req.user.sub, symptomId);
    return sendSuccessResponse('Symptom removed', result);
  }
}
