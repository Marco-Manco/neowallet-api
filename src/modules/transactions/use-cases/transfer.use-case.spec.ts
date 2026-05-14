import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { TransferUseCase } from './transfer.use-case';
import { Transaction } from '../entities/transaction.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { TransactionValidator } from './validators/transaction.validator';
import { TransactionsQueueService } from '../transactions.queue-service';
import { TransactionType } from '../enums/transaction-type.enum';

describe('TransferUseCase', () => {
  let useCase: TransferUseCase;
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
    credit: jest.fn(function (amount: Decimal) {
      this.balance = this.balance.plus(amount);
    }),
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
        TransferUseCase,
        { provide: DataSource, useValue: mockDataSource },
        { provide: TransactionValidator, useValue: validator },
        { provide: TransactionsQueueService, useValue: queueService },
      ],
    }).compile();

    useCase = module.get<TransferUseCase>(TransferUseCase);
  });

  it('should move funds between wallets', async () => {
    const source = mockWallet({ id: 'wallet-a', balance: new Decimal(200) });
    const target = mockWallet({ id: 'wallet-b', balance: new Decimal(50) });

    walletRepo.createQueryBuilder.mockImplementation(() => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockImplementation(async () => {
        const callCount = walletRepo.createQueryBuilder.mock.calls.length;
        return callCount % 2 === 1 ? source : target;
      });
      return qb;
    });

    const result = await useCase.execute(source.id, target.id, '75');

    expect(source.debit).toHaveBeenCalledWith(new Decimal('75'));
    expect(target.credit).toHaveBeenCalledWith(new Decimal('75'));
    expect(walletRepo.save).toHaveBeenCalledWith(source);
    expect(walletRepo.save).toHaveBeenCalledWith(target);
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TransactionType.TRANSFER,
        sourceWalletId: source.id,
        targetWalletId: target.id,
        amount: new Decimal('75'),
      }),
    );
    expect(queueService.enqueueTransactionCompleted).toHaveBeenCalled();
    expect(result.type).toBe('TRANSFER');
  });

  it('should return cached response for duplicate idempotency key', async () => {
    const cachedDto = { id: 'cached-tx', type: 'TRANSFER', amount: '50' };
    idempotencyRepo.findOne.mockResolvedValue({
      id: 'idemp-1',
      key: 'dup-key',
      resourceType: 'transaction',
      responseBody: cachedDto,
    });

    const result = await useCase.execute('wallet-a', 'wallet-b', '50', 'dup-key');

    expect(result).toEqual(cachedDto);
    expect(walletRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
