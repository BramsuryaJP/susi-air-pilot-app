import { Controller, Get, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

@Controller('failure')
class FailureController {
  @Get()
  fail() {
    throw new Error('Internal diagnostic information');
  }
}

describe('pilot authentication (HTTP)', () => {
  let app: INestApplication<App>;
  const credentials = { username: 'johndoe', password: 'susiairtest' };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [FailureController],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function login() {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);
  }

  it('issues a bounded bearer token and returns the seeded profile only with authentication', async () => {
    const result = await login();
    expect(result.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 1800 });
    expect(result.body.accessToken).toEqual(expect.any(String));
    expect(result.headers['cache-control']).toContain('no-store');
    const claims = app.get(JwtService).decode(result.body.accessToken);
    expect(claims.exp - claims.iat).toBe(1800);
    const profile = await request(app.getHttpServer())
      .get('/pilot/me')
      .auth(result.body.accessToken, { type: 'bearer' })
      .expect(200);
    expect(profile.body).toEqual({
      name: 'John Doe',
      totalFlightHours: 1444.5,
      avatarUrl: '/pilot-avatar.svg',
      today: '2026-05-15',
    });
    expect(profile.headers['cache-control']).toContain('no-store');
    expect(JSON.stringify(profile.body)).not.toMatch(
      /password|accessToken|jwtSecret/,
    );
  });

  it.each([
    { username: 'unknown', password: 'susiairtest' },
    { username: 'johndoe', password: 'incorrect' },
  ])('uses the same safe credential error for %j', async (body) => {
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(401);
    expect(result.body).toMatchObject({
      statusCode: 401,
      path: '/auth/login',
      error: { code: 'UNAUTHORIZED', message: 'Invalid username or password.' },
    });
    expect(result.headers['cache-control']).toContain('no-store');
  });

  it.each([
    {},
    { username: 42, password: 'x' },
    { ...credentials, role: 'admin' },
    { username: 'x'.repeat(65), password: 'x' },
    { username: 'johndoe', password: 'x'.repeat(129) },
    { username: 'johndoe', password: '' },
  ])('rejects malformed credentials', async (body) => {
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(400);
    expect(result.body.error.code).toBe('BAD_REQUEST');
  });

  it.each([undefined, 'Bearer invalid', 'Basic anything', 'Bearer one extra'])(
    'rejects a missing or malformed Authorization header',
    async (header) => {
      const call = request(app.getHttpServer()).get('/pilot/me');
      if (header) call.set('Authorization', header);
      const result = await call.expect(401);
      expect(result.body.error.code).toBe('UNAUTHORIZED');
    },
  );

  it.each(['expired', 'subject', 'audience', 'algorithm', 'signature'])(
    'rejects a token with an invalid %s',
    async (variant) => {
      const jwt = app.get(JwtService);
      const payload = {
        sub: variant === 'subject' ? 'another-pilot' : 'pilot-johndoe',
        username: 'johndoe',
      };
      let token = jwt.sign(payload, {
        ...(variant === 'expired' ? { expiresIn: -1 } : {}),
        ...(variant === 'audience' ? { audience: 'another-application' } : {}),
        ...(variant === 'algorithm' ? { algorithm: 'HS384' as const } : {}),
        ...(variant === 'signature'
          ? { secret: 'an-unrelated-signing-key-with-at-least-32-characters' }
          : {}),
      });
      await request(app.getHttpServer())
        .get('/pilot/me')
        .auth(token, { type: 'bearer' })
        .expect(401);
    },
  );

  it('applies the guard globally and hides unexpected exception details', async () => {
    await request(app.getHttpServer()).get('/failure').expect(401);
    const { body } = await login();
    const result = await request(app.getHttpServer())
      .get('/failure')
      .auth(body.accessToken, { type: 'bearer' })
      .expect(500);
    expect(result.body.error).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    });
    expect(JSON.stringify(result.body)).not.toContain('diagnostic');
  });

  it('limits repeated login attempts without trusting forwarded client IPs', async () => {
    for (let index = 0; index < 5; index++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', `192.0.2.${index + 1}`)
        .send({ username: 'johndoe', password: 'incorrect' })
        .expect(401);
    }
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '192.0.2.100')
      .send(credentials)
      .expect(429);
    expect(result.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
