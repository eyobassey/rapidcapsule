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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { UpdateReferralSettingsDto } from './dto/update-settings.dto';

@ApiTags('Admin Referrals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @ApiOperation({ summary: 'List all referrals', description: 'Retrieve paginated list of all referral records with search and sorting' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by user name or email' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'total_signups' })
  @ApiResponse({ status: 200, description: 'Paginated referral list returned' })
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

  @Get('analytics')
  @ApiOperation({ summary: 'Get referral analytics', description: 'Retrieve referral programme analytics and conversion statistics' })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Referral analytics returned' })
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

  @Get('settings')
  @ApiOperation({ summary: 'Get referral settings', description: 'Retrieve current referral programme configuration and reward settings' })
  @ApiResponse({ status: 200, description: 'Referral settings returned' })
  async getSettings() {
    const result = await this.referralsService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update referral settings', description: 'Update referral programme rewards, share messages, milestones, and configuration' })
  @ApiResponse({ status: 200, description: 'Referral settings updated' })
  async updateSettings(@Body() updateDto: UpdateReferralSettingsDto, @Request() req) {
    const result = await this.referralsService.updateSettings(updateDto, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get('clicks')
  @ApiOperation({ summary: 'Get recent referral clicks', description: 'Retrieve recent referral link click activity' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiResponse({ status: 200, description: 'Recent click data returned' })
  async getRecentClicks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const result = await this.referralsService.getRecentClicks(parseInt(page), parseInt(limit));
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get referral by ID', description: 'Retrieve a specific referral record' })
  @ApiParam({ name: 'id', description: 'Referral ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Referral details returned' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async getReferralById(@Param('id') id: string) {
    const result = await this.referralsService.getReferralById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user referral details', description: 'Retrieve referral details for a specific user including their referral code and stats' })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'User referral details returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserReferralDetails(@Param('userId') userId: string) {
    const result = await this.referralsService.getUserReferralDetails(userId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
