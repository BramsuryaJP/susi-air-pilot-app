import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('schedules (HTTP)', () => {
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

  it('requires authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/schedules?year=2026&month=05')
      .expect(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
  it.each(['5', '05'])(
    'returns one private month using month=%s',
    async (month) => {
      const response = await request(app.getHttpServer())
        .get(`/schedules?year=2026&month=${month}`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toMatchObject({
        year: 2026,
        month: 5,
        today: '2026-05-15',
      });
      expect(response.body.schedules).toHaveLength(21);
      expect(response.body.legend).toHaveLength(10);
      expect(
        response.body.schedules.every((entry: { duty_date: string }) =>
          entry.duty_date.startsWith('2026-05-'),
        ),
      ).toBe(true);
    },
  );
  it.each([
    '',
    'year=2026',
    'month=5',
    'year=2026&month=0',
    'year=2026&month=13',
    'year=2026&month=1.5',
    'year=2026&month=5x',
    'year=2026&month=005',
    'year=26&month=5',
    'year=0000&month=5',
    'year=10000&month=5',
    'year=2e3&month=5',
    'year=2026.0&month=5',
    'year=2026&month=5&month=6',
    'year=2026&year=2027&month=5',
    'year=2026&month=5&today=2099-01-01',
  ])('rejects invalid query %s', async (query) => {
    const response = await request(app.getHttpServer())
      .get(`/schedules?${query}`)
      .auth(token, { type: 'bearer' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: { code: 'BAD_REQUEST' },
    });
  });
});
