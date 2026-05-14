import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Transaction } from './entities/transaction.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsProcessor } from './transactions.processor';
import { TransactionsQueueService } from './transactions.queue-service';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { WithdrawUseCase } from './use-cases/withdraw.use-case';
import { TransferUseCase } from './use-cases/transfer.use-case';
import { TransactionValidator } from './use-cases/validators/transaction.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, IdempotencyKey]),
    WalletsModule,
    BullModule.registerQueue({
      name: 'transactions',
    }),
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    DepositUseCase,
    WithdrawUseCase,
    TransferUseCase,
    TransactionValidator,
    TransactionsProcessor,
    TransactionsQueueService,
  ],
  exports: [TransactionsService, TransactionsQueueService],
})
export class TransactionsModule {}
