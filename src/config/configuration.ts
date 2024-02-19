export default () => ({
  // Redis
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  // Exchange rates
  exchangeRates: {
    refreshCron: process.env.EXCHANGE_RATES_REFRESH_CRON,
    triggerRefreshKey: process.env.EXCHANGE_RATES_TRIGGER_REFRESH_KEY,
    srcUrl: process.env.EXCHANGE_RATES_SRC_URL,
  },
});
