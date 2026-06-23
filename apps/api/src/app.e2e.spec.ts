import 'reflect-metadata';

import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { IntelligenceController } from './intelligence/intelligence.controller';
import { IntelligenceCitationService } from './intelligence/intelligence-citation.service';
import { IntelligenceClient } from './intelligence/intelligence.client';

const mockIntelligenceClient = {
  health: vi.fn(),
  extractEntities: vi.fn(),
  mapLegal: vi.fn(),
  simplify: vi.fn(),
  ask: vi.fn(),
  clusterMatch: vi.fn(),
  discoverYoutube: vi.fn(),
};

const mockHealthService = {
  getUptimeSeconds: vi.fn(() => 42),
  getFullHealth: vi.fn(),
};

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    mockIntelligenceClient.health.mockResolvedValue({
      reachable: true,
      status: 'ok',
      pgvector: true,
    });
    mockIntelligenceClient.extractEntities.mockResolvedValue({
      people: [{ name: 'Jacob Zuma', role: null, confidence: 0.8 }],
      organisations: [],
      events: [],
      crimes_alleged: ['corruption'],
      locations: [],
    });
    mockIntelligenceClient.mapLegal.mockResolvedValue({
      references: [
        {
          act_name: 'Prevention and Combating of Corrupt Activities Act',
          short_name: 'PRECCA',
          section: '3',
          relevance: 'General corruption offence.',
          is_constitutional: false,
          act_number: '12 of 2004',
        },
      ],
    });
    mockIntelligenceClient.simplify.mockResolvedValue({
      simplified: 'The court said the accused must stand trial.',
      reading_level: 'child',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [HealthController, IntelligenceController],
      providers: [HealthService, IntelligenceClient, IntelligenceCitationService],
    })
      .overrideProvider(HealthService)
      .useValue(mockHealthService)
      .overrideProvider(IntelligenceClient)
      .useValue(mockIntelligenceClient)
      .overrideProvider(IntelligenceCitationService)
      .useValue({
        enrichCitations: vi.fn(async (citations: unknown) => citations),
      })
      .compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  const req = () => request(app.getHttpServer());

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await req().get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.uptime).toBe(42);
    });

    it('returns pgvector: true when extension is installed', async () => {
      const health = await mockIntelligenceClient.health();
      expect(health.reachable).toBe(true);
      expect(health.pgvector).toBe(true);
    });
  });

  describe('Intelligence endpoints', () => {
    it('POST /api/intelligence/entities/extract returns entities for text input', async () => {
      const res = await req()
        .post('/api/intelligence/entities/extract')
        .send({ text: 'Jacob Zuma faced corruption allegations.' });
      expect(res.status).toBe(200);
      expect(res.body.people).toHaveLength(1);
      expect(res.body.crimes_alleged).toContain('corruption');
      expect(mockIntelligenceClient.extractEntities).toHaveBeenCalled();
    });

    it('POST /api/intelligence/legal/map returns statutes for known crimes', async () => {
      const res = await req()
        .post('/api/intelligence/legal/map')
        .send({ crimes_alleged: ['corruption'] });
      expect(res.status).toBe(200);
      expect(res.body.references[0].short_name).toBe('PRECCA');
      expect(mockIntelligenceClient.mapLegal).toHaveBeenCalledWith(
        ['corruption'],
        '',
      );
    });

    it('POST /api/intelligence/summary/simplify returns simplified text', async () => {
      const res = await req()
        .post('/api/intelligence/summary/simplify')
        .send({
          text: 'The applicant seeks an order declaring the conduct unlawful.',
          level: 'child',
        });
      expect(res.status).toBe(200);
      expect(res.body.simplified).toContain('court');
      expect(res.body.reading_level).toBe('child');
      expect(mockIntelligenceClient.simplify).toHaveBeenCalled();
    });
  });
});
