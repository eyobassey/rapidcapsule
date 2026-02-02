import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Bank, BankDocument } from './entities/bank.entity';
import { Model, Types } from 'mongoose';
import { Paystack } from '../../common/external/payment/providers/paystack';
import { SUCCESS } from '../../core/constants';
import {
  create,
  deleteOne,
  find,
  findOne,
  updateOneAndReturn,
} from '../../common/crud/crud';
import { Messages } from '../../core/messages/messages';
import { ResolveAccountDto } from './dto/resolve-account.dto';
import * as Banks from '../banks/json/banks.json';

@Injectable()
export class BanksService {
  constructor(
    @InjectModel(Bank.name) private bankModel: Model<BankDocument>,
    private readonly paystack: Paystack,
  ) {}
  async createBank(createBankDto: CreateBankDto, userId: Types.ObjectId) {
    const { account_number, account_name, bank_name, recipient_type } =
      createBankDto;

    let recipient_code = null;

    // Try to create Paystack transfer recipient, but don't fail if it doesn't work
    try {
      const response = await this.paystack.createTransferRecipient({
        name: account_name,
        account_number,
        bank_name,
        type: recipient_type,
      });
      if (response.status === SUCCESS) {
        recipient_code = response.data.data.recipient_code;
      }
    } catch (error) {
      // Log error but continue - allow saving bank without Paystack validation
      console.warn('Paystack createTransferRecipient failed:', error.message);
    }

    // Save bank account regardless of Paystack validation
    return await create(this.bankModel, {
      ...createBankDto,
      recipient_code,
      userId,
    });
  }

  async getUserBanks(userId: Types.ObjectId) {
    return await find(this.bankModel, { userId });
  }

  async getBank(bankId: Types.ObjectId) {
    const bank = await findOne(this.bankModel, { _id: bankId });
    if (!bank) throw new NotFoundException(Messages.BANK_NOT_FOUND);
    return bank;
  }

  makeBankAccountDefault(bankId: Types.ObjectId) {
    return updateOneAndReturn(
      this.bankModel,
      { _id: bankId },
      { is_default: true },
    );
  }

  async deleteBankAccount(bankId: Types.ObjectId) {
    return await deleteOne(this.bankModel, { _id: bankId });
  }

  async getUserDefaultBank(userId: Types.ObjectId) {
    const bank = await findOne(this.bankModel, { userId, is_default: true });
    if (!bank) throw new NotFoundException(Messages.NOT_FOUND_DEFAULT_BANK);
    return bank;
  }

  async resolveAccount(resolveAccountDto: ResolveAccountDto) {
    const { account_number, bank_code } = resolveAccountDto;
    const response = await this.paystack.resolveAccount(
      account_number,
      bank_code,
    );
    if (response.status === SUCCESS) {
      return response.data?.data;
    }
    return null;
  }

  async listBanks() {
    return Banks.map(({ name, code, currency, type, country }) => ({
      name,
      code,
      currency,
      type,
      country,
    }));
  }
}
