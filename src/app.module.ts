import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ValidationOptions, ValidationSchema } from './config/validation';
import configuration from './config/configuration';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { ConversionModule } from './conversion/conversion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: ValidationSchema,
      validationOptions: ValidationOptions,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    RedisCacheModule,
    ExchangeRatesModule,
    ConversionModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
