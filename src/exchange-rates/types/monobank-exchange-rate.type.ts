export type MonobankExchangeRate = {
  currencyCodeA: number; // 840 - currency code in ISO 4217
  currencyCodeB: number; // 980 - currency code in ISO 4217
  date: number; // 1708336273 - unix time
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
