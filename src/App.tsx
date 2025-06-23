import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import TradeForm from './components/trades/TradeForm';
import TradeList from './components/trades/TradeList';
import TradeDetail from './components/trades/TradeDetail';
import MissedTradesList from './components/trades/MissedTradesList';
import MissedTradeForm from './components/trades/MissedTradeForm';
import MissedTradeDetail from './components/trades/MissedTradeDetail';
import BacktestGallery from './components/backtest/BacktestGallery';
import TradingJournal from './components/analytics/TradingJournal';
import RiskManagement from './components/analytics/RiskManagement';
import ImportExport from './components/settings/ImportExport';

function App() {
  // Set dark mode based on user preference
  React.useEffect(() => {
    const isDarkMode = localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-trade" element={<TradeForm />} />
        <Route path="/trades" element={<TradeList />} />
        <Route path="/trades/:id" element={<TradeDetail />} />
        <Route path="/trades/:id/edit" element={<TradeForm editMode={true} />} />
        <Route path="/missed-trades" element={<MissedTradesList />} />
        <Route path="/missed-trades/add" element={<MissedTradeForm />} />
        <Route path="/missed-trades/:id" element={<MissedTradeDetail />} />
        <Route path="/missed-trades/:id/edit" element={<MissedTradeForm editMode={true} />} />
        <Route path="/backtests" element={<BacktestGallery />} />
        <Route path="/journal" element={<TradingJournal />} />
        <Route path="/risk" element={<RiskManagement />} />
        <Route path="/stats" element={<Dashboard />} />
        <Route path="/settings" element={<ImportExport />} />
      </Routes>
    </Layout>
  );
}

export default App;