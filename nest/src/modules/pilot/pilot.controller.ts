import { Controller, Get, Header } from '@nestjs/common';
import { PilotService } from './pilot.service.js';

@Controller('pilot')
export class PilotController {
  constructor(private readonly pilot: PilotService) {}

  @Get('me')
  @Header('Cache-Control', 'private, no-store')
  me() {
    return this.pilot.getProfile();
  }
}
