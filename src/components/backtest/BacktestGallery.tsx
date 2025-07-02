import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Search, 
  Download, 
  Upload, 
  Eye, 
  Folder, 
  FolderOpen, 
  Filter,
  Grid3X3,
  List,
  Calendar,
  Tag,
  Clock,
  TrendingUp,
  X,
  Edit3,
  Star,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { BacktestScreenshot, EntryType } from '../../types';
import { getAllBacktests, addBacktest, updateBacktest, deleteBacktest } from '../../db';
import { fileToDataUrl } from '../../utils/mediaHelpers';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ImageViewer } from '../ui/ImageViewer';

const entryTypes: EntryType[] = ['2 touch', '3 touch', 'v touch', 'mechanical', 'override', 'aft entry'];
const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
const strategies = ['Continuation', 'Reversal', 'Breakout', 'Pullback', 'Scalping', 'Swing'];

const popularPairs = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
  'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'AUD/JPY',
  'EUR/AUD', 'EUR/CAD', 'GBP/AUD', 'GBP/CAD'
];

interface BacktestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (backtests: Omit<BacktestScreenshot, 'id' | 'createdAt'>[]) => void;
  selectedPair?: string;
}

const BacktestUploadModal: React.FC<BacktestUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  selectedPair 
}) => {
  const [formData, setFormData] = useState({
    currencyPair: selectedPair || '',
    entryType: '2 touch' as EntryType,
    timeframe: '4h',
    strategy: 'Continuation',
    description: '',
    notes: '',
    tags: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const backtests: Omit<BacktestScreenshot, 'id' | 'createdAt'>[] = [];
      
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const dataUrl = await fileToDataUrl(file);
        backtests.push({
          description: formData.description || `${formData.currencyPair} ${formData.entryType} ${formData.timeframe}`,
          dataUrl,
          currencyPair: formData.currencyPair,
          entryType: formData.entryType,
          timeframe: formData.timeframe,
          strategy: formData.strategy,
          notes: formData.notes,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        });
      }
      
      onUpload(backtests);
      onClose();
      setFiles([]);
      setFormData({
        currencyPair: selectedPair || '',
        entryType: '2 touch',
        timeframe: '4h',
        strategy: 'Continuation',
        description: '',
        notes: '',
        tags: ''
      });
    } catch (error) {
      console.error('Error uploading backtests:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Backtest Screenshots</h2>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={20} />} />
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency Pair
              </label>
              <select
                value={formData.currencyPair}
                onChange={(e) => setFormData(prev => ({ ...prev, currencyPair: e.target.value }))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Currency Pair</option>
                {popularPairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entry Type
              </label>
              <select
                value={formData.entryType}
                onChange={(e) => setFormData(prev => ({ ...prev, entryType: e.target.value as EntryType }))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {entryTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeframe
              </label>
              <select
                value={formData.timeframe}
                onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy
              </label>
              <select
                value={formData.strategy}
                onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {strategies.map(strategy => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the setup..."
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="trend, support, resistance, breakout..."
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Additional notes about this backtest..."
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Screenshots
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload size={16} />}
                  >
                    Select Images
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Files ({files.length}):
                  </p>
                  <div className="space-y-1">
                    {files.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            isLoading={uploading}
            disabled={!formData.currencyPair || files.length === 0}
          >
            Upload {files.length} Screenshot{files.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

const BacktestGallery: React.FC = () => {
  const [backtests, setBacktests] = useState<BacktestScreenshot[]>([]);
  const [filteredBacktests, setFilteredBacktests] = useState<BacktestScreenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [viewMode, setViewMode] = useState<'folders' | 'grid' | 'list'>('folders');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<Array<{ src: string; title: string; alt: string }>>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
  const [filters, setFilters] = useState({
    entryType: '',
    timeframe: '',
    strategy: '',
    currencyPair: ''
  });

  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBacktests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, backtests]);

  const loadBacktests = async () => {
    try {
      const result = await getAllBacktests();
      setBacktests(result);
      setFilteredBacktests(result);
    } catch (error) {
      console.error('Error loading backtests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...backtests];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(backtest => 
        backtest.description.toLowerCase().includes(query) ||
        backtest.currencyPair.toLowerCase().includes(query) ||
        backtest.entryType.toLowerCase().includes(query) ||
        backtest.timeframe.toLowerCase().includes(query) ||
        backtest.strategy?.toLowerCase().includes(query) ||
        backtest.notes?.toLowerCase().includes(query) ||
        backtest.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.entryType) {
      filtered = filtered.filter(backtest => backtest.entryType === filters.entryType);
    }

    if (filters.timeframe) {
      filtered = filtered.filter(backtest => backtest.timeframe === filters.timeframe);
    }

    if (filters.strategy) {
      filtered = filtered.filter(backtest => backtest.strategy === filters.strategy);
    }

    if (filters.currencyPair) {
      filtered = filtered.filter(backtest => backtest.currencyPair === filters.currencyPair);
    }

    setFilteredBacktests(filtered);
  };

  const handleUploadBacktests = async (newBacktests: Omit<BacktestScreenshot, 'id' | 'createdAt'>[]) => {
    try {
      for (const backtest of newBacktests) {
        await addBacktest(backtest);
      }
      await loadBacktests();
      alert(`Successfully uploaded ${newBacktests.length} backtest(s)!`);
    } catch (error) {
      console.error('Error uploading backtests:', error);
      alert('Error uploading backtests. Please try again.');
    }
  };

  const handleDeleteBacktest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backtest?')) return;
    
    try {
      await deleteBacktest(id);
      setBacktests(prev => prev.filter(backtest => backtest.id !== id));
    } catch (error) {
      console.error('Error deleting backtest:', error);
    }
  };

  const handleUpdateDescription = async (id: string, newDescription: string) => {
    try {
      await updateBacktest(id, { description: newDescription });
      setBacktests(prev => 
        prev.map(backtest => 
          backtest.id === id 
            ? { ...backtest, description: newDescription } 
            : backtest
        )
      );
    } catch (error) {
      console.error('Error updating backtest description:', error);
    }
  };

  const openImageViewer = (index: number, pairBacktests?: BacktestScreenshot[]) => {
    const targetBacktests = pairBacktests || filteredBacktests;
    const images = targetBacktests.map((backtest, i) => ({
      src: backtest.dataUrl,
      title: `${backtest.currencyPair} - ${backtest.entryType} (${backtest.timeframe})`,
      alt: `Backtest ${i + 1}`
    }));
    
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const toggleFolder = (pair: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(pair)) {
      newExpanded.delete(pair);
    } else {
      newExpanded.add(pair);
    }
    setExpandedFolders(newExpanded);
  };

  const exportBacktests = async () => {
    try {
      const dataStr = JSON.stringify(backtests, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtests-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting backtests:', error);
      alert('Error exporting backtests. Please try again.');
    }
  };

  const importBacktests = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      const text = await file.text();
      const importedBacktests = JSON.parse(text);
      
      if (!Array.isArray(importedBacktests)) {
        throw new Error('Invalid file format');
      }
      
      for (const backtest of importedBacktests) {
        await addBacktest({
          description: backtest.description,
          dataUrl: backtest.dataUrl,
          currencyPair: backtest.currencyPair || 'Unknown',
          entryType: backtest.entryType || '2 touch',
          timeframe: backtest.timeframe || '4h',
          strategy: backtest.strategy,
          notes: backtest.notes,
          tags: backtest.tags || []
        });
      }
      
      await loadBacktests();
      alert(`Successfully imported ${importedBacktests.length} backtest(s)!`);
    } catch (error) {
      console.error('Error importing backtests:', error);
      alert('Error importing backtests. Please check the file format and try again.');
    } finally {
      e.target.value = '';
    }
  };

  // Group backtests by currency pair
  const groupedBacktests = filteredBacktests.reduce((acc, backtest) => {
    const pair = backtest.currencyPair;
    if (!acc[pair]) {
      acc[pair] = [];
    }
    acc[pair].push(backtest);
    return acc;
  }, {} as Record<string, BacktestScreenshot[]>);

  const currencyPairs = Object.keys(groupedBacktests).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Backtest Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and analyze your trading backtests by currency pairs and strategies
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportBacktests}
            icon={<Download size={16} />}
            disabled={backtests.length === 0}
          >
            Export
          </Button>
          
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importBacktests}
          />
          <Button 
            variant="outline"
            size="sm"
            icon={<Upload size={16} />}
            onClick={() => importInputRef.current?.click()}
          >
            Import
          </Button>
          
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            onClick={() => setUploadModalOpen(true)}
          >
            Add Backtest
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search backtests, pairs, strategies, tags..."
                  className="pl-10 pr-4 py-2 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.currencyPair}
                onChange={(e) => setFilters(prev => ({ ...prev, currencyPair: e.target.value }))}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Pairs</option>
                {popularPairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              
              <select
                value={filters.entryType}
                onChange={(e) => setFilters(prev => ({ ...prev, entryType: e.target.value }))}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Entry Types</option>
                {entryTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
              
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Timeframes</option>
                {timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
              
              <select
                value={filters.strategy}
                onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Strategies</option>
                {strategies.map(strategy => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredBacktests.length} of {backtests.length} backtests
              </span>
              {currencyPairs.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  • {currencyPairs.length} currency pairs
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'folders' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('folders')}
                icon={<Folder size={16} />}
              />
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={<Grid3X3 size={16} />}
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={<List size={16} />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredBacktests.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              {searchQuery || Object.values(filters).some(f => f) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No backtests found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({ entryType: '', timeframe: '', strategy: '', currencyPair: '' });
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Backtests Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Start building your backtest library by uploading your first screenshots.
                  </p>
                  <Button
                    variant="primary"
                    icon={<PlusCircle size={18} />}
                    onClick={() => setUploadModalOpen(true)}
                  >
                    Add Your First Backtest
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Folder View */}
          {viewMode === 'folders' && (
            <div className="space-y-4">
              {currencyPairs.map(pair => {
                const pairBacktests = groupedBacktests[pair];
                const isExpanded = expandedFolders.has(pair);
                
                return (
                  <Card key={pair} className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => toggleFolder(pair)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <FolderOpen className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Folder className="h-6 w-6 text-blue-500" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pair}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {pairBacktests.length} backtest{pairBacktests.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPair(pair);
                              setUploadModalOpen(true);
                            }}
                            icon={<PlusCircle size={16} />}
                          >
                            Add
                          </Button>
                          <div className="text-gray-400">
                            {isExpanded ? '−' : '+'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {pairBacktests.map((backtest, index) => (
                            <div key={backtest.id} className="group relative">
                              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <img
                                  src={backtest.dataUrl}
                                  alt={backtest.description}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => openImageViewer(index, pairBacktests)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openImageViewer(index, pairBacktests)}
                                    icon={<Eye size={16} />}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white hover:bg-opacity-20"
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    {backtest.entryType.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {backtest.timeframe}
                                  </span>
                                </div>
                                
                                <input
                                  type="text"
                                  value={backtest.description}
                                  onChange={(e) => handleUpdateDescription(backtest.id, e.target.value)}
                                  className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0"
                                  placeholder="Description..."
                                />
                                
                                {backtest.strategy && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {backtest.strategy}
                                  </span>
                                )}
                                
                                {backtest.tags && backtest.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {backtest.tags.slice(0, 2).map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {backtest.tags.length > 2 && (
                                      <span className="text-xs text-gray-400">
                                        +{backtest.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-400">
                                    {format(new Date(backtest.createdAt), 'MMM dd')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteBacktest(backtest.id)}
                                    icon={<Trash2 size={14} />}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBacktests.map((backtest, index) => (
                <Card key={backtest.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                    <img
                      src={backtest.dataUrl}
                      alt={backtest.description}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openImageViewer(index)}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-xs font-medium text-white bg-black bg-opacity-60 px-2 py-1 rounded">
                        {backtest.currencyPair}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBacktest(backtest.id)}
                        icon={<Trash2 size={14} />}
                        className="text-white hover:text-red-400 hover:bg-black hover:bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {backtest.entryType.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {backtest.timeframe}
                        </span>
                      </div>
                      
                      <input
                        type="text"
                        value={backtest.description}
                        onChange={(e) => handleUpdateDescription(backtest.id, e.target.value)}
                        className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0"
                        placeholder="Description..."
                      />
                      
                      {backtest.strategy && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {backtest.strategy}
                        </p>
                      )}
                      
                      {backtest.tags && backtest.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {backtest.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {backtest.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{backtest.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{format(new Date(backtest.createdAt), 'MMM dd, yyyy')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openImageViewer(index)}
                          icon={<Eye size={14} />}
                          className="text-gray-500 hover:text-blue-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBacktests.map((backtest, index) => (
                    <div key={backtest.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={backtest.dataUrl}
                            alt={backtest.description}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openImageViewer(index)}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {backtest.currencyPair}
                            </h3>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                              {backtest.entryType.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {backtest.timeframe}
                            </span>
                            {backtest.strategy && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {backtest.strategy}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {backtest.description}
                          </p>
                          
                          {backtest.tags && backtest.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {backtest.tags.slice(0, 4).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {backtest.tags.length > 4 && (
                                <span className="text-xs text-gray-400">
                                  +{backtest.tags.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {format(new Date(backtest.createdAt), 'MMM dd')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openImageViewer(index)}
                            icon={<Eye size={16} />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBacktest(backtest.id)}
                            icon={<Trash2 size={16} />}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Upload Modal */}
      <BacktestUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setSelectedPair('');
        }}
        onUpload={handleUploadBacktests}
        selectedPair={selectedPair}
      />

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

export default BacktestGallery;