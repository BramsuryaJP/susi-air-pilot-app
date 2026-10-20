import { describe, expect, it } from 'vitest';
import { loadAuthConfig } from './auth.config.js';

describe('authentication configuration', () => {
  it('generates independent development secrets without a fixed fallback key', () => {
    const first = loadAuthConfig({ NODE_ENV: 'development' });
    const second = loadAuthConfig({ NODE_ENV: 'development' });
    expect(first.jwtSecret.length).toBeGreaterThanOrEqual(32);
    expect(first.jwtSecret).not.toBe(second.jwtSecret);
    expect(first.tokenTtlSeconds).toBe(1800);
  });

  it.each([undefined, 'short', ' '.repeat(32)])(
    'rejects an unsafe production secret',
    (secret) => {
      expect(() =>
        loadAuthConfig({ NODE_ENV: 'production', JWT_SECRET: secret }),
      ).toThrow('JWT_SECRET');
    },
  );

  it('accepts an explicit production secret', () => {
    const secret = 'test-only-production-key-with-at-least-32-characters';
    expect(
      loadAuthConfig({ NODE_ENV: 'production', JWT_SECRET: secret }).jwtSecret,
    ).toBe(secret);
  });

  it('allows the blank development example to use a random secret', () => {
    expect(
      loadAuthConfig({ NODE_ENV: 'development', JWT_SECRET: '' }).jwtSecret
        .length,
    ).toBeGreaterThanOrEqual(32);
  });
});
