import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MonobankExchangeRates } from './types/monobank-exchange-rates.type';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      const response = await firstValueFrom(
        this.httpService.get<MonobankExchangeRates>(exchangeRatesSrcUrl + 'xd'),
      );

      // todo store results in redis
    } catch (e) {
      const message = `Error at refreshing exchange rates. ${e}`;
      if (params.silentLog) {
        return this.logger.error(message);
      }
      throw new InternalServerErrorException(message);
    }
  }
}
