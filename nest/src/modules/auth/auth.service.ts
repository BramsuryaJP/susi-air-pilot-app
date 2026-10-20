import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { AuthConfig } from '../../config/auth.config.js';
import { PILOT_ID, PILOT_USERNAME } from './auth.constants.js';
import type { LoginDto } from './dto/login.dto.js';

const deriveKey = promisify(scrypt);
const demoPasswordHash = Buffer.from(
  '6c3c6a3c94f51ac111970d72acc52af4cb63e36f35fb138a37accb0bc0c9401dfbbf6b7293a4cb52e82e5657ab89d4f70afdb6a88a118153f25ab8f7d0519940',
  'hex',
);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AuthConfig, true>,
  ) {}

  async login(input: LoginDto) {
    // Derive a key even for an unknown username to avoid a fast rejection path.
    const supplied = (await deriveKey(
      input.password,
      'susi-air-pilot-test-v1',
      64,
    )) as Buffer;
    const validPassword = timingSafeEqual(supplied, demoPasswordHash);
    if (!validPassword || input.username !== PILOT_USERNAME) {
      throw new UnauthorizedException('Invalid username or password.');
    }
    return {
      accessToken: await this.jwt.signAsync({
        sub: PILOT_ID,
        username: PILOT_USERNAME,
      }),
      tokenType: 'Bearer' as const,
      expiresIn: this.config.get('tokenTtlSeconds', { infer: true }),
    };
  }
}
