import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Calendar, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MissedTrade } from '../../types';
import { getAllMissedTrades, deleteMissedTrade } from '../../db';
import { formatPips } from '../../utils/formatters';

const MissedTradesList: React.FC = () => {
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<MissedTrade[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissedTrades = async () => {
      try {
        const trades = await getAllMissedTrades();
        setMissedTrades(trades);
        setFilteredTrades(trades);
      } catch (error) {
        console.error('Error fetching missed trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissedTrades();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTrades(missedTrades);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = missedTrades.filter(trade => 
        trade.pair.toLowerCase().includes(query) ||
        trade.reason.toLowerCase().includes(query) ||
        trade.notes?.toLowerCase().includes(query)
      );
      setFilteredTrades(filtered);
    }
  }, [searchQuery, missedTrades]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this missed trade?')) return;
    
    try {
      await deleteMissedTrade(id);
      setMissedTrades(prev => prev.filter(trade => trade.id !== id));
    } catch (error) {
      console.error('Error deleting missed trade:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Missed Trades</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search missed trades..."
              className="pl-10 pr-4 py-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            as={Link}
            to="/missed-trades/add"
            variant="primary"
            icon={<PlusCircle size={18} />}
            className="whitespace-nowrap"
          >
            Add Missed Trade
          </Button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              {searchQuery ? (
                <p className="text-gray-500 dark:text-gray-400">No missed trades found matching your search.</p>
              ) : (
                <>
                  <TrendingDown className="mx-auto h-12 w-12 text-orange-400 mb-4" />
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Missed Trades Yet</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Track the trades you missed to learn from missed opportunities.
                  </p>
                  <Button
                    as={Link}
                    to="/missed-trades/add"
                    variant="primary"
                    icon={<PlusCircle size={18} />}
                  >
                    Add First Missed Trade
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrades.map(trade => (
            <Card key={trade.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{trade.pair}</CardTitle>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                      Missed
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {trade.entryType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Missed Date</p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      {format(new Date(trade.missedDate), 'PPP')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Potential Entry</p>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{trade.potentialEntry.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Potential Exit</p>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{trade.potentialExit.toFixed(5)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Potential Pips</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      +{formatPips(trade.potentialPips)} pips
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason Missed</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{trade.reason}</p>
                  </div>
                  
                  {trade.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{trade.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(trade.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                  <Button
                    as={Link}
                    to={`/missed-trades/${trade.id}`}
                    variant="primary"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissedTradesList;