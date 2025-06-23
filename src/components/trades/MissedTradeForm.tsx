import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, Mic, MicOff, X, Upload, Image, Video, FileAudio } from 'lucide-react';
import { Button } from '../ui/Button';
import { EntryType, TimeframeScreenshots, MissedTrade } from '../../types';
import { addMissedTrade, updateMissedTrade, getMissedTrade } from '../../db';
import { fileToDataUrl, recordAudio, stopRecording } from '../../utils/mediaHelpers';

const entryTypes: EntryType[] = ['2 touch', '3 touch', 'v touch', 'mechanical', 'override', 'aft entry'];
const timeframeLabels = {
  weekly: 'Weekly',
  daily: 'Daily',
  fourHour: '4h',
  oneHour: '1h',
  fifteenMin: '15m',
  fiveMin: '5m'
};

interface MissedTradeFormProps {
  editMode?: boolean;
}

const MissedTradeForm: React.FC<MissedTradeFormProps> = ({ editMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const [formData, setFormData] = useState<{
    pair: string;
    entryType: EntryType;
    missedDate: Date;
    potentialEntry: string;
    potentialExit: string;
    reason: string;
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
    missedDate: new Date(),
    potentialEntry: '',
    potentialExit: '',
    reason: '',
    notes: '',
    media: {
      before: [],
      after: [],
      videos: [],
    },
    timeframeScreenshots: {},
  });

  // Calculate potential pips
  const calculatePotentialPips = () => {
    const entry = parseFloat(formData.potentialEntry);
    const exit = parseFloat(formData.potentialExit);
    
    if (entry && exit) {
      const priceDiff = Math.abs(exit - entry);
      const isJPYPair = formData.pair.includes('JPY');
      
      if (isJPYPair) {
        return priceDiff * 100; // For JPY pairs, 1 pip = 0.01
      } else {
        return priceDiff * 10000; // For other pairs, 1 pip = 0.0001
      }
    }
    return 0;
  };

  // Fetch missed trade data if in edit mode
  useEffect(() => {
    if (editMode && id) {
      const fetchMissedTrade = async () => {
        const trade = await getMissedTrade(id);
        if (trade) {
          setFormData({
            pair: trade.pair,
            entryType: trade.entryType,
            missedDate: trade.missedDate,
            potentialEntry: trade.potentialEntry.toString(),
            potentialExit: trade.potentialExit.toString(),
            reason: trade.reason,
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
      fetchMissedTrade();
    }
  }, [editMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, missedDate: date }));
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
      const potentialPips = calculatePotentialPips();
      
      const missedTradeData: Omit<MissedTrade, 'id' | 'createdAt' | 'updatedAt'> = {
        pair: formData.pair,
        entryType: formData.entryType,
        missedDate: formData.missedDate,
        potentialEntry: parseFloat(formData.potentialEntry),
        potentialExit: parseFloat(formData.potentialExit),
        potentialPips: potentialPips,
        reason: formData.reason,
        notes: formData.notes || undefined,
        media: formData.media,
        timeframeScreenshots: formData.timeframeScreenshots,
      };

      if (editMode && id) {
        await updateMissedTrade(id, missedTradeData);
      } else {
        await addMissedTrade(missedTradeData);
      }

      navigate('/missed-trades');
    } catch (error) {
      console.error('Error saving missed trade:', error);
      alert('Error saving missed trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const potentialPips = calculatePotentialPips();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editMode ? 'Edit Missed Trade' : 'Add Missed Trade'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {/* Trade Details Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Missed Trade Details</h2>
          
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
              <label htmlFor="missedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Missed Date
              </label>
              <DatePicker
                selected={formData.missedDate}
                onChange={handleDateChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                dateFormat="MM/dd/yyyy h:mm aa"
                showTimeSelect
                id="missedDate"
                required
              />
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
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason Missed
              </label>
              <input
                type="text"
                id="reason"
                name="reason"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="e.g., Didn't see the setup, Was away from computer"
                value={formData.reason}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Price Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="potentialEntry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Potential Entry Price
              </label>
              <input
                type="number"
                id="potentialEntry"
                name="potentialEntry"
                step="0.00001"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                value={formData.potentialEntry}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="potentialExit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Potential Exit Price
              </label>
              <input
                type="number"
                id="potentialExit"
                name="potentialExit"
                step="0.00001"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                value={formData.potentialExit}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Potential Pips (Auto-calculated)
              </label>
              <div className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">
                {potentialPips.toFixed(1)} pips
              </div>
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
              placeholder="Additional notes about why this trade was missed..."
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
              onClick={() => navigate('/missed-trades')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editMode ? 'Update Missed Trade' : 'Save Missed Trade'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MissedTradeForm;