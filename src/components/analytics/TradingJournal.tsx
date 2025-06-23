import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, Clock, BookOpen } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getAllTrades } from '../../db';
import { Trade } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

const TradingJournal: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [journalEntries, setJournalEntries] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTrades = async () => {
      const allTrades = await getAllTrades();
      setTrades(allTrades);
    };
    fetchTrades();
  }, []);

  const getPeriodTrades = () => {
    const start = selectedPeriod === 'week' 
      ? startOfWeek(currentDate) 
      : startOfMonth(currentDate);
    const end = selectedPeriod === 'week' 
      ? endOfWeek(currentDate) 
      : endOfMonth(currentDate);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= start && tradeDate <= end;
    });
  };

  const periodTrades = getPeriodTrades();
  const wins = periodTrades.filter(t => t.outcome === 'win').length;
  const losses = periodTrades.filter(t => t.outcome === 'loss').length;
  const winRate = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0;

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (selectedPeriod === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const periodKey = selectedPeriod === 'week' 
    ? `week-${format(startOfWeek(currentDate), 'yyyy-MM-dd')}`
    : `month-${format(startOfMonth(currentDate), 'yyyy-MM')}`;

  const saveJournalEntry = (entry: string) => {
    setJournalEntries(prev => ({
      ...prev,
      [periodKey]: entry
    }));
    // In a real app, you'd save this to your database
    localStorage.setItem('tradingJournal', JSON.stringify({
      ...journalEntries,
      [periodKey]: entry
    }));
  };

  useEffect(() => {
    // Load journal entries from localStorage
    const saved = localStorage.getItem('tradingJournal');
    if (saved) {
      setJournalEntries(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Trading Journal
        </h1>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={selectedPeriod === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Period Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
              Previous
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedPeriod === 'week' 
                ? `Week of ${format(startOfWeek(currentDate), 'MMM dd, yyyy')}`
                : format(currentDate, 'MMMM yyyy')
              }
            </h2>
            
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{periodTrades.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Wins</p>
                <p className="text-2xl font-bold text-green-600">{wins}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Losses</p>
                <p className="text-2xl font-bold text-red-600">{losses}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{winRate.toFixed(1)}%</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-40 p-4 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={`Write your thoughts about this ${selectedPeriod}'s trading performance...`}
            value={journalEntries[periodKey] || ''}
            onChange={(e) => saveJournalEntry(e.target.value)}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your journal entries are automatically saved as you type.
          </p>
        </CardContent>
      </Card>

      {/* Recent Trades for Period */}
      {periodTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trades This {selectedPeriod === 'week' ? 'Week' : 'Month'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {periodTrades.slice(0, 10).map(trade => (
                <div key={trade.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{trade.pair}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(trade.entryDate), 'MMM dd, h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      trade.outcome === 'win' ? 'text-green-600' : 
                      trade.outcome === 'loss' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trade.outcome.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{trade.entryType}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TradingJournal;