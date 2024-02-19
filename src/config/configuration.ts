export default () => ({
  // Redis
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  // Cache settings
  cache: {
    exchangeRatesTTLSec: process.env.EXCHANGE_RATES_TTL_SEC,
  },
});
