import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecoveryProfileService } from '../services/recovery-profile.service';
import { CreateRecoveryProfileDto } from '../dto/create-recovery-profile.dto';
import { AddSubstancesDto } from '../dto/add-substance.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { RecoveryStatus } from '../entities/recovery-profile.entity';

@ApiTags('Recovery - Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/profile')
export class RecoveryProfileController {
  constructor(
    private readonly profileService: RecoveryProfileService,
  ) {}

  @ApiOperation({
    summary: 'Create a recovery profile',
    description:
      'Creates a new recovery profile for the authenticated patient, including substance use history, sobriety start date, care level, and consent preferences. Only one active profile is allowed per patient.',
  })
  @ApiResponse({ status: 201, description: 'Recovery profile created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or profile already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post()
  async createProfile(
    @Body() dto: CreateRecoveryProfileDto,
    @Request() req,
  ) {
    const result = await this.profileService.createProfile(
      dto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Get recovery profile',
    description:
      'Retrieves the authenticated patient\'s active recovery profile, including substance use history, sobriety data, care team, risk level, and outcomes.',
  })
  @ApiResponse({ status: 200, description: 'Recovery profile returned' })
  @ApiResponse({ status: 404, description: 'No active recovery profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get()
  async getProfile(@Request() req) {
    const result = await this.profileService.getProfile(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get recovery dashboard',
    description:
      'Returns an aggregated dashboard view with key recovery metrics: current sobriety streak, risk level, recent screening scores, upcoming milestones, and daily log summary.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data returned' })
  @ApiResponse({ status: 404, description: 'No active recovery profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const result = await this.profileService.getDashboardData(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get past recovery programmes',
    description:
      'Retrieves a list of the patient\'s archived recovery programmes, useful for reviewing previous treatment history and outcomes.',
  })
  @ApiResponse({ status: 200, description: 'List of past programmes returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('past-programmes')
  async getPastProgrammes(@Request() req) {
    const result = await this.profileService.getPastProgrammes(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Archive current profile and re-enrol',
    description:
      'Archives the patient\'s current recovery profile and creates a new one. This is used when a patient completes a programme or needs to restart with updated substance history.',
  })
  @ApiResponse({ status: 201, description: 'Previous profile archived and new profile created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'No active recovery profile to archive' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Post('archive-and-reenrol')
  async archiveAndReenrol(
    @Body() dto: CreateRecoveryProfileDto,
    @Request() req,
  ) {
    const result = await this.profileService.archiveAndReenrol(
      req.user.sub,
      dto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Add substances to profile',
    description:
      'Adds one or more new substance history entries to the patient\'s active recovery profile without replacing existing entries.',
  })
  @ApiResponse({ status: 200, description: 'Substances added to the recovery profile' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'No active recovery profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Patch('substances')
  async addSubstances(
    @Body() dto: AddSubstancesDto,
    @Request() req,
  ) {
    const result = await this.profileService.addSubstances(
      req.user.sub,
      dto.substances,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Update recovery status',
    description:
      'Updates the status of the patient\'s recovery profile (e.g. active, paused, completed, withdrawn). An optional reason can be provided for the status change.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: Object.values(RecoveryStatus),
          description: 'The new recovery status',
          example: RecoveryStatus.PAUSED,
        },
        reason: {
          type: 'string',
          description: 'Optional reason for the status change',
          example: 'Patient requested a break due to family emergency',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Recovery status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 404, description: 'No active recovery profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Patch('status')
  async updateStatus(
    @Body() body: { status: RecoveryStatus; reason?: string },
    @Request() req,
  ) {
    const result = await this.profileService.updateStatus(
      req.user.sub,
      body.status,
      body.reason,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Update a consent preference',
    description:
      'Updates a single consent flag on the patient\'s recovery profile. The consent key identifies which consent to update, and the given flag sets the new value. The patient\'s IP address is recorded for audit purposes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['consent_key', 'given'],
      properties: {
        consent_key: {
          type: 'string',
          description: 'The consent key to update',
          example: 'ai_companion_consent',
        },
        given: {
          type: 'boolean',
          description: 'Whether the consent is granted or revoked',
          example: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Consent preference updated' })
  @ApiResponse({ status: 400, description: 'Invalid consent key' })
  @ApiResponse({ status: 404, description: 'No active recovery profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Patch('consent')
  async updateConsent(
    @Body() body: { consent_key: string; given: boolean },
    @Request() req,
    @Ip() ip: string,
  ) {
    const result = await this.profileService.updateConsent(
      req.user.sub,
      body.consent_key,
      body.given,
      ip,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
