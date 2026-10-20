import { Module } from '@nestjs/common';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';

@Module({
  controllers: [WelcomeController],
  providers: [WelcomeService],
})
export class WelcomeModule {}
