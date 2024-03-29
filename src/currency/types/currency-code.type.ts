import * as _ from 'lodash';

export const currencyCodeToIsoCode = {
  AED: 784,
  AFN: 971,
  ALL: 8,
  AMD: 51,
  AOA: 973,
  ARS: 32,
  AUD: 36,
  AZN: 944,
  BDT: 50,
  BGN: 975,
  BHD: 48,
  BIF: 108,
  BND: 96,
  BOB: 68,
  BRL: 986,
  BWP: 72,
  BYN: 933,
  CAD: 124,
  CDF: 976,
  CHF: 756,
  CLP: 152,
  CNY: 156,
  COP: 170,
  CRC: 188,
  CUP: 192,
  CZK: 203,
  DJF: 262,
  DKK: 208,
  DZD: 12,
  EGP: 818,
  ETB: 230,
  EUR: 978,
  GBP: 826,
  GEL: 981,
  GHS: 936,
  GMD: 270,
  GNF: 324,
  HKD: 344,
  HRK: 191,
  HUF: 348,
  IDR: 360,
  ILS: 376,
  INR: 356,
  IQD: 368,
  ISK: 352,
  JOD: 400,
  JPY: 392,
  KES: 404,
  KGS: 417,
  KHR: 116,
  KRW: 410,
  KWD: 414,
  KZT: 398,
  LAK: 418,
  LBP: 422,
  LKR: 144,
  LYD: 434,
  MAD: 504,
  MDL: 498,
  MGA: 969,
  MKD: 807,
  MNT: 496,
  MUR: 480,
  MWK: 454,
  MXN: 484,
  MYR: 458,
  MZN: 943,
  NAD: 516,
  NGN: 566,
  NIO: 558,
  NOK: 578,
  NPR: 524,
  NZD: 554,
  OMR: 512,
  PEN: 604,
  PHP: 608,
  PKR: 586,
  PLN: 985,
  PYG: 600,
  QAR: 634,
  RON: 946,
  RSD: 941,
  SAR: 682,
  SCR: 690,
  SDG: 938,
  SEK: 752,
  SGD: 702,
  SLL: 694,
  SOS: 706,
  SRD: 968,
  SZL: 748,
  THB: 764,
  TJS: 972,
  TND: 788,
  TRY: 949,
  TWD: 901,
  TZS: 834,
  UAH: 980,
  UGX: 800,
  USD: 840,
  UYU: 858,
  UZS: 860,
  VND: 704,
  XAF: 950,
  XOF: 952,
  YER: 886,
  ZAR: 710,
};

export type CurrencyCode = keyof typeof currencyCodeToIsoCode;

export const isoCodeToCurrencyCode = _.invert(currencyCodeToIsoCode) as {
  [isoCode: number]: CurrencyCode;
};
