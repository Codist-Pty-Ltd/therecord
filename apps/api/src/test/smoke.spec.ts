import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../app.module';

/**
 * Contract / smoke tests — verify HTTP status codes and response shapes,
 * not seeded data content. Requires a running PostgreSQL with migrations
 * applied (see CI `api-smoke-test` job).
 */
describe('API Smoke Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  const req = () => request(app.getHttpServer());

  describe('Health', () => {
    it('GET /api/health returns 200', async () => {
      const res = await req().get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('Stories', () => {
    it('GET /api/stories returns paginated list', async () => {
      const res = await req().get('/api/stories');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/stories/nonexistent returns 404', async () => {
      const res = await req().get('/api/stories/this-does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('Commissions', () => {
    it('GET /api/commissions returns list', async () => {
      const res = await req().get('/api/commissions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('People', () => {
    it('GET /api/people returns list', async () => {
      const res = await req().get('/api/people');
      expect(res.status).toBe(200);
    });

    it('GET /api/people/nonexistent returns 404', async () => {
      const res = await req().get(
        '/api/people/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('Search', () => {
    it('GET /api/search requires q param', async () => {
      const res = await req().get('/api/search');
      expect(res.status).toBe(400);
    });

    it('GET /api/search?q=x returns 400 (too short)', async () => {
      const res = await req().get('/api/search?q=x');
      expect(res.status).toBe(400);
    });

    it('GET /api/search?q=commission returns results shape', async () => {
      const res = await req().get('/api/search?q=commission');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('query');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.results)).toBe(true);
    });
  });

  describe('SIU', () => {
    it('GET /api/siu/stats returns financial shape', async () => {
      const res = await req().get('/api/siu/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_civil_litigation_rands');
    });
  });

  describe('Legal', () => {
    it('GET /api/legal/laws returns list', async () => {
      const res = await req().get('/api/legal/laws');
      expect(res.status).toBe(200);
    });

    it('GET /api/legal/constitution returns list', async () => {
      const res = await req().get('/api/legal/constitution');
      expect(res.status).toBe(200);
    });
  });

  describe('Ingestion guard', () => {
    it('POST /api/ingestion/article without key returns 401', async () => {
      const res = await req().post('/api/ingestion/article').send({});
      expect(res.status).toBe(401);
    });
  });
});
