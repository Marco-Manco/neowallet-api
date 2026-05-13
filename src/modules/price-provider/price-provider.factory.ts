import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Decimal } from 'decimal.js';
import { IPriceProvider } from './interfaces/price-provider.interface';
import { DolarApiProvider } from './providers/dolar-api.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { PriceUnavailableException } from '../../shared/domain/exceptions/price-unavailable.exception';

@Injectable()
export class PriceProviderFactory {
  private readonly logger = new Logger(PriceProviderFactory.name);
  private readonly providers: IPriceProvider[];
  private readonly cacheTtl = 5000; // 5 seconds

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly dolarApiProvider: DolarApiProvider,
    private readonly cryptoProvider: CryptoProvider,
  ) {
    this.providers = [this.dolarApiProvider, this.cryptoProvider];
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<Decimal> {
    const normalizedFrom = fromCurrency.toUpperCase().trim();
    const normalizedTo = toCurrency.toUpperCase().trim();

    this.validateInput(normalizedFrom, normalizedTo);

    const cacheKey = this.buildCacheKey(normalizedFrom, normalizedTo);

    // 1. Try cache first
    const cachedValue = await this.getFromCache(cacheKey);
    if (cachedValue) {
      this.logger.debug(`Cache hit for ${normalizedFrom}/${normalizedTo}: ${cachedValue}`);
      return cachedValue;
    }

    // 2. Try providers with fallback chain
    const supportedProviders = this.providers.filter((p) =>
      p.supports(normalizedFrom, normalizedTo),
    );

    if (supportedProviders.length === 0) {
      this.logger.warn(`No provider supports pair: ${normalizedFrom}/${normalizedTo}`);
      throw new PriceUnavailableException(`${normalizedFrom}/${normalizedTo}`);
    }

    for (const provider of supportedProviders) {
      try {
        const rate = await provider.getExchangeRate(normalizedFrom, normalizedTo);
        await this.setCache(cacheKey, rate);
        this.logger.debug(`Rate fetched from ${provider.constructor.name}: ${rate}`);
        return rate;
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.constructor.name} failed for ${normalizedFrom}/${normalizedTo}: ${error.message}`,
        );
        // Continue to next provider (fallback)
      }
    }

    // 3. All providers failed
    this.logger.error(`All providers failed for pair: ${normalizedFrom}/${normalizedTo}`);
    throw new PriceUnavailableException(`${normalizedFrom}/${normalizedTo}`);
  }

  private validateInput(from: string, to: string): void {
    if (!from || !to) {
      throw new PriceUnavailableException(`${from}/${to}`);
    }
    if (from === to) {
      throw new PriceUnavailableException(`${from}/${to}`);
    }
  }

  private buildCacheKey(from: string, to: string): string {
    return `price:${from}:${to}`;
  }

  private async getFromCache(key: string): Promise<Decimal | null> {
    try {
      const value = await this.cacheManager.get<string>(key);
      if (value) {
        return new Decimal(value);
      }
      return null;
    } catch (error) {
      this.logger.error(`Redis cache read error: ${error.message}`);
      return null;
    }
  }

  private async setCache(key: string, value: Decimal): Promise<void> {
    try {
      await this.cacheManager.set(key, value.toString(), this.cacheTtl);
    } catch (error) {
      this.logger.error(`Redis cache write error: ${error.message}`);
      // Do not throw; caching is a best-effort optimization
    }
  }
}
