import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('deployment health (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves a minimal non-cacheable health response without credentials', async () => {
    const result = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(result.body).toEqual({ status: 'ok' });
    expect(result.headers['cache-control']).toBe('no-store');
  });

  it.each(['/health', '/pilot/me', '/missing-security-route'])(
    'sets security headers before processing %s',
    async (path) => {
      const result = await request(app.getHttpServer()).get(path);
      expect(result.headers['x-content-type-options']).toBe('nosniff');
      expect(result.headers['x-frame-options']).toBe('DENY');
      expect(result.headers['referrer-policy']).toBe('no-referrer');
      expect(result.headers['content-security-policy']).toContain(
        "default-src 'none'",
      );
    },
  );

  it.each([
    '/pilot/me',
    '/documents',
    '/schedules?year=2026&month=5',
    '/flight-hours/summary?range=1w',
  ])('keeps pilot route %s protected', async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
  });
});
