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
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdvancedHealthScoreService } from './advanced-health-score.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@ApiTags('Advanced Health Score')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Check assessment eligibility', description: 'Check if the user meets requirements to start an advanced health score assessment' })
  @ApiResponse({ status: 200, description: 'Assessment eligibility status returned' })
  @Get('can-start')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
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
  @ApiOperation({ summary: 'Get relevant health checkups', description: 'Retrieve health checkups relevant to the assessment with suggested include/exclude status' })
  @ApiResponse({ status: 200, description: 'Relevant health checkups returned' })
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
  @ApiOperation({ summary: 'Get assessment questions', description: 'Retrieve all active assessment questions grouped by health domain' })
  @ApiResponse({ status: 200, description: 'Questions grouped by domain returned' })
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
  @ApiOperation({ summary: 'Upload supporting document', description: 'Upload a supporting document (lab results, medical records) for the health assessment' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload error' })
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
  @ApiOperation({ summary: 'Submit assessment', description: 'Submit assessment answers and optional documents to generate the advanced health score report' })
  @ApiResponse({ status: 200, description: 'Assessment submitted and report generated' })
  @ApiResponse({ status: 400, description: 'Invalid assessment data' })
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
  @ApiOperation({ summary: 'Get assessment history', description: 'Retrieve paginated assessment history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Assessment history returned' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '10' })
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
  @ApiOperation({ summary: 'Get assessment for specialist', description: 'Retrieve a specific assessment report for specialist viewing' })
  @ApiResponse({ status: 200, description: 'Assessment report returned' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiParam({ name: 'id', description: 'Assessment ID', example: '507f1f77bcf86cd799439011' })
  @Get('view/:id')
  async getAssessmentForSpecialist(@Param('id') id: string) {
    const result = await this.advancedHealthScoreService.getAssessmentByIdForSpecialist(id);
    return sendSuccessResponse('Assessment retrieved', result);
  }

  /**
   * Get a specific assessment report
   * GET /advanced-health-score/:id
   */
  @ApiOperation({ summary: 'Get assessment by ID', description: 'Retrieve a specific assessment report for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Assessment report returned' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiParam({ name: 'id', description: 'Assessment ID', example: '507f1f77bcf86cd799439011' })
  @Get(':id')
  async getAssessment(@Request() req, @Param('id') id: string) {
    const result = await this.advancedHealthScoreService.getAssessmentById(
      req.user.sub,
      id,
    );
    return sendSuccessResponse('Assessment retrieved', result);
  }
}
