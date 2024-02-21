import { Module } from '@nestjs/common';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';

@Module({
  imports: [ExchangeRatesModule],
  controllers: [ConversionController],
  providers: [ConversionService],
})
export class ConversionModule {}
