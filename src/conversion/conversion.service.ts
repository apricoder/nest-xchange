import * as _ from 'lodash';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrencyCode } from '../currency/types/currency-code.type';
import { ExchangeRate, ExchangeRatesMap } from '../exchange-rates/types/exchange-rate.type';
import { Conversion, ConversionResult } from './types/conversion.type';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(private readonly ratesService: ExchangeRatesService) {}

  async convert(srcCurrency: CurrencyCode, tgtCurrency: CurrencyCode, amount: number): Promise<ConversionResult> {
    // first try to convert based on cached rates
    const resultUsingCachedRate = await this.convertUsingCachedRate(srcCurrency, tgtCurrency, amount);
    if (resultUsingCachedRate) {
      return resultUsingCachedRate;
    }

    const { exchangeRatesMap, tgtAmount, conversion } = await this.convertUsingLatestFetchedRates(
      srcCurrency,
      tgtCurrency,
      amount,
    );

    // since latest rates are just downloaded - use them to update our cache
    // no need for await to make user wait
    this.ratesService.refreshExchangeRatesCache({ exchangeRatesMap, silentLog: true });

    return { tgtAmount, conversion };
  }

  private async convertUsingLatestFetchedRates(
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    amount: number,
  ): Promise<{ exchangeRatesMap: ExchangeRatesMap; tgtAmount: number; conversion: Conversion }> {
    try {
      const exchangeRatesMap = await this.ratesService.fetchLatestExchangeRatesMap();
      const { tgtAmount, conversion } = await this.convertUsingRateProvider(srcCurrency, tgtCurrency, amount, {
        name: 'Fresh download',
        provideRate: async (srcCurrency, tgtCurrency) => {
          const key = this.ratesService.getCurrencyPairKey(srcCurrency, tgtCurrency);
          return exchangeRatesMap[key];
        },
      });
      return { exchangeRatesMap, tgtAmount, conversion };
    } catch (e) {
      throw new InternalServerErrorException(`Error converting using freshly fetched rates: ${e}`);
    }
  }

  private async convertUsingCachedRate(
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    amount: number,
  ): Promise<ConversionResult> {
    try {
      return this.convertUsingRateProvider(srcCurrency, tgtCurrency, amount, {
        name: 'Redis',
        provideRate: (srcCurrency, tgtCurrency) => this.ratesService.getCachedExchangeRate(srcCurrency, tgtCurrency),
      });
    } catch (e) {
      this.logger.error(`Error converting using cached rate: ${e}`);
      return null;
    }
  }

  private async convertUsingRateProvider(
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    amount: number,
    // Either redis cache or latest downloaded exchange rates
    rateProvider: {
      name: string;
      provideRate: (srcCurrency: CurrencyCode, tgtCurrency: CurrencyCode) => Promise<ExchangeRate>;
    },
  ): Promise<ConversionResult> {
    const directRate = await rateProvider.provideRate(srcCurrency, tgtCurrency);
    if (directRate) {
      this.logger.log(
        `[~] Conversion: direct, Currencies: ${srcCurrency} → ${tgtCurrency}, Rate source: ${rateProvider.name}`,
      );
      const tgtAmount = this.calculateTargetAmount(amount, srcCurrency, tgtCurrency, directRate);
      return { tgtAmount, conversion: 'direct' };
    }

    // if no direct rate & neither source nor target is uah
    const noneIsUah = srcCurrency !== 'UAH' && tgtCurrency !== 'UAH';
    if (noneIsUah) {
      // get rates for double conversion like source -> uah -> target
      const [srcUahRate, tgtUahRate] = await Promise.all([
        rateProvider.provideRate(srcCurrency, 'UAH'),
        rateProvider.provideRate(tgtCurrency, 'UAH'),
      ]);

      if (!srcUahRate || !tgtUahRate) {
        return null;
      }

      this.logger.log(
        `[~] Conversion: double, Currencies: ${srcCurrency} → ${tgtCurrency}, Rate source: ${rateProvider.name}`,
      );

      // double conversion: source -> uah, uah -> target
      const uahAmount = this.calculateTargetAmount(amount, srcCurrency, 'UAH', srcUahRate);
      const tgtAmount = this.calculateTargetAmount(uahAmount, 'UAH', tgtCurrency, tgtUahRate);

      return { tgtAmount, conversion: 'double' };
    }

    return null;
  }

  public calculateTargetAmount(
    srcAmount: number,
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    exchangeRate: ExchangeRate,
  ): number {
    const currenciesMatchExchangeRate = _.isEqual(
      [srcCurrency, tgtCurrency].sort(),
      [exchangeRate.currencyCodeA, exchangeRate.currencyCodeB].sort(),
    );
    if (!currenciesMatchExchangeRate) {
      throw new InternalServerErrorException(`exchangeRate doesn't match srcCurrency and tgtCurrency`);
    }

    const shouldBuy = srcCurrency === exchangeRate.currencyCodeA;
    const useRateCross = exchangeRate.rateCross;

    const tgtAmount = useRateCross
      ? shouldBuy
        ? srcAmount * exchangeRate.rateCross
        : srcAmount / exchangeRate.rateCross
      : shouldBuy
        ? srcAmount * exchangeRate.rateBuy
        : srcAmount / exchangeRate.rateSell;

    return _.round(tgtAmount, 2);
  }
}
