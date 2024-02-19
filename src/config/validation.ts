import * as Joi from 'joi';

export const ValidationSchema = Joi.object({
  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().required(),

  // Exchange rates
  EXCHANGE_RATES_REFRESH_CRON: Joi.string().required(),
  EXCHANGE_RATES_TRIGGER_REFRESH_KEY: Joi.string().required(),
  EXCHANGE_RATES_SRC_URL: Joi.string().uri().required(),
});

export const ValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
};
