import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Decimal } from 'decimal.js';
import { IPriceProvider } from '../interfaces/price-provider.interface';

@Injectable()
export class DolarApiProvider implements IPriceProvider {
  private readonly logger = new Logger(DolarApiProvider.name);
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('DOLAR_API_URL');
  }

  supports(fromCurrency: string, toCurrency: string): boolean {
    const pair = [fromCurrency.toUpperCase(), toCurrency.toUpperCase()];
    return pair.includes('ARS') && pair.includes('USD');
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<Decimal> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/cripto`),
      );

      const price = new Decimal(data.venta);

      if (fromCurrency.toUpperCase() === 'USD' && toCurrency.toUpperCase() === 'ARS') {
        return price;
      }

      if (fromCurrency.toUpperCase() === 'ARS' && toCurrency.toUpperCase() === 'USD') {
        return new Decimal(1).dividedBy(price);
      }

      throw new Error('Unsupported conversion direction');
    } catch (error) {
      this.logger.error(`Error fetching DolarAPI: ${error.message}`);
      throw error;
    }
  }
}