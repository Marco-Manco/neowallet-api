import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  sourceWalletId: string;

  @ApiProperty({ nullable: true })
  targetWalletId: string | null;

  @ApiProperty()
  createdAt: Date;
}

export function toTransactionResponseDto(transaction: Transaction): TransactionResponseDto {
  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    amount: transaction.amount.toString(),
    sourceWalletId: transaction.sourceWalletId,
    targetWalletId: transaction.targetWalletId,
    createdAt: transaction.createdAt,
  };
}
