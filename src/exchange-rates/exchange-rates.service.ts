import { firstValueFrom } from 'rxjs';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MonobankExchangeRate } from './types/monobank-exchange-rate.type';
import { isoCodeToCurrencyCode } from './types/currency-code.type';
import { ExchangeRate } from './types/exchange-rate.type';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async refreshExchangeRates(
    params: { silentLog: boolean } = { silentLog: true },
  ) {
    this.logger.log(`[~] Refreshing exchange rates`);

    try {
      const exchangeRatesSrcUrl = this.configService.get(
        'exchangeRates.srcUrl',
      );

      // todo add exponential retries
      const { data: rates } = await firstValueFrom(
        this.httpService.get<MonobankExchangeRate[]>(exchangeRatesSrcUrl),
      );

      let cachingSuccessCount = 0;
      let cachingErrorCount = 0;
      const cachedAtUnix = Math.floor(Date.now() / 1000);

      await Promise.all(
        rates.map(async (rate: MonobankExchangeRate) => {
          try {
            const currencyCodeA = isoCodeToCurrencyCode[rate.currencyCodeA];
            const currencyCodeB = isoCodeToCurrencyCode[rate.currencyCodeB];
            const mapped = {
              currencyCodeA,
              currencyCodeB,
              externalDateUnix: rate.date,
              rateBuy: rate.rateBuy,
              rateSell: rate.rateSell,
              rateCross: rate.rateCross,
              cachedAtUnix,
            } as ExchangeRate;

            // key is always sorted alphabetically to be able to get rate in 1 call independently of a/b or b/a conversion
            const cacheKey = [currencyCodeA, currencyCodeB].sort().join(`-`);
            const cacheTTLSec = this.configService.get(
              'exchangeRates.cacheTTLSec',
            );
            await this.cacheManager.set(cacheKey, mapped, cacheTTLSec * 1000);

            cachingSuccessCount += 1;
          } catch (e) {
            this.logger.error(
              `Error caching rate [${rate.currencyCodeA}:${rate.currencyCodeB}]`,
            );
            cachingErrorCount += 1;
          }
        }),
      );

      this.logger.log(
        `[~] Finished refreshing exchange rates caches (success: ${cachingSuccessCount}, error: ${cachingErrorCount})`,
      );
    } catch (e) {
      const message = `Error at refreshing exchange rates. ${e}`;
      if (params.silentLog) {
        return this.logger.error(message);
      }
      throw new InternalServerErrorException(message);
    }
  }
}
