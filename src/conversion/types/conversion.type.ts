export type Conversion = 'direct' | 'double';

export type ConversionResult = {
  tgtAmount: number;
  conversion: Conversion;
} | null;
