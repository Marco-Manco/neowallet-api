import { Decimal } from "decimal.js";
import { WalletResponseDto } from "../dto/wallet-response.dto";
import { Wallet } from "../entities/wallet.entity";
import { CurrencyType } from "../../currencies/enums/currency-type.enum";

export const mockCurrency = {
  id: 'currency-uuid-123',
  code: 'ARS',
  name: 'Argentine Peso',
  symbol: '$',
  type: CurrencyType.FIAT, 
  decimals: 2,             
  createdAt: new Date('2026-04-25T10:00:00Z'), 
  updatedAt: new Date('2026-04-25T10:00:00Z'), 
} as any; 

export const mockZeroBalance = new Decimal(0);
export const mockNonZeroBalance = new Decimal(100);

export const mockWallet = {
  id: 'wallet-uuid-123',
  userId: 'user-uuid-123',
  currencyId: mockCurrency.id,
  balance: mockZeroBalance,
  currency: mockCurrency,
  createdAt: new Date('2026-04-25T10:00:00Z'),
  updatedAt: new Date('2026-04-25T10:00:00Z'),
} as Wallet;

export const mockWalletResponse: WalletResponseDto = {
  id: mockWallet.id,
  userId: mockWallet.userId,
  balance: '0',
  currency: {
    id: mockCurrency.id,
    code: mockCurrency.code,
    name: mockCurrency.name,
    symbol: mockCurrency.symbol,
    type: mockCurrency.type,
    decimals: mockCurrency.decimals,
    createdAt: mockCurrency.createdAt,
    updatedAt: mockCurrency.updatedAt,
  },
  createdAt: mockWallet.createdAt,
  updatedAt: mockWallet.updatedAt,
};