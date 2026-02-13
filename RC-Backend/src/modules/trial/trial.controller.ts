import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrialService } from './trial.service';
import { TrialGuard } from './trial.guard';
import {
  RequestTrialDto,
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
  async requestTrial(@Body() dto: RequestTrialDto, @Request() req: any) {
    const result = await this.trialService.requestTrial(dto, req);
    return sendSuccessResponse(result.message, { success: true });
  }

  @Get('verify/:token')
  async verifyToken(@Param('token') token: string) {
    const result = await this.trialService.verifyToken(token);
    return sendSuccessResponse('Trial verified successfully', result);
  }

  // ============ TRIAL-GUARDED ENDPOINTS ============

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('session')
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
  async beginCheckup(@Body() dto: TrialBeginCheckupDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialBeginCheckup(token, dto);
    return sendSuccessResponse('Checkup started', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/parse')
  @HttpCode(HttpStatus.OK)
  async parseFreeText(@Body() dto: TrialParseTextDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialParseFreeText(token, dto);
    return sendSuccessResponse('Text parsed', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/diagnosis')
  @HttpCode(HttpStatus.OK)
  async checkDiagnosis(@Body() dto: TrialDiagnosisDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialDiagnosis(token, dto);
    return sendSuccessResponse('Diagnosis checked', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Get('symptom-checker/search')
  async searchSymptoms(@Query() dto: TrialSearchDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialSearch(token, dto);
    return sendSuccessResponse('Search completed', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/risk-factors')
  @HttpCode(HttpStatus.OK)
  async getRiskFactors(@Body() dto: TrialRiskFactorsDto, @Request() req: any) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialGetRiskFactors(token, dto);
    return sendSuccessResponse('Risk factors retrieved', result);
  }

  @ApiSecurity('Trial-token')
  @UseGuards(TrialGuard)
  @Post('symptom-checker/symptoms')
  @HttpCode(HttpStatus.OK)
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
  async getPrescriptionStatus(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ) {
    const token = req.headers['x-trial-token'];
    const result = await this.trialService.trialPrescriptionStatus(token, uploadId);
    return sendSuccessResponse('Verification status retrieved', result);
  }

  // ---- Trial Analytics (public for admin use) ----

  @Get('analytics')
  async getTrialAnalytics() {
    const result = await this.trialService.getTrialAnalytics();
    return sendSuccessResponse('Trial analytics retrieved', result);
  }
}
