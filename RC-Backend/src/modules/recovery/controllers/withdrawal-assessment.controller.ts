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
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WithdrawalAssessmentService } from '../services/withdrawal-assessment.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Withdrawal Assessment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/withdrawal')
export class WithdrawalAssessmentController {
  constructor(
    private readonly withdrawalService: WithdrawalAssessmentService,
  ) {}

  @ApiOperation({
    summary: 'List available withdrawal scales',
    description:
      'Returns metadata for all available clinician-administered withdrawal assessment scales (COWS, CIWA-Ar).',
  })
  @ApiResponse({ status: 200, description: 'List of available scales' })
  @Get('scales')
  async getAvailableScales() {
    const result = this.withdrawalService.getAvailableScales();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get scale definition',
    description:
      'Returns the full scale definition including all items, options, and scoring zones. Used to render the assessment form.',
  })
  @ApiParam({
    name: 'scaleId',
    description: 'Scale identifier (cows or ciwa_ar)',
    example: 'cows',
  })
  @ApiResponse({ status: 200, description: 'Scale definition returned' })
  @ApiResponse({ status: 404, description: 'Scale not found' })
  @Get('scales/:scaleId')
  async getScaleDefinition(@Param('scaleId') scaleId: string) {
    const result = this.withdrawalService.getScaleDefinition(scaleId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Administer withdrawal assessment',
    description:
      'Submit a completed withdrawal assessment for a patient. Specialist-only. Calculates total score, determines severity zone, and persists the record.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['patient_id', 'scale_id', 'responses'],
      properties: {
        patient_id: {
          type: 'string',
          description: 'The patient being assessed',
        },
        scale_id: {
          type: 'string',
          enum: ['cows', 'ciwa_ar'],
          description: 'The withdrawal scale to use',
        },
        responses: {
          type: 'array',
          description: 'Array of item responses',
          items: {
            type: 'object',
            properties: {
              item_id: { type: 'string' },
              value: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Assessment scored and saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post('administer')
  async administer(
    @Body()
    body: {
      patient_id: string;
      scale_id: string;
      responses: Array<{ item_id: string; value: number }>;
    },
    @Request() req,
  ) {
    const result = await this.withdrawalService.administer(
      body.patient_id,
      req.user.sub,
      body.scale_id,
      body.responses,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Get withdrawal assessment history',
    description:
      'Returns paginated history of withdrawal assessments for a patient. Optionally filter by scale type.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'Patient ID',
  })
  @ApiQuery({
    name: 'scale_id',
    required: false,
    description: 'Filter by scale type (cows or ciwa_ar)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Assessment history returned' })
  @Get('history/:patientId')
  async getHistory(
    @Param('patientId') patientId: string,
    @Query('scale_id') scaleId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.withdrawalService.getHistory(
      patientId,
      scaleId || undefined,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
