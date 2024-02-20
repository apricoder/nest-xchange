import * as _ from 'lodash';
import { firstValueFrom } from 'rxjs';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MonobankExchangeRate } from './types/monobank-exchange-rate.type';
import { CurrencyCode, isoCodeToCurrencyCode } from '../currency/types/currency-code.type';
import { ExchangeRate, ExchangeRatesMap } from './types/exchange-rate.type';
import { wait } from '../common/utils/time';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly cacheTTL: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.cacheTTL = this.configService.get('exchangeRates.cacheTTLSec') * 1000;
  }

  async refreshExchangeRatesCache(
    params: {
      exchangeRatesMap?: ExchangeRatesMap;
      silentLog: boolean;
    } = {
      silentLog: true,
    },
  ): Promise<void> {
    this.logger.log(`[~] Refreshing exchange rates`);

    try {
      const exchangeRatesMap = params.exchangeRatesMap ?? (await this.fetchLatestExchangeRatesMap());
      const entries = _.entries(exchangeRatesMap);
      await Promise.all(entries.map(([key, exchangeRate]) => this.cacheManager.set(key, exchangeRate, this.cacheTTL)));

      this.logger.log(`[~] Finished refreshing exchange rates. Cached ${entries.length} entries`);
    } catch (e) {
      const message = `Error at refreshing exchange rates cache. ${e}`;
      if (params.silentLog) {
        return this.logger.error(message);
      }
      throw new InternalServerErrorException(message);
    }
  }

  async fetchLatestExchangeRatesMap(): Promise<ExchangeRatesMap> {
    try {
      const rates = await this.fetchLatestMonobankExchangeRates();

      const fetchedAtUnix = Math.floor(Date.now() / 1000);
      return rates
        .map((rate) => this.mapExchangeRate(rate, fetchedAtUnix))
        .reduce((acc, next) => {
          const key = this.getCacheKey(next.currencyCodeA, next.currencyCodeB);
          return { ...acc, [key]: next };
        }, {});
    } catch (e) {
      throw new InternalServerErrorException(`Error getting latest exchange rates map: ${e}`);
    }
  }

  async getCachedExchangeRate(sourceCurrencyCode: CurrencyCode, targetCurrencyCode: CurrencyCode): Promise<ExchangeRate> {
    const key = this.getCacheKey(sourceCurrencyCode, targetCurrencyCode);
    return this.cacheManager.get<ExchangeRate>(key);
  }

  private async fetchLatestMonobankExchangeRates(maxRetries = 5): Promise<MonobankExchangeRate[]> {
    const attempt = async (attempts: number) => {
      try {
        const ratesSrcUrl = this.configService.get('exchangeRates.srcUrl');
        const { data: rates } = await firstValueFrom(this.httpService.get<MonobankExchangeRate[]>(ratesSrcUrl));

        return rates;
      } catch (e) {
        this.logger.error(`Failed attempt to fetch exchange rates: ${e}`);
        if (attempts >= maxRetries) {
          throw e;
        }

        // Calculate exponential backoff delay: 2^attempts * 100 milliseconds
        const delayMs = 2 ** attempts * 100;
        this.logger.error(`Next attempt in ${delayMs}ms`);
        await wait(delayMs);

        return attempt(attempts + 1);
      }
    };

    return attempt(1);
  }

  private mapExchangeRate(rate: MonobankExchangeRate, fetchedAtUnix = Math.floor(Date.now() / 1000)): ExchangeRate {
    const currencyCodeA = isoCodeToCurrencyCode[rate.currencyCodeA];
    const currencyCodeB = isoCodeToCurrencyCode[rate.currencyCodeB];
    return {
      currencyCodeA,
      currencyCodeB,
      externalDateUnix: rate.date,
      rateBuy: rate.rateBuy,
      rateSell: rate.rateSell,
      rateCross: rate.rateCross,
      fetchedAtUnix,
    } as ExchangeRate;
  }

  private getCacheKey(currencyCodeA: CurrencyCode, currencyCodeB: CurrencyCode) {
    // key is always sorted alphabetically to be able to get rate in 1 call independently of a/b or b/a conversion
    return [currencyCodeA, currencyCodeB].sort().join(`-`);
  }
}
