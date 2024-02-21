import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ConvertCurrencyRequestDto } from './dto/convert-currency.request.dto';
import { ConversionService } from './conversion.service';
import { ConversionResult } from './types/conversion.type';

@Controller('convert')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post('/')
  async convert(
    @Body(new ValidationPipe({ whitelist: true }))
    body: ConvertCurrencyRequestDto,
  ): Promise<ConversionResult> {
    const { sourceCurrencyCode, targetCurrencyCode, amount } = body;

    return this.conversionService.convert(sourceCurrencyCode, targetCurrencyCode, amount);
  }
}
