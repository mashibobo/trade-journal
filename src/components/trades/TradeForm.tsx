import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, Mic, MicOff, X, Upload, PlusCircle, Image, Video, FileAudio } from 'lucide-react';
import { Button } from '../ui/Button';
import { EntryType, TradeOutcome, Trade, TimeframeScreenshots, TradeType } from '../../types';
import { addTrade, updateTrade, getTrade } from '../../db';
import { fileToDataUrl, recordAudio, stopRecording } from '../../utils/mediaHelpers';

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
  
  const [formData, setFormData] = useState<{
    pair: string;
    entryType: EntryType;
    outcome: TradeOutcome;
    tradeType: TradeType;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        const dataUrl = await fileToDataUrl(files[i]);
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
        entryDate: formData.entryDate,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        stopLoss: parseFloat(formData.stopLoss),
        takeProfit: parseFloat(formData.takeProfit),
        lotSize: parseFloat(formData.lotSize),
        riskRewardRatio: riskRewardRatio,
        stopLossAmount: parseFloat(formData.stopLossAmount),
        takeProfitAmount: parseFloat(formData.takeProfitAmount),
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

          <div>
            <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Take Profit Price
            </label>
            <input
              type="number"
              id="takeProfit"
              name="takeProfit"
              step="0.00001"
              required
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

          <div>
            <label htmlFor="takeProfitAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Take Profit Amount ($)
            </label>
            <input
              type="number"
              id="takeProfitAmount"
              name="takeProfitAmount"
              step="0.01"
              required
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
                accept="video/*"
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
    </form>
  );
};

export default TradeForm;