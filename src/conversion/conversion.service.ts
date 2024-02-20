import * as _ from 'lodash';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrencyCode } from '../currency/types/currency-code.type';
import { ExchangeRate } from '../exchange-rates/types/exchange-rate.type';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(private readonly ratesService: ExchangeRatesService) {}

  async convert(srcCurrency: CurrencyCode, tgtCurrency: CurrencyCode, amount: number) {
    // first try to convert based on cached rate
    const tgtAmountUsingCachedRate = await this.convertUsingCachedRateOrNull(srcCurrency, tgtCurrency, amount);

    if (tgtAmountUsingCachedRate) {
      return tgtAmountUsingCachedRate;
    }

    // if couldn't convert with cached rate
    // fetch fresh rates map from monobank
    // if direct rate - calculate & return target amount
    // else try to convert source -> uah -> target
    // else give up
  }

  private async convertUsingCachedRateOrNull(srcCurrency: CurrencyCode, tgtCurrency: CurrencyCode, amount: number): Promise<number | null> {
    try {
      // check if direct exchange rate cached
      const directRate = await this.ratesService.getCachedExchangeRate(srcCurrency, tgtCurrency);
      if (directRate) {
        return this.calculateTargetAmount(amount, srcCurrency, tgtCurrency, directRate);
      }

      // if no direct rate & neither source nor target is uah
      const noneIsUah = srcCurrency !== 'UAH' && tgtCurrency !== 'UAH';
      if (noneIsUah) {
        // try to convert source -> uah -> target
        const [srcUahRate, tgtUahRate] = await Promise.all([
          this.ratesService.getCachedExchangeRate(srcCurrency, 'UAH'),
          this.ratesService.getCachedExchangeRate(tgtCurrency, 'UAH'),
        ]);

        if (!srcUahRate || !tgtUahRate) {
          return null;
        }

        // convert source -> uah
        const uahAmount = this.calculateTargetAmount(amount, srcCurrency, 'UAH', srcUahRate);
        // convert uah -> target
        const tgtAmount = this.calculateTargetAmount(uahAmount, 'UAH', tgtCurrency, tgtUahRate);

        return tgtAmount;
      }
    } catch (e) {
      this.logger.error(`Error converting using cached rate: ${e}`);
      return null;
    }
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
      throw new InternalServerErrorException(
        `exchangeRate doesn't match srcCurrency and tgtCurrency`,
      );
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
