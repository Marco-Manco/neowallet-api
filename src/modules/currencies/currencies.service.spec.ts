import { Test, TestingModule } from '@nestjs/testing';
import { CurrenciesService } from './currencies.service';
import { CurrencyMapper } from './mappers/currency.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { MockRepositoryFactory } from 'src/testing/mocks/repository.mock'; 
import { mockCurrency, mockCurrencyResponse } from './test/currency.fixture';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CurrencyType } from './enums/currency-type.enum';

describe('CurrenciesService', () => {
  let service: CurrenciesService;
  let repository: ReturnType<typeof MockRepositoryFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        CurrencyMapper,
        {
          provide: getRepositoryToken(Currency),
          useFactory: MockRepositoryFactory,
        }
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
    repository = module.get(getRepositoryToken(Currency));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a CurrencyResponseDto when currency is found', async () => {
      repository.findOne.mockResolvedValue(mockCurrency);
      
      const result = await service.findOne(mockCurrency.id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockCurrency.id } });
      expect(result).toEqual(mockCurrencyResponse);
    });

    it('should throw NotFoundException when currency is not found', async () => {
      repository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('uuid-invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createCurrencyDto = { 
      code: 'BTC', 
      name: 'Bitcoin', 
      symbol: '₿', 
      type: CurrencyType.CRYPTO, 
      decimals: 8 
    };

    it('should successfully create and return a currency', async () => {
      repository.findOne.mockResolvedValue(null); 
      repository.create.mockReturnValue(mockCurrency);
      repository.save.mockResolvedValue(mockCurrency);

      const result = await service.create(createCurrencyDto);

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { code: createCurrencyDto.code },
        withDeleted: true 
      });
      expect(repository.create).toHaveBeenCalledWith(createCurrencyDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCurrencyResponse);
    });

    it('should throw ConflictException if currency code already exists', async () => {
      repository.findOne.mockResolvedValue(mockCurrency); 

      await expect(service.create(createCurrencyDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createCurrencyDto)).rejects.toThrow(`Currency with code ${createCurrencyDto.code} already exists`);
      
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Bitcoin Updated' };

    it('should successfully update and return a currency without changing code', async () => {
      // Usamos { ...mockCurrency } para pasar un CLON, protegiendo el original
      repository.findOne.mockResolvedValue({ ...mockCurrency }); 
      
      const updatedCurrency = { ...mockCurrency, ...updateDto };
      repository.save.mockResolvedValue(updatedCurrency);

      const result = await service.update(mockCurrency.id, updateDto);

      expect(repository.findOne).toHaveBeenCalledTimes(1); 
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.name).toEqual(updateDto.name);
    });

    it('should successfully update currency when code is changed and is unique', async () => {
      const updateCodeDto = { code: 'ETH' };
      
      repository.findOne
        .mockResolvedValueOnce({ ...mockCurrency }) // CLON 
        .mockResolvedValueOnce(null);        
        
      const updatedCurrency = { ...mockCurrency, code: 'ETH' };
      repository.save.mockResolvedValue(updatedCurrency);

      const result = await service.update(mockCurrency.id, updateCodeDto);

      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalled();
      expect(result.code).toEqual('ETH');
    });

    it('should throw ConflictException if trying to update to an existing code', async () => {
      const updateCodeDto = { code: 'ETH' };
      
      repository.findOne
        .mockResolvedValueOnce({ ...mockCurrency }) // CLON
        .mockResolvedValueOnce({ id: 'otro-id', code: 'ETH' }); 

      await expect(service.update(mockCurrency.id, updateCodeDto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if currency to update is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('uuid-invalido', updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // ... (el describe de remove queda igual) ...

  describe('findAll', () => {
    it('should return an array of CurrencyResponseDto', async () => {
      // También devolvemos un clon acá por buenas prácticas
      repository.find.mockResolvedValue([{ ...mockCurrency }]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockCurrencyResponse]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should successfully soft delete a currency', async () => {
      repository.findOne.mockResolvedValue(mockCurrency);
      
      await service.remove(mockCurrency.id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockCurrency.id } });
      expect(repository.softDelete).toHaveBeenCalledWith(mockCurrency.id);
    });

    it('should throw NotFoundException when trying to delete a non-existent currency', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('uuid-invalido')).rejects.toThrow(NotFoundException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

});