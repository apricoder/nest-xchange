import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(
    private readonly configService: ConfigService,
    private readonly ratesService: ExchangeRatesService,
  ) {}

  @Get('/ding-ding')
  async triggerExchangeRatesRefresh(@Query('key') key: string) {
    if (key !== this.configService.get('exchangeRates.triggerRefreshKey')) {
      throw new NotFoundException();
    }
    await this.ratesService.refreshExchangeRates({ silentLog: false });
  }
}
