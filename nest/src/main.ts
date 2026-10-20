import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/app.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  app.enableShutdownHooks();
  await app.listen(config.get('port', { infer: true }));
}
// Serverless adapters must finish importing before starting the captured listener.
void bootstrap();
