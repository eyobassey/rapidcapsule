import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { SpecialistWalletService } from './specialist-wallet.service';
import { SpecialistWalletController } from './specialist-wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './entities/wallet-transactions.entity';
import {
  SpecialistWallet,
  SpecialistWalletSchema,
} from './entities/specialist-wallet.entity';
import {
  SpecialistWalletTransaction,
  SpecialistWalletTransactionSchema,
} from './entities/specialist-wallet-transaction.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { BanksModule } from '../banks/banks.module';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { Paystack } from '../../common/external/payment/providers/paystack';

@Module({
  imports: [
    BanksModule,
    AdminSettingsModule,
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: SpecialistWallet.name, schema: SpecialistWalletSchema },
      {
        name: SpecialistWalletTransaction.name,
        schema: SpecialistWalletTransactionSchema,
      },
    ]),
  ],
  controllers: [WalletsController, SpecialistWalletController],
  providers: [
    WalletsService,
    SpecialistWalletService,
    GeneralHelpers,
    PaymentHandler,
    Paystack,
  ],
  exports: [WalletsService, SpecialistWalletService],
})
export class WalletsModule {}
