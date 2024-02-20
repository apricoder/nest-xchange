import { registerDecorator, ValidationArguments } from 'class-validator';
import { ValidationOptions } from 'joi';

export function IsNotEqualTo(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotEqualTo',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const targetValue = (args.object as any)[args.constraints[0]]; // Get the value of the target field
          return value !== targetValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be different from ${args.constraints[0]}.`;
        },
      },
    });
  };
}
