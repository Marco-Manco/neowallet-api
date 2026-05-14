import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

const decimalTransformer = {
  to: (value: Decimal | string | number) => new Decimal(value || 0).toString(),
  from: (value: string) => new Decimal(value || 0),
};

@Entity('transactions')
@Index(['idempotencyKey'], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 18, scale: 8, transformer: decimalTransformer })
  amount: Decimal;

  @ManyToOne(() => Wallet, { nullable: false })
  @JoinColumn({ name: 'sourceWalletId' })
  sourceWallet: Wallet;

  @Column()
  sourceWalletId: string;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'targetWalletId' })
  targetWallet: Wallet | null;

  @Column({ nullable: true })
  targetWalletId: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
