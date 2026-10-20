import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadAppConfig } from './config/app.config.js';
import { WelcomeModule } from './modules/welcome/welcome.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadAppConfig] }),
    WelcomeModule,
  ],
})
export class AppModule {}
