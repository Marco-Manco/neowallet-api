import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { WithdrawUseCase } from './withdraw.use-case';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { TransactionValidator } from './validators/transaction.validator';
import { TransactionsQueueService } from '../transactions.queue-service';
import { TransactionType } from '../enums/transaction-type.enum';
import { InsufficientFundsException } from '../../../shared/domain/exceptions';

describe('WithdrawUseCase', () => {
  let useCase: WithdrawUseCase;
  let validator: jest.Mocked<TransactionValidator>;
  let queueService: jest.Mocked<TransactionsQueueService>;
  let walletRepo: any;
  let txRepo: any;
  let idempotencyRepo: any;

  const mockWallet = (overrides?: Partial<any>): any => ({
    id: 'wallet-1',
    userId: 'user-1',
    currencyId: 'currency-1',
    balance: new Decimal(100),
    currency: { id: 'currency-1', code: 'ARS' },
    deletedAt: null,
    debit: jest.fn(function (amount: Decimal) {
      this.balance = this.balance.minus(amount);
    }),
    canAfford: jest.fn(function (amount: Decimal) {
      return this.balance.gte(amount);
    }),
    ...overrides,
  });

  const createMockQueryBuilder = (wallet?: any) => ({
    where: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(wallet),
  });

  const mockDataSource = {
    transaction: jest.fn(async (fn) => {
      return fn({
        getRepository: (entity: any) => {
          if (entity === Wallet) return walletRepo;
          if (entity === Transaction) return txRepo;
          if (entity === IdempotencyKey) return idempotencyRepo;
          throw new Error('Unknown entity');
        },
      });
    }),
  };

  beforeEach(async () => {
    txRepo = {
      create: jest.fn((dto) => ({ ...dto, id: 'tx-1' })),
      save: jest.fn((tx) => Promise.resolve(tx)),
    };

    idempotencyRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'idemp-1' })),
      save: jest.fn((k) => Promise.resolve(k)),
    };

    walletRepo = {
      save: jest.fn((w) => Promise.resolve(w)),
      createQueryBuilder: jest.fn(),
    };

    validator = {
      assertWalletActive: jest.fn(),
      assertSameCurrency: jest.fn(),
      assertSufficientFunds: jest.fn(),
    } as unknown as jest.Mocked<TransactionValidator>;

    queueService = {
      enqueueTransactionCompleted: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TransactionsQueueService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawUseCase,
        { provide: DataSource, useValue: mockDataSource },
        { provide: TransactionValidator, useValue: validator },
        { provide: TransactionsQueueService, useValue: queueService },
      ],
    }).compile();

    useCase = module.get<WithdrawUseCase>(WithdrawUseCase);
  });

  it('should debit wallet, create transaction, and enqueue job', async () => {
    const wallet = mockWallet({ balance: new Decimal(200) });
    walletRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(wallet));

    const result = await useCase.execute(wallet.id, '30');

    expect(wallet.debit).toHaveBeenCalledWith(new Decimal('30'));
    expect(validator.assertSufficientFunds).toHaveBeenCalledWith(wallet, new Decimal('30'));
    expect(walletRepo.save).toHaveBeenCalledWith(wallet);
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TransactionType.CASH_OUT,
        amount: new Decimal('30'),
      }),
    );
    expect(queueService.enqueueTransactionCompleted).toHaveBeenCalled();
    expect(result.type).toBe('CASH_OUT');
  });

  it('should propagate InsufficientFundsException', async () => {
    const wallet = mockWallet({ balance: new Decimal(10) });
    walletRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(wallet));
    validator.assertSufficientFunds.mockImplementation(() => {
      throw new InsufficientFundsException();
    });

    await expect(useCase.execute(wallet.id, '100')).rejects.toThrow(InsufficientFundsException);
  });

  it('should return cached response for duplicate idempotency key', async () => {
    const cachedDto = { id: 'cached-tx', type: 'CASH_OUT', amount: '20' };
    idempotencyRepo.findOne.mockResolvedValue({
      id: 'idemp-1',
      key: 'dup-key',
      resourceType: 'transaction',
      responseBody: cachedDto,
    });

    const result = await useCase.execute('wallet-1', '20', 'dup-key');

    expect(result).toEqual(cachedDto);
    expect(walletRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
