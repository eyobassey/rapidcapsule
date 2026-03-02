import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecoveryEnrolledGuard } from '../guards/recovery-enrolled.guard';
import { RiskScoringService } from '../services/risk-scoring.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Relapse Risk')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RecoveryEnrolledGuard)
@Controller('recovery/risk')
export class RelapseRiskController {
  constructor(private readonly riskScoringService: RiskScoringService) {}

  @ApiOperation({
    summary: 'Get current risk score',
    description:
      'Returns the current relapse risk score with a full signal breakdown for the authenticated patient. This reads the latest persisted score and does not trigger a recalculation.',
  })
  @ApiResponse({ status: 200, description: 'Current risk score and signal breakdown returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 403, description: 'No active recovery profile' })
  @Get('current')
  async getCurrentRisk(@Request() req) {
    const result = await this.riskScoringService.getRiskBreakdown(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get risk score history',
    description:
      'Returns historical risk scores for charting. Supports period filtering (7d, 30d, 90d) and pagination via limit.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d'],
    description: 'Time period filter (default: 30d)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of history entries (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Risk history entries returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 403, description: 'No active recovery profile' })
  @Get('history')
  async getRiskHistory(
    @Query('period') period: '7d' | '30d' | '90d',
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.riskScoringService.getRiskHistory(
      req.user.sub,
      parseInt(limit) || 30,
      period || '30d',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Force recalculate risk score',
    description:
      'Triggers an immediate recalculation of the risk score and persists the result. Use sparingly — the system auto-recalculates daily and on key events.',
  })
  @ApiResponse({ status: 200, description: 'Risk score recalculated and persisted' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 403, description: 'No active recovery profile' })
  @Post('recalculate')
  async recalculateRisk(@Request() req) {
    const result = await this.riskScoringService.calculateAndPersistRisk(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Get detailed risk signal breakdown',
    description:
      'Returns a categorised breakdown of all risk signals with their individual scores, trends, and contributing factors. Useful for understanding what is driving the current risk level.',
  })
  @ApiResponse({ status: 200, description: 'Detailed signal breakdown returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised' })
  @ApiResponse({ status: 403, description: 'No active recovery profile' })
  @Get('signals')
  async getRiskSignals(@Request() req) {
    const result = await this.riskScoringService.getRiskBreakdown(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, {
      signals: result.signals,
      top_factors: result.top_factors,
      trend: result.trend,
    });
  }
}
