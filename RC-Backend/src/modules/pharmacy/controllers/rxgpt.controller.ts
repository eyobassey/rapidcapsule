import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RxGPTService } from '../services/rxgpt.service';
import { ClaudeAIService } from '../services/claude-ai.service';
import {
  RxGPTAnalyzeDto,
  RxGPTQuickCheckDto,
  UpdateRxGPTSettingsDto,
  RxGPTAnalyticsQueryDto,
  SubmitRxGPTFeedbackDto,
  RxGPTSuggestMedicationsDto,
  RxGPTStandaloneAnalyzeDto,
  RxGPTRerunAnalysisDto,
} from '../dto/rxgpt.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Pharmacy - RxGPT')
@ApiBearerAuth('JWT-auth')
@Controller('pharmacy/rxgpt')
@UseGuards(JwtAuthGuard)
export class RxGPTController {
  constructor(
    private readonly rxgptService: RxGPTService,
    private readonly claudeAIService: ClaudeAIService,
  ) {}

  // ============ SPECIALIST ENDPOINTS ============

  /**
   * Analyze a prescription for safety
   * Requires specialist authentication and credits
   */
  @ApiOperation({ summary: 'Analyze prescription safety', description: 'Run a full AI-powered safety analysis on a prescription including drug interactions, dosage checks, contraindications, and evidence-based recommendations. Consumes 1 credit.' })
  @ApiResponse({ status: 200, description: 'Prescription analyzed with safety report returned' })
  @ApiResponse({ status: 400, description: 'Invalid prescription data' })
  @ApiResponse({ status: 403, description: 'Only specialists can use RxGPT or insufficient credits' })
  @Post('analyze')
  async analyze(@Body() dto: RxGPTAnalyzeDto, @Request() req: any) {
    // Verify user is a specialist
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can use RxGPT');
    }

    const result = await this.rxgptService.analyze(dto, req.user.sub, dto.skip_cache);
    return sendSuccessResponse('Prescription analyzed successfully', result);
  }

  /**
   * Quick safety check for a single drug
   * Lighter weight, used for real-time feedback while selecting drugs
   */
  @ApiOperation({ summary: 'Quick drug safety check', description: 'Lightweight real-time safety check for a single drug against patient context. Used for live feedback while building a prescription.' })
  @ApiResponse({ status: 200, description: 'Quick safety check result returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can use RxGPT' })
  @Post('quick-check')
  async quickCheck(@Body() dto: RxGPTQuickCheckDto, @Request() req: any) {
    // Verify user is a specialist
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can use RxGPT');
    }

    const result = await this.rxgptService.quickCheck(dto, req.user.sub);
    return sendSuccessResponse('Quick check completed', result);
  }

  /**
   * Suggest medications based on patient context and diagnosis
   * AI-powered medication recommendations with inventory check
   */
  @ApiOperation({ summary: 'Suggest medications', description: 'AI-powered medication recommendations based on patient demographics, diagnosis, and existing medications. Cross-references pharmacy inventory availability.' })
  @ApiResponse({ status: 200, description: 'Medication suggestions with availability info returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can use RxGPT' })
  @Post('suggest-medications')
  async suggestMedications(
    @Body() dto: RxGPTSuggestMedicationsDto,
    @Request() req: any,
  ) {
    // Verify user is a specialist
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can use RxGPT');
    }

    const result = await this.rxgptService.suggestMedications(dto, req.user.sub);
    return sendSuccessResponse('Medication suggestions generated', result);
  }

  /**
   * Standalone analysis - works without a patient ID
   * Accepts inline patient demographics + diagnosis for quick analysis
   */
  @ApiOperation({ summary: 'Standalone prescription analysis', description: 'Run a safety analysis without requiring a patient record. Accepts inline demographics (age, gender, weight) and diagnosis for ad-hoc analyses.' })
  @ApiResponse({ status: 200, description: 'Standalone analysis completed with safety report' })
  @ApiResponse({ status: 403, description: 'Only specialists can use RxGPT' })
  @Post('standalone-analyze')
  async standaloneAnalyze(
    @Body() dto: RxGPTStandaloneAnalyzeDto,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can use RxGPT');
    }

    const result = await this.rxgptService.standaloneAnalyze(dto, req.user.sub);
    return sendSuccessResponse('Standalone analysis completed', result);
  }

  /**
   * Re-run a standalone analysis with the same inputs
   * Creates a new version in the version chain
   */
  @ApiOperation({ summary: 'Re-run analysis', description: 'Re-run a previous standalone analysis with the same inputs to get a fresh result. Creates a new version in the version chain for comparison.' })
  @ApiResponse({ status: 200, description: 'Analysis re-run completed with new version' })
  @ApiResponse({ status: 403, description: 'Only specialists can re-run analyses' })
  @ApiResponse({ status: 404, description: 'Source analysis not found' })
  @Post('rerun')
  async rerunAnalysis(
    @Body() dto: RxGPTRerunAnalysisDto,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can re-run RxGPT analyses');
    }

    const result = await this.rxgptService.rerunAnalysis(dto.source_analysis_id, req.user.sub);
    return sendSuccessResponse('Analysis re-run completed', result);
  }

  /**
   * Standalone drug interaction checker
   * Accepts drug names directly — charges 1 credit per check
   */
  @ApiOperation({ summary: 'Check drug interactions', description: 'Standalone interaction checker that accepts drug names directly. Returns detailed interaction analysis between 2+ medications. Consumes 1 credit.' })
  @ApiResponse({ status: 200, description: 'Drug interaction check result returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can use the interaction checker or insufficient credits' })
  @Post('check-interactions')
  async checkInteractions(
    @Body('drugs') drugs: Array<{ name: string; dose?: string; route?: string }>,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can use the interaction checker');
    }

    if (!drugs || drugs.length < 2) {
      return sendSuccessResponse('At least two drugs are required', {
        hasInteractions: false,
        interactions: [],
        summary: 'Please provide at least two medications to check for interactions.',
      });
    }

    // Deduct 1 credit
    const creditResult = await this.rxgptService.consumeInteractionCheckCredit(req.user.sub);
    if (!creditResult.success) {
      throw new ForbiddenException('Insufficient credits. You need at least 1 credit to run an interaction check.');
    }

    const result = await this.claudeAIService.checkDrugInteractionsDetailed(drugs);
    return sendSuccessResponse('Interaction check completed', {
      ...result,
      credits_remaining: creditResult.remaining,
    });
  }

  /**
   * Get specialist's credit balance for RxGPT
   */
  @ApiOperation({ summary: 'Get RxGPT credit balance', description: 'Retrieve the authenticated specialist credit balance for RxGPT analyses' })
  @ApiResponse({ status: 200, description: 'Credit balance returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT credits' })
  @Get('credits')
  async getCredits(@Request() req: any) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT credits');
    }

    const balance = await this.rxgptService.getSpecialistCreditBalance(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, balance);
  }

  /**
   * Get RxGPT settings (for UI display)
   * Returns settings relevant to specialists (not admin-only fields)
   */
  @ApiOperation({ summary: 'Get RxGPT settings', description: 'Retrieve specialist-facing RxGPT configuration including enabled features, credit cost, and display options' })
  @ApiResponse({ status: 200, description: 'RxGPT settings returned' })
  @Get('settings')
  async getSettings(@Request() req: any) {
    const settings = await this.rxgptService.getSettings();

    // Return only specialist-relevant settings
    return sendSuccessResponse(Messages.RETRIEVED, {
      is_enabled: settings.is_enabled,
      is_enabled_for_specialists: settings.is_enabled_for_specialists,
      credits_per_analysis: settings.credit_settings.credits_per_analysis,
      features: settings.features,
      display: settings.display,
      disclaimer_text: settings.disclaimer_text,
    });
  }

  /**
   * Check if RxGPT is available (with full status for specialists)
   */
  @ApiOperation({ summary: 'Get RxGPT status', description: 'Check RxGPT availability. Specialists receive full status including credits and feature access; other users get basic availability info.' })
  @ApiResponse({ status: 200, description: 'RxGPT status returned' })
  @Get('status')
  async getStatus(@Request() req: any) {
    if (req.user?.user_type === 'Specialist') {
      // Return full status for specialists
      const status = await this.rxgptService.getSpecialistRxGPTStatus(req.user.sub);
      return sendSuccessResponse(Messages.RETRIEVED, status);
    }

    // Basic status for other users
    const settings = await this.rxgptService.getSettings();
    const isAvailable = this.rxgptService.isAvailable();
    const isEnabled = settings.is_enabled && settings.is_enabled_for_specialists;

    return sendSuccessResponse(Messages.RETRIEVED, {
      is_available: isAvailable && isEnabled,
      is_enabled: isEnabled,
      credits_per_analysis: settings.credit_settings.credits_per_analysis,
    });
  }

  // ============ ANALYSIS HISTORY ENDPOINTS ============

  /**
   * Get specialist's RxGPT analysis history
   */
  @ApiOperation({ summary: 'Get analysis history', description: 'Retrieve paginated RxGPT analysis history for the specialist, with optional filters by patient, risk level, date range, or critical alerts' })
  @ApiResponse({ status: 200, description: 'Analysis history returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '20' })
  @ApiQuery({ name: 'patient_id', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'risk_level', required: false, description: 'Filter by risk level', example: 'high' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date filter (ISO 8601)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date filter (ISO 8601)', example: '2025-12-31' })
  @ApiQuery({ name: 'has_critical_alerts', required: false, description: 'Filter for analyses with critical alerts', example: 'true' })
  @Get('history')
  async getAnalysisHistory(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('patient_id') patientId: string,
    @Query('risk_level') riskLevel: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('has_critical_alerts') hasCriticalAlerts: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT history');
    }

    const result = await this.rxgptService.getSpecialistAnalysisHistory(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      {
        patient_id: patientId,
        risk_level: riskLevel,
        start_date: startDate,
        end_date: endDate,
        has_critical_alerts: hasCriticalAlerts === 'true',
      },
    );

    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get all versions for a version group (for version switcher UI)
   */
  @ApiOperation({ summary: 'Get analysis versions', description: 'Retrieve all versions of an analysis within a version group for the version-switcher comparison UI' })
  @ApiResponse({ status: 200, description: 'Version list returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT versions' })
  @ApiParam({ name: 'versionGroup', description: 'Version group identifier', example: 'vg_abc123def456' })
  @Get('versions/:versionGroup')
  async getVersions(
    @Param('versionGroup') versionGroup: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT versions');
    }

    const versions = await this.rxgptService.getVersionsForGroup(versionGroup, req.user.sub);
    return sendSuccessResponse('Versions retrieved', versions);
  }

  /**
   * Get a specific analysis by ID
   */
  @ApiOperation({ summary: 'Get analysis by ID', description: 'Retrieve a specific RxGPT analysis result by its ID' })
  @ApiResponse({ status: 200, description: 'Analysis details returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT history' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  @ApiParam({ name: 'id', description: 'Analysis ID', example: '507f1f77bcf86cd799439011' })
  @Get('history/:id')
  async getAnalysisById(@Param('id') id: string, @Request() req: any) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT history');
    }

    const analysis = await this.rxgptService.getAnalysisById(id, req.user.sub);
    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return sendSuccessResponse(Messages.RETRIEVED, analysis);
  }

  /**
   * Get specialist's analysis statistics
   */
  @ApiOperation({ summary: 'Get analysis statistics', description: 'Retrieve aggregate statistics for the specialist RxGPT analyses including total count, risk distribution, and credit usage' })
  @ApiResponse({ status: 200, description: 'Analysis statistics returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT stats' })
  @Get('stats')
  async getAnalysisStats(@Request() req: any) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT stats');
    }

    const stats = await this.rxgptService.getSpecialistAnalysisStats(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, stats);
  }

  /**
   * Get RxGPT analysis history for a specific prescription
   * Used on prescription details page to show past analyses
   */
  @ApiOperation({ summary: 'Get prescription analysis history', description: 'Retrieve all RxGPT analyses performed for a specific prescription. Used on prescription detail pages.' })
  @ApiResponse({ status: 200, description: 'Prescription analysis history returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT history' })
  @ApiParam({ name: 'prescriptionId', description: 'Prescription ID', example: '507f1f77bcf86cd799439011' })
  @Get('prescription/:prescriptionId/history')
  async getPrescriptionAnalysisHistory(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT history');
    }

    const history = await this.rxgptService.getAnalysisHistoryByPrescription(
      prescriptionId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, history);
  }

  /**
   * Get RxGPT analysis history for a patient
   * Shows all analyses done for a specific patient across all prescriptions
   */
  @ApiOperation({ summary: 'Get patient analysis history', description: 'Retrieve all RxGPT analyses performed for a specific patient across all prescriptions' })
  @ApiResponse({ status: 200, description: 'Patient analysis history returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT history' })
  @ApiParam({ name: 'patientId', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '20' })
  @Get('patient/:patientId/history')
  async getPatientAnalysisHistory(
    @Param('patientId') patientId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT history');
    }

    const history = await this.rxgptService.getAnalysisHistoryByPatient(
      patientId,
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, history);
  }

  /**
   * Link an existing RxGPT analysis to a prescription
   * Called when prescription is saved to associate the analysis
   */
  @ApiOperation({ summary: 'Link analysis to prescription', description: 'Associate an existing RxGPT analysis with a saved prescription. Called when the prescription is finalized.' })
  @ApiResponse({ status: 200, description: 'Analysis linked to prescription' })
  @ApiResponse({ status: 403, description: 'Only specialists can link RxGPT analyses' })
  @ApiResponse({ status: 404, description: 'Analysis or prescription not found' })
  @ApiParam({ name: 'analysisId', description: 'RxGPT analysis ID', example: '507f1f77bcf86cd799439011' })
  @Patch('analysis/:analysisId/link-prescription')
  async linkAnalysisToPrescription(
    @Param('analysisId') analysisId: string,
    @Body('prescription_id') prescriptionId: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can link RxGPT analyses');
    }

    const updated = await this.rxgptService.linkAnalysisToPrescription(
      analysisId,
      prescriptionId,
      req.user.sub,
    );
    return sendSuccessResponse('Analysis linked to prescription', updated);
  }

  // ============ FEEDBACK ENDPOINTS ============

  /**
   * Submit feedback for an analysis
   */
  @ApiOperation({ summary: 'Submit analysis feedback', description: 'Submit specialist feedback on an RxGPT analysis including rating, correctness assessment, and comments for model improvement' })
  @ApiResponse({ status: 200, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 403, description: 'Only specialists can submit RxGPT feedback' })
  @Post('feedback')
  async submitFeedback(@Body() dto: SubmitRxGPTFeedbackDto, @Request() req: any) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can submit RxGPT feedback');
    }

    const feedback = await this.rxgptService.submitFeedback(
      dto.analysis_id,
      req.user.sub,
      {
        rating: dto.rating,
        safety_assessment_correct: dto.safety_assessment_correct,
        alerts_relevant: dto.alerts_relevant,
        recommendations_useful: dto.recommendations_useful,
        drug_feedback: dto.drug_feedback,
        missed_issues: dto.missed_issues,
        false_positives: dto.false_positives,
        comments: dto.comments,
        action_taken: dto.action_taken,
        modifications_made: dto.modifications_made,
      },
    );

    return sendSuccessResponse('Feedback submitted successfully', feedback);
  }

  /**
   * Get feedback for a specific analysis
   */
  @ApiOperation({ summary: 'Get analysis feedback', description: 'Retrieve specialist feedback previously submitted for a specific RxGPT analysis' })
  @ApiResponse({ status: 200, description: 'Feedback returned' })
  @ApiResponse({ status: 403, description: 'Only specialists can access RxGPT feedback' })
  @ApiParam({ name: 'analysisId', description: 'RxGPT analysis ID', example: '507f1f77bcf86cd799439011' })
  @Get('feedback/:analysisId')
  async getFeedback(@Param('analysisId') analysisId: string, @Request() req: any) {
    if (req.user?.user_type !== 'Specialist') {
      throw new ForbiddenException('Only specialists can access RxGPT feedback');
    }

    const feedback = await this.rxgptService.getFeedbackForAnalysis(analysisId, req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, feedback);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get full RxGPT settings (admin only)
   */
  @ApiOperation({ summary: 'Get full settings (Admin)', description: 'Retrieve the complete RxGPT configuration including admin-only fields like API keys, model settings, and cost parameters' })
  @ApiResponse({ status: 200, description: 'Full RxGPT settings returned' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @Get('admin/settings')
  async getAdminSettings(@Request() req: any) {
    // Verify user is an admin
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const settings = await this.rxgptService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, settings);
  }

  /**
   * Update RxGPT settings (admin only)
   */
  @ApiOperation({ summary: 'Update settings (Admin)', description: 'Update RxGPT configuration including enabling/disabling features, adjusting credit costs, or changing AI model parameters' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @Patch('admin/settings')
  async updateSettings(
    @Body() dto: UpdateRxGPTSettingsDto,
    @Request() req: any,
  ) {
    // Verify user is an admin
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const settings = await this.rxgptService.updateSettings(dto, req.user.sub);
    return sendSuccessResponse('Settings updated successfully', settings);
  }

  /**
   * Get RxGPT analytics (admin only)
   */
  @ApiOperation({ summary: 'Get analytics (Admin)', description: 'Retrieve platform-wide RxGPT usage analytics including analysis counts, credit consumption, risk distribution, and specialist activity' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @Get('admin/analytics')
  async getAnalytics(
    @Query() query: RxGPTAnalyticsQueryDto,
    @Request() req: any,
  ) {
    // Verify user is an admin
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const analytics = await this.rxgptService.getAnalytics(query);
    return sendSuccessResponse(Messages.RETRIEVED, analytics);
  }

  /**
   * Get cache statistics (admin only)
   */
  @ApiOperation({ summary: 'Get cache stats (Admin)', description: 'Retrieve RxGPT analysis cache statistics including hit rate, total entries, and memory usage' })
  @ApiResponse({ status: 200, description: 'Cache statistics returned' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @Get('admin/cache/stats')
  async getCacheStats(@Request() req: any) {
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const stats = await this.rxgptService.getCacheStats();
    return sendSuccessResponse(Messages.RETRIEVED, stats);
  }

  /**
   * Cleanup expired cache entries (admin only)
   */
  @ApiOperation({ summary: 'Cleanup cache (Admin)', description: 'Remove expired analysis cache entries to free memory and storage. Returns count of deleted entries.' })
  @ApiResponse({ status: 200, description: 'Cache cleanup completed with count of deleted entries' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @Post('admin/cache/cleanup')
  async cleanupCache(@Request() req: any) {
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const deletedCount = await this.rxgptService.cleanupExpiredCache();
    return sendSuccessResponse('Cache cleanup completed', { deleted_count: deletedCount });
  }

  /**
   * Get feedback statistics (admin only)
   */
  @ApiOperation({ summary: 'Get feedback stats (Admin)', description: 'Retrieve aggregate feedback statistics for RxGPT analyses including average ratings, accuracy metrics, and specialist satisfaction' })
  @ApiResponse({ status: 200, description: 'Feedback statistics returned' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date filter (ISO 8601)', example: '2025-01-01' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date filter (ISO 8601)', example: '2025-12-31' })
  @Get('admin/feedback/stats')
  async getFeedbackStats(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req: any,
  ) {
    if (req.user?.user_type !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }

    const stats = await this.rxgptService.getFeedbackStats(startDate, endDate);
    return sendSuccessResponse(Messages.RETRIEVED, stats);
  }
}
