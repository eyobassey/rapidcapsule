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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdvancedHealthScoreAdminService } from './advanced-health-score-admin.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';

@ApiTags('Advanced Health Score')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get health score settings', description: 'Retrieves the current advanced health score configuration including credit costs, file upload limits, health checkup inclusion rules, and credit sharing settings.' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('settings')
  async getSettings() {
    const result = await this.advancedHealthScoreAdminService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get default settings values
   * GET /advanced-health-score/settings/defaults
   */
  @ApiOperation({ summary: 'Get default settings values', description: 'Returns the factory default values for all advanced health score settings. Useful for resetting or comparing with current configuration.' })
  @ApiResponse({ status: 200, description: 'Default settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('settings/defaults')
  async getDefaultSettings() {
    const result = this.advancedHealthScoreAdminService.getDefaultSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update settings
   * PATCH /advanced-health-score/settings
   */
  @ApiOperation({ summary: 'Update health score settings', description: 'Partially updates the advanced health score configuration. Only provided fields will be modified; omitted fields remain unchanged.' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid field values' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get all assessment questions', description: 'Retrieves all health score assessment questions. By default only active questions are returned; set include_inactive to true for the complete list.' })
  @ApiQuery({ name: 'include_inactive', required: false, type: String, description: 'Set to "true" to include deactivated questions', example: 'true' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get questions grouped by health domain', description: 'Returns all active questions organized by their health domains (cardiovascular, metabolic, mental wellbeing, lifestyle, physical symptoms, preventive care).' })
  @ApiResponse({ status: 200, description: 'Questions grouped by domain retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('questions/by-domain')
  async getQuestionsByDomain() {
    const result = await this.advancedHealthScoreAdminService.getQuestionsByDomain();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get a single question
   * GET /advanced-health-score/questions/:id
   */
  @ApiOperation({ summary: 'Get a single question by ID', description: 'Retrieves the full details of a specific assessment question including its options, scale config, and metadata.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the question', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @Get('questions/:id')
  async getQuestion(@Param('id') questionId: string) {
    const result = await this.advancedHealthScoreAdminService.getQuestionById(questionId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Create a new question
   * POST /advanced-health-score/questions
   */
  @ApiOperation({ summary: 'Create a new assessment question', description: 'Adds a new question to the advanced health score questionnaire. The question is assigned to a health domain and will appear in patient assessments based on its domain and question order.' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid question data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Update an existing question', description: 'Partially updates a question. Only provided fields are modified. Can be used to change text, options, scoring weights, or deactivate a question.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the question to update', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid question data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Question not found' })
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
  @ApiOperation({ summary: 'Delete a question', description: 'Permanently removes a question from the assessment questionnaire. This action cannot be undone. Consider deactivating the question instead if it has been used in past assessments.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the question to delete', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @Delete('questions/:id')
  async deleteQuestion(@Param('id') questionId: string) {
    const result = await this.advancedHealthScoreAdminService.deleteQuestion(questionId);
    return sendSuccessResponse('Question deleted successfully', result);
  }

  /**
   * Reorder questions
   * POST /advanced-health-score/questions/reorder
   */
  @ApiOperation({ summary: 'Reorder assessment questions', description: 'Updates the display order of multiple questions in a single batch operation. Useful for reorganizing the questionnaire flow after drag-and-drop reordering in the admin UI.' })
  @ApiResponse({ status: 200, description: 'Questions reordered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get analytics overview', description: 'Returns high-level statistics for the advanced health score feature including total assessments, average scores, completion rates, and active patient counts.' })
  @ApiResponse({ status: 200, description: 'Overview stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/overview')
  async getOverviewStats() {
    const result = await this.advancedHealthScoreAdminService.getOverviewStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get usage trends
   * GET /advanced-health-score/analytics/trends
   */
  @ApiOperation({ summary: 'Get usage trends', description: 'Returns time-series data showing daily assessment volumes over a date range. Defaults to the last 30 days if no dates are specified.' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date for the trend period (ISO 8601)', example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date for the trend period (ISO 8601)', example: '2026-02-27' })
  @ApiResponse({ status: 200, description: 'Usage trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get score distribution', description: 'Returns the distribution of overall health scores across all completed assessments, grouped into ranges (e.g., 0-20, 21-40, etc.) for histogram visualization.' })
  @ApiResponse({ status: 200, description: 'Score distribution retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('analytics/distribution')
  async getScoreDistribution() {
    const result = await this.advancedHealthScoreAdminService.getScoreDistribution();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get domain averages
   * GET /advanced-health-score/analytics/domain-averages
   */
  @ApiOperation({ summary: 'Get average scores per health domain', description: 'Returns the average score for each health domain (cardiovascular, metabolic, mental wellbeing, etc.) across all completed assessments. Useful for identifying population-level health trends.' })
  @ApiResponse({ status: 200, description: 'Domain averages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get patient assessment history', description: 'Retrieves paginated list of health score assessments for a specific patient, ordered by most recent first.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the patient', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number for pagination (default: 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of records per page (default: 10)', example: '10' })
  @ApiResponse({ status: 200, description: 'Patient assessments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Get assessment detail', description: 'Retrieves full details of a specific health score assessment including all answers, domain scores, AI-generated report, priority actions, and lifestyle recommendations.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the assessment', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Assessment detail retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @Get('assessments/:id')
  async getAssessmentDetail(@Param('id') assessmentId: string) {
    const result = await this.advancedHealthScoreAdminService.getPatientAssessmentDetail(
      assessmentId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
