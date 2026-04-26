import { Injectable } from '@nestjs/common';
import { Wallet } from '../entities/wallet.entity';
import { WalletResponseDto } from '../dto/wallet-response.dto';

@Injectable()
export class WalletMapper {
  toResponseDto(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      balance: wallet.balance.toString(),
      currency: {
        id: wallet.currency.id,
        code: wallet.currency.code,
        name: wallet.currency.name,
        symbol: wallet.currency.symbol,
        type: wallet.currency.type,
        decimals: wallet.currency.decimals,
        createdAt: wallet.currency.createdAt,
        updatedAt: wallet.currency.updatedAt,
      },
      userId: wallet.userId,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  toResponseDtoArray(wallets: Wallet[]): WalletResponseDto[] {
    return wallets.map((wallet) => this.toResponseDto(wallet));
  }
}