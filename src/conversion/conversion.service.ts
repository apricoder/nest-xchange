import { Injectable } from '@nestjs/common';
import { ExchangeRatesService } from 'src/exchange-rates/exchange-rates.service';
import { CurrencyCode } from '../currency/types/currency-code.type';
import { ExchangeRate } from '../exchange-rates/types/exchange-rate.type';

@Injectable()
export class ConversionService {
  constructor(private readonly ratesService: ExchangeRatesService) {}

  async convert(
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    amount: number,
  ) {
    // first try to convert based on cached rate
    try {
      // check if direct exchange rate cached
      const directRate = await this.ratesService.getCachedExchangeRate(
        srcCurrency,
        tgtCurrency,
      );

      if (directRate) {
        return this.calculateTargetAmount(
          amount,
          srcCurrency,
          tgtCurrency,
          directRate,
        );
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
          // if some rate is missing give up
        }

        // convert source -> uah
        const uahAmount = this.calculateTargetAmount(
          amount,
          srcCurrency,
          'UAH',
          srcUahRate,
        );

        // convert uah -> target
        return this.calculateTargetAmount(
          uahAmount,
          'UAH',
          tgtCurrency,
          tgtUahRate,
        );
      }
    } catch (e) {
      // silent log & go to monobank request
    }

    // if couldn't convert with cached rate
    // fetch fresh rates map from monobank
    // if direct rate - calculate & return target amount
    // else try to convert source -> uah -> target
    // else give up
  }

  public calculateTargetAmount(
    srcAmount: number,
    srcCurrency: CurrencyCode,
    tgtCurrency: CurrencyCode,
    exchangeRate: ExchangeRate,
  ): number {
    // todo implement
    return -1;
  }
}
