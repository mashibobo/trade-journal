import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Trade } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { formatPips, calculatePips } from '../../utils/formatters';

interface TradeCardProps {
  trade: Trade;
  onDelete: (id: string) => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, onDelete }) => {
  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'win':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'loss':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'breakeven':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  // Calculate profit/loss and pips
  const priceDiff = trade.exitPrice - trade.entryPrice;
  const isProfit = priceDiff > 0;
  const profitLossAmount = Math.abs(priceDiff) * trade.lotSize;
  const pips = calculatePips(priceDiff, trade.pair);
  const formattedPips = formatPips(pips, trade.pair);

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{trade.pair}</CardTitle>
        <div className="flex space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeColor(
              trade.outcome
            )}`}
          >
            {trade.outcome.charAt(0).toUpperCase() + trade.outcome.slice(1)}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            {trade.entryType.toUpperCase()}
          </span>
          {trade.tradeType === 'missed' && (
            <>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                Missed
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                trade.direction === 'buy' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 
                'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {trade.direction.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Date</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
              {format(new Date(trade.entryDate), 'PPP')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk:Reward</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
              1:{trade.riskRewardRatio.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Price</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{trade.entryPrice.toFixed(5)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Exit Price</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{trade.exitPrice.toFixed(5)}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Result</p>
          <p className={`mt-1 text-sm font-medium ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isProfit ? '+' : '-'}${profitLossAmount.toFixed(2)} ({formattedPips} pips)
          </p>
        </div>

        {/* Media preview */}
        {(trade.media.before.length > 0 || trade.media.after.length > 0) && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Media</p>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {trade.media.before.slice(0, 2).map((src, index) => (
                <img 
                  key={`before-${index}`} 
                  src={src} 
                  alt={`Before trade ${index + 1}`} 
                  className="h-16 w-16 object-cover rounded-md" 
                />
              ))}
              {trade.media.after.slice(0, 2).map((src, index) => (
                <img 
                  key={`after-${index}`} 
                  src={src} 
                  alt={`After trade ${index + 1}`} 
                  className="h-16 w-16 object-cover rounded-md" 
                />
              ))}
              {(trade.media.before.length > 2 || trade.media.after.length > 2) && (
                <div className="flex items-center justify-center h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <span className="text-xs text-gray-500 dark:text-gray-400">+{(trade.media.before.length + trade.media.after.length - 4)} more</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(trade.id)}
          icon={<Trash2 size={16} />}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete
        </Button>
        <div className="flex space-x-2">
          <Button
            as={Link}
            to={`/trades/${trade.id}`}
            variant="ghost"
            size="sm"
            icon={<Eye size={16} />}
          >
            View
          </Button>
          <Button
            as={Link}
            to={`/trades/${trade.id}/edit`}
            variant="primary"
            size="sm"
            icon={<Edit size={16} />}
          >
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TradeCard;