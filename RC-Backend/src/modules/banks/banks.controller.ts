import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { MakeBankDefaultDto } from './dto/make-bank-default.dto';
import { DeleteBankDto } from './dto/delete-bank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResolveAccountDto } from './dto/resolve-account.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Banks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @ApiOperation({ summary: 'Add bank account', description: 'Add a new bank account for withdrawals. Verifies account via Paystack and creates a transfer recipient.' })
  @ApiResponse({ status: 201, description: 'Bank account added and verified' })
  @ApiResponse({ status: 400, description: 'Invalid account details or verification failed' })
  @Post()
  async createBankAccount(
    @Body() createBankDto: CreateBankDto,
    @Request() req,
  ) {
    const result = await this.banksService.createBank(
      createBankDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get user bank accounts', description: 'Retrieve all saved bank accounts for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Bank accounts returned' })
  @Get()
  async getUserBanks(@Request() req) {
    const result = await this.banksService.getUserBanks(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'List Nigerian banks', description: 'Retrieve the full list of Nigerian banks supported by Paystack for transfers' })
  @ApiResponse({ status: 200, description: 'Bank list returned' })
  @Get('list')
  async listBanks() {
    const result = await this.banksService.listBanks();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get default bank account', description: 'Retrieve the default bank account used for withdrawals' })
  @ApiResponse({ status: 200, description: 'Default bank account returned' })
  @ApiResponse({ status: 404, description: 'No default bank account set' })
  @Get('default')
  async getUserDefaultBank(@Request() req) {
    const result = await this.banksService.getUserDefaultBank(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Set default bank account', description: 'Set a saved bank account as the default for withdrawals' })
  @ApiResponse({ status: 200, description: 'Bank account set as default' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  @Patch('default')
  async makeBankAccountDefault(@Body() makeBankDefaultDto: MakeBankDefaultDto) {
    const result = await this.banksService.makeBankAccountDefault(
      makeBankDefaultDto.bankId,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Delete bank account', description: 'Remove a saved bank account from the user profile' })
  @ApiResponse({ status: 200, description: 'Bank account deleted' })
  @ApiResponse({ status: 404, description: 'Bank account not found' })
  @Delete(':id')
  async deleteBankAccount(@Body() deleteBankDto: DeleteBankDto) {
    const result = await this.banksService.deleteBankAccount(
      deleteBankDto.bankId,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Resolve bank account', description: 'Verify a bank account number and retrieve the account holder name via Paystack' })
  @ApiResponse({ status: 200, description: 'Account resolved with holder name' })
  @ApiResponse({ status: 400, description: 'Invalid account number or bank code' })
  @Post('resolve-account')
  async resolveAccount(@Body() resolveAccountDto: ResolveAccountDto) {
    const result = await this.banksService.resolveAccount(resolveAccountDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
