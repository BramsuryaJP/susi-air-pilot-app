import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AuthConfig } from '../../config/auth.config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenAuthGuard } from './token-auth.guard.js';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from './auth.constants.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AuthConfig, true>) => ({
        secret: config.get('jwtSecret', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get('tokenTtlSeconds', { infer: true }),
          issuer: TOKEN_ISSUER,
          audience: TOKEN_AUDIENCE,
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: TOKEN_ISSUER,
          audience: TOKEN_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: TokenAuthGuard }],
})
export class AuthModule {}
