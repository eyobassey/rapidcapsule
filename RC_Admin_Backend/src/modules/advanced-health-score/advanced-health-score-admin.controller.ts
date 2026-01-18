import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdvancedHealthScoreAdminService } from './advanced-health-score-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';

@UseGuards(JwtAuthGuard)
@Controller('advanced-health-score')
export class AdvancedHealthScoreAdminController {
  constructor(
    private readonly advancedHealthScoreAdminService: AdvancedHealthScoreAdminService,
  ) {}

  // =====================
  // Settings
  // =====================

  /**
   * Get settings
   * GET /advanced-health-score/settings
   */
  @Get('settings')
  async getSettings() {
    const result = await this.advancedHealthScoreAdminService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get default settings values
   * GET /advanced-health-score/settings/defaults
   */
  @Get('settings/defaults')
  async getDefaultSettings() {
    const result = this.advancedHealthScoreAdminService.getDefaultSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update settings
   * PATCH /advanced-health-score/settings
   */
  @Patch('settings')
  async updateSettings(
    @Body() updateDto: UpdateSettingsDto,
    @Body('admin_id') adminId: string,
  ) {
    const result = await this.advancedHealthScoreAdminService.updateSettings(
      updateDto,
      adminId,
    );
    return sendSuccessResponse('Settings updated successfully', result);
  }

  // =====================
  // Questions Management
  // =====================

  /**
   * Get all questions
   * GET /advanced-health-score/questions
   */
  @Get('questions')
  async getQuestions(@Query('include_inactive') includeInactive?: string) {
    const result = await this.advancedHealthScoreAdminService.getQuestions(
      includeInactive === 'true',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get questions grouped by domain
   * GET /advanced-health-score/questions/by-domain
   */
  @Get('questions/by-domain')
  async getQuestionsByDomain() {
    const result = await this.advancedHealthScoreAdminService.getQuestionsByDomain();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get a single question
   * GET /advanced-health-score/questions/:id
   */
  @Get('questions/:id')
  async getQuestion(@Param('id') questionId: string) {
    const result = await this.advancedHealthScoreAdminService.getQuestionById(questionId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Create a new question
   * POST /advanced-health-score/questions
   */
  @Post('questions')
  async createQuestion(
    @Body() createDto: CreateQuestionDto,
    @Body('admin_id') adminId: string,
  ) {
    const result = await this.advancedHealthScoreAdminService.createQuestion(
      createDto,
      adminId,
    );
    return sendSuccessResponse('Question created successfully', result);
  }

  /**
   * Update a question
   * PATCH /advanced-health-score/questions/:id
   */
  @Patch('questions/:id')
  async updateQuestion(
    @Param('id') questionId: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    const result = await this.advancedHealthScoreAdminService.updateQuestion(
      questionId,
      updateDto,
    );
    return sendSuccessResponse('Question updated successfully', result);
  }

  /**
   * Delete a question
   * DELETE /advanced-health-score/questions/:id
   */
  @Delete('questions/:id')
  async deleteQuestion(@Param('id') questionId: string) {
    const result = await this.advancedHealthScoreAdminService.deleteQuestion(questionId);
    return sendSuccessResponse('Question deleted successfully', result);
  }

  /**
   * Reorder questions
   * POST /advanced-health-score/questions/reorder
   */
  @Post('questions/reorder')
  async reorderQuestions(@Body() reorderDto: ReorderQuestionsDto) {
    const result = await this.advancedHealthScoreAdminService.reorderQuestions(reorderDto);
    return sendSuccessResponse('Questions reordered successfully', result);
  }

  // =====================
  // Analytics
  // =====================

  /**
   * Get overview stats
   * GET /advanced-health-score/analytics/overview
   */
  @Get('analytics/overview')
  async getOverviewStats() {
    const result = await this.advancedHealthScoreAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get usage trends
   * GET /advanced-health-score/analytics/trends
   */
  @Get('analytics/trends')
  async getUsageTrends(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const result = await this.advancedHealthScoreAdminService.getUsageTrends(
      startDate,
      endDate,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get score distribution
   * GET /advanced-health-score/analytics/distribution
   */
  @Get('analytics/distribution')
  async getScoreDistribution() {
    const result = await this.advancedHealthScoreAdminService.getScoreDistribution();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get domain averages
   * GET /advanced-health-score/analytics/domain-averages
   */
  @Get('analytics/domain-averages')
  async getDomainAverages() {
    const result = await this.advancedHealthScoreAdminService.getDomainAverages();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // =====================
  // Patient Assessments
  // =====================

  /**
   * Get patient assessments
   * GET /advanced-health-score/patient/:id/assessments
   */
  @Get('patient/:id/assessments')
  async getPatientAssessments(
    @Param('id') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.advancedHealthScoreAdminService.getPatientAssessments(
      patientId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get specific assessment detail
   * GET /advanced-health-score/assessments/:id
   */
  @Get('assessments/:id')
  async getAssessmentDetail(@Param('id') assessmentId: string) {
    const result = await this.advancedHealthScoreAdminService.getPatientAssessmentDetail(
      assessmentId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
