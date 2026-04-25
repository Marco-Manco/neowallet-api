import { Injectable } from '@nestjs/common';
import { CurrencyResponseDto } from '../dto/currency-response.dto';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyMapper {
  toResponseDto(currency: Currency): CurrencyResponseDto {
    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      type: currency.type,
      decimals: currency.decimals,
      createdAt: currency.createdAt,
      updatedAt: currency.updatedAt,
    };
  }

  toResponseDtoArray(currencies: Currency[]): CurrencyResponseDto[] {
    return currencies.map((currency) => this.toResponseDto(currency));
  }
}