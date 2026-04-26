import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletMapper } from './mappers/wallet.mapper';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    CurrenciesModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, WalletMapper],
  exports: [WalletsService, WalletMapper],
})
export class WalletsModule {}
