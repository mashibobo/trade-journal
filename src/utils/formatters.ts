/**
 * Format pips with proper decimal places
 * Professional 3-digit pip formatting like TradingView
 */
export const formatPips = (pips: number, pair?: string): string => {
  const isJPYPair = pair?.includes('JPY') || false;
  
  if (isJPYPair) {
    // JPY pairs: 1 pip = 0.01, format to 1 decimal place
    if (pips >= 1000) {
      return (pips / 1000).toFixed(1) + 'K';
    } else if (pips >= 100) {
      return pips.toFixed(0);
    } else {
      return pips.toFixed(1);
    }
  } else {
    // Regular pairs: 1 pip = 0.0001, format to 1 decimal place
    if (pips >= 100) {
      return pips.toFixed(0);
    } else if (pips >= 10) {
      return pips.toFixed(1);
    } else {
      return pips.toFixed(1);
    }
  }
};

/**
 * Calculate pips from price difference
 */
export const calculatePips = (priceDiff: number, pair: string): number => {
  const isJPYPair = pair.includes('JPY');
  
  if (isJPYPair) {
    // For JPY pairs, 1 pip = 0.01
    return Math.abs(priceDiff) * 100;
  } else {
    // For other pairs, 1 pip = 0.0001
    return Math.abs(priceDiff) * 10000;
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};