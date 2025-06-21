import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Search } from 'lucide-react';
import { BacktestScreenshot } from '../../types';
import { db } from '../../db';
import { fileToDataUrl } from '../../utils/mediaHelpers';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

const BacktestGallery: React.FC = () => {
  const [backtests, setBacktests] = useState<BacktestScreenshot[]>([]);
  const [filteredBacktests, setFilteredBacktests] = useState<BacktestScreenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

    try {
      const file = e.target.files[0];
      const dataUrl = await fileToDataUrl(file);
      
      const newBacktest: BacktestScreenshot = {
        id: crypto.randomUUID(),
        description: 'New Backtest',
        dataUrl
      };
      
      const id = await db.backtests.add(newBacktest);
      
      setBacktests(prev => [...prev, { ...newBacktest, id: id.toString() }]);
      
    } catch (error) {
      console.error('Error uploading backtest:', error);
      alert('Error uploading backtest. Please try again.');
    } finally {
      e.target.value = '';
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
          
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadBacktest}
              />
              <Button 
                variant="primary"
                icon={<PlusCircle size={18} />}
                className="whitespace-nowrap"
              >
                Add Backtest
              </Button>
            </label>
          </div>
        </div>
      </div>

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
                      className="hidden"
                      onChange={handleUploadBacktest}
                    />
                    <Button 
                      variant="primary"
                      icon={<PlusCircle size={18} />}
                    >
                      Upload First Backtest
                    </Button>
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBacktests.map(backtest => (
            <Card key={backtest.id} className="overflow-hidden">
              <img 
                src={backtest.dataUrl} 
                alt={backtest.description} 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={backtest.description}
                    onChange={(e) => handleUpdateDescription(backtest.id, e.target.value)}
                    className="flex-1 mr-2 p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
    </div>
  );
};

export default BacktestGallery;