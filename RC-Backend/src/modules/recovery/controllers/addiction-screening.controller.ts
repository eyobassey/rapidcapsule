import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AddictionScreeningService } from '../services/addiction-screening.service';
import { BeginScreeningDto } from '../dto/begin-screening.dto';
import { SubmitScreeningDto } from '../dto/submit-screening.dto';
import { ScreeningHistoryDto } from '../dto/screening-history.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { ScreeningInstrumentType } from '../entities/addiction-screening.entity';

@ApiTags('Recovery - Screening')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/screening')
export class AddictionScreeningController {
  constructor(
    private readonly screeningService: AddictionScreeningService,
  ) {}

  @ApiOperation({
    summary: 'Begin a new addiction screening',
    description:
      'Initiates a new screening session using the specified validated instrument (AUDIT, DAST-10, CAGE, or ASSIST). Returns the questionnaire questions for the patient to answer.',
  })
  @ApiResponse({ status: 200, description: 'Screening session initiated with questionnaire questions returned' })
  @ApiResponse({ status: 400, description: 'Invalid instrument type or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @HttpCode(HttpStatus.OK)
  @Post()
  async beginScreening(@Body() dto: BeginScreeningDto, @Request() req) {
    const result = await this.screeningService.beginScreening(
      dto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Submit screening answers',
    description:
      'Submits the completed answers for a screening instrument. The system scores the answers, determines the risk level, and stores the result.',
  })
  @ApiParam({
    name: 'instrument',
    description: 'The screening instrument being submitted',
    enum: ScreeningInstrumentType,
    example: ScreeningInstrumentType.AUDIT,
  })
  @ApiResponse({ status: 201, description: 'Screening scored and result stored successfully' })
  @ApiResponse({ status: 400, description: 'Invalid answers or instrument type' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post(':instrument/submit')
  async submitScreening(
    @Param('instrument') instrument: ScreeningInstrumentType,
    @Body() dto: SubmitScreeningDto,
    @Request() req,
  ) {
    const result = await this.screeningService.submitScreening(
      null,
      dto,
      instrument,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Generate AI interpretation for a screening',
    description:
      'Uses AI to generate a clinical interpretation of a completed screening result, including risk assessment, recommended interventions, and a motivational message.',
  })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the completed screening',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 201, description: 'AI interpretation generated and attached to the screening' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post(':id/ai-interpretation')
  async generateAIInterpretation(@Param('id') id: string, @Request() req) {
    const result = await this.screeningService.generateAIInterpretation(
      id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Get recommended screening instrument',
    description:
      'Returns the most appropriate screening instrument for the patient based on their recovery profile, substance use history, and previous screening results.',
  })
  @ApiResponse({ status: 200, description: 'Recommended instrument returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('recommended')
  async getRecommendedInstrument(@Request() req) {
    const result = await this.screeningService.getRecommendedInstrument(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get screening history',
    description:
      'Retrieves a paginated list of the patient\'s past screening results, optionally filtered by instrument type and sorted by date.',
  })
  @ApiResponse({ status: 200, description: 'Paginated screening history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('history')
  async getScreeningHistory(@Query() dto: ScreeningHistoryDto, @Request() req) {
    const result = await this.screeningService.getScreeningHistory(
      req.user.sub,
      dto.instrument,
      dto.page || 1,
      dto.limit || 10,
      dto.sortOrder || 'desc',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get screening progress over time',
    description:
      'Returns the patient\'s screening score trend for a specific instrument over time, useful for visualising recovery progress on charts.',
  })
  @ApiParam({
    name: 'instrument',
    description: 'The screening instrument to track progress for',
    enum: ScreeningInstrumentType,
    example: ScreeningInstrumentType.AUDIT,
  })
  @ApiResponse({ status: 200, description: 'Progress data points returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('progress/:instrument')
  async getProgressOverTime(
    @Param('instrument') instrument: ScreeningInstrumentType,
    @Request() req,
  ) {
    const result = await this.screeningService.getProgressOverTime(
      req.user.sub,
      instrument,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Compare screening to baseline',
    description:
      'Compares a screening result against the patient\'s baseline screening of the same instrument. Returns delta, percentage change, subscale comparison, and risk level change.',
  })
  @ApiParam({ name: 'id', description: 'Screening ID to compare' })
  @ApiResponse({ status: 200, description: 'Baseline comparison returned' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @Get(':id/compare-baseline')
  async compareToBaseline(@Param('id') id: string, @Request() req) {
    const result = await this.screeningService.compareToBaseline(
      id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Schedule a follow-up screening',
    description:
      'Schedules a follow-up screening at the specified interval in days. Updates both the screening record and recovery profile with the next due date.',
  })
  @ApiParam({ name: 'id', description: 'Screening ID to schedule follow-up for', example: '663f961ebb4dc1fec5426abc' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['interval_days'],
      properties: {
        interval_days: { type: 'number', description: 'Number of days until the follow-up screening', example: 30 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Follow-up screening scheduled' })
  @ApiResponse({ status: 400, description: 'Invalid interval' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @Post(':id/schedule-followup')
  async scheduleFollowUp(
    @Param('id') id: string,
    @Body() body: { interval_days: number },
    @Request() req,
  ) {
    const result = await this.screeningService.scheduleFollowUp(
      id,
      req.user.sub,
      body.interval_days,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Specialist-administered screening',
    description:
      'Allows a specialist to administer a screening on behalf of a patient. The specialist fills in the answers and optionally adds clinical notes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['patient_id', 'instrument', 'answers'],
      properties: {
        patient_id: { type: 'string', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' },
        instrument: { type: 'string', enum: ['AUDIT', 'DAST_10', 'CAGE', 'PHQ_9', 'GAD_7', 'ASSIST', 'CRAFFT'], description: 'Screening instrument to administer', example: 'AUDIT' },
        answers: { type: 'object', description: 'Map of question IDs to numeric answers', example: { q1: 2, q2: 1, q3: 0, q4: 3 } },
        clinical_notes: { type: 'string', description: 'Optional clinical notes from the specialist', example: 'Patient was cooperative. Responses consistent with mild alcohol use disorder.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Specialist-administered screening scored and saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post('administer')
  async administerScreening(
    @Body()
    body: {
      patient_id: string;
      instrument: ScreeningInstrumentType;
      answers: Record<string, number>;
      clinical_notes?: string;
    },
    @Request() req,
  ) {
    const result = await this.screeningService.administerScreening(
      body.patient_id,
      req.user.sub,
      body.instrument,
      body.answers,
      body.clinical_notes,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Get a screening by ID',
    description:
      'Retrieves the full details of a single screening result, including answers, scores, risk level, and any AI interpretation.',
  })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the screening',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Screening details returned' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get(':id')
  async getScreeningById(@Param('id') id: string, @Request() req) {
    const result = await this.screeningService.getScreeningById(
      id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Delete a screening',
    description:
      'Soft-deletes a screening result by setting the deleted_at timestamp. The record is retained for audit purposes but excluded from normal queries.',
  })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the screening to delete',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Screening soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Delete(':id')
  async deleteScreening(@Param('id') id: string, @Request() req) {
    const result = await this.screeningService.deleteScreening(
      id,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
