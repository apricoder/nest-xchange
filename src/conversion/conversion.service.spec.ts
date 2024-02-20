import * as _ from 'lodash';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversionService } from './conversion.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { ExchangeRate } from '../exchange-rates/types/exchange-rate.type';
import { InternalServerErrorException } from '@nestjs/common';
import { CurrencyCode } from '../currency/types/currency-code.type';

describe('ConversionService', () => {
  let service: ConversionService;
  let ratesService: ExchangeRatesService;

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
    ratesService = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert', () => {
    describe('when cache has relevant exchange rates', () => {
      describe('when cache has direct exchange rate', () => {
        const rateEurUsd: ExchangeRate = {
          currencyCodeA: 'EUR',
          currencyCodeB: 'USD',
          externalDateUnix: 1708434073,
          rateBuy: 1.073,
          rateSell: 1.085,
          fetchedAtUnix: 1708466400,
        };

        beforeEach(() => {
          ratesService.getCachedExchangeRate = jest
            .fn()
            .mockImplementation((srcCurr: CurrencyCode, tgtCurr: CurrencyCode) => {
              if (_.isEqual([srcCurr, tgtCurr].sort(), ['EUR', 'USD'].sort())) {
                return rateEurUsd;
              }
            });
        });

        it('should call ratesService.getCachedExchangeRate with correct params', async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.getCachedExchangeRate).toHaveBeenCalledTimes(1);
          expect(ratesService.getCachedExchangeRate).toHaveBeenCalledWith('EUR', 'USD');
        });

        it('should return correct target amount when converting EUR -> USD', async () => {
          const tgtAmount = await service.convert('EUR', 'USD', 1000);
          expect(tgtAmount).toEqual(1073); // srcAmount * rateBuy
        });

        it('should return correct target amount when converting USD -> EUR', async () => {
          const tgtAmount = await service.convert('USD', 'EUR', 1000);
          expect(tgtAmount).toEqual(921.66); // srcAmount / rateSell
        });
      });
    });
  });

  describe('calculateTargetAmount', () => {
    describe(`when exchange rate has 'rateBuy' & 'rateSell'`, () => {
      const srcAmount = 1000;

      const rateUsdUah: ExchangeRate = {
        currencyCodeA: 'USD',
        currencyCodeB: 'UAH',
        externalDateUnix: 1708434073,
        rateBuy: 38.3,
        rateSell: 38.7507,
        fetchedAtUnix: 1708462800,
      };

      it(`should divide by 'rateSell' when converting UAH -> USD`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'UAH', 'USD', rateUsdUah);
        expect(targetAmount).toEqual(25.81); // srcAmount / rateSell
      });

      it(`should multiply by 'rateBuy' when converting USD -> UAH`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'USD', 'UAH', rateUsdUah);
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
