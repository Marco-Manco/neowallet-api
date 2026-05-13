import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { Decimal } from 'decimal.js';
import { DolarApiProvider } from './dolar-api.provider';

describe('DolarApiProvider', () => {
  let provider: DolarApiProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DolarApiProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('https://dolarapi.com/v1/dolares'),
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

    provider = module.get<DolarApiProvider>(DolarApiProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('supports', () => {
    it('should return true for ARS/USD pair', () => {
      expect(provider.supports('ARS', 'USD')).toBe(true);
      expect(provider.supports('USD', 'ARS')).toBe(true);
    });

    it('should return false for non-ARS/USD pairs', () => {
      expect(provider.supports('BTC', 'USDT')).toBe(false);
      expect(provider.supports('EUR', 'ARS')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(provider.supports('ars', 'usd')).toBe(true);
    });
  });

  describe('getExchangeRate', () => {
    it('should return rate for USD to ARS', async () => {
      const mockResponse = {
        data: { venta: '150.50' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await provider.getExchangeRate('USD', 'ARS');

      expect(result).toEqual(new Decimal('150.50'));
      expect(httpService.get).toHaveBeenCalledWith('https://dolarapi.com/v1/dolares/cripto');
    });

    it('should return inverted rate for ARS to USD', async () => {
      const mockResponse = {
        data: { venta: '150.50' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await provider.getExchangeRate('ARS', 'USD');

      expect(result).toEqual(new Decimal(1).dividedBy('150.50'));
    });

    it('should throw when API call fails', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Network error')));

      await expect(provider.getExchangeRate('USD', 'ARS')).rejects.toThrow('Network error');
    });
  });
});
