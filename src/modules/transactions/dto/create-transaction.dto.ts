import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class CreateTransactionDto {
  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.TRANSFER,
    description: 'Type of transaction',
  })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  @IsNotEmpty({ message: 'Transaction type is required' })
  type: TransactionType;

  @ApiProperty({
    example: '100.50',
    description: 'Amount to transfer or swap',
  })
  @IsString({ message: 'Amount must be a string' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Source wallet ID',
  })
  @IsUUID('4', { message: 'Source wallet ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Source wallet ID is required' })
  sourceWalletId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Target wallet ID (required for transfers)',
    required: false,
  })
  @IsUUID('4', { message: 'Target wallet ID must be a valid UUID' })
  targetWalletId?: string;
}
