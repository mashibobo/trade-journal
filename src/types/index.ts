export type EntryType = '2 touch' | '3 touch' | 'v touch' | 'mechanical' | 'override' | 'aft entry';
export type TradeOutcome = 'win' | 'loss' | 'breakeven';
export type TradeType = 'executed' | 'missed';

export interface TimeframeScreenshots {
  weekly?: string;
  daily?: string;
  fourHour?: string;
  oneHour?: string;
  fifteenMin?: string;
  fiveMin?: string;
}

export interface BacktestScreenshot {
  id: string;
  description: string;
  dataUrl: string;
  currencyPair: string;
  entryType: EntryType;
  timeframe: string;
  strategy?: string;
  notes?: string;
  createdAt: Date;
  tags?: string[];
}

export interface TradeMedia {
  before: string[];
  after: string[];
  videos: string[];
  audioDescription?: string;
}

export interface Trade {
  id: string;
  pair: string;
  entryType: EntryType;
  outcome: TradeOutcome;
  tradeType: TradeType;
  direction: 'buy' | 'sell';
  entryDate: Date;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  riskRewardRatio: number;
  stopLossAmount: number;
  takeProfitAmount: number;
  breakEvenAmount?: number;
  notes?: string;
  media: TradeMedia;
  timeframeScreenshots: TimeframeScreenshots;
  backtestScreenshots: BacktestScreenshot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  averageRR: number;
  profitFactor: number;
  totalPips: number;
  averagePips: number;
  byEntryType: Record<EntryType, {
    total: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    totalPips: number;
    averagePips: number;
  }>;
  byMonth: Record<string, {
    total: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    totalPips: number;
  }>;
}

export interface MissedTrade {
  id: string;
  pair: string;
  entryType: EntryType;
  missedDate: Date;
  potentialEntry: number;
  potentialExit: number;
  potentialPips: number;
  reason: string;
  notes?: string;
  media: TradeMedia;
  timeframeScreenshots: TimeframeScreenshots;
  createdAt: Date;
  updatedAt: Date;
}