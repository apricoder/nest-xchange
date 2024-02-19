import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CronJob } from 'cron';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';

@Module({
  imports: [HttpModule, RedisCacheModule],
  providers: [ExchangeRatesService],
  controllers: [ExchangeRatesController],
})
export class ExchangeRatesModule implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesModule.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly ratesService: ExchangeRatesService,
  ) {}

  async onModuleInit() {
    this.setupCronToRefreshExchangeRates();

    // initial refresh on startup
    await this.ratesService.refreshExchangeRates();
  }

  private setupCronToRefreshExchangeRates() {
    const cron = this.configService.get<string>('exchangeRates.refreshCron');
    this.logger.log(
      `[~] Setting up refresh exchange rates job. Cron - "${cron}"`,
    );
    const job = new CronJob(cron, () =>
      this.ratesService.refreshExchangeRates(),
    );
    this.schedulerRegistry.addCronJob('refresh-exchange-rates', job);
    job.start();
  }
}
