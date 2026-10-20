import { randomBytes } from 'node:crypto';

export interface AuthConfig {
  jwtSecret: string;
  tokenTtlSeconds: number;
}

export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): AuthConfig {
  const jwtSecret =
    env.JWT_SECRET?.trim() ||
    (env.NODE_ENV === 'production' ? '' : randomBytes(32).toString('hex'));
  if (jwtSecret.trim().length < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 non-padding characters.',
    );
  }
  return { jwtSecret, tokenTtlSeconds: 1800 };
}
