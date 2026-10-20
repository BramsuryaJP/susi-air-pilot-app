import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('documents (HTTP)', () => {
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

  it.each([undefined, 'Bearer invalid'])(
    'requires a valid session',
    async (authorization) => {
      const call = request(app.getHttpServer()).get('/documents');
      if (authorization) call.set('Authorization', authorization);
      const response = await call.expect(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        path: '/documents',
        error: { code: 'UNAUTHORIZED' },
      });
    },
  );

  it('returns seeded document metadata with server-derived urgency and no-store headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/documents')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.body).toMatchObject({
      today: '2026-05-15',
      warningDays: 30,
    });
    expect(response.body.documents).toHaveLength(5);
    expect(
      response.body.documents.find(
        (document: { id: string }) => document.id === 'doc_security',
      ),
    ).toEqual({
      id: 'doc_security',
      label: 'Security Clearance Exp. Date',
      expiryDate: '2026-05-01',
      daysRemaining: -14,
      status: 'expired',
    });
    expect(
      response.body.documents.map(
        (document: { status: string }) => document.status,
      ),
    ).toEqual(['safe', 'safe', 'soon', 'soon', 'expired']);
  });

  it('does not let browser query parameters override the business date or urgency threshold', async () => {
    const response = await request(app.getHttpServer())
      .get('/documents?today=2099-01-01&warningDays=0')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).toMatchObject({
      today: '2026-05-15',
      warningDays: 30,
    });
    expect(response.body.documents[2]).toMatchObject({
      daysRemaining: 14,
      status: 'soon',
    });
  });
});
