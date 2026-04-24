import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testUser = {
    email: 'login.test@example.com',
    password: 'Password123!',
    firstName: 'Login',
    lastName: 'Test',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.query(`TRUNCATE TABLE users CASCADE;`); 

    await request(app.getHttpServer())
      .post('/users')
      .send(testUser)
      .expect(201);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
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

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
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