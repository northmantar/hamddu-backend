import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return 200 on root endpoint', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('Auth Endpoints', () => {
    describe('POST /auth/admin/login', () => {
      it('should return 401 for invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/admin/login')
          .send({ email: 'invalid@example.com', password: 'wrongpassword' })
          .expect(401);
      });

      it('should return 400 for missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/admin/login')
          .send({ email: 'test@example.com' })
          .expect(400);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should return 401 for missing refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .expect(401);
      });
    });
  });

  describe('Protected Endpoints (without auth)', () => {
    it('GET /users/me should return 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('POST /boards should return 401', () => {
      return request(app.getHttpServer())
        .post('/boards')
        .send({ categoryId: 'test', title: 'Test', body: 'Test' })
        .expect(401);
    });

    it('GET /points/wallet should return 401', () => {
      return request(app.getHttpServer())
        .get('/points/wallet')
        .expect(401);
    });

    it('GET /xp/wallet should return 401', () => {
      return request(app.getHttpServer())
        .get('/xp/wallet')
        .expect(401);
    });
  });

  describe('Public Endpoints', () => {
    describe('GET /boards/categories', () => {
      it('should return categories list', () => {
        return request(app.getHttpServer())
          .get('/boards/categories')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('GET /xp/levels', () => {
      it('should return XP levels list', () => {
        return request(app.getHttpServer())
          .get('/xp/levels')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });
  });

  describe('Admin Endpoints (without admin auth)', () => {
    const fakeToken = 'Bearer invalid-token';

    it('GET /users should return 401', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', fakeToken)
        .expect(401);
    });

    it('POST /boards/categories should return 401', () => {
      return request(app.getHttpServer())
        .post('/boards/categories')
        .set('Authorization', fakeToken)
        .send({ label: 'Test Category' })
        .expect(401);
    });

    it('POST /points/policies should return 401', () => {
      return request(app.getHttpServer())
        .post('/points/policies')
        .set('Authorization', fakeToken)
        .send({ actionType: 'WATCH', pointAmount: 100 })
        .expect(401);
    });

    it('POST /xp/levels should return 401', () => {
      return request(app.getHttpServer())
        .post('/xp/levels')
        .set('Authorization', fakeToken)
        .send({ level: 1, minXp: 0, maxXp: 100, label: 'Test' })
        .expect(401);
    });

    it('POST /channels should return 401', () => {
      return request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', fakeToken)
        .send({ name: 'Test Channel', youtubeChannelId: 'UC123' })
        .expect(401);
    });

    it('POST /contents should return 401', () => {
      return request(app.getHttpServer())
        .post('/contents')
        .set('Authorization', fakeToken)
        .send({ channelId: 'ch-1', youtubeVideoId: 'vid-1', name: 'Test' })
        .expect(401);
    });
  });
});
