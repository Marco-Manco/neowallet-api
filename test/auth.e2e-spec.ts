import { Test, TestingModule } from '@nestjs/testing';
import { configureTestApp } from './utils/configure-test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testUser = {
    email: 'login.test@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureTestApp(app);
    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.query(`TRUNCATE TABLE users CASCADE;`); 
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a user successfully and return access_token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');

      expect(response.body.data).toHaveProperty('access_token');
      expect(typeof response.body.data.access_token).toBe('string');
    });

    it('should return 409 Conflict if email is already taken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.error.message).toBe('Email is already registered');
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully and return a JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201); 

      expect(response.body.data).toHaveProperty('access_token');
      expect(typeof response.body.data.access_token).toBe('string');
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999!',
        })
        .expect(401);
    });

    it('should return 401 Unauthorized for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'ghost@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });
});