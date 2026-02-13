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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
