import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

interface TransactionJobData {
  transactionId: string;
  type: string;
  sourceWalletId: string;
  targetWalletId?: string;
  amount: string;
}

@Injectable()
export class TransactionsQueueService {
  constructor(
    @InjectQueue('transactions')
    private readonly transactionsQueue: Queue,
  ) {}

  async enqueueTransactionCompleted(data: TransactionJobData): Promise<void> {
    await this.transactionsQueue.add('transaction-completed', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
