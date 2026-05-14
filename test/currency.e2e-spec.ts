import { Test, TestingModule } from '@nestjs/testing';
import { configureTestApp } from './utils/configure-test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SeedService } from 'src/modules/seed/seed.service';
import { ConfigService } from '@nestjs/config';
import { CurrencyType } from '../src/modules/currencies/enums/currency-type.enum';

describe('CurrenciesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

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
    await dataSource.query('TRUNCATE TABLE users, currencies CASCADE');
    
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

    const userDto = { email: 'user@example.com', password: 'Password123!' };
    
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userDto)
      .expect(201);
      
    userToken = registerRes.body.data.access_token;
  });

  describe('POST /currencies', () => {
    const newCurrency = {
      code: 'USD',
      name: 'United States Dollar',
      symbol: '$',
      type: CurrencyType.FIAT,
      decimals: 2,
    };

    it('should allow Admin to create a currency', async () => {
      const response = await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCurrency)
        .expect(201);

      expect(response.body.data.code).toBe('USD');
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 403 Forbidden for normal User', async () => {
      await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newCurrency)
        .expect(403);
    });

    it('should return 409 Conflict if code already exists', async () => {
      const duplicateCurrency = { ...newCurrency, code: 'ARS' };

      const response = await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateCurrency)
        .expect(409);

      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('GET /currencies', () => {
    it('should allow any authenticated user to list currencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/currencies')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/currencies')
        .expect(401);
    });
  });

  describe('PATCH /currencies/:id', () => {
    it('should allow Admin to update a currency', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'GBP', name: 'Pound', type: CurrencyType.FIAT, decimals: 2 })
        .expect(201);

      const currencyId = createRes.body.data.id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/currencies/${currencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'British Pound' })
        .expect(200);

      expect(updateRes.body.data.name).toBe('British Pound');
    });
  });

  describe('DELETE /currencies/:id', () => {
    it('should allow Admin to soft delete a currency', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'TEMP', name: 'Delete Me', type: CurrencyType.FIAT, decimals: 2 })
        .expect(201);

      const currencyId = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/currencies/${currencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const listRes = await request(app.getHttpServer())
        .get('/currencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const found = listRes.body.data.find((c: any) => c.id === currencyId);
      expect(found).toBeUndefined();
    });
  });
});