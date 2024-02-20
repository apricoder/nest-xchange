import { Test, TestingModule } from '@nestjs/testing';
import { ConversionService } from './conversion.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { ExchangeRate } from '../exchange-rates/types/exchange-rate.type';
import { InternalServerErrorException } from '@nestjs/common';

describe('ConversionService', () => {
  let service: ConversionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversionService,
        {
          provide: ExchangeRatesService,
          useValue: {
            getCachedExchangeRate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversionService>(ConversionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTargetAmount', () => {
    describe(`when exchange rate has 'rateBuy' & 'rateSell'`, () => {
      const srcAmount = 1000;

      const rateUahUsd: ExchangeRate = {
        currencyCodeA: 'USD',
        currencyCodeB: 'UAH',
        externalDateUnix: 1708434073,
        rateBuy: 38.3,
        rateSell: 38.7507,
        fetchedAtUnix: 1708462800,
      };

      it(`should divide by 'rateSell' when converting UAH -> USD`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'UAH', 'USD', rateUahUsd);
        expect(targetAmount).toEqual(25.81); // srcAmount / rateSell
      });

      it(`should multiply by 'rateBuy' when converting USD -> UAH`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'USD', 'UAH', rateUahUsd);
        expect(targetAmount).toEqual(38300); // srcAmount * rateBuy
      });
    });

    describe(`when exchange rate only has 'rateCross'`, () => {
      const srcAmount = 1000;

      const ratePlnUah: ExchangeRate = {
        currencyCodeA: 'PLN',
        currencyCodeB: 'UAH',
        externalDateUnix: 1708466352,
        rateCross: 9.6664,
        fetchedAtUnix: 1708466400,
      };

      it(`should divide by 'rateSell' when converting UAH -> PLN`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'UAH', 'PLN', ratePlnUah);
        expect(targetAmount).toEqual(103.45); // srcAmount / rateSell
      });

      it(`should multiply by 'rateBuy' when converting PLN -> UAH`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'PLN', 'UAH', ratePlnUah);
        expect(targetAmount).toEqual(9666.4); // srcAmount * rateBuy
      });
    });

    describe(`when currencies don't match the exchange rate`, () => {
      const srcAmount = 1000;

      const rateUahUsd: ExchangeRate = {
        currencyCodeA: 'USD',
        currencyCodeB: 'UAH',
        externalDateUnix: 1708434073,
        rateBuy: 38.3,
        rateSell: 38.7507,
        fetchedAtUnix: 1708462800,
      };

      it('should throw an exception', () => {
        expect(() => service.calculateTargetAmount(srcAmount, 'UAH', 'PLN', rateUahUsd)).toThrow(
          new InternalServerErrorException(`exchangeRate doesn't match srcCurrency and tgtCurrency`),
        );
      });
    });
  });
});
