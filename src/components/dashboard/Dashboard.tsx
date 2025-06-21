import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { PlusCircle, TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { getAllTrades } from '../../db';
import { calculateStats, generateChartData } from '../../utils/statsCalculator';
import { Trade, TradeStats } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allTrades = await getAllTrades();
        setTrades(allTrades);
        
        if (allTrades.length > 0) {
          const tradeStats = calculateStats(allTrades);
          setStats(tradeStats);
          
          const data = generateChartData(allTrades);
          setChartData(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getBarChartOptions = (title: string) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        color: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#1f2937',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        }
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        }
      }
    }
  });

  const getDoughnutData = () => {
    if (!stats) return null;
    
    return {
      labels: ['Wins', 'Losses', 'Breakeven'],
      datasets: [
        {
          data: [stats.wins, stats.losses, stats.breakeven],
          backgroundColor: ['rgba(75, 192, 75, 0.7)', 'rgba(255, 99, 99, 0.7)', 'rgba(153, 153, 153, 0.7)'],
          borderColor: ['rgba(75, 192, 75, 1)', 'rgba(255, 99, 99, 1)', 'rgba(153, 153, 153, 1)'],
          borderWidth: 1,
        },
      ],
    };
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'win':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'loss':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'breakeven':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Button
          as={Link}
          to="/add-trade"
          variant="primary"
          icon={<PlusCircle size={18} />}
        >
          Add New Trade
        </Button>
      </div>

      {trades.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Welcome to your Trading Journal</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start tracking your trading progress by adding your first trade.</p>
              <Button
                as={Link}
                to="/add-trade"
                variant="primary"
                icon={<PlusCircle size={18} />}
              >
                Add Your First Trade
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalTrades}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats?.winRate.toFixed(1)}%
                    </h3>
                  </div>
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Risk:Reward</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      1:{stats?.averageRR.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit Factor</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats?.profitFactor.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Performance by Entry Type</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData && (
                  <Bar 
                    data={chartData.byEntryType} 
                    options={getBarChartOptions('Trades by Entry Type')} 
                    height={60} 
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trade Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {stats && (
                  <div className="w-full max-w-xs">
                    <Doughnut 
                      data={getDoughnutData()} 
                      options={{
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && (
                <Bar 
                  data={chartData.byMonth} 
                  options={getBarChartOptions('Trade Performance by Month')} 
                  height={60} 
                />
              )}
            </CardContent>
          </Card>

          {/* Entry Type Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance by Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wins</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Losses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Breakeven</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats && Object.entries(stats.byEntryType).map(([entryType, data]) => (
                      <tr key={entryType} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {entryType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {data.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          {data.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                          {data.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {data.breakeven}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {data.winRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-lg">Recent Trades</CardTitle>
              <Link to="/trades" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pair</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outcome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">P/L</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {trades.slice(0, 5).map((trade) => {
                      const priceDiff = trade.exitPrice - trade.entryPrice;
                      const isProfit = priceDiff > 0;
                      const profitLossAmount = Math.abs(priceDiff) * trade.lotSize;
                      
                      return (
                        <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {trade.pair}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {trade.entryType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeColor(
                                trade.outcome
                              )}`}
                            >
                              {trade.outcome.charAt(0).toUpperCase() + trade.outcome.slice(1)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isProfit ? '+' : '-'}{profitLossAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No trades recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;