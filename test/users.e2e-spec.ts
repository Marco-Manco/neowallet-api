import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SeedService } from 'src/modules/seed/seed.service';
import { ConfigService } from '@nestjs/config';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE users CASCADE');
    const seedService = app.get(SeedService);
    await seedService.onModuleInit();
  });

  describe('Protected Routes - Own Profile (/users/me)', () => {
    let userToken: string;
    const userDto = { email: 'me@example.com', password: 'password123' };

    beforeEach(async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userDto)
        .expect(201);
      
      userToken = registerRes.body.access_token;
    });

    it('(GET) should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe(userDto.email);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('(GET) should return 401 Unauthorized if token is missing', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('(DELETE) should soft delete current user account', async () => {
      await request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
        
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404); 
    });
  });


  describe('Protected Routes - Admin Access', () => {
    let adminToken: string;
    let regularToken: string;
    let targetUserId: string;

    beforeEach(async () => {
      const configService = app.get(ConfigService);
      const adminEmail = configService.get<string>('ADMIN_SEED_EMAIL');
      const adminPassword = configService.get<string>('ADMIN_SEED_PASSWORD');

      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password: adminPassword })
        .expect(201);
        
      adminToken = adminLogin.body.access_token;

      const userDto = { email: 'user@example.com', password: 'userpassword123' };
      
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userDto)
        .expect(201);

      targetUserId = registerRes.body.user.id; 
      regularToken = registerRes.body.access_token;
    });

    it('(GET /users) Admin should be able to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2); 
    });

    it('(GET /users) Regular user should be forbidden (403)', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('(GET /users/:id) Admin can fetch a specific user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(targetUserId);
      expect(response.body.email).toBe('user@example.com');
    });

    it('(DELETE /users/:id) Admin can delete a specific user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('(DELETE /users/:id) Regular user should be forbidden (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });
  });
});