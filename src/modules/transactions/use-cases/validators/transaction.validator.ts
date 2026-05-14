import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { Wallet } from '../../../wallets/entities/wallet.entity';
import {
  InsufficientFundsException,
  WalletNotActiveException,
  CurrencyMismatchException,
} from '../../../../shared/domain/exceptions';

@Injectable()
export class TransactionValidator {
  assertWalletActive(wallet: Wallet): void {
    if (wallet.deletedAt) {
      throw new WalletNotActiveException();
    }
  }

  assertSameCurrency(source: Wallet, target: Wallet): void {
    if (source.currencyId !== target.currencyId) {
      throw new CurrencyMismatchException();
    }
  }

  assertSufficientFunds(wallet: Wallet, amount: Decimal): void {
    if (!wallet.canAfford(amount)) {
      throw new InsufficientFundsException();
    }
  }
}
