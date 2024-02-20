import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ConvertCurrencyRequestDto } from './dto/convert-currency.request.dto';
import { ConversionService } from './conversion.service';

@Controller('convert')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post('/')
  async convert(
    @Body(new ValidationPipe({ whitelist: true }))
    body: ConvertCurrencyRequestDto,
  ) {
    const { sourceCurrencyCode, targetCurrencyCode, amount } = body;

    return this.conversionService.convert(
      sourceCurrencyCode,
      targetCurrencyCode,
      amount,
    );
  }
}
