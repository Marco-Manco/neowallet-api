import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { Decimal } from 'decimal.js';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
    transformer: {
      to: (value: Decimal | string | number) => new Decimal(value || 0).toString(),
      from: (value: string) => new Decimal(value || 0),
    },
  })
  balance: Decimal;

  @ManyToOne(() => User, (user) => user.wallets, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Currency, { nullable: false, eager: true })
  @JoinColumn({ name: 'currencyId' })
  currency: Currency;

  @Column()
  currencyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  canAfford(amount: Decimal | string | number): boolean {
    const amountToCompare = new Decimal(amount);
    return this.balance.gte(amountToCompare);
  }

  credit(amount: Decimal | string | number): void {
    const amountToAdd = new Decimal(amount);
    if (amountToAdd.isNegative()) {
      throw new Error('Cannot credit a negative amount'); 
    }
    this.balance = this.balance.plus(amountToAdd);
  }

  debit(amount: Decimal | string | number): void {
    const amountToSubtract = new Decimal(amount);
    if (amountToSubtract.isNegative()) {
      throw new Error('Cannot debit a negative amount');
    }
    if (!this.canAfford(amountToSubtract)) {
      throw new Error('Insufficient funds');
    }
    this.balance = this.balance.minus(amountToSubtract);
  }
}