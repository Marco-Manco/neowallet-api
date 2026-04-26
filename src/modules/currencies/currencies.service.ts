import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { Repository } from 'typeorm';
import { CurrencyMapper } from './mappers/currency.mapper';
import { CurrencyResponseDto } from './dto/currency-response.dto';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    private readonly currencyMapper: CurrencyMapper,
  ){}

  async create(createCurrencyDto: CreateCurrencyDto): Promise<CurrencyResponseDto> {
    await this.validateCodeIsUnique(createCurrencyDto.code);
    const currency = this.currencyRepository.create(createCurrencyDto);
    const savedCurrency = await this.currencyRepository.save(currency);

    return this.currencyMapper.toResponseDto(savedCurrency);
  }

  async findAll(): Promise<CurrencyResponseDto[]> {
    const currencies = await this.currencyRepository.find();
    return this.currencyMapper.toResponseDtoArray(currencies);
  }

  async findOne(id: string): Promise<CurrencyResponseDto> {
    const currency = await this.getCurrencyOrThrow(id);
    return this.currencyMapper.toResponseDto(currency);
  }

  async update(id: string, updateCurrencyDto: UpdateCurrencyDto): Promise<CurrencyResponseDto> {
    const currency = await this.getCurrencyOrThrow(id);

    if (updateCurrencyDto.code && updateCurrencyDto.code !== currency.code) {
      await this.validateCodeIsUnique(updateCurrencyDto.code);
    }

    Object.assign(currency, updateCurrencyDto);
    const updatedCurrency = await this.currencyRepository.save(currency);
    
    return this.currencyMapper.toResponseDto(updatedCurrency);
  }

  async remove(id: string): Promise<void> {
    const currency = await this.getCurrencyOrThrow(id);
    await this.currencyRepository.softDelete(currency.id);
  }
  
  async findByCode(code: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({ where: { code } });
    if (!currency) {
      throw new NotFoundException(`Currency with code '${code}' not found`);
    }
    return currency;
  }

  private async getCurrencyOrThrow(id: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({ where: { id } });
    
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    
    return currency;
  }

  private async validateCodeIsUnique(code: string): Promise<void> {
    const existingCurrency = await this.currencyRepository.findOne({
      where: { code },
      withDeleted: true, 
    });

    if (existingCurrency) {
      throw new ConflictException(`Currency with code ${code} already exists`);
    }
  }
}
