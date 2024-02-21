import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`getPong`, () => {

    it('should be defined', () => {
      expect(controller.getPong).toBeDefined();
    });

    it(`should return 'pong'`, () => {
      expect(controller.getPong()).toEqual(`pong`);
    });
  });
});
