import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Search, Download, Upload, Eye } from 'lucide-react';
import { BacktestScreenshot } from '../../types';
import { db } from '../../db';
import { fileToDataUrl } from '../../utils/mediaHelpers';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { ImageViewer } from '../ui/ImageViewer';

const BacktestGallery: React.FC = () => {
  const [backtests, setBacktests] = useState<BacktestScreenshot[]>([]);
  const [filteredBacktests, setFilteredBacktests] = useState<BacktestScreenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<Array<{ src: string; title: string; alt: string }>>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  useEffect(() => {
    const loadBacktests = async () => {
      try {
        const result = await db.backtests.toArray();
        setBacktests(result);
        setFilteredBacktests(result);
      } catch (error) {
        console.error('Error loading backtests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBacktests();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBacktests(backtests);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = backtests.filter(backtest => 
        backtest.description.toLowerCase().includes(query)
      );
      setFilteredBacktests(filtered);
    }
  }, [searchQuery, backtests]);

  const handleUploadBacktest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      console.log('Files selected:', files.length);
      
      const newBacktests: BacktestScreenshot[] = [];
      
      for (const file of files) {
        console.log('Processing file:', file.name, file.type);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name);
          continue;
        }
        
        try {
          const dataUrl = await fileToDataUrl(file);
          console.log('Data URL created for:', file.name);
          
          const newBacktest: Omit<BacktestScreenshot, 'id'> = {
            description: `Backtest - ${file.name.split('.')[0]}`,
            dataUrl
          };
          
          const id = await db.backtests.add(newBacktest);
          console.log('Added to database with ID:', id);
          
          const savedBacktest: BacktestScreenshot = {
            ...newBacktest,
            id: id.toString()
          };
          
          newBacktests.push(savedBacktest);
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
        }
      }
      
      if (newBacktests.length > 0) {
        setBacktests(prev => [...prev, ...newBacktests]);
        alert(`Successfully uploaded ${newBacktests.length} backtest(s)!`);
      } else {
        alert('No valid image files were uploaded. Please select image files only.');
      }
      
    } catch (error) {
      console.error('Error uploading backtests:', error);
      alert('Error uploading backtests. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleUpdateDescription = async (id: string, newDescription: string) => {
    try {
      await db.backtests.update(id, { description: newDescription });
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

  const handleDeleteBacktest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backtest?')) return;
    
    try {
      await db.backtests.delete(id);
      setBacktests(prev => prev.filter(backtest => backtest.id !== id));
    } catch (error) {
      console.error('Error deleting backtest:', error);
    }
  };

  const openImageViewer = (index: number) => {
    const images = filteredBacktests.map((backtest, i) => ({
      src: backtest.dataUrl,
      title: backtest.description,
      alt: `Backtest ${i + 1}`
    }));
    
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
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
        await db.backtests.add({
          description: backtest.description,
          dataUrl: backtest.dataUrl
        });
      }
      
      // Reload backtests
      const result = await db.backtests.toArray();
      setBacktests(result);
      setFilteredBacktests(result);
      
      alert(`Successfully imported ${importedBacktests.length} backtest(s)!`);
    } catch (error) {
      console.error('Error importing backtests:', error);
      alert('Error importing backtests. Please check the file format and try again.');
    } finally {
      e.target.value = '';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backtest Gallery</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search backtests..."
              className="pl-10 pr-4 py-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportBacktests}
              icon={<Download size={16} />}
              disabled={backtests.length === 0}
            >
              Export
            </Button>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importBacktests}
              />
              <Button 
                variant="outline"
                size="sm"
                icon={<Upload size={16} />}
              >
                Import
              </Button>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadBacktest}
                disabled={uploading}
              />
              <Button 
                variant="primary"
                icon={<PlusCircle size={18} />}
                className="whitespace-nowrap"
                isLoading={uploading}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add Backtest'}
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
          <p className="text-blue-800 dark:text-blue-200">
            Debug: {backtests.length} backtests loaded, {filteredBacktests.length} filtered
          </p>
        </div>
      )}

      {filteredBacktests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              {searchQuery ? (
                <p className="text-gray-500 dark:text-gray-400">No backtests found matching your search.</p>
              ) : (
                <>
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Backtests Yet</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Start uploading your backtest screenshots to build your reference library.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadBacktest}
                      disabled={uploading}
                    />
                    <Button 
                      variant="primary"
                      icon={<PlusCircle size={18} />}
                      isLoading={uploading}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload First Backtest'}
                    </Button>
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBacktests.map((backtest, index) => (
            <Card key={backtest.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative group">
                <img 
                  src={backtest.dataUrl} 
                  alt={backtest.description} 
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openImageViewer(index)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openImageViewer(index)}
                    icon={<Eye size={16} />}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white hover:bg-opacity-20"
                  >
                    View
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="text"
                    value={backtest.description}
                    onChange={(e) => handleUpdateDescription(backtest.id, e.target.value)}
                    className="flex-1 p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Description..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBacktest(backtest.id)}
                    icon={<Trash2 size={16} />}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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