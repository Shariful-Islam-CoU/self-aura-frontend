// Currency formatter for BDT (Bangladeshi Taka)

export const CURRENCY_CODE = 'BDT';
export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_LOCALE = 'bn-BD';

export function formatCurrency(amount: number): string {
  if (amount === 0) return `${CURRENCY_SYMBOL}0`;
  
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount === 0) return `${CURRENCY_SYMBOL}0`;
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1e9) {
    return `${CURRENCY_SYMBOL}${(amount / 1e9).toFixed(1)}B`;
  }
  if (absAmount >= 1e6) {
    return `${CURRENCY_SYMBOL}${(amount / 1e6).toFixed(1)}M`;
  }
  if (absAmount >= 1e3) {
    return `${CURRENCY_SYMBOL}${(amount / 1e3).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE).format(value);
}