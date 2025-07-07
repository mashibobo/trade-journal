import Dexie, { Table } from 'dexie';
import { Trade, BacktestScreenshot, MissedTrade } from '../types';

class TradeDatabase extends Dexie {
  trades!: Table<Trade>;
  backtests!: Table<BacktestScreenshot>;
  missedTrades!: Table<MissedTrade>;

  constructor() {
    super('ForexTraderProgressTracker');
    
    this.version(3).stores({
      trades: '++id, pair, entryType, outcome, tradeType, direction, entryDate, createdAt, updatedAt',
      backtests: '++id, description, currencyPair, entryType, timeframe, createdAt',
      missedTrades: '++id, pair, entryType, missedDate, createdAt, updatedAt'
    });
  }
}

export const db = new TradeDatabase();

// Trade functions
export async function addTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const id = await db.trades.add({
    ...trade,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  return id.toString();
}

export async function updateTrade(id: string, trade: Partial<Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await db.trades.update(id, {
    ...trade,
    updatedAt: new Date()
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await db.trades.delete(id);
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  return db.trades.get(id);
}

export async function getAllTrades(): Promise<Trade[]> {
  return db.trades.toArray();
}

export async function getTradesByEntryType(entryType: Trade['entryType']): Promise<Trade[]> {
  return db.trades
    .where('entryType')
    .equals(entryType)
    .toArray();
}

export async function getTradesByOutcome(outcome: Trade['outcome']): Promise<Trade[]> {
  return db.trades
    .where('outcome')
    .equals(outcome)
    .toArray();
}

// Missed Trade functions
export async function addMissedTrade(trade: Omit<MissedTrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const id = await db.missedTrades.add({
    ...trade,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  return id.toString();
}

export async function updateMissedTrade(id: string, trade: Partial<Omit<MissedTrade, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await db.missedTrades.update(id, {
    ...trade,
    updatedAt: new Date()
  });
}

export async function deleteMissedTrade(id: string): Promise<void> {
  await db.missedTrades.delete(id);
}

export async function getMissedTrade(id: string): Promise<MissedTrade | undefined> {
  return db.missedTrades.get(id);
}

export async function getAllMissedTrades(): Promise<MissedTrade[]> {
  return db.missedTrades.toArray();
}

// Backtest functions
export async function addBacktest(backtest: Omit<BacktestScreenshot, 'id' | 'createdAt'>): Promise<string> {
  const now = new Date();
  const id = await db.backtests.add({
    ...backtest,
    id: crypto.randomUUID(),
    createdAt: now,
  });
  return id.toString();
}

export async function updateBacktest(id: string, backtest: Partial<Omit<BacktestScreenshot, 'id' | 'createdAt'>>): Promise<void> {
  await db.backtests.update(id, backtest);
}

export async function deleteBacktest(id: string): Promise<void> {
  await db.backtests.delete(id);
}

export async function getBacktest(id: string): Promise<BacktestScreenshot | undefined> {
  return db.backtests.get(id);
}

export async function getAllBacktests(): Promise<BacktestScreenshot[]> {
  return db.backtests.orderBy('createdAt').reverse().toArray();
}

export async function getBacktestsByCurrencyPair(currencyPair: string): Promise<BacktestScreenshot[]> {
  return db.backtests
    .where('currencyPair')
    .equals(currencyPair)
    .toArray();
}

export async function getBacktestsByEntryType(entryType: string): Promise<BacktestScreenshot[]> {
  return db.backtests
    .where('entryType')
    .equals(entryType)
    .toArray();
}

// Database export/import
export function exportDatabase(): Promise<Blob> {
  return db.export();
}

export async function importDatabase(blob: Blob): Promise<void> {
  return db.import(blob);
}