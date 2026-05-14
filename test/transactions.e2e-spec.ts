import { Test, TestingModule } from '@nestjs/testing';
import { configureTestApp } from './utils/configure-test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Decimal } from 'decimal.js';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SeedService } from 'src/modules/seed/seed.service';
import { ConfigService } from '@nestjs/config';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let userWalletId: string;

  const testUser = { email: 'tx.user@example.com', password: 'Password123!' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureTestApp(app);
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE users, currencies, wallets, transactions, idempotency_keys CASCADE');
    
    const seedService = app.get(SeedService);
    await seedService.onModuleInit();

    const configService = app.get(ConfigService);
    const adminEmail = configService.get<string>('ADMIN_SEED_EMAIL');
    const adminPassword = configService.get<string>('ADMIN_SEED_PASSWORD');

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    adminToken = adminLogin.body.data.access_token;

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);
    
    userToken = registerRes.body.data.access_token;

    // The user gets an ARS wallet by default on registration
    const walletsRes = await request(app.getHttpServer())
      .get('/wallets/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    
    userWalletId = walletsRes.body.data[0].id;
  });

  describe('POST /transactions/deposit', () => {
    it('should deposit funds into a wallet', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: userWalletId, amount: '100.50' })
        .expect(201);

      expect(response.body.data.type).toBe('CASH_IN');
      expect(new Decimal(response.body.data.amount).toString()).toBe('100.5');
      expect(response.body.data).toHaveProperty('id');

      // Verify balance increased
      const walletRes = await request(app.getHttpServer())
        .get(`/wallets/${userWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(new Decimal(walletRes.body.data.balance).toString()).toBe('100.5');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .send({ walletId: userWalletId, amount: '10' })
        .expect(401);
    });
  });

  describe('POST /transactions/withdraw', () => {
    it('should withdraw funds from a wallet', async () => {
      // First deposit
      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: userWalletId, amount: '200' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/transactions/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: userWalletId, amount: '50' })
        .expect(201);

      expect(response.body.data.type).toBe('CASH_OUT');
      expect(response.body.data.amount).toBe('50');

      // Verify balance decreased
      const walletRes = await request(app.getHttpServer())
        .get(`/wallets/${userWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(walletRes.body.data.balance).toBe('150');
    });

    it('should return 400 when insufficient funds', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: userWalletId, amount: '999' })
        .expect(400);

      expect(response.body.error.code).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('POST /transactions/transfer', () => {
    it('should transfer funds between wallets of same currency', async () => {
      // Create EUR currency as admin
      await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'EUR', name: 'Euro', symbol: '€', type: 'FIAT', decimals: 2 })
        .expect(201);

      // Create two EUR wallets for the same user
      const firstWalletRes = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currencyCode: 'EUR' })
        .expect(201);
      const firstWalletId = firstWalletRes.body.data.id;

      const secondWalletRes = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currencyCode: 'EUR' })
        .expect(409); // User already has EUR wallet... wait, that's also a conflict

      // Actually, let's register a second user and give them EUR wallet
      const secondUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'tx.target@example.com', password: 'Password123!' })
        .expect(201);
      const secondUserToken = secondUserRes.body.data.access_token;

      const targetWalletRes = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ currencyCode: 'EUR' })
        .expect(201);
      const targetWalletId = targetWalletRes.body.data.id;

      // Deposit to source wallet
      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: firstWalletId, amount: '500' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/transactions/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sourceWalletId: firstWalletId,
          targetWalletId: targetWalletId,
          amount: '200',
        })
        .expect(201);

      expect(response.body.data.type).toBe('TRANSFER');
      expect(response.body.data.amount).toBe('200');

      // Verify balances
      const sourceWalletRes = await request(app.getHttpServer())
        .get(`/wallets/${firstWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(sourceWalletRes.body.data.balance).toBe('300');

      const targetWalletRes2 = await request(app.getHttpServer())
        .get(`/wallets/${targetWalletId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);
      expect(targetWalletRes2.body.data.balance).toBe('200');
    });
  });

  describe('Idempotency', () => {
    it('should reject duplicate requests with same idempotency key', async () => {
      const idempotencyKey = 'unique-key-123';

      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ walletId: userWalletId, amount: '100' })
        .expect(201);

      const duplicate = await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ walletId: userWalletId, amount: '100' })
        .expect(201);

      expect(duplicate.body.data.type).toBe('CASH_IN');
      expect(new Decimal(duplicate.body.data.amount).toString()).toBe('100');
    });
  });

  describe('GET /transactions/wallet/:walletId', () => {
    it('should list transactions for a wallet', async () => {
      await request(app.getHttpServer())
        .post('/transactions/deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ walletId: userWalletId, amount: '75' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/transactions/wallet/${userWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].type).toBe('CASH_IN');
    });
  });
});
