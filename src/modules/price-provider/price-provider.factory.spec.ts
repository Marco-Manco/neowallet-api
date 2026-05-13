import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Decimal } from 'decimal.js';
import { PriceProviderFactory } from './price-provider.factory';
import { DolarApiProvider } from './providers/dolar-api.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { PriceUnavailableException } from '../../shared/domain/exceptions/price-unavailable.exception';

describe('PriceProviderFactory', () => {
  let factory: PriceProviderFactory;
  let cacheManager: Cache;
  let dolarApiProvider: DolarApiProvider;
  let cryptoProvider: CryptoProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceProviderFactory,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: DolarApiProvider,
          useValue: {
            supports: jest.fn(),
            getExchangeRate: jest.fn(),
          },
        },
        {
          provide: CryptoProvider,
          useValue: {
            supports: jest.fn(),
            getExchangeRate: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<PriceProviderFactory>(PriceProviderFactory);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dolarApiProvider = module.get<DolarApiProvider>(DolarApiProvider);
    cryptoProvider = module.get<CryptoProvider>(CryptoProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExchangeRate', () => {
    it('should return cached value when available', async () => {
      const cachedRate = '150.50';
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedRate);

      const result = await factory.getExchangeRate('USD', 'ARS');

      expect(result).toEqual(new Decimal(cachedRate));
      expect(cacheManager.get).toHaveBeenCalledWith('price:USD:ARS');
      expect(dolarApiProvider.getExchangeRate).not.toHaveBeenCalled();
      expect(cryptoProvider.getExchangeRate).not.toHaveBeenCalled();
    });

    it('should fetch from provider and cache when cache miss', async () => {
      const rate = new Decimal('150.50');
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(true);
      jest.spyOn(dolarApiProvider, 'getExchangeRate').mockResolvedValue(rate);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(false);

      const result = await factory.getExchangeRate('USD', 'ARS');

      expect(result).toEqual(rate);
      expect(dolarApiProvider.getExchangeRate).toHaveBeenCalledWith('USD', 'ARS');
      expect(cacheManager.set).toHaveBeenCalledWith('price:USD:ARS', rate.toString(), 5000);
    });

    it('should fallback to next provider when first fails', async () => {
      const rate = new Decimal('150.50');
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      // Both providers support the pair
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(true);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(true);

      // First provider fails
      jest.spyOn(dolarApiProvider, 'getExchangeRate').mockRejectedValue(new Error('DolarAPI down'));
      // Second provider succeeds
      jest.spyOn(cryptoProvider, 'getExchangeRate').mockResolvedValue(rate);

      const result = await factory.getExchangeRate('USD', 'ARS');

      expect(result).toEqual(rate);
      expect(dolarApiProvider.getExchangeRate).toHaveBeenCalled();
      expect(cryptoProvider.getExchangeRate).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith('price:USD:ARS', rate.toString(), 5000);
    });

    it('should throw PriceUnavailableException when no provider supports the pair', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(false);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(false);

      await expect(factory.getExchangeRate('XYZ', 'ABC')).rejects.toThrow(
        PriceUnavailableException,
      );
    });

    it('should throw PriceUnavailableException when all providers fail', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(true);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(true);
      jest.spyOn(dolarApiProvider, 'getExchangeRate').mockRejectedValue(new Error('Down'));
      jest.spyOn(cryptoProvider, 'getExchangeRate').mockRejectedValue(new Error('Down'));

      await expect(factory.getExchangeRate('USD', 'ARS')).rejects.toThrow(
        PriceUnavailableException,
      );
    });

    it('should throw PriceUnavailableException when from and to currencies are the same', async () => {
      await expect(factory.getExchangeRate('USD', 'USD')).rejects.toThrow(
        PriceUnavailableException,
      );
    });

    it('should throw PriceUnavailableException when currencies are empty', async () => {
      await expect(factory.getExchangeRate('', 'ARS')).rejects.toThrow(
        PriceUnavailableException,
      );
      await expect(factory.getExchangeRate('USD', '')).rejects.toThrow(
        PriceUnavailableException,
      );
    });

    it('should normalize currency codes to uppercase', async () => {
      const rate = new Decimal('150.50');
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(true);
      jest.spyOn(dolarApiProvider, 'getExchangeRate').mockResolvedValue(rate);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(false);

      await factory.getExchangeRate('usd', 'ars');

      expect(dolarApiProvider.getExchangeRate).toHaveBeenCalledWith('USD', 'ARS');
      expect(cacheManager.set).toHaveBeenCalledWith('price:USD:ARS', rate.toString(), 5000);
    });

    it('should continue without throwing if cache write fails', async () => {
      const rate = new Decimal('150.50');
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockRejectedValue(new Error('Redis down'));
      jest.spyOn(dolarApiProvider, 'supports').mockReturnValue(true);
      jest.spyOn(dolarApiProvider, 'getExchangeRate').mockResolvedValue(rate);
      jest.spyOn(cryptoProvider, 'supports').mockReturnValue(false);

      const result = await factory.getExchangeRate('USD', 'ARS');

      expect(result).toEqual(rate);
    });
  });
});
