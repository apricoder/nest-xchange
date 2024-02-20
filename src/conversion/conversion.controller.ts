import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ConvertCurrencyRequestDto } from './dto/convert-currency.request.dto';

@Controller('convert')
export class ConversionController {
  @Post('/')
  async convert(
    @Body(new ValidationPipe({ whitelist: true }))
    body: ConvertCurrencyRequestDto,
  ) {
    const { sourceCurrencyCode, targetCurrencyCode, amount } = body;

    // todo implement

    return body;
  }
}
