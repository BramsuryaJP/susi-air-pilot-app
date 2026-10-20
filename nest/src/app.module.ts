import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadAppConfig } from './config/app.config.js';
import { loadAuthConfig } from './config/auth.config.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FlightHoursModule } from './modules/flight-hours/flight-hours.module.js';
import { PilotModule } from './modules/pilot/pilot.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig, loadAuthConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    PilotModule,
    FlightHoursModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false, value: false },
      }),
    },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
