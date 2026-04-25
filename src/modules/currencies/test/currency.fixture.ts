import { CurrencyResponseDto } from "../dto/currency-response.dto";
import { Currency } from "../entities/currency.entity";
import { CurrencyType } from "../enums/currency-type.enum";

export const mockCurrency: Currency = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'BTC',
  name: 'Bitcoin',
  symbol: '₿',
  type: CurrencyType.CRYPTO,
  decimals: 8,
  createdAt: new Date('2026-04-24T10:00:00Z'),
  updatedAt: new Date('2026-04-24T10:00:00Z'),
};

export const mockCurrencyResponse: CurrencyResponseDto = {
  id: mockCurrency.id,
  code: mockCurrency.code,
  name: mockCurrency.name,
  symbol: mockCurrency.symbol,
  type: mockCurrency.type,
  decimals: mockCurrency.decimals,
  createdAt: mockCurrency.createdAt,
  updatedAt: mockCurrency.updatedAt,
};