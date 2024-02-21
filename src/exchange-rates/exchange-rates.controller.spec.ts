import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('ExchangeRatesController', () => {
  let controller: ExchangeRatesController;
  let ratesService: ExchangeRatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeRatesController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => `${key}-value-from-config`),
          },
        },
        {
          provide: ExchangeRatesService,
          useValue: {
            refreshExchangeRatesCache: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExchangeRatesController>(ExchangeRatesController);
    ratesService = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('triggerExchangeRatesRefresh', () => {
    const legitKey = 'exchangeRates.triggerRefreshKey-value-from-config';

    it('should be defined', () => {
      expect(controller.triggerExchangeRatesRefresh).toBeDefined();
    });

    it(`should throw if key doesn't match`, async () => {
      await expect(controller.triggerExchangeRatesRefresh('random-key')).rejects.toEqual(new NotFoundException());
    });

    it(`should not throw if key matches`, async () => {
      await expect(controller.triggerExchangeRatesRefresh(legitKey)).resolves.toBeUndefined();
    });

    it('should call ratesService.refreshExchangeRatesCache with correct params', async () => {
      await controller.triggerExchangeRatesRefresh(legitKey);

      expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledTimes(1);
      expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledWith({ silentLog: false });
    });
  });
});
