import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

interface TransactionJobData {
  transactionId: string;
  type: string;
  sourceWalletId: string;
  targetWalletId?: string;
  amount: string;
}

@Processor('transactions')
export class TransactionsProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionsProcessor.name);

  async process(job: Job<TransactionJobData>): Promise<void> {
    const { transactionId, type, sourceWalletId, targetWalletId, amount } = job.data;
    
    this.logger.log(
      `Processing async post-transaction for ${type} #${transactionId}: ${amount} from ${sourceWalletId}` +
      (targetWalletId ? ` to ${targetWalletId}` : ''),
    );

    // Placeholder for future async operations:
    // - Send push/email notification
    // - Update analytics
    // - Reconcile balances
    // - Emit WebSocket event

    await this.simulateAsyncWork();
    
    this.logger.log(`Async post-transaction completed for #${transactionId}`);
  }

  private async simulateAsyncWork(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}
