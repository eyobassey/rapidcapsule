import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get('conversations')
  async getConversations(@Req() req: any) {
    const conversations = await this.ekaService.getConversations(req.user.sub);
    return sendSuccessResponse('Conversations retrieved', conversations);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Req() req: any) {
    const conversation = await this.ekaService.getConversation(id, req.user.sub);
    return sendSuccessResponse('Conversation retrieved', conversation);
  }

  @Patch('conversations/:id')
  async renameConversation(@Param('id') id: string, @Body() body: { title: string }, @Req() req: any) {
    const result = await this.ekaService.renameConversation(id, req.user.sub, body.title);
    return sendSuccessResponse('Conversation renamed', result);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Req() req: any) {
    const result = await this.ekaService.deleteConversation(id, req.user.sub);
    return sendSuccessResponse('Conversation deleted', result);
  }

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

  @Post('clear-checkup-phase')
  async clearCheckupPhase(@Req() req: any) {
    await this.ekaService.clearStaleCheckupPhases(req.user.sub);
    return sendSuccessResponse('Checkup phases cleared', {});
  }

  @Post('checkup/:sessionId/symptoms')
  async addCheckupSymptom(
    @Param('sessionId') sessionId: string,
    @Body() body: { id: string; name: string; common_name: string },
    @Req() req: any,
  ) {
    const result = await this.ekaService.addAvatarSymptom(sessionId, req.user.sub, body);
    return sendSuccessResponse('Symptom added', result);
  }

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
