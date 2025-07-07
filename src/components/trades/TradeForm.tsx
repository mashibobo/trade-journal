import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, Mic, MicOff, X, Upload, PlusCircle, Image, Video, FileAudio, Download, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { EntryType, TradeOutcome, Trade, TimeframeScreenshots, TradeType } from '../../types';
import { addTrade, updateTrade, getTrade } from '../../db';
import { fileToDataUrl, recordAudio, stopRecording } from '../../utils/mediaHelpers';

interface ImportedTrade {
  symbol: string;
  type: string;
  volume: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: Date;
  exitTime: Date;
  profit: number;
}

interface MT5ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: ImportedTrade[];
  onImport: (selectedTrades: ImportedTrade[]) => void;
}

const MT5ImportModal: React.FC<MT5ImportModalProps> = ({ isOpen, onClose, trades, onImport }) => {
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  
  if (!isOpen) return null;
  
  const toggleTrade = (index: number) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTrades(newSelected);
  };
  
  const handleImport = () => {
    const tradesToImport = trades.filter((_, index) => selectedTrades.has(index));
    onImport(tradesToImport);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import MT5 Trades</h2>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={20} />} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Found {trades.length} trades. Select which ones to import:
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTrades(new Set(trades.map((_, i) => i)))}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTrades(new Set())}
            >
              Clear All
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Exit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {trades.map((trade, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTrades.has(index)}
                        onChange={() => toggleTrade(index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.type === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {trade.volume}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {trade.entryPrice.toFixed(5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {trade.exitPrice.toFixed(5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={trade.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {trade.entryTime.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={selectedTrades.size === 0}
          >
            Import {selectedTrades.size} Trade{selectedTrades.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};
const entryTypes: EntryType[] = ['2 touch', '3 touch', 'v touch', 'mechanical', 'override', 'aft entry'];
const outcomes: TradeOutcome[] = ['win', 'loss', 'breakeven'];
const tradeTypes: TradeType[] = ['executed', 'missed'];
const timeframeLabels = {
  weekly: 'Weekly',
  daily: 'Daily',
  fourHour: '4h',
  oneHour: '1h',
  fifteenMin: '15m',
  fiveMin: '5m'
};

interface TradeFormProps {
  editMode?: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({ editMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [importedTrades, setImportedTrades] = useState<ImportedTrade[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState<{
    pair: string;
    entryType: EntryType;
    outcome: TradeOutcome;
    tradeType: TradeType;
    direction: 'buy' | 'sell';
    entryDate: Date;
    entryPrice: string;
    exitPrice: string;
    stopLoss: string;
    takeProfit: string;
    lotSize: string;
    stopLossAmount: string;
    takeProfitAmount: string;
    breakEvenAmount: string;
    notes: string;
    media: {
      before: string[];
      after: string[];
      videos: string[];
      audioDescription?: string;
    };
    timeframeScreenshots: TimeframeScreenshots;
  }>({
    pair: '',
    entryType: '2 touch',
    outcome: 'win',
    tradeType: 'executed',
    direction: 'buy',
    entryDate: new Date(),
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: '',
    stopLossAmount: '',
    takeProfitAmount: '',
    breakEvenAmount: '',
    notes: '',
    media: {
      before: [],
      after: [],
      videos: [],
    },
    timeframeScreenshots: {},
  });

  // Handle importing selected trades from MT5
  const handleImportTrades = async (selectedTrades: ImportedTrade[]) => {
    try {
      for (const trade of selectedTrades) {
        const outcome: TradeOutcome = trade.profit > 0 ? 'win' : trade.profit < 0 ? 'loss' : 'breakeven';
        
        const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'backtestScreenshots'> = {
          pair: trade.symbol,
          entryType: '2 touch', // Default, user can edit later
          outcome,
          tradeType: 'executed',
          direction: trade.type as 'buy' | 'sell',
          entryDate: trade.entryTime,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss || 0,
          takeProfit: trade.takeProfit || 0,
          lotSize: trade.volume,
          riskRewardRatio: 0, // Will be calculated
          stopLossAmount: Math.abs(trade.profit), // Simplified
          takeProfitAmount: outcome === 'win' ? Math.abs(trade.profit) : 0,
          breakEvenAmount: undefined,
          notes: `Imported from MT5 report`,
          media: {
            before: [],
            after: [],
            videos: [],
          },
          timeframeScreenshots: {},
          backtestScreenshots: [],
        };
        
        await addTrade(tradeData);
      }
      
      alert(`Successfully imported ${selectedTrades.length} trade(s)!`);
      navigate('/trades');
    } catch (error) {
      console.error('Error importing trades:', error);
      alert('Error importing trades. Please try again.');
    }
  };
  // Calculate Risk:Reward ratio automatically
  const calculateRiskReward = () => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    
    if (entry && sl && tp) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      return risk > 0 ? (reward / risk) : 0;
    }
    return 0;
  };

  // Fetch trade data if in edit mode
  useEffect(() => {
    if (editMode && id) {
      const fetchTrade = async () => {
        const trade = await getTrade(id);
        if (trade) {
          setFormData({
            pair: trade.pair,
            entryType: trade.entryType,
            outcome: trade.outcome,
            tradeType: trade.tradeType,
            direction: trade.direction,
            entryDate: trade.entryDate,
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice.toString(),
            stopLoss: trade.stopLoss.toString(),
            takeProfit: trade.takeProfit.toString(),
            lotSize: trade.lotSize.toString(),
            stopLossAmount: trade.stopLossAmount.toString(),
            takeProfitAmount: trade.takeProfitAmount.toString(),
            breakEvenAmount: trade.breakEvenAmount?.toString() || '',
            notes: trade.notes || '',
            media: {
              before: trade.media.before,
              after: trade.media.after,
              videos: trade.media.videos,
              audioDescription: trade.media.audioDescription,
            },
            timeframeScreenshots: trade.timeframeScreenshots,
          });
        }
      };
      fetchTrade();
    }
  }, [editMode, id]);

  // Handle MT5 Report Import
  const handleMT5Import = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const text = await file.text();
      
      // Parse MT5 HTML report
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Extract trades from the positions table
      const positionRows = doc.querySelectorAll('table tr[bgcolor]');
      const trades: any[] = [];
      
      positionRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 14) {
          const entryTime = cells[0]?.textContent?.trim();
          const symbol = cells[2]?.textContent?.trim();
          const type = cells[3]?.textContent?.trim();
          const volume = cells[4]?.textContent?.trim();
          const entryPrice = cells[5]?.textContent?.trim();
          const stopLoss = cells[6]?.textContent?.trim();
          const takeProfit = cells[7]?.textContent?.trim();
          const exitTime = cells[8]?.textContent?.trim();
          const exitPrice = cells[9]?.textContent?.trim();
          const profit = cells[13]?.textContent?.trim();
          
          if (symbol && type && entryPrice && exitPrice) {
            trades.push({
              symbol,
              type: type.toLowerCase(),
              volume: parseFloat(volume || '0'),
              entryPrice: parseFloat(entryPrice),
              exitPrice: parseFloat(exitPrice),
              stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
              takeProfit: takeProfit ? parseFloat(takeProfit) : 0,
              entryTime: new Date(entryTime || Date.now()),
              exitTime: new Date(exitTime || Date.now()),
              profit: parseFloat(profit || '0')
            });
          }
        }
      });
      
      if (trades.length > 0) {
        // Show import modal with trades
        setImportedTrades(trades);
        setShowImportModal(true);
      } else {
        alert('No trades found in the MT5 report. Please check the file format.');
      }
    } catch (error) {
      console.error('Error parsing MT5 report:', error);
      alert('Error parsing MT5 report. Please check the file format.');
    } finally {
      e.target.value = '';
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Disable take profit fields when outcome is loss
  useEffect(() => {
    if (formData.outcome === 'loss') {
      setFormData(prev => ({
        ...prev,
        takeProfit: '',
        takeProfitAmount: ''
      }));
    }
  }, [formData.outcome]);
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, entryDate: date }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'videos') => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = e.target.files;
    const fileUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        if (type === 'videos') {
          // Handle video files differently
          const dataUrl = await fileToDataUrl(files[i]);
          fileUrls.push(dataUrl);
        } else {
          const dataUrl = await fileToDataUrl(files[i]);
          fileUrls.push(dataUrl);
        }
        fileUrls.push(dataUrl);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        [type]: [...prev.media[type], ...fileUrls]
      }
    }));

    e.target.value = '';
  };

  const handleTimeframeScreenshot = async (e: React.ChangeEvent<HTMLInputElement>, timeframe: keyof TimeframeScreenshots) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const dataUrl = await fileToDataUrl(e.target.files[0]);
      
      setFormData(prev => ({
        ...prev,
        timeframeScreenshots: {
          ...prev.timeframeScreenshots,
          [timeframe]: dataUrl
        }
      }));
    } catch (error) {
      console.error('Error processing timeframe screenshot:', error);
    }

    e.target.value = '';
  };

  const handleRemoveMedia = (type: 'before' | 'after' | 'videos', index: number) => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        [type]: prev.media[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleRemoveTimeframeScreenshot = (timeframe: keyof TimeframeScreenshots) => {
    setFormData(prev => ({
      ...prev,
      timeframeScreenshots: {
        ...prev.timeframeScreenshots,
        [timeframe]: undefined
      }
    }));
  };

  const startRecording = async () => {
    try {
      const recorder = await recordAudio();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const endRecording = async () => {
    if (mediaRecorder) {
      try {
        const audioDataUrl = await stopRecording(mediaRecorder);
        setFormData(prev => ({
          ...prev,
          media: {
            ...prev.media,
            audioDescription: audioDataUrl
          }
        }));
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleDeleteAudio = () => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        audioDescription: undefined
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const riskRewardRatio = calculateRiskReward();
      
      const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'backtestScreenshots'> = {
        pair: formData.pair,
        entryType: formData.entryType,
        outcome: formData.outcome,
        tradeType: formData.tradeType,
        direction: formData.direction,
        entryDate: formData.entryDate,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        stopLoss: parseFloat(formData.stopLoss),
        takeProfit: formData.outcome === 'loss' ? 0 : parseFloat(formData.takeProfit || '0'),
        lotSize: parseFloat(formData.lotSize),
        riskRewardRatio: riskRewardRatio,
        stopLossAmount: parseFloat(formData.stopLossAmount),
        takeProfitAmount: formData.outcome === 'loss' ? 0 : parseFloat(formData.takeProfitAmount || '0'),
        breakEvenAmount: formData.breakEvenAmount ? parseFloat(formData.breakEvenAmount) : undefined,
        notes: formData.notes || undefined,
        media: formData.media,
        timeframeScreenshots: formData.timeframeScreenshots,
        backtestScreenshots: [],
      };

      if (editMode && id) {
        await updateTrade(id, tradeData);
      } else {
        await addTrade(tradeData);
      }

      navigate('/trades');
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Error saving trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskRewardRatio = calculateRiskReward();

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
      <div className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {editMode ? 'Edit Trade' : 'Add New Trade'}
      </div>

      {/* Trade Details Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Trade Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pair" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency Pair
            </label>
            <input
              type="text"
              id="pair"
              name="pair"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="EUR/USD"
              value={formData.pair}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Entry Date
            </label>
            <DatePicker
              selected={formData.entryDate}
              onChange={handleDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              dateFormat="MM/dd/yyyy h:mm aa"
              showTimeSelect
              id="entryDate"
              required
            />
          </div>

          <div>
            <label htmlFor="tradeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trade Type
            </label>
            <select
              id="tradeType"
              name="tradeType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.tradeType}
              onChange={handleChange}
            >
              {tradeTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trade Direction
            </label>
            <select
              id="direction"
              name="direction"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.direction}
              onChange={handleChange}
            >
              <option value="buy">Buy (Long)</option>
              <option value="sell">Sell (Short)</option>
            </select>
          </div>
          <div>
            <label htmlFor="entryType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Entry Type
            </label>
            <select
              id="entryType"
              name="entryType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.entryType}
              onChange={handleChange}
            >
              {entryTypes.map(type => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Outcome
            </label>
            <select
              id="outcome"
              name="outcome"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.outcome}
              onChange={handleChange}
            >
              {outcomes.map(outcome => (
                <option key={outcome} value={outcome}>
                  {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Lot Size
            </label>
            <input
              type="number"
              id="lotSize"
              name="lotSize"
              step="0.01"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.lotSize}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Entry Price
            </label>
            <input
              type="number"
              id="entryPrice"
              name="entryPrice"
              step="0.00001"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.entryPrice}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stop Loss Price
            </label>
            <input
              type="number"
              id="stopLoss"
              name="stopLoss"
              step="0.00001"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.stopLoss}
              onChange={handleChange}
            />
          </div>

          <div className={formData.outcome === 'loss' ? 'opacity-50 pointer-events-none' : ''}>
            <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Take Profit Price {formData.outcome === 'loss' && '(Disabled for Loss)'}
            </label>
            <input
              type="number"
              id="takeProfit"
              name="takeProfit"
              step="0.00001"
              required={formData.outcome !== 'loss'}
              disabled={formData.outcome === 'loss'}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.takeProfit}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Actual Exit Price
            </label>
            <input
              type="number"
              id="exitPrice"
              name="exitPrice"
              step="0.00001"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.exitPrice}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Risk:Reward Ratio (Auto-calculated)
            </label>
            <div className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">
              1:{riskRewardRatio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="stopLossAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stop Loss Amount ($)
            </label>
            <input
              type="number"
              id="stopLossAmount"
              name="stopLossAmount"
              step="0.01"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.stopLossAmount}
              onChange={handleChange}
            />
          </div>

          <div className={formData.outcome === 'loss' ? 'opacity-50 pointer-events-none' : ''}>
            <label htmlFor="takeProfitAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Take Profit Amount ($) {formData.outcome === 'loss' && '(Disabled for Loss)'}
            </label>
            <input
              type="number"
              id="takeProfitAmount"
              name="takeProfitAmount"
              step="0.01"
              required={formData.outcome !== 'loss'}
              disabled={formData.outcome === 'loss'}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.takeProfitAmount}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="breakEvenAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Break Even Amount ($) <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="number"
              id="breakEvenAmount"
              name="breakEvenAmount"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={formData.breakEvenAmount}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="Add any trade notes here..."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* MT5 Report Import Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">MT5 Report Import</h2>
        <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="mt5-report" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  icon={<Upload size={16} />}
                  onClick={() => document.getElementById('mt5-report')?.click()}
                >
                  Import MT5 Report
                </Button>
              </label>
              <input
                id="mt5-report"
                type="file"
                accept=".html"
                className="hidden"
                onChange={handleMT5Import}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upload your MetaTrader 5 HTML report to automatically import trades
            </p>
          </div>
        </div>
      </div>
      {/* Timeframe Screenshots */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Timeframe Screenshots</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {(Object.keys(timeframeLabels) as Array<keyof typeof timeframeLabels>).map((key) => (
            <div key={key} className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {timeframeLabels[key]}
              </label>
              {formData.timeframeScreenshots[key as keyof TimeframeScreenshots] ? (
                <div className="relative">
                  <img
                    src={formData.timeframeScreenshots[key as keyof TimeframeScreenshots]}
                    alt={`${timeframeLabels[key]} screenshot`}
                    className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                    onClick={() => handleRemoveTimeframeScreenshot(key as keyof TimeframeScreenshots)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 flex flex-col items-center justify-center h-32 w-full">
                  <label htmlFor={`timeframe-${key}`} className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Upload</span>
                  </label>
                  <input
                    id={`timeframe-${key}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleTimeframeScreenshot(e, key as keyof TimeframeScreenshots)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Media Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Trade Media</h2>
        
        {/* Before Photos */}
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Before Trade Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {formData.media.before.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt={`Before trade ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                  onClick={() => handleRemoveMedia('before', index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 flex flex-col items-center justify-center h-32">
              <label htmlFor="before-photos" className="cursor-pointer flex flex-col items-center">
                <Image className="h-8 w-8 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Add Before Photos</span>
              </label>
              <input
                id="before-photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'before')}
              />
            </div>
          </div>
        </div>

        {/* After Photos */}
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">After Trade Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {formData.media.after.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt={`After trade ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                  onClick={() => handleRemoveMedia('after', index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 flex flex-col items-center justify-center h-32">
              <label htmlFor="after-photos" className="cursor-pointer flex flex-col items-center">
                <Image className="h-8 w-8 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Add After Photos</span>
              </label>
              <input
                id="after-photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'after')}
              />
            </div>
          </div>
        </div>

        {/* Videos */}
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Trade Videos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {formData.media.videos.map((src, index) => (
              <div key={index} className="relative">
                <video
                  src={src}
                  controls
                  className="w-full h-40 object-cover rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                  onClick={() => handleRemoveMedia('videos', index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 flex flex-col items-center justify-center h-40">
              <label htmlFor="videos" className="cursor-pointer flex flex-col items-center">
                <Video className="h-8 w-8 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Add Videos</span>
              </label>
              <input
                id="videos"
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'videos')}
              />
            </div>
          </div>
        </div>

        {/* Audio Description */}
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Description</h3>
          {formData.media.audioDescription ? (
            <div className="mb-4 p-4 border rounded-md border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <audio src={formData.media.audioDescription} controls className="w-full" />
              <button
                type="button"
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={handleDeleteAudio}
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <Button
                type="button"
                variant={isRecording ? 'danger' : 'primary'}
                onClick={isRecording ? endRecording : startRecording}
                className="w-full sm:w-auto flex items-center justify-center"
                icon={isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              {isRecording && (
                <p className="text-sm text-red-500 mt-2">Recording in progress...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-3"
            onClick={() => navigate('/trades')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {editMode ? 'Update Trade' : 'Save Trade'}
          </Button>
        </div>
      </div>
      
      {/* MT5 Import Modal */}
      <MT5ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        trades={importedTrades}
        onImport={handleImportTrades}
      />
    </form>
  );
};

export default TradeForm;