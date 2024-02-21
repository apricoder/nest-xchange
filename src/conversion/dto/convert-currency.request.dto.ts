import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { CurrencyCode } from '../../currency/types/currency-code.type';
import { IsCurrencyCodeValid } from '../../currency/decorators/is-currency-code-valid';
import { IsNotEqualTo } from '../../common/decorators/is-not-equal-to';

export class ConvertCurrencyRequestDto {
  @IsCurrencyCodeValid()
  @IsString()
  @IsNotEmpty()
  sourceCurrencyCode: CurrencyCode;

  @IsCurrencyCodeValid()
  @IsString()
  @IsNotEmpty()
  @IsNotEqualTo('sourceCurrencyCode')
  targetCurrencyCode: CurrencyCode;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;
}
