import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BasicHealthScoreService } from './basic-health-score.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScoreChangeTrigger } from './entities/basic-health-score-history.entity';

@UseGuards(JwtAuthGuard)
@Controller('basic-health-score')
export class BasicHealthScoreController {
  constructor(private readonly basicHealthScoreService: BasicHealthScoreService) {}

  /**
   * Get current user's basic health score
   * GET /basic-health-score
   */
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
