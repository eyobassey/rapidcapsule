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
import { Response } from 'express';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { UpdateReferralsDto } from './dto/update-referrals.dto';
import { TrackShareDto } from './dto/track-share.dto';
import { ClickSource } from './entities/referral-click.entity';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReferral(@Request() req) {
    const firstName = req.user?.profile?.first_name;
    const lastName = req.user?.profile?.last_name;
    const result = await this.referralsService.createReferral(req.user.sub, firstName, lastName);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Patch()
  async updateReferrals(@Body() updateReferralsDto: UpdateReferralsDto) {
    const { referral_code, referee } = updateReferralsDto;
    const result = await this.referralsService.updateReferrals(referee, referral_code);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserReferralCode(@Request() req) {
    const firstName = req.user?.profile?.first_name;
    const lastName = req.user?.profile?.last_name;
    const result = await this.referralsService.getUserReferral(req.user.sub, firstName, lastName);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getUserStats(@Request() req) {
    const result = await this.referralsService.getUserStats(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('share-messages')
  async getShareMessages(@Request() req) {
    const result = await this.referralsService.getShareMessages(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings() {
    const result = await this.referralsService.getSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('track-share')
  async trackShare(@Request() req, @Body() trackShareDto: TrackShareDto) {
    const result = await this.referralsService.trackShare(req.user.sub, trackShareDto.platform);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get(':code')
  async getReferralByCode(@Param('code') code: string) {
    const result = await this.referralsService.getReferralByCode(code);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}

// Separate controller for public referral link redirect (no auth required)
@Controller('r')
export class ReferralRedirectController {
  constructor(private readonly referralsService: ReferralsService) {}

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
