import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Res,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { UpdateReferralsDto } from './dto/update-referrals.dto';
import { TrackShareDto } from './dto/track-share.dto';
import { ClickSource } from './entities/referral-click.entity';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @ApiOperation({ summary: 'Create referral code', description: 'Generate a unique referral code for the authenticated user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Referral code created' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createReferral(@Request() req) {
    const firstName = req.user?.profile?.first_name;
    const lastName = req.user?.profile?.last_name;
    const result = await this.referralsService.createReferral(req.user.sub, firstName, lastName);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Apply referral code', description: 'Apply a referral code to link a new user to their referrer' })
  @ApiResponse({ status: 200, description: 'Referral applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid referral code' })
  @Patch()
  async updateReferrals(@Body() updateReferralsDto: UpdateReferralsDto) {
    const { referral_code, referee } = updateReferralsDto;
    const result = await this.referralsService.updateReferrals(referee, referral_code);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Get my referral code', description: 'Retrieve the referral code and stats for the authenticated user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Referral code and info returned' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserReferralCode(@Request() req) {
    const firstName = req.user?.profile?.first_name;
    const lastName = req.user?.profile?.last_name;
    const result = await this.referralsService.getUserReferral(req.user.sub, firstName, lastName);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get referral stats', description: 'Retrieve referral statistics including total referrals, successful signups, and rewards earned' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Referral statistics returned' })
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getUserStats(@Request() req) {
    const result = await this.referralsService.getUserStats(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get share messages', description: 'Retrieve pre-formatted referral share messages for different platforms' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Share messages returned' })
  @UseGuards(JwtAuthGuard)
  @Get('share-messages')
  async getShareMessages(@Request() req) {
    const result = await this.referralsService.getShareMessages(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get referral settings', description: 'Retrieve global referral program settings and reward configuration' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Referral settings returned' })
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings() {
    const result = await this.referralsService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Track referral share', description: 'Track when a user shares their referral link on a specific platform' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Share tracked successfully' })
  @UseGuards(JwtAuthGuard)
  @Post('track-share')
  async trackShare(@Request() req, @Body() trackShareDto: TrackShareDto) {
    const result = await this.referralsService.trackShare(req.user.sub, trackShareDto.platform);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Get referral by code', description: 'Retrieve referral information by referral code (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Referral information returned' })
  @ApiResponse({ status: 404, description: 'Referral code not found' })
  @ApiParam({ name: 'code', description: 'Referral code', example: 'ADAEZE-RC2025' })
  @Get(':code')
  async getReferralByCode(@Param('code') code: string) {
    const result = await this.referralsService.getReferralByCode(code);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}

// Separate controller for public referral link redirect (no auth required)
@ApiTags('Referrals')
@Controller('r')
export class ReferralRedirectController {
  constructor(private readonly referralsService: ReferralsService) {}

  @ApiOperation({ summary: 'Redirect referral link', description: 'Handle referral link click, track the click source, and redirect to signup page' })
  @ApiResponse({ status: 302, description: 'Redirects to signup page with referral code' })
  @ApiParam({ name: 'code', description: 'Referral code', example: 'ADAEZE-RC2025' })
  @ApiQuery({ name: 'src', required: false, description: 'Click source platform', example: 'wa' })
  @Get(':code')
  async handleReferralRedirect(
    @Param('code') code: string,
    @Query('src') source: string,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // Map source query param to ClickSource
    const sourceMap: Record<string, ClickSource> = {
      wa: ClickSource.WHATSAPP,
      whatsapp: ClickSource.WHATSAPP,
      fb: ClickSource.FACEBOOK,
      facebook: ClickSource.FACEBOOK,
      tw: ClickSource.TWITTER,
      twitter: ClickSource.TWITTER,
      li: ClickSource.LINKEDIN,
      linkedin: ClickSource.LINKEDIN,
      em: ClickSource.EMAIL,
      email: ClickSource.EMAIL,
    };

    const clickSource = sourceMap[source?.toLowerCase()] || ClickSource.DIRECT;

    // Track the click
    await this.referralsService.trackClick(code, clickSource, ip, userAgent);

    // Redirect to signup page with referral code
    const signupUrl = `https://rapidcapsule.com/signup/patient?ref=${code}`;
    return res.redirect(302, signupUrl);
  }
}
