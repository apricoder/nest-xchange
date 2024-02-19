export type MonobankExchangeRates = Array<{
  currencyCodeA: number; // 840 - currency code in ISO 4217
  currencyCodeB: number; // 980 - currency code in ISO 4217
  date: number; // 1708336273 - unix time
  rateBuy: number; // 38.03
  rateSell: number; // 38.4601
}>;
