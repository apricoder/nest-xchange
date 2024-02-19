import { CurrencyCode } from './currency-code.type';

export type ExchangeRate = {
  currencyCodeA: CurrencyCode;
  currencyCodeB: CurrencyCode;
  externalDateUnix: number;
  cachedAtUnix: number;
} & (
  | {
      // sometimes it has buy/sell rates
      rateBuy: number; // 38.03
      rateSell: number; // 38.4601
      rateCross?: undefined;
    }
  | {
      // sometimes only cross rate
      rateCross: number; // 38.20
      rateBuy?: undefined;
      rateSell?: undefined;
    }
);
