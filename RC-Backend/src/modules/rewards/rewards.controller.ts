import { Controller, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @ApiOperation({ summary: 'Get total rewards', description: 'Retrieve total reward points accumulated by the authenticated user' })
  @ApiResponse({ status: 200, description: 'Total rewards returned' })
  @Get()
  async getUserTotalRewards(@Request() req) {
    const result = await this.rewardsService.getUserTotalRewards(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get earned rewards', description: 'Retrieve detailed list of all rewards earned by the authenticated user' })
  @ApiResponse({ status: 200, description: 'Earned rewards list returned' })
  @Get('list')
  async getUserRewards(@Request() req) {
    const result = await this.rewardsService.getUserEarnedRewards(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
