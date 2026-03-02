import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MATProtocolService } from '../services/mat-protocol.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - MAT Protocol')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/mat')
export class MATProtocolController {
  constructor(private readonly matService: MATProtocolService) {}

  @ApiOperation({
    summary: 'List MAT medications',
    description:
      'Returns all MAT medications in the drug catalog with optional filtering by target condition.',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    description: 'Filter by target condition (e.g., opioid_use_disorder)',
  })
  @ApiResponse({ status: 200, description: 'MAT medications returned' })
  @Get('medications')
  async getMedications(@Query('condition') condition: string) {
    const result = await this.matService.getMATMedications(condition);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get MAT protocol for a drug',
    description:
      'Returns the full MAT protocol details for a specific medication including tapering schedule, monitoring requirements, and contraindications.',
  })
  @ApiParam({ name: 'drugId', description: 'Drug ID' })
  @ApiResponse({ status: 200, description: 'MAT protocol returned' })
  @ApiResponse({ status: 404, description: 'MAT medication not found' })
  @Get('medications/:drugId/protocol')
  async getProtocol(@Param('drugId') drugId: string) {
    const result = await this.matService.getMATProtocol(drugId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Check patient MAT eligibility',
    description:
      'Checks if a patient is eligible for MAT with a specific medication. Returns blockers and warnings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Eligibility result with blockers/warnings',
  })
  @Post('eligibility')
  async checkEligibility(
    @Body() body: { patient_id: string; drug_id: string },
    @Request() req,
  ) {
    const result = await this.matService.checkPatientEligibility(
      body.patient_id,
      body.drug_id,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Verify specialist MAT authorization',
    description:
      'Checks if the authenticated specialist has the required MAT prescribing waiver.',
  })
  @ApiResponse({ status: 200, description: 'Authorization status returned' })
  @Get('authorization')
  async checkAuthorization(@Request() req) {
    const result = await this.matService.verifySpecialistAuthorization(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Check drug interactions',
    description:
      "Checks for critical drug interactions between a MAT medication and the patient's current prescriptions.",
  })
  @ApiResponse({
    status: 200,
    description: 'Drug interactions list returned',
  })
  @Post('interactions')
  async checkInteractions(
    @Body() body: { patient_id: string; drug_id: string },
  ) {
    const result = await this.matService.checkDrugInteractions(
      body.patient_id,
      body.drug_id,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Generate tapering schedule',
    description:
      'Generates a gradual dose reduction schedule for a MAT medication.',
  })
  @ApiResponse({ status: 200, description: 'Tapering schedule generated' })
  @Post('tapering-schedule')
  async generateTaperingSchedule(
    @Body()
    body: {
      drug_id: string;
      current_dose: string;
      target_dose: string;
      weeks_duration: number;
    },
  ) {
    const result = this.matService.generateTaperingSchedule(
      body.drug_id,
      body.current_dose,
      body.target_dose,
      body.weeks_duration,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get patient MAT compliance summary',
    description:
      "Returns the patient's MAT compliance status including active prescriptions, screening compliance, and outcomes.",
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance summary returned',
  })
  @ApiResponse({ status: 404, description: 'Recovery profile not found' })
  @Get('compliance')
  async getCompliance(@Request() req) {
    const result = await this.matService.getComplianceSummary(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get patient MAT compliance (specialist view)',
    description:
      'Returns MAT compliance summary for a specific patient. For specialist use.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient user ID' })
  @ApiResponse({ status: 200, description: 'Compliance summary returned' })
  @Get('compliance/:patientId')
  async getPatientCompliance(@Param('patientId') patientId: string) {
    const result = await this.matService.getComplianceSummary(patientId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get naloxone co-prescription suggestion',
    description:
      'Returns naloxone co-prescription recommendation and available products for a MAT medication.',
  })
  @ApiParam({ name: 'drugId', description: 'MAT Drug ID' })
  @ApiResponse({
    status: 200,
    description: 'Naloxone suggestion returned',
  })
  @Get('medications/:drugId/naloxone-suggestion')
  async getNaloxoneSuggestion(@Param('drugId') drugId: string) {
    const result = await this.matService.getNaloxoneSuggestion(drugId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
