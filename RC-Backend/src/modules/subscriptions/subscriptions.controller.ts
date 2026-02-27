import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { VerifySubTransactionDto } from './dto/verify-sub-transaction.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'Create subscription', description: 'Subscribe to a plan by selecting a plan, payment card, and billing recurrence. Initiates the first charge.' })
  @ApiResponse({ status: 201, description: 'Subscription created and first payment initiated' })
  @ApiResponse({ status: 400, description: 'Invalid plan, card, or recurrence' })
  @Post()
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req,
  ) {
    const result = await this.subscriptionsService.subscribeToPlan(
      createSubscriptionDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Verify subscription payment', description: 'Verify a Paystack payment reference for a subscription transaction and activate the subscription' })
  @ApiResponse({ status: 200, description: 'Payment verified and subscription activated' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @HttpCode(HttpStatus.OK)
  @Post('transactions/verify')
  async verifyTransaction(
    @Body() verifySubTransactionDto: VerifySubTransactionDto,
  ) {
    const { reference, subscriptionId } = verifySubTransactionDto;
    const result = await this.subscriptionsService.verifySubscription(
      reference,
      subscriptionId,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Get user subscriptions', description: 'Retrieve all subscriptions (active, expired, cancelled) for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Subscriptions returned' })
  @Get()
  async getUserSubscriptions(@Request() req) {
    const result = await this.subscriptionsService.getUserSubscriptions(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get active subscription', description: 'Retrieve the currently active subscription for the authenticated user, if any' })
  @ApiResponse({ status: 200, description: 'Active subscription returned (or null if none)' })
  @Get('active')
  async getActiveSubscription(@Request() req) {
    const result = await this.subscriptionsService.getActiveSubscription(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Cancel subscription', description: 'Cancel an active subscription. The subscription remains active until the current billing period ends.' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch('cancel')
  async cancelSubscription(
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
    @Request() req,
  ) {
    const result = await this.subscriptionsService.cancelSubscription(
      cancelSubscriptionDto.subscriptionId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
