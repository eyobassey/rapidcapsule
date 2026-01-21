import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdvancedHealthScoreService } from './advanced-health-score.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@UseGuards(JwtAuthGuard)
@Controller('advanced-health-score')
export class AdvancedHealthScoreController {
  constructor(
    private readonly advancedHealthScoreService: AdvancedHealthScoreService,
  ) {}

  /**
   * Check if user can start an assessment
   * GET /advanced-health-score/can-start
   */
  @Get('can-start')
  async canStartAssessment(@Request() req) {
    const result = await this.advancedHealthScoreService.canStartAssessment(
      req.user.sub,
    );
    return sendSuccessResponse('Assessment requirements checked', result);
  }

  /**
   * Get relevant health checkups for the assessment
   * Returns checkups with suggested include/exclude status based on settings
   * GET /advanced-health-score/relevant-checkups
   */
  @Get('relevant-checkups')
  async getRelevantCheckups(@Request() req) {
    const result = await this.advancedHealthScoreService.getRelevantHealthCheckups(
      req.user.sub,
    );
    return sendSuccessResponse('Relevant health checkups retrieved', result);
  }

  /**
   * Get all active questions grouped by domain
   * GET /advanced-health-score/questions
   */
  @Get('questions')
  async getQuestions() {
    const questions =
      await this.advancedHealthScoreService.getQuestionsByDomain();
    return sendSuccessResponse('Questions retrieved', questions);
  }

  /**
   * Upload a supporting document
   * POST /advanced-health-score/upload-document
   */
  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return sendSuccessResponse('No file provided', null);
    }

    const result = await this.advancedHealthScoreService.uploadDocument(
      req.user.sub,
      file,
    );
    return sendSuccessResponse('Document uploaded successfully', result);
  }

  /**
   * Submit assessment answers and generate report
   * POST /advanced-health-score/submit
   */
  @Post('submit')
  async submitAssessment(
    @Request() req,
    @Body() submitDto: SubmitAssessmentDto & { documents?: any[] },
  ) {
    const { documents = [], ...dto } = submitDto;
    const result = await this.advancedHealthScoreService.submitAssessment(
      req.user.sub,
      dto,
      documents,
    );
    return sendSuccessResponse('Assessment submitted successfully', result);
  }

  /**
   * Get user's assessment history
   * GET /advanced-health-score/history
   */
  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.advancedHealthScoreService.getAssessmentHistory(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse('Assessment history retrieved', result);
  }

  /**
   * Get a specific assessment report (for specialists viewing patient data)
   * GET /advanced-health-score/view/:id
   */
  @Get('view/:id')
  async getAssessmentForSpecialist(@Param('id') id: string) {
    const result = await this.advancedHealthScoreService.getAssessmentByIdForSpecialist(id);
    return sendSuccessResponse('Assessment retrieved', result);
  }

  /**
   * Get a specific assessment report
   * GET /advanced-health-score/:id
   */
  @Get(':id')
  async getAssessment(@Request() req, @Param('id') id: string) {
    const result = await this.advancedHealthScoreService.getAssessmentById(
      req.user.sub,
      id,
    );
    return sendSuccessResponse('Assessment retrieved', result);
  }
}
