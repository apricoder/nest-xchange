import * as Joi from 'joi';

export const ValidationSchema = Joi.object({
  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().required(),

  // Cache settings
  EXCHANGE_RATES_TTL_SEC: Joi.number().required()
});

export const ValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
};
