import React, { useState, useEffect } from 'react';
import { Filter, Search, Loader, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Trade, EntryType, TradeOutcome } from '../../types';
import { getAllTrades, deleteTrade } from '../../db';
import TradeCard from './TradeCard';
import { Button } from '../ui/Button';

const TradeList: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<Record<string, Trade[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    entryType: '' as EntryType | '',
    outcome: '' as TradeOutcome | '',
    tradeType: '' as 'executed' | 'missed' | '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const allTrades = await getAllTrades();
        setTrades(allTrades);
        setFilteredTrades(allTrades);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, trades]);

  useEffect(() => {
    groupTradesByMonth();
  }, [filteredTrades]);

  const applyFilters = () => {
    let filtered = [...trades];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trade) =>
          trade.pair.toLowerCase().includes(query) ||
          trade.notes?.toLowerCase().includes(query)
      );
    }

    // Apply entry type filter
    if (filters.entryType) {
      filtered = filtered.filter((trade) => trade.entryType === filters.entryType);
    }

    // Apply outcome filter
    if (filters.outcome) {
      filtered = filtered.filter((trade) => trade.outcome === filters.outcome);
    }

    // Apply trade type filter
    if (filters.tradeType) {
      filtered = filtered.filter((trade) => trade.tradeType === filters.tradeType);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((trade) => new Date(trade.entryDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Set to end of day
      filtered = filtered.filter((trade) => new Date(trade.entryDate) <= toDate);
    }

    // Sort by date, newest first
    filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    setFilteredTrades(filtered);
  };

  const groupTradesByMonth = () => {
    const grouped = filteredTrades.reduce((acc, trade) => {
      const monthKey = format(new Date(trade.entryDate), 'MMMM yyyy');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);

    setGroupedTrades(grouped);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      entryType: '',
      outcome: '',
      tradeType: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchQuery('');
  };

  const handleDeleteTrade = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade(id);
        setTrades((prev) => prev.filter((trade) => trade.id !== id));
      } catch (error) {
        console.error('Error deleting trade:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trades</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search trades..."
              className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={16} />}
          >
            Filter
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="entryType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry Type
              </label>
              <select
                id="entryType"
                name="entryType"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={filters.entryType}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="2 touch">2 Touch</option>
                <option value="3 touch">3 Touch</option>
                <option value="v touch">V Touch</option>
                <option value="mechanical">Mechanical</option>
                <option value="override">Override</option>
                <option value="aft entry">AFT Entry</option>
              </select>
            </div>
            <div>
              <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Outcome
              </label>
              <select
                id="outcome"
                name="outcome"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={filters.outcome}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
            <div>
              <label htmlFor="tradeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trade Type
              </label>
              <select
                id="tradeType"
                name="tradeType"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={filters.tradeType}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="executed">Executed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mr-2"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {filteredTrades.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No trades found. Add your first trade to get started!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTrades)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([month, monthTrades]) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{month}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({monthTrades.length} trade{monthTrades.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthTrades.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} onDelete={handleDeleteTrade} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TradeList;