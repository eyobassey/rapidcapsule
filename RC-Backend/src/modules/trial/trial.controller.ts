import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrialService } from './trial.service';
import { TrialGuard } from './trial.guard';
import {
  RequestTrialDto,
  RequestTrialWithOtpDto,
  VerifyOtpDto,
  ResendOtpDto,
  TrialBeginCheckupDto,
  TrialParseTextDto,
  TrialDiagnosisDto,
  TrialSearchDto,
  TrialRiskFactorsDto,
  TrialSuggestedSymptomsDto,
  TrialRxGPTDto,
  TrialAISummaryDto,
} from './trial.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';

const ALLOWED_PRESCRIPTION_MIMES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif', 'application/pdf',
];

@ApiTags('Trial')
@Controller('trial')
export class TrialController {
  constructor(private readonly trialService: TrialService) {}

  // ============ PUBLIC ENDPOINTS (no auth) ============

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request trial access',
    description:
      'Submits a trial access request. Sends a verification email with a unique trial token to the provided address. If a valid trial already exists for the email, it returns the existing session.',
  })
  @ApiResponse({ status: 200, description: 'Trial request processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or email format' })
  @ApiResponse({ status: 429, description: 'Too many trial requests' })
  async requestTrial(@Body() dto: RequestTrialDto, @Request() req: any) {
    const result = await this.trialService.requestTrial(dto, req);
    return sendSuccessResponse(result.message, { success: true });
  }

  @Get('verify/:token')
  @ApiOperation({
    summary: 'Verify trial token',
    description:
      'Verifies a trial token received via email. Returns session details and remaining usage limits if the token is valid and has not expired.',
  })
  @ApiParam({
    name: 'token',
    description: 'Trial verification token from the email link',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Trial token verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired trial token' })
  async verifyToken(@Param('token') token: string) {
    const result = await this.trialService.verifyToken(token);
    return sendSuccessResponse('Trial verified successfully', result);
  }

  // ============ CONVERSATIONAL OTP ONBOARDING ============

  @Post('request-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request trial with OTP verification',
    description:
      'Creates a trial session and sends a 6-digit OTP code via email for conversational onboarding through Eka. Also includes a magic link as fallback.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Disposable email or invalid input' })
  @ApiResponse({ status: 403, description: 'IP rate limited' })
  @ApiResponse({ status: 409, description: 'Active trial already exists' })
  async requestTrialWithOtp(@Body() dto: RequestTrialWithOtpDto, @Request() req: any) {
    const result = await this.trialService.requestTrialWithOtp(dto, req);
    return sendSuccessResponse(result.message, { success: true });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code',
    description:
      'Verifies the 6-digit OTP code submitted during conversational onboarding. On success, returns a fresh trial token for subsequent API calls.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified, trial token returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 403, description: 'Too many incorrect attempts' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Request() req: any) {
    const result = await this.trialService.verifyOtp(dto, req);
    return sendSuccessResponse('Email verified successfully!', result);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP code',
    description:
      'Generates and sends a new OTP code to the email address associated with a pending trial session. Resets the attempt counter.',
  })
  @ApiResponse({ status: 200, description: 'New OTP sent' })
  @ApiResponse({ status: 400, description: 'No pending trial found' })
  async resendOtp(@Body() dto: ResendOtpDto, @Request() req: any) {
    const result = await this.trialService.resendOtp(dto, req);
    return sendSuccessResponse(result.message, { success: true });
  }

  // ============ TRIAL-GUARDED ENDPOINTS ============

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('session')
  @ApiOperation({
    summary: 'Get trial session status',
    description:
      'Returns the current trial session details including remaining usage counts for symptom checker, RxGPT, prescription verification, and Eka AI features.',
  })
  @ApiResponse({ status: 200, description: 'Session status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async getSession(@Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.getSessionStatus(token);
    return sendSuccessResponse('Session retrieved', result);
  }

  // ---- Symptom Checker Proxy Endpoints ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/begin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Begin symptom checker checkup',
    description:
      'Initializes a new Infermedica symptom checker session for the trial user. Optionally accepts age and gender to pre-populate patient info. Returns an interview token for subsequent API calls.',
  })
  @ApiResponse({ status: 200, description: 'Checkup session started successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  @ApiResponse({ status: 429, description: 'Symptom checker usage limit reached' })
  async beginCheckup(@Body() dto: TrialBeginCheckupDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialBeginCheckup(token, dto);
    return sendSuccessResponse('Checkup started', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/parse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse free text symptoms',
    description:
      'Uses Infermedica NLP to parse free-text symptom descriptions into structured evidence. The parsed symptoms can then be used in subsequent diagnosis calls.',
  })
  @ApiResponse({ status: 200, description: 'Free text parsed into structured symptoms' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async parseFreeText(@Body() dto: TrialParseTextDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialParseFreeText(token, dto);
    return sendSuccessResponse('Text parsed', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/diagnosis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check diagnosis',
    description:
      'Sends the current evidence to the Infermedica diagnosis engine. Returns the next interview question, possible conditions with probabilities, and triage information.',
  })
  @ApiResponse({ status: 200, description: 'Diagnosis results returned' })
  @ApiResponse({ status: 400, description: 'Malformed evidence or invalid parameters' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async checkDiagnosis(@Body() dto: TrialDiagnosisDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialDiagnosis(token, dto);
    return sendSuccessResponse('Diagnosis checked', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('symptom-checker/search')
  @ApiOperation({
    summary: 'Search symptoms',
    description:
      'Searches the Infermedica symptom database by keyword phrase. Results can be filtered by sex and age. Returns matching symptoms with their IDs for use as evidence.',
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async searchSymptoms(@Query() dto: TrialSearchDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialSearch(token, dto);
    return sendSuccessResponse('Search completed', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/risk-factors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get risk factors',
    description:
      'Retrieves age-appropriate risk factors from Infermedica that can be added as evidence to improve diagnosis accuracy.',
  })
  @ApiResponse({ status: 200, description: 'Risk factors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async getRiskFactors(@Body() dto: TrialRiskFactorsDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialGetRiskFactors(token, dto);
    return sendSuccessResponse('Risk factors retrieved', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/symptoms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get suggested symptoms',
    description:
      'Returns additional symptoms that Infermedica suggests based on the current evidence. These help guide the user through the interview process for more accurate results.',
  })
  @ApiResponse({ status: 200, description: 'Suggested symptoms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async getSuggestedSymptoms(
    @Body() dto: TrialSuggestedSymptomsDto,
    @Request() req: any,
  ) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialGetSuggestedSymptoms(token, dto);
    return sendSuccessResponse('Suggested symptoms retrieved', result);
  }

  // ---- AI Health Summary Endpoint ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/ai-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AI health summary',
    description:
      'Generates an AI-powered summary of the symptom checker results, including condition explanations, recommended next steps, and specialist referral suggestions based on the diagnosis data.',
  })
  @ApiResponse({ status: 200, description: 'AI summary generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async generateAISummary(@Body() dto: TrialAISummaryDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialGenerateAISummary(token, dto);
    return sendSuccessResponse('AI summary generated', result);
  }

  // ---- RxGPT Proxy Endpoint ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('rxgpt/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze with RxGPT',
    description:
      'Submits a diagnosis to the RxGPT AI engine for pharmacological analysis. Returns evidence-based drug recommendations, dosage guidelines, contraindication checks, and interaction warnings tailored to the patient context.',
  })
  @ApiResponse({ status: 200, description: 'RxGPT analysis completed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  @ApiResponse({ status: 429, description: 'RxGPT usage limit reached' })
  async analyzeRxGPT(@Body() dto: TrialRxGPTDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialRxGPTAnalyze(token, dto);
    return sendSuccessResponse('RxGPT analysis completed', result);
  }

  // ---- Prescription Upload Proxy Endpoints ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('prescription/upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload prescription for verification',
    description:
      'Uploads a prescription image or PDF for AI-powered verification. Supported formats: JPEG, PNG, WebP, GIF, PDF. Maximum file size is 10 MB. The verification process runs asynchronously; use the status endpoint to poll for results.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Prescription uploaded and verification started' })
  @ApiResponse({ status: 400, description: 'Invalid file type or missing file' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  @ApiResponse({ status: 429, description: 'Prescription verification usage limit reached' })
  @UseInterceptors(
    FileInterceptor('prescription', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_PRESCRIPTION_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialPrescriptionUpload(
      token,
      file,
      body?.uploadSource,
    );
    return sendSuccessResponse('Prescription uploaded. Verification in progress.', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('prescription/:uploadId/status')
  @ApiOperation({
    summary: 'Get prescription verification status',
    description:
      'Polls the status of a previously uploaded prescription verification. Returns the current processing state and, when complete, the verification results including extracted drug information.',
  })
  @ApiParam({
    name: 'uploadId',
    description: 'Upload ID returned from the prescription upload endpoint',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  @ApiResponse({ status: 404, description: 'Upload ID not found' })
  async getPrescriptionStatus(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialPrescriptionStatus(token, uploadId);
    return sendSuccessResponse('Verification status retrieved', result);
  }

  // ---- Eka AI Chat Endpoints ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('eka/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with Eka AI (SSE streaming)',
    description:
      'Sends a message to the Eka AI assistant and returns a Server-Sent Events (SSE) stream. Each event contains a JSON chunk with type and content fields. The stream ends with a [DONE] sentinel. Supports optional language parameter for multilingual responses.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream of Eka AI chat response chunks' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  @ApiResponse({ status: 429, description: 'Eka AI usage limit reached' })
  async ekaChat(@Body() body: { message: string; language?: string; conversation_id?: string }, @Request() req: any, @Res() res: any) {
    const token = req.headers['x-trial-token'];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const chunk of this.trialService.trialEkaChat(token, body.message, body.language, body.conversation_id)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'An unexpected error occurred.' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('eka/status')
  @ApiOperation({
    summary: 'Get Eka AI status',
    description:
      'Returns the current status of the Eka AI assistant for the trial session, including conversation history availability and remaining message count.',
  })
  @ApiResponse({ status: 200, description: 'Eka status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing trial token' })
  async getEkaStatus(@Request() req: any, @Query('conversation_id') conversationId?: string) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.getEkaStatus(token, conversationId);
    return sendSuccessResponse('Eka status retrieved', result);
  }

  // ---- Eka Conversation CRUD ----

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('eka/conversations')
  @ApiOperation({ summary: 'List trial conversations', description: 'Returns all active conversations for the trial session.' })
  @ApiResponse({ status: 200, description: 'Conversations listed' })
  async getEkaConversations(@Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.getTrialConversations(token);
    return sendSuccessResponse('Conversations retrieved', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('eka/conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new trial conversation', description: 'Creates a new empty conversation for the trial session.' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createEkaConversation(@Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.createTrialConversation(token);
    return sendSuccessResponse('Conversation created', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Patch('eka/conversations/:id')
  @ApiOperation({ summary: 'Rename trial conversation', description: 'Updates the title of a trial conversation.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation renamed' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async renameEkaConversation(@Param('id') id: string, @Body() body: { title: string }, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.renameTrialConversation(token, id, body.title);
    return sendSuccessResponse('Conversation renamed', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Delete('eka/conversations/:id')
  @ApiOperation({ summary: 'Delete trial conversation', description: 'Soft-deletes a trial conversation.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteEkaConversation(@Param('id') id: string, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.deleteTrialConversation(token, id);
    return sendSuccessResponse('Conversation deleted', result);
  }

  // ---- Trial Analytics (public for admin use) ----

  @Get('analytics')
  @ApiOperation({
    summary: 'Get trial analytics',
    description:
      'Returns aggregate trial analytics including total requests, active sessions, feature usage counts, and conversion metrics. This endpoint is public and intended for admin dashboard consumption.',
  })
  @ApiResponse({ status: 200, description: 'Trial analytics retrieved successfully' })
  async getTrialAnalytics() {
    const result = await this.trialService.getTrialAnalytics();
    return sendSuccessResponse('Trial analytics retrieved', result);
  }
}
