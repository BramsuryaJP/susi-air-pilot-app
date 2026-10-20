import { Injectable } from '@nestjs/common';

@Injectable()
export class WelcomeService {
  getHello(): string {
    return 'Hello World!';
  }
}
