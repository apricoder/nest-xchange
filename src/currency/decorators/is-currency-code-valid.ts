import { registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ValidationOptions } from 'joi';
import { CurrencyCode, currencyCodeToIsoCode } from '../types/currency-code.type';

@ValidatorConstraint({ async: false })
export class IsCurrencyCodeValidConstraint implements ValidatorConstraintInterface {
  validate(currencyCode: CurrencyCode) {
    return currencyCodeToIsoCode.hasOwnProperty(currencyCode);
  }

  defaultMessage(args: ValidationArguments) {
    // todo append a link to swagger docs with a complete list of supported currency codes
    return `${args.property} is not a valid currency code. Valid codes example: UAH, USD etc.`;
  }
}

export function IsCurrencyCodeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCurrencyCodeValidConstraint,
    });
  };
}
