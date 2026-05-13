import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Decimal } from 'decimal.js';
import { IPriceProvider } from '../interfaces/price-provider.interface';

@Injectable()
export class CryptoProvider implements IPriceProvider {
  private readonly logger = new Logger(CryptoProvider.name);
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('BINANCE_API_URL');
  }

  supports(fromCurrency: string, toCurrency: string): boolean {
    const cryptos = ['BTC', 'ETH', 'USDT'];
    return cryptos.includes(fromCurrency.toUpperCase()) && cryptos.includes(toCurrency.toUpperCase());
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<Decimal> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    const symbol = `${from}${to}`;
    const reverseSymbol = `${to}${from}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}?symbol=${symbol}`),
      );
      return new Decimal(data.price);
    } catch (error) {
      try {
        const { data } = await firstValueFrom(
          this.httpService.get(`${this.apiUrl}?symbol=${reverseSymbol}`),
        );
        return new Decimal(1).dividedBy(new Decimal(data.price));
      } catch (reverseError) {
        this.logger.error(`Error fetching Binance API for pair ${from}/${to}: ${reverseError.message}`);
        throw reverseError;
      }
    }
  }
}