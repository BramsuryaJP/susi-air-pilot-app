import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import data from '../../data/mock-flight-hours.json' with { type: 'json' };
import type { AppConfig } from '../../config/app.config.js';

@Injectable()
export class PilotService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  getProfile() {
    return {
      ...data.pilot,
      avatarUrl: '/pilot-avatar.svg',
      today: this.config.get('businessDate', { infer: true }),
    };
  }
}
