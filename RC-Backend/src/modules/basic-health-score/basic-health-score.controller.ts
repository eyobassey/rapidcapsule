import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BasicHealthScoreService } from './basic-health-score.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScoreChangeTrigger } from './entities/basic-health-score-history.entity';

@ApiTags('Basic Health Score')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('basic-health-score')
export class BasicHealthScoreController {
  constructor(private readonly basicHealthScoreService: BasicHealthScoreService) {}

  /**
   * Get current user's basic health score
   * GET /basic-health-score
   */
  @ApiOperation({ summary: 'Get current health score', description: 'Retrieve the current basic health score for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Basic health score returned' })
  @Get()
  async getCurrentScore(@Request() req) {
    const result = await this.basicHealthScoreService.getCurrentScore(req.user.sub);
    return sendSuccessResponse('Basic health score retrieved', result);
  }

  /**
   * Calculate and store the user's basic health score
   * POST /basic-health-score/calculate
   *
   * Call this when patient views their dashboard to ensure score is stored
   */
  @ApiOperation({ summary: 'Calculate health score', description: 'Calculate and store the basic health score based on profile completeness, vitals, checkups, and activity' })
  @ApiResponse({ status: 201, description: 'Health score calculated and stored' })
  @Post('calculate')
  async calculateAndStoreScore(@Request() req) {
    const result = await this.basicHealthScoreService.calculateAndStoreScore(
      req.user.sub,
      ScoreChangeTrigger.MANUAL_RECALCULATION,
      'Score calculated from patient dashboard',
    );
    return sendSuccessResponse('Basic health score calculated and stored', result);
  }

  /**
   * Get score history for the current user
   * GET /basic-health-score/history?page=1&limit=20
   */
  @ApiOperation({ summary: 'Get score history', description: 'Retrieve paginated health score history showing score changes over time' })
  @ApiResponse({ status: 200, description: 'Score history returned' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '20' })
  @Get('history')
  async getScoreHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.basicHealthScoreService.getScoreHistory(
      req.user.sub,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse('Score history retrieved', result);
  }
}
