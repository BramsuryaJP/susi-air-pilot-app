import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';

describe('WelcomeController', () => {
  let welcomeController: WelcomeController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WelcomeController],
      providers: [WelcomeService],
    }).compile();

    welcomeController = app.get<WelcomeController>(WelcomeController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(welcomeController.getHello()).toBe('Hello World!');
    });
  });
});
