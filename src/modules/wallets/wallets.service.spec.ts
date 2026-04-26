import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SeedService } from 'src/modules/seed/seed.service';
import { ConfigService } from '@nestjs/config';
import { AppModule } from 'src/app.module';

describe('WalletsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let userToken: string;
  let userId: string;
  let createdWalletId: string;
  
  const testUser = { email: 'wallet.user@example.com', password: 'Password123!' };
  const targetCurrencyCode = 'EUR'; 

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    
    dataSource = app.get(DataSource);
    
    await dataSource.query('TRUNCATE TABLE users, currencies, wallets CASCADE');
    
    const seedService = app.get(SeedService);
    await seedService.onModuleInit();

    const configService = app.get(ConfigService);
    const adminEmail = configService.get<string>('ADMIN_SEED_EMAIL');
    const adminPassword = configService.get<string>('ADMIN_SEED_PASSWORD');

    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = adminLoginRes.body.access_token;

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201); 
    
    userToken = registerRes.body.access_token;
    userId = registerRes.body.user.id;

    await request(app.getHttpServer())
      .post('/currencies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: targetCurrencyCode,
        name: 'Euro',
        symbol: '€',
        type: 'FIAT',
        decimals: 2,
      })
      .expect(201);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/wallets (POST)', () => {
    it('should create a new wallet for the logged in user', async () => {
      const response = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currencyCode: targetCurrencyCode })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(userId);
      expect(response.body.currency.code).toBe(targetCurrencyCode);
      expect(response.body.balance).toBe('0');
      
      createdWalletId = response.body.id; 
    });

    it('should return 409 Conflict if user already has a wallet for this currency', async () => {
      await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currencyCode: targetCurrencyCode })
        .expect(409);
    });

    it('should return 404 Not Found if currency code does not exist', async () => {
      await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currencyCode: 'FAKECURR' })
        .expect(404);
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      await request(app.getHttpServer())
        .post('/wallets')
        .send({ currencyCode: targetCurrencyCode })
        .expect(401);
    });
  });

  describe('/wallets/me (GET)', () => {
    it('should return an array of wallets for the current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/wallets/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].userId).toBe(userId);
    });
  });

  describe('/wallets/:id (GET)', () => {
    it('should return the wallet if requested by the owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/wallets/${createdWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdWalletId);
    });

    it('should return the wallet if requested by an ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get(`/wallets/${createdWalletId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdWalletId);
    });

    it('should return 403 Forbidden if another regular user tries to access it', async () => {
      const intruderRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'intruder@test.com', password: 'Password123!' }) 
        .expect(201); 
      
      const intruderToken = intruderRes.body.access_token;

      await request(app.getHttpServer())
        .get(`/wallets/${createdWalletId}`)
        .set('Authorization', `Bearer ${intruderToken}`)
        .expect(403);
    });

    it('should return 400 Bad Request if ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .get('/wallets/invalid-uuid-string')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('/wallets (GET)', () => {
    it('should allow ADMIN to fetch all wallets', async () => {
      const response = await request(app.getHttpServer())
        .get('/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 Forbidden for a regular user', async () => {
      await request(app.getHttpServer())
        .get('/wallets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/wallets/:id (DELETE)', () => {
    it('should allow owner to soft delete a wallet with 0 balance', async () => {
      await request(app.getHttpServer())
        .delete(`/wallets/${createdWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204); 
    });

    it('should return 404 Not Found for a deleted wallet', async () => {
      await request(app.getHttpServer())
        .get(`/wallets/${createdWalletId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});