import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { WithdrawUseCase } from './use-cases/withdraw.use-case';
import { TransferUseCase } from './use-cases/transfer.use-case';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly transferUseCase: TransferUseCase,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async deposit(
    walletId: string,
    amount: string,
    idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.depositUseCase.execute(walletId, amount, idempotencyKey);
  }

  async withdraw(
    walletId: string,
    amount: string,
    idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.withdrawUseCase.execute(walletId, amount, idempotencyKey);
  }

  async transfer(
    sourceWalletId: string,
    targetWalletId: string,
    amount: string,
    idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.transferUseCase.execute(sourceWalletId, targetWalletId, amount, idempotencyKey);
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: [
        { sourceWalletId: walletId },
        { targetWalletId: walletId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['sourceWallet', 'targetWallet'],
    });
  }
}
