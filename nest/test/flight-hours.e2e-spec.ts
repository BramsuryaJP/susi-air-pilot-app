import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('flight hours (HTTP)', () => {
  let app: INestApplication<App>;
  let token: string;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    token = app
      .get(JwtService)
      .sign({ sub: 'pilot-johndoe', username: 'johndoe' });
  });
  afterAll(async () => {
    await app.close();
  });

  it.each([
    '/flight-hours?from=2026-05-15&to=2026-05-15',
    '/flight-hours/summary?range=1w',
  ])('protects %s with the existing global guard', async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
  });

  it('returns private, minimal daily data', async () => {
    const response = await request(app.getHttpServer())
      .get('/flight-hours?from=2026-05-15&to=2026-05-16')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.body.days).toHaveLength(2);
    expect(response.body.days[0]).toEqual({
      date: '2026-05-15',
      hours: 6.4,
      isProjection: false,
    });
  });

  it.each(['1w', '1m', '3m', '6m', '1y'])(
    'returns a 15-point %s summary with server-derived cards',
    async (range) => {
      const response = await request(app.getHttpServer())
        .get(`/flight-hours/summary?range=${range}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(response.body.series).toHaveLength(15);
      expect(response.body.cards).toHaveLength(4);
      expect(response.body.series[7].isToday).toBe(true);
      expect(response.headers['cache-control']).toContain('no-store');
    },
  );

  it.each([
    '/flight-hours',
    '/flight-hours?from=2026-02-29&to=2026-03-01',
    '/flight-hours?from=2026-04-31&to=2026-05-01',
    '/flight-hours?from=2026-5-01&to=2026-05-02',
    '/flight-hours?from=2026-05-16&to=2026-05-15',
    '/flight-hours?from=2024-01-01&to=2026-05-15',
    '/flight-hours?from=2026-05-15&to=2026-05-15&extra=x',
    '/flight-hours?from=2026-05-15&from=2026-05-16&to=2026-05-16',
    '/flight-hours/summary',
    '/flight-hours/summary?range=2w',
    '/flight-hours/summary?range=1w&range=1m',
    '/flight-hours/summary?range=1w&extra=x',
  ])('rejects invalid query %s through the uniform filter', async (path) => {
    const response = await request(app.getHttpServer())
      .get(path)
      .auth(token, { type: 'bearer' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: { code: 'BAD_REQUEST' },
    });
  });
});
