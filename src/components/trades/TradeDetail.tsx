import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit, ArrowLeft, Trash2, Image as ImageIcon, Video, FileAudio } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { ImageViewer } from '../ui/ImageViewer';
import { getTrade, deleteTrade } from '../../db';
import { Trade } from '../../types';
import { formatPips } from '../../utils/formatters';

const TradeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'timeframes'>('details');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<Array<{ src: string; title: string; alt: string }>>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
  useEffect(() => {
    const fetchTrade = async () => {
      if (!id) return;
      
      try {
        const fetchedTrade = await getTrade(id);
        if (fetchedTrade) {
          setTrade(fetchedTrade);
        } else {
          navigate('/trades');
        }
      } catch (error) {
        console.error('Error fetching trade:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrade();
  }, [id, navigate]);
  
  const handleDelete = async () => {
    if (!trade || !confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      await deleteTrade(trade.id);
      navigate('/trades');
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const openImageViewer = (images: Array<{ src: string; title: string; alt: string }>, index: number) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (!trade) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Trade not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The trade you're looking for doesn't exist or has been deleted.</p>
        <Button as={Link} to="/trades" variant="primary">
          Back to Trades
        </Button>
      </div>
    );
  }

  // Calculate profit/loss and pips
  const priceDiff = trade.exitPrice - trade.entryPrice;
  const isProfit = priceDiff > 0;
  const profitLossAmount = Math.abs(priceDiff) * trade.volume;
  const pips = formatPips(Math.abs(priceDiff));
  
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

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button
          as={Link}
          to="/trades"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
        >
          Back to Trades
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            icon={<Trash2 size={16} />}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete
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
      </div>
      
      {/* Trade Header */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{trade.pair}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(trade.entryDate), 'MMMM dd, yyyy h:mm a')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                trade.direction === 'buy' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 
                'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {trade.direction.toUpperCase()}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                {trade.tradeType.charAt(0).toUpperCase() + trade.tradeType.slice(1)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4">
              {[
                { id: 'details', label: 'Details' },
                { id: 'media', label: 'Media' },
                { id: 'timeframes', label: 'Timeframes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="mt-4">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Price</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{trade.entryPrice.toFixed(5)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Exit Price</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{trade.exitPrice.toFixed(5)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stop Loss</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{trade.stopLoss.toFixed(5)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Take Profit</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{trade.takeProfit.toFixed(5)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume (Lot Size)</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{trade.volume} lots</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk:Reward Ratio</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">1:{trade.riskRewardRatio.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stop Loss Amount</h3>
                    <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">-${trade.stopLossAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Take Profit Amount</h3>
                    <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">+${trade.takeProfitAmount.toFixed(2)}</p>
                  </div>
                  {trade.breakEvenAmount && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Break Even Amount</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-600 dark:text-gray-400">${trade.breakEvenAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">P&L Amount</h3>
                  <p className={`mt-1 text-lg font-semibold ${
                    isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isProfit ? '+' : '-'}${profitLossAmount.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Result</h3>
                  <p className={`mt-1 text-lg font-semibold ${
                    isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPips(calculatePips(priceDiff, trade.pair), trade.pair)} pips
                  </p>
                </div>
                
                {trade.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                    <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{trade.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {trade.media.audioDescription && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <FileAudio size={16} className="mr-1" /> Audio Description
                    </h3>
                    <audio src={trade.media.audioDescription} controls className="w-full" />
                  </div>
                )}
                
                {trade.media.before.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <ImageIcon size={16} className="mr-1" /> Before Trade
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {trade.media.before.map((src, index) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img
                            src={src}
                            alt={`Before trade ${index + 1}`}
                            className="rounded-lg w-full h-40 object-cover hover:opacity-80 transition-opacity"
                            onClick={() => openImageViewer(
                              trade.media.before.map((src, i) => ({
                                src,
                                title: `Before Trade ${i + 1}`,
                                alt: `Before trade ${i + 1}`
                              })),
                              index
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {trade.media.after.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <ImageIcon size={16} className="mr-1" /> After Trade
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {trade.media.after.map((src, index) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img
                            src={src}
                            alt={`After trade ${index + 1}`}
                            className="rounded-lg w-full h-40 object-cover hover:opacity-80 transition-opacity"
                            onClick={() => openImageViewer(
                              trade.media.after.map((src, i) => ({
                                src,
                                title: `After Trade ${i + 1}`,
                                alt: `After trade ${i + 1}`
                              })),
                              index
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {trade.media.videos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <Video size={16} className="mr-1" /> Videos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {trade.media.videos.map((src, index) => (
                        <div key={index}>
                          <video
                            src={src}
                            controls
                            className="rounded-lg w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {trade.media.before.length === 0 && trade.media.after.length === 0 && trade.media.videos.length === 0 && !trade.media.audioDescription && (
                  <p className="text-gray-500 dark:text-gray-400 py-8 text-center">No media uploaded for this trade.</p>
                )}
              </div>
            )}
            
            {/* Timeframes Tab */}
            {activeTab === 'timeframes' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(trade.timeframeScreenshots).length > 0 ? (
                    Object.entries(trade.timeframeScreenshots).map(([key, value]) => {
                      if (!value) return null;
                      
                      const timeframeMap: Record<string, string> = {
                        weekly: 'Weekly',
                        daily: 'Daily',
                        fourHour: '4 Hour',
                        oneHour: '1 Hour',
                        fifteenMin: '15 Minutes',
                        fiveMin: '5 Minutes'
                      };
                      
                      return (
                        <div key={key} className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {timeframeMap[key]}
                          </h3>
                          <div className="relative group cursor-pointer">
                            <img
                              src={value}
                              alt={`${timeframeMap[key]} timeframe`}
                              className="w-full rounded-md object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                              onClick={() => {
                                const timeframeImages = Object.entries(trade.timeframeScreenshots)
                                  .filter(([, src]) => src)
                                  .map(([tf, src]) => ({
                                    src: src!,
                                    title: `${timeframeMap[tf]} Timeframe`,
                                    alt: `${timeframeMap[tf]} timeframe`
                                  }));
                                
                                const currentIndex = timeframeImages.findIndex(img => img.src === value);
                                openImageViewer(timeframeImages, currentIndex);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 py-8 text-center col-span-3">No timeframe screenshots uploaded for this trade.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer */}
      <ImageViewer
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
    </div>
  );
};

export default TradeDetail;