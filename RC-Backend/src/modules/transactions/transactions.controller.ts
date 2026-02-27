import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { VerifyTransactionDto } from './dto/verify-transaction.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Verify transaction', description: 'Verify a Paystack payment transaction by reference' })
  @ApiResponse({ status: 200, description: 'Transaction verified' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @Post('verify')
  async verifyTransaction(@Body() verifyTransactionDto: VerifyTransactionDto) {
    const result = await this.transactionsService.verifyTransaction(
      verifyTransactionDto.reference,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }
}
