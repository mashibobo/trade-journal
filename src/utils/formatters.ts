/**
 * Format pips with proper decimal places
 * For most pairs: 25.8 pips, 147.2 pips
 * For JPY pairs: 2.58 pips, 14.7 pips
 */
export const formatPips = (pips: number, pair?: string): string => {
  const isJPYPair = pair?.includes('JPY') || false;
  
  if (isJPYPair) {
    // JPY pairs: show more decimal places
    if (pips >= 100) {
      return pips.toFixed(1);
    } else if (pips >= 10) {
      return pips.toFixed(1);
    } else {
      return pips.toFixed(2);
    }
  } else {
    // Regular pairs: show 1 decimal place for numbers >= 10, 1 decimal for smaller
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