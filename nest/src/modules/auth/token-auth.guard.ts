import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PILOT_ID, PILOT_USERNAME } from './auth.constants.js';
import { PUBLIC_ROUTE } from './public.decorator.js';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const header = context.switchToHttp().getRequest<Request>()
      .headers.authorization;
    const match =
      typeof header === 'string' ? /^Bearer ([^\s]+)$/i.exec(header) : null;
    if (!match) throw new UnauthorizedException('Please sign in to continue.');
    try {
      const payload = await this.jwt.verifyAsync<{
        sub?: string;
        username?: string;
        exp?: number;
      }>(match[1]);
      if (
        payload.sub !== PILOT_ID ||
        payload.username !== PILOT_USERNAME ||
        typeof payload.exp !== 'number'
      )
        throw new Error('Invalid pilot identity.');
      return true;
    } catch {
      throw new UnauthorizedException(
        'Your session is invalid or has expired. Please sign in again.',
      );
    }
  }
}
