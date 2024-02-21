import * as _ from 'lodash';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversionService } from './conversion.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { ExchangeRate, ExchangeRatesMap } from '../exchange-rates/types/exchange-rate.type';
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
            fetchLatestExchangeRatesMap: jest.fn(),
            refreshExchangeRatesCache: jest.fn(),
            getCurrencyPairKey: jest.fn().mockImplementation((a, b) => [a, b].sort().join(`-`)),
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
    const rateEurUsd: ExchangeRate = {
      currencyCodeA: 'EUR',
      currencyCodeB: 'USD',
      externalDateUnix: 1708434073,
      rateBuy: 1.073,
      rateSell: 1.085,
      fetchedAtUnix: 1708466400,
    };

    const rateEurUah: ExchangeRate = {
      currencyCodeA: 'EUR',
      currencyCodeB: 'UAH',
      externalDateUnix: 1708466473,
      rateBuy: 41.25,
      rateSell: 41.9903,
      fetchedAtUnix: 1708470000,
    };

    const rateUsdUah: ExchangeRate = {
      currencyCodeA: 'USD',
      currencyCodeB: 'UAH',
      externalDateUnix: 1708434073,
      rateBuy: 38.3,
      rateSell: 38.7507,
      fetchedAtUnix: 1708462800,
    };

    it('should be defined', () => {
      expect(service.convert).toBeDefined();
    });

    describe('when exchange rate is available in cache', () => {
      describe('direct conversion with cache', () => {
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

        it(`should not call ratesService.fetchLatestExchangeRatesMap`, async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.fetchLatestExchangeRatesMap).not.toHaveBeenCalled();
        });

        it('should return correct target amount when converting EUR -> USD', async () => {
          const conversionResult = await service.convert('EUR', 'USD', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 1073, // srcAmount * rateBuy
            conversion: 'direct',
          });
        });

        it('should return correct target amount when converting USD -> EUR', async () => {
          const conversionResult = await service.convert('USD', 'EUR', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 921.66, // srcAmount / rateSell
            conversion: 'direct',
          });
        });
      });

      describe('double conversion with cache', () => {
        beforeEach(() => {
          ratesService.getCachedExchangeRate = jest
            .fn()
            .mockImplementation((srcCurr: CurrencyCode, tgtCurr: CurrencyCode) => {
              if (_.isEqual([srcCurr, tgtCurr].sort(), ['EUR', 'UAH'].sort())) {
                return rateEurUah;
              }
              if (_.isEqual([srcCurr, tgtCurr].sort(), ['USD', 'UAH'].sort())) {
                return rateUsdUah;
              }
            });
        });

        it('should call ratesService.getCachedExchangeRate with correct params', async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.getCachedExchangeRate).toHaveBeenCalledTimes(3);

          // first should try to get direct rate
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(1, 'EUR', 'USD');

          // then 2 more calls to get indirect rates with uah
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(2, 'EUR', 'UAH');
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(3, 'USD', 'UAH');
        });

        it(`should not call ratesService.fetchLatestExchangeRatesMap`, async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.fetchLatestExchangeRatesMap).not.toHaveBeenCalled();
        });

        it('should return correct target amount when converting EUR -> UAH -> USD', async () => {
          const conversionResult = await service.convert('EUR', 'USD', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 1064.5, // 1000 eur -> 41250 uah -> 1064.5 usd
            conversion: 'double',
          });
        });

        it('should return correct target amount when converting USD -> UAH -> EUR', async () => {
          const tgtAmount = await service.convert('USD', 'EUR', 1000);
          expect(tgtAmount).toEqual({
            tgtAmount: 912.12, // 1000 usd -> 38300 uah -> 912.12 usd
            conversion: 'double',
          });
        });
      });
    });

    describe('when exchange rate is not cached', () => {
      describe('direct conversion without cache', () => {
        let exchangeRatesMap: ExchangeRatesMap;

        beforeEach(() => {
          // no exchange rate in cache
          ratesService.getCachedExchangeRate = jest.fn().mockResolvedValue(null);

          // mock downloaded fresh exchange rates map
          exchangeRatesMap = {
            [ratesService.getCurrencyPairKey('EUR', 'USD')]: rateEurUsd,
          };
          ratesService.fetchLatestExchangeRatesMap = jest.fn().mockResolvedValue(exchangeRatesMap);
        });

        it('should call ratesService.getCachedExchangeRate to try to get cached rates', async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.getCachedExchangeRate).toHaveBeenCalledTimes(3);

          // first should try to get direct rate
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(1, 'EUR', 'USD');

          // then 2 more calls to try to get indirect rates with uah
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(2, 'EUR', 'UAH');
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(3, 'USD', 'UAH');
        });

        it(`should call ratesService.fetchLatestExchangeRatesMap after cache didn't return rates`, async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.fetchLatestExchangeRatesMap).toHaveBeenCalledTimes(1);
        });

        it('should return correct target amount when converting EUR -> USD', async () => {
          const conversionResult = await service.convert('EUR', 'USD', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 1073, // srcAmount * rateBuy
            conversion: 'direct',
          });
        });

        it('should return correct target amount when converting USD -> EUR', async () => {
          const conversionResult = await service.convert('USD', 'EUR', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 921.66, // srcAmount / rateSell
            conversion: 'direct',
          });
        });

        it('should use freshly downloaded exchange rates map to refresh cache', async () => {
          await service.convert('USD', 'EUR', 1000);
          expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledTimes(1);
          expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledWith({ exchangeRatesMap, silentLog: true });
        });
      });

      describe('double conversion without cache', () => {
        let exchangeRatesMap: ExchangeRatesMap;

        beforeEach(() => {
          // no exchange rate in cache
          ratesService.getCachedExchangeRate = jest.fn().mockResolvedValue(null);

          // mock downloaded fresh exchange rates map
          exchangeRatesMap = {
            [ratesService.getCurrencyPairKey('EUR', 'UAH')]: rateEurUah,
            [ratesService.getCurrencyPairKey('USD', 'UAH')]: rateUsdUah,
          };
          ratesService.fetchLatestExchangeRatesMap = jest.fn().mockResolvedValue(exchangeRatesMap);
        });

        it('should call ratesService.getCachedExchangeRate to try to get cached rates', async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.getCachedExchangeRate).toHaveBeenCalledTimes(3);

          // first should try to get direct rate
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(1, 'EUR', 'USD');

          // then 2 more calls to try to get indirect rates with uah
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(2, 'EUR', 'UAH');
          expect(ratesService.getCachedExchangeRate).toHaveBeenNthCalledWith(3, 'USD', 'UAH');
        });

        it(`should call ratesService.fetchLatestExchangeRatesMap after cache didn't return rates`, async () => {
          await service.convert('EUR', 'USD', 1000);

          expect(ratesService.fetchLatestExchangeRatesMap).toHaveBeenCalledTimes(1);
        });

        it('should return correct target amount when converting EUR -> UAH -> USD', async () => {
          const conversionResult = await service.convert('EUR', 'USD', 1000);
          expect(conversionResult).toEqual({
            tgtAmount: 1064.5, // 1000 eur -> 41250 uah -> 1064.5 usd
            conversion: 'double',
          });
        });

        it('should return correct target amount when converting USD -> UAH -> EUR', async () => {
          const tgtAmount = await service.convert('USD', 'EUR', 1000);
          expect(tgtAmount).toEqual({
            tgtAmount: 912.12, // 1000 usd -> 38300 uah -> 912.12 usd
            conversion: 'double',
          });
        });

        it('should use freshly downloaded exchange rates map to refresh cache', async () => {
          await service.convert('USD', 'EUR', 1000);
          expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledTimes(1);
          expect(ratesService.refreshExchangeRatesCache).toHaveBeenCalledWith({ exchangeRatesMap, silentLog: true });
        });
      })
    });
  });

  describe('calculateTargetAmount', () => {

    it('should be defined', () => {
      expect(service.calculateTargetAmount).toBeDefined();
    });

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

      it(`should divide by 'rateCross' when converting UAH -> PLN`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'UAH', 'PLN', ratePlnUah);
        expect(targetAmount).toEqual(103.45); // srcAmount / rateCross
      });

      it(`should multiply by 'rateCross' when converting PLN -> UAH`, () => {
        const targetAmount = service.calculateTargetAmount(srcAmount, 'PLN', 'UAH', ratePlnUah);
        expect(targetAmount).toEqual(9666.4); // srcAmount * rateCross
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
