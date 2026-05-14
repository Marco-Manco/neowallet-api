import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionResponseDto, toTransactionResponseDto } from '../dto/transaction-response.dto';
import { TransactionValidator } from './validators/transaction.validator';
import { TransactionsQueueService } from '../transactions.queue-service';

@Injectable()
export class DepositUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly validator: TransactionValidator,
    private readonly queueService: TransactionsQueueService,
  ) {}

  async execute(
    walletId: string,
    amount: string,
    idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(Transaction);
      const idempotencyRepo = manager.getRepository(IdempotencyKey);

      if (idempotencyKey) {
        const cached = await this.checkIdempotency(idempotencyKey, idempotencyRepo);
        if (cached) return cached;
      }

      const wallet = await this.getLockedWallet(walletRepo, walletId);
      this.validator.assertWalletActive(wallet);

      const amountDecimal = new Decimal(amount);
      wallet.credit(amountDecimal);
      await walletRepo.save(wallet);

      const transaction = txRepo.create({
        type: TransactionType.CASH_IN,
        status: TransactionStatus.COMPLETED,
        amount: amountDecimal,
        sourceWalletId: wallet.id,
        idempotencyKey: idempotencyKey || null,
      });
      await txRepo.save(transaction);

      const responseDto = toTransactionResponseDto(transaction);

      if (idempotencyKey) {
        await this.saveIdempotency(idempotencyKey, 201, responseDto, idempotencyRepo);
      }

      await this.queueService.enqueueTransactionCompleted({
        transactionId: transaction.id,
        type: transaction.type,
        sourceWalletId: wallet.id,
        amount: amountDecimal.toString(),
      });

      return responseDto;
    });
  }

  private async getLockedWallet(repo: Repository<Wallet>, id: string): Promise<Wallet> {
    const wallet = await repo
      .createQueryBuilder('wallet')
      .where('wallet.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!wallet) {
      throw new Error(`Wallet with ID '${id}' not found`);
    }

    return wallet;
  }

  private async checkIdempotency(
    key: string,
    repo: Repository<IdempotencyKey>,
  ): Promise<TransactionResponseDto | null> {
    const existing = await repo.findOne({ where: { key, resourceType: 'transaction' } });
    return existing ? (existing.responseBody as TransactionResponseDto) : null;
  }

  private async saveIdempotency(
    key: string,
    responseStatus: number,
    responseBody: TransactionResponseDto,
    repo: Repository<IdempotencyKey>,
  ): Promise<void> {
    const record = repo.create({
      key,
      resourceType: 'transaction',
      responseStatus,
      responseBody: responseBody as Record<string, any>,
    });
    await repo.save(record);
  }
}
