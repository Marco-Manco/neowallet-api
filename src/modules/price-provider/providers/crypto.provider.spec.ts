import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { Decimal } from 'decimal.js';
import { CryptoProvider } from './crypto.provider';

describe('CryptoProvider', () => {
  let provider: CryptoProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('https://api.binance.com/api/v3/ticker/price'),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<CryptoProvider>(CryptoProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('supports', () => {
    it('should return true for supported crypto pairs', () => {
      expect(provider.supports('BTC', 'USDT')).toBe(true);
      expect(provider.supports('ETH', 'BTC')).toBe(true);
    });

    it('should return false for non-crypto pairs', () => {
      expect(provider.supports('ARS', 'USD')).toBe(false);
      expect(provider.supports('BTC', 'EUR')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(provider.supports('btc', 'usdt')).toBe(true);
    });
  });

  describe('getExchangeRate', () => {
    it('should return rate for direct pair', async () => {
      const mockResponse = {
        data: { price: '45000.00' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await provider.getExchangeRate('BTC', 'USDT');

      expect(result).toEqual(new Decimal('45000.00'));
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      );
    });

    it('should return inverted rate for reverse pair', async () => {
      const mockResponse = {
        data: { price: '45000.00' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      jest
        .spyOn(httpService, 'get')
        .mockImplementation((url: string) => {
          if (url.includes('BTCUSDT')) {
            return of(mockResponse);
          }
          return throwError(() => new Error('Not found'));
        });

      const result = await provider.getExchangeRate('USDT', 'BTC');

      expect(result).toEqual(new Decimal(1).dividedBy('45000.00'));
    });

    it('should throw when both direct and reverse pairs fail', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Not found')));

      await expect(provider.getExchangeRate('BTC', 'USDT')).rejects.toThrow('Not found');
    });
  });
});
