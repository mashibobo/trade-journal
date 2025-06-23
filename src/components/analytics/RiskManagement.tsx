import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { getAllTrades } from '../../db';
import { Trade } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const RiskManagement: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [riskMetrics, setRiskMetrics] = useState({
    averageRisk: 0,
    maxRisk: 0,
    riskConsistency: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    consecutiveLosses: 0,
    riskRewardDistribution: {} as Record<string, number>
  });

  useEffect(() => {
    const fetchTrades = async () => {
      const allTrades = await getAllTrades();
      setTrades(allTrades);
      calculateRiskMetrics(allTrades);
    };
    fetchTrades();
  }, []);

  const calculateRiskMetrics = (trades: Trade[]) => {
    if (trades.length === 0) return;

    // Calculate risk amounts
    const riskAmounts = trades.map(t => t.stopLossAmount);
    const averageRisk = riskAmounts.reduce((a, b) => a + b, 0) / riskAmounts.length;
    const maxRisk = Math.max(...riskAmounts);

    // Risk consistency (lower standard deviation = more consistent)
    const riskVariance = riskAmounts.reduce((acc, risk) => acc + Math.pow(risk - averageRisk, 2), 0) / riskAmounts.length;
    const riskStdDev = Math.sqrt(riskVariance);
    const riskConsistency = averageRisk > 0 ? (1 - (riskStdDev / averageRisk)) * 100 : 0;

    // Profit factor
    const profits = trades.filter(t => t.outcome === 'win').reduce((acc, t) => acc + t.takeProfitAmount, 0);
    const losses = trades.filter(t => t.outcome === 'loss').reduce((acc, t) => acc + t.stopLossAmount, 0);
    const profitFactor = losses > 0 ? profits / losses : 0;

    // Max consecutive losses
    let maxConsecutiveLosses = 0;
    let currentConsecutiveLosses = 0;
    
    trades.forEach(trade => {
      if (trade.outcome === 'loss') {
        currentConsecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
      } else {
        currentConsecutiveLosses = 0;
      }
    });

    // Risk-Reward distribution
    const rrDistribution: Record<string, number> = {};
    trades.forEach(trade => {
      const rrRange = Math.floor(trade.riskRewardRatio);
      const key = `${rrRange}:1 - ${rrRange + 1}:1`;
      rrDistribution[key] = (rrDistribution[key] || 0) + 1;
    });

    setRiskMetrics({
      averageRisk,
      maxRisk,
      riskConsistency: Math.max(0, riskConsistency),
      profitFactor,
      sharpeRatio: 0, // Simplified for now
      maxDrawdown: 0, // Would need equity curve calculation
      consecutiveLosses: maxConsecutiveLosses,
      riskRewardDistribution: rrDistribution
    });
  };

  const getRiskLevel = (consistency: number) => {
    if (consistency >= 80) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
    if (consistency >= 60) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' };
  };

  const riskLevel = getRiskLevel(riskMetrics.riskConsistency);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Risk Management
        </h1>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Risk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${riskMetrics.averageRisk.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Max Risk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${riskMetrics.maxRisk.toFixed(2)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Risk Consistency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {riskMetrics.riskConsistency.toFixed(1)}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profit Factor</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {riskMetrics.profitFactor.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${riskLevel.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${riskLevel.color}`}>
                    Risk Level: {riskLevel.level}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on risk consistency and management patterns
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${riskLevel.color}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Max Consecutive Losses</h4>
                <p className="text-2xl font-bold text-red-600">{riskMetrics.consecutiveLosses}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {riskMetrics.consecutiveLosses <= 3 ? 'Good control' : 'Consider review'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Recommendations</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {riskMetrics.riskConsistency < 70 && (
                    <li>• Standardize your risk per trade</li>
                  )}
                  {riskMetrics.consecutiveLosses > 5 && (
                    <li>• Review strategy after 3 consecutive losses</li>
                  )}
                  {riskMetrics.profitFactor < 1.5 && (
                    <li>• Improve risk:reward ratio</li>
                  )}
                  {Object.keys(riskMetrics.riskRewardDistribution).length === 0 && (
                    <li>• Start tracking more trades for better analysis</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk-Reward Distribution */}
      {Object.keys(riskMetrics.riskRewardDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk:Reward Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(riskMetrics.riskRewardDistribution).map(([range, count]) => (
                <div key={range} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">{range}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">{count} trades</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(count / trades.length) * 100}%` }}
                      />
                    </div>
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

export default RiskManagement;