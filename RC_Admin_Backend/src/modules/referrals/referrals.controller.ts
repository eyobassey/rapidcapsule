import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { UpdateReferralSettingsDto } from './dto/update-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // Get all referrals with pagination
  @Get()
  async getAllReferrals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'total_signups',
  ) {
    const result = await this.referralsService.getAllReferrals(
      parseInt(page),
      parseInt(limit),
      search,
      sortBy,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // Get referral analytics
  @Get('analytics')
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.referralsService.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // Get settings
  @Get('settings')
  async getSettings() {
    const result = await this.referralsService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // Update settings
  @Patch('settings')
  async updateSettings(@Body() updateDto: UpdateReferralSettingsDto, @Request() req) {
    const result = await this.referralsService.updateSettings(updateDto, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // Get recent clicks
  @Get('clicks')
  async getRecentClicks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const result = await this.referralsService.getRecentClicks(parseInt(page), parseInt(limit));
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // Get specific referral by ID
  @Get(':id')
  async getReferralById(@Param('id') id: string) {
    const result = await this.referralsService.getReferralById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // Get user's referral details
  @Get('user/:userId')
  async getUserReferralDetails(@Param('userId') userId: string) {
    const result = await this.referralsService.getUserReferralDetails(userId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
