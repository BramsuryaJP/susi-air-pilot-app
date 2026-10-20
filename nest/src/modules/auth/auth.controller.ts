import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }
}
