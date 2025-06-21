import { Trade, TradeStats, EntryType } from '../types';

/**
 * Calculate trade statistics from an array of trades
 */
export const calculateStats = (trades: Trade[]): TradeStats => {
  // Initialize stats object
  const stats: TradeStats = {
    totalTrades: trades.length,
    wins: 0,
    losses: 0,
    breakeven: 0,
    winRate: 0,
    averageRR: 0,
    profitFactor: 0,
    byEntryType: {
      '2 touch': { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0 },
      '3 touch': { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0 },
      'v touch': { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0 },
      'mechanical': { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0 },
      'override': { total: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0 }
    }
  };

  // Early return for empty trades
  if (trades.length === 0) {
    return stats;
  }

  // Calculate overall stats
  let totalRR = 0;
  let totalProfit = 0;
  let totalLoss = 0;

  trades.forEach(trade => {
    // Overall outcome counts
    if (trade.outcome === 'win') {
      stats.wins += 1;
      totalProfit += (trade.exitPrice - trade.entryPrice) * trade.lotSize;
    } else if (trade.outcome === 'loss') {
      stats.losses += 1;
      totalLoss += (trade.entryPrice - trade.exitPrice) * trade.lotSize;
    } else if (trade.outcome === 'breakeven') {
      stats.breakeven += 1;
    }

    // Risk-reward ratio
    totalRR += trade.riskRewardRatio;

    // Entry type stats
    const entryTypeStats = stats.byEntryType[trade.entryType];
    entryTypeStats.total += 1;
    
    if (trade.outcome === 'win') {
      entryTypeStats.wins += 1;
    } else if (trade.outcome === 'loss') {
      entryTypeStats.losses += 1;
    } else if (trade.outcome === 'breakeven') {
      entryTypeStats.breakeven += 1;
    }
  });

  // Calculate derived stats
  stats.winRate = (stats.wins / stats.totalTrades) * 100;
  stats.averageRR = totalRR / stats.totalTrades;
  stats.profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

  // Calculate win rates for each entry type
  Object.keys(stats.byEntryType).forEach(key => {
    const entryType = key as EntryType;
    const typeStats = stats.byEntryType[entryType];
    if (typeStats.total > 0) {
      typeStats.winRate = (typeStats.wins / typeStats.total) * 100;
    }
  });

  return stats;
};

/**
 * Generate datasets for Chart.js
 */
export const generateChartData = (trades: Trade[]) => {
  // Group trades by entry type
  const tradesByEntryType = trades.reduce((acc, trade) => {
    if (!acc[trade.entryType]) {
      acc[trade.entryType] = {
        win: 0,
        loss: 0,
        breakeven: 0
      };
    }
    acc[trade.entryType][trade.outcome] += 1;
    return acc;
  }, {} as Record<EntryType, Record<string, number>>);

  // Prepare data for bar chart
  const entryTypes = Object.keys(tradesByEntryType);
  const wins = entryTypes.map(type => tradesByEntryType[type as EntryType].win);
  const losses = entryTypes.map(type => tradesByEntryType[type as EntryType].loss);
  const breakevenTrades = entryTypes.map(type => tradesByEntryType[type as EntryType].breakeven);

  // Group trades by month
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }).reverse();

  const tradesByMonth = trades.reduce((acc, trade) => {
    const month = new Date(trade.entryDate).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    if (!acc[month]) {
      acc[month] = {
        win: 0,
        loss: 0,
        breakeven: 0
      };
    }
    
    acc[month][trade.outcome] += 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Prepare monthly data
  const monthlyWins = last6Months.map(month => tradesByMonth[month]?.win || 0);
  const monthlyLosses = last6Months.map(month => tradesByMonth[month]?.loss || 0);
  const monthlyBreakeven = last6Months.map(month => tradesByMonth[month]?.breakeven || 0);

  return {
    byEntryType: {
      labels: entryTypes,
      datasets: [
        {
          label: 'Wins',
          data: wins,
          backgroundColor: 'rgba(75, 192, 75, 0.7)'
        },
        {
          label: 'Losses',
          data: losses,
          backgroundColor: 'rgba(255, 99, 99, 0.7)'
        },
        {
          label: 'Breakeven',
          data: breakevenTrades,
          backgroundColor: 'rgba(153, 153, 153, 0.7)'
        }
      ]
    },
    byMonth: {
      labels: last6Months,
      datasets: [
        {
          label: 'Wins',
          data: monthlyWins,
          backgroundColor: 'rgba(75, 192, 75, 0.7)'
        },
        {
          label: 'Losses',
          data: monthlyLosses,
          backgroundColor: 'rgba(255, 99, 99, 0.7)'
        },
        {
          label: 'Breakeven',
          data: monthlyBreakeven,
          backgroundColor: 'rgba(153, 153, 153, 0.7)'
        }
      ]
    }
  };
};