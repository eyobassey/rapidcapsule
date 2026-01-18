import {
  Controller,
  Get,
  Body,
  Request,
  UseGuards,
  Post,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WithdrawFundDto } from './dto/withdraw-wallet-fund.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  async getWalletBalance(@Request() req) {
    const result = await this.walletsService.getUserEarnings(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get()
  async getUserWalletTransaction(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.walletsService.getWalletTransactions(
      req.user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('withdraw')
  async withdrawFromWallet(
    @Body() withdrawFundDto: WithdrawFundDto,
    @Request() req,
  ) {
    const result = await this.walletsService.withdrawFromWallet(
      withdrawFundDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.WITHDRAW_SUCCESSFUL, result);
  }
}
