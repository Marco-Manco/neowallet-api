import { 
  Injectable, NotFoundException, ConflictException, 
  ForbiddenException, BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { CurrenciesService } from '../currencies/currencies.service';
import { UserRole } from '../users/enums/user-role.enum';
import { WalletMapper } from './mappers/wallet.mapper';
import { WalletResponseDto } from './dto/wallet-response.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly currenciesService: CurrenciesService,
    private readonly walletMapper: WalletMapper, 
  ) {}

  async create(userId: string, currencyCode: string, manager?: EntityManager): Promise<WalletResponseDto> {
    const repo = this.getRepo(manager);
    const currency = await this.currenciesService.findByCode(currencyCode);
    
    await this.validateWalletDoesNotExist(userId, currency.id, repo);

    const newWallet = repo.create({
      userId,
      currencyId: currency.id,
      balance: 0,
    });

    const savedWallet = await repo.save(newWallet);
    savedWallet.currency = currency; 
    
    return this.walletMapper.toResponseDto(savedWallet);
  }

  async findAll(): Promise<WalletResponseDto[]> {
    const wallets = await this.walletRepository.find({
      relations: ['user', 'currency'],
    });
    return this.walletMapper.toResponseDtoArray(wallets);
  }

  async findByUserId(userId: string): Promise<WalletResponseDto[]> {
    const wallets = await this.walletRepository.find({
      where: { userId },
      relations: ['currency'],
    });
    return this.walletMapper.toResponseDtoArray(wallets);
  }

  async findOne(id: string, requesterId: string, requesterRole: UserRole): Promise<WalletResponseDto> {
    const wallet = await this.getWalletEntityOrThrow(id, requesterId, requesterRole);
    return this.walletMapper.toResponseDto(wallet);
  }

  async remove(id: string, requesterId: string, requesterRole: UserRole): Promise<void> {
    const wallet = await this.getWalletEntityOrThrow(id, requesterId, requesterRole);

    if (!wallet.balance.isZero()) {
      throw new BadRequestException('Cannot delete a wallet with non-zero balance');
    }

    await this.walletRepository.softRemove(wallet);
  }

  private async getWalletEntityOrThrow(id: string, requesterId: string, requesterRole: UserRole): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['currency'],
      withDeleted: false,
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID '${id}' not found`);
    }

    if (requesterRole !== UserRole.ADMIN && wallet.userId !== requesterId) {
      throw new ForbiddenException('You do not have permission to access this wallet');
    }

    return wallet;
  }

  private getRepo(manager?: EntityManager): Repository<Wallet> {
    return manager ? manager.getRepository(Wallet) : this.walletRepository;
  }

  private async validateWalletDoesNotExist(userId: string, currencyId: string, repo: Repository<Wallet>) {
    const existingWallet = await repo.findOne({ where: { userId, currencyId } });
    if (existingWallet) {
      throw new ConflictException('User already has a wallet for this currency');
    }
  }
}