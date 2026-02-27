import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HealthCheckupService } from './health-checkup.service';
import { ClaudeHealthSummaryService } from './services/claude-health-summary.service';
import { ClaudeSummaryCreditsService } from '../claude-summary-credits/claude-summary-credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseTextDto } from './dto/parse-text.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { RiskFactorsDto } from './dto/risk-factors.dto';
import { SuggestedSymptomsDto } from './dto/suggested-symptoms.dto';
import { CheckDiagnosisDto } from './dto/check-diagnosis.dto';
import { ExplainConditionDto } from './dto/explain-condition.dto';
import { BeginCheckupDto } from './dto/begin-checkup.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ExtendedDiagnosisDto } from './dto/extended-diagnosis.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { BasicHealthScoreService } from '../basic-health-score/basic-health-score.service';
import { ScoreChangeTrigger } from '../basic-health-score/entities/basic-health-score-history.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health Checkup')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('health-checkup')
export class HealthCheckupController {
  constructor(
    private readonly healthCheckupService: HealthCheckupService,
    private readonly claudeHealthSummaryService: ClaudeHealthSummaryService,
    private readonly claudeSummaryCreditsService: ClaudeSummaryCreditsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => BasicHealthScoreService))
    private readonly basicHealthScoreService: BasicHealthScoreService,
  ) {}

  @ApiOperation({ summary: 'Begin health checkup', description: 'Start a new AI-powered health checkup session for self, dependant, or someone else. Creates an Infermedica interview.' })
  @ApiResponse({ status: 201, description: 'Health checkup session started with interview token' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid owner ID' })
  @Post()
  async beginCheckup(@Body() beginCheckupDto: BeginCheckupDto, @Request() req) {
    const result = await this.healthCheckupService.beginCheckup(
      beginCheckupDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Parse free text symptoms', description: 'Parse patient free-text symptom description into structured Infermedica evidence using NLP.' })
  @ApiResponse({ status: 200, description: 'Parsed symptoms with evidence IDs returned' })
  @HttpCode(HttpStatus.OK)
  @Post('parse')
  async parseFreeText(@Body() parseTextDto: ParseTextDto) {
    const result = await this.healthCheckupService.parseFreeText(
      parseTextDto,
      parseTextDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Parse free text (enhanced NLP)', description: 'Enhanced text parsing with typo tolerance, fuzzy matching, and up to 15 suggestions per parse.' })
  @ApiResponse({ status: 200, description: 'Enhanced parsed results returned' })
  @HttpCode(HttpStatus.OK)
  @Post('parse-enhanced')
  async parseFreeTextEnhanced(@Body() parseTextDto: ParseTextDto) {
    // Enhanced parsing with NLP improvements enabled by default
    const enhancedDto = {
      ...parseTextDto,
      extras: {
        enable_typo_tolerance: true,
        enable_enhanced_nlp: true,
        enable_fuzzy_matching: true,
        max_suggestions: 15,
        include_raw_mentions: true,
        ...parseTextDto.extras
      }
    };
    
    const result = await this.healthCheckupService.parseFreeText(
      enhancedDto,
      parseTextDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Get risk factors', description: 'Retrieve age-appropriate health risk factors from Infermedica for the symptom interview.' })
  @ApiResponse({ status: 200, description: 'Risk factors list returned' })
  @HttpCode(HttpStatus.OK)
  @Post('risk-factors')
  async getRiskFactors(@Body() riskFactorsDto: RiskFactorsDto) {
    const result = await this.healthCheckupService.getRiskFactors(
      riskFactorsDto.age,
      riskFactorsDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Get suggested symptoms', description: 'Get symptom suggestions based on current evidence to guide the interview process.' })
  @ApiResponse({ status: 200, description: 'Suggested symptoms returned' })
  @HttpCode(HttpStatus.OK)
  @Post('symptoms')
  async getSuggestedSymptoms(
    @Body() suggestedSymptomsDto: SuggestedSymptomsDto,
  ) {
    const result = await this.healthCheckupService.getSuggestedSymptoms(
      suggestedSymptomsDto,
      suggestedSymptomsDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Check diagnosis', description: 'Submit evidence for diagnosis. Returns follow-up questions or final triage with conditions. Updates health score on completion.' })
  @ApiResponse({ status: 200, description: 'Diagnosis question or triage result returned' })
  @HttpCode(HttpStatus.OK)
  @Post('diagnosis')
  async checkDiagnosis(
    @Body() checkDiagnosisDto: CheckDiagnosisDto,
    @Request() req,
  ) {
    const result = await this.healthCheckupService.diagnosis(
      checkDiagnosisDto,
      req.user.sub,
    );

    // If checkup is complete (has triage_level), update basic health score
    if (result?.data?.triage_level) {
      const triageLevel = result.data.triage_level;
      this.basicHealthScoreService
        .calculateAndStoreScore(req.user.sub, ScoreChangeTrigger.HEALTH_CHECKUP_COMPLETED, `Health checkup completed with triage: ${triageLevel}`)
        .catch(err => console.error('Error updating basic health score:', err));
    }

    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Check diagnosis (with duration)', description: 'Enhanced diagnosis supporting symptom duration questions. Same as /diagnosis but with enable_symptom_duration enabled.' })
  @ApiResponse({ status: 200, description: 'Diagnosis with duration support returned' })
  @HttpCode(HttpStatus.OK)
  @Post('diagnosis-enhanced')
  async checkDiagnosisWithDuration(
    @Body() checkDiagnosisDto: CheckDiagnosisDto,
    @Request() req,
  ) {
    console.log('=== ENHANCED CONTROLLER CALLED ===');
    console.log('Enhanced diagnosis controller hit with user:', req.user?.sub);
    console.log('Evidence count:', checkDiagnosisDto.evidence?.length);

    const result = await this.healthCheckupService.diagnosisWithDuration(
      checkDiagnosisDto,
      req.user.sub,
      true // Enable duration support
    );

    // If checkup is complete (has triage_level), update basic health score
    if (result?.data?.triage_level) {
      const triageLevel = result.data.triage_level;
      this.basicHealthScoreService
        .calculateAndStoreScore(req.user.sub, ScoreChangeTrigger.HEALTH_CHECKUP_COMPLETED, `Health checkup completed with triage: ${triageLevel}`)
        .catch(err => console.error('Error updating basic health score:', err));
    }

    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Explain condition', description: 'Get a plain-language explanation of a diagnosed condition, including supporting and opposing evidence.' })
  @ApiResponse({ status: 200, description: 'Condition explanation returned' })
  @HttpCode(HttpStatus.OK)
  @Post('explain-condition')
  async explainCondition(@Body() explainConditionDto: ExplainConditionDto) {
    const result = await this.healthCheckupService.explainCondition(
      explainConditionDto,
      explainConditionDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Search symptoms/conditions', description: 'Search Infermedica database for symptoms and conditions by keyword phrase.' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @Get('search')
  async search(@Query() searchQueryDto: SearchQueryDto) {
    const result = await this.healthCheckupService.search(
      searchQueryDto,
      searchQueryDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Search symptoms (enhanced)', description: 'Enhanced search with typo tolerance, fuzzy matching, synonyms, and relaxed matching. Lower confidence threshold (0.4).' })
  @ApiResponse({ status: 200, description: 'Enhanced search results returned' })
  @Get('search-enhanced')
  async searchEnhanced(@Query() searchQueryDto: SearchQueryDto) {
    // Enhanced search with NLP improvements enabled by default
    const enhancedQuery = {
      ...searchQueryDto,
      extras: {
        enable_typo_tolerance: true,
        enable_fuzzy_matching: true,
        include_synonyms: true,
        relaxed_matching: true,
        minimum_confidence: 0.4,
        ...searchQueryDto.extras
      }
    };
    
    const result = await this.healthCheckupService.search(
      enhancedQuery,
      searchQueryDto.interview_token
    );
    return sendSuccessResponse(Messages.RETRIEVED, result?.data);
  }

  @ApiOperation({ summary: 'Get checkup results by user', description: 'Retrieve all health checkup results for a specific user.' })
  @ApiResponse({ status: 200, description: 'Checkup results returned' })
  @Get('results/:id')
  async getHealthCheckupResults(@Param('id') userId: string) {
    const result = await this.healthCheckupService.getHealthCheckupResults(userId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get checkup history', description: 'Retrieve paginated health checkup history for the authenticated user with sorting options.' })
  @ApiResponse({ status: 200, description: 'Checkup history returned with pagination' })
  @Get('history')
  async getHealthCheckupHistory(
    @Query() historyQueryDto: HistoryQueryDto,
    @Request() req
  ) {
    const result = await this.healthCheckupService.getHealthCheckupHistory(
      req.user.sub,
      historyQueryDto.page,
      historyQueryDto.limit,
      historyQueryDto.sortBy,
      historyQueryDto.sortOrder
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get checkup by ID', description: 'Retrieve full details of a specific health checkup including symptoms, evidence, and diagnosis results.' })
  @ApiResponse({ status: 200, description: 'Health checkup details returned' })
  @ApiResponse({ status: 404, description: 'Checkup not found' })
  @Get(':checkupId')
  async getHealthCheckupById(
    @Param('checkupId') checkupId: string,
    @Request() req
  ) {
    const result = await this.healthCheckupService.getHealthCheckupById(checkupId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Delete health checkup', description: 'Permanently delete a health checkup record. Only the owner can delete their own checkups.' })
  @ApiResponse({ status: 200, description: 'Checkup deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this checkup' })
  @ApiResponse({ status: 404, description: 'Checkup not found' })
  @Delete(':checkupId')
  async deleteHealthCheckup(
    @Param('checkupId') checkupId: string,
    @Request() req
  ) {
    const result = await this.healthCheckupService.deleteHealthCheckup(
      checkupId,
      req.user.sub
    );
    return sendSuccessResponse('Health checkup deleted successfully', result);
  }

  @ApiOperation({ summary: 'Get extended diagnosis', description: 'Retrieve an extended list of possible conditions with probability scores. Useful for detailed analysis after the main diagnosis.' })
  @ApiResponse({ status: 200, description: 'Extended diagnosis with probability scores' })
  @HttpCode(HttpStatus.OK)
  @Post('extended-diagnosis')
  async getExtendedDiagnosis(
    @Body() extendedDiagnosisDto: ExtendedDiagnosisDto,
    @Request() req
  ) {
    const result = await this.healthCheckupService.getExtendedDiagnosis(
      extendedDiagnosisDto,
      req.user.sub
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Test Infermedica settings', description: 'Debug endpoint to verify Infermedica API configuration. Not for production use.' })
  @ApiResponse({ status: 200, description: 'Infermedica settings returned' })
  @HttpCode(HttpStatus.OK)
  @Get('settings/test')
  async testInfermedicaSettings() {
    // This endpoint is for testing API settings - remove in production
    const result = await this.healthCheckupService.getInfermedicaSettings();
    return {
      success: true,
      data: result,
      message: 'Infermedica API Settings Retrieved'
    };
  }

  @ApiOperation({ summary: 'Get Claude summary status', description: 'Check if AI Health Summary is available and view credit balance (free, gifted, purchased credits).' })
  @ApiResponse({ status: 200, description: 'Summary availability status and credit balance returned' })
  @Get('claude-summary/status')
  async getClaudeSummaryStatus(@Request() req) {
    // Get credit status for the user
    const creditStatus = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);
    const canGenerate = await this.claudeSummaryCreditsService.canGenerateSummary(req.user.sub);

    return sendSuccessResponse(Messages.RETRIEVED, {
      enabled: true, // Feature is enabled for all users via credits system
      service_available: this.claudeHealthSummaryService.isAvailable(),
      credits: creditStatus,
      can_generate: canGenerate.can_generate,
      credit_source: canGenerate.source,
      credits_remaining: canGenerate.credits_remaining,
    });
  }

  @ApiOperation({ summary: 'Get Claude AI summary', description: 'Retrieve a stored AI-generated health summary for a checkup, along with credit status.' })
  @ApiResponse({ status: 200, description: 'Claude summary and credit status returned' })
  @ApiResponse({ status: 404, description: 'Checkup not found' })
  @Get(':checkupId/claude-summary')
  async getClaudeSummary(
    @Param('checkupId') checkupId: string,
    @Request() req
  ) {
    // Get stored summary from DB
    const result = await this.healthCheckupService.getClaudeSummary(checkupId);

    // Get credit status
    const creditStatus = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);
    const canGenerate = await this.claudeSummaryCreditsService.canGenerateSummary(req.user.sub);

    return sendSuccessResponse(Messages.RETRIEVED, {
      enabled: true,
      ...result,
      credits: creditStatus,
      can_generate: canGenerate.can_generate,
      credit_source: canGenerate.source,
    });
  }

  @ApiOperation({ summary: 'Generate Claude AI summary', description: 'Generate a new AI health summary for a checkup. Consumes one credit. Returns existing summary if already generated.' })
  @ApiResponse({ status: 200, description: 'Summary generated (or already exists), credit consumed' })
  @ApiResponse({ status: 402, description: 'No credits available — purchase required' })
  @HttpCode(HttpStatus.OK)
  @Post(':checkupId/generate-claude-summary')
  async generateClaudeSummary(
    @Param('checkupId') checkupId: string,
    @Body() body: { answered_questions?: any[] },
    @Request() req
  ) {
    // Get checkup data first to check if summary already exists
    const checkupData = await this.healthCheckupService.getCheckupForClaudeSummary(checkupId);

    // Check if summary already exists (no credit needed)
    if (checkupData.claude_summary?.content) {
      const creditStatus = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);
      return sendSuccessResponse('Claude summary already exists', {
        enabled: true,
        generated: false,
        already_exists: true,
        claude_summary: checkupData.claude_summary,
        credits: creditStatus,
      });
    }

    // Check if user has credits available
    const canGenerate = await this.claudeSummaryCreditsService.canGenerateSummary(req.user.sub);

    if (!canGenerate.can_generate) {
      // No credits available - return friendly message with purchase info
      const plans = await this.claudeSummaryCreditsService.getActivePlans();
      const creditStatus = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);

      return sendSuccessResponse('No credits available', {
        enabled: true,
        generated: false,
        purchase_required: true,
        message: 'Your free monthly Health Summary credits have been used. Purchase more credits to continue.',
        credits: creditStatus,
        available_plans: plans,
      });
    }

    // Extract diagnosis data from checkup
    const diagnosisData = {
      conditions: checkupData.response?.data?.conditions || [],
      evidence: checkupData.request?.evidence || [],
      triage_level: checkupData.response?.data?.triage_level,
      has_emergency_evidence: checkupData.response?.data?.has_emergency_evidence
    };

    const patientInfo = {
      age: checkupData.request?.age?.value || 30,
      gender: checkupData.request?.sex || 'unknown'
    };

    // Generate summary using Claude
    const summaryResult = await this.claudeHealthSummaryService.generateHealthSummary(
      diagnosisData,
      patientInfo,
      body.answered_questions
    );

    // Consume a credit after successful generation
    const consumeResult = await this.claudeSummaryCreditsService.consumeCredit(
      req.user.sub,
      checkupId
    );

    // Store the generated summary in DB
    const storedResult = await this.healthCheckupService.storeClaudeSummary(
      checkupId,
      summaryResult
    );

    // Get updated credit status
    const creditStatus = await this.claudeSummaryCreditsService.getCreditStatus(req.user.sub);

    return sendSuccessResponse('Claude summary generated and stored', {
      enabled: true,
      generated: true,
      claude_summary: storedResult.claude_summary,
      credit_used: {
        source: consumeResult.source,
        remaining: consumeResult.remaining,
      },
      credits: creditStatus,
    });
  }
}
