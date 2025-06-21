import React, { useState } from 'react';
import { Download, Upload, Database } from 'lucide-react';
import { exportDatabase, importDatabase } from '../../db';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { estimateStorageUsage } from '../../utils/mediaHelpers';

const ImportExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  
  React.useEffect(() => {
    const checkStorage = async () => {
      const usage = await estimateStorageUsage();
      setStorageUsage(usage);
    };
    
    checkStorage();
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const blob = await exportDatabase();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forex-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting database:', error);
      alert('Error exporting database. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    if (!confirm('Importing data will replace your current data. Make sure you have backed up your data first. Continue?')) {
      e.target.value = '';
      return;
    }
    
    setIsImporting(true);
    
    try {
      const file = e.target.files[0];
      await importDatabase(file);
      
      alert('Data imported successfully. The page will now reload to update the UI.');
      window.location.reload();
    } catch (error) {
      console.error('Error importing database:', error);
      alert('Error importing database. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Usage */}
          {storageUsage !== null && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Storage Usage</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Currently using approximately {formatBytes(storageUsage)} of local storage.
              </p>
            </div>
          )}
          
          {/* Export Section */}
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Your Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Download all your trading data as a backup file. We recommend doing this regularly.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleExport}
                isLoading={isExporting}
                icon={<Download size={16} />}
              >
                Export Data
              </Button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <strong>Note:</strong> The export includes all your trades, backtests, media files, and settings.
            </div>
          </div>
          
          {/* Import Section */}
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Import Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Restore your trading data from a previously exported file.
                </p>
              </div>
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleImport}
                    disabled={isImporting}
                  />
                  <Button
                    variant="outline"
                    isLoading={isImporting}
                    icon={<Upload size={16} />}
                  >
                    Import Data
                  </Button>
                </label>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <strong>Warning:</strong> Importing data will replace your current data. Make sure to export your current data first!
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            All your trading data is stored securely on your device using IndexedDB, a powerful browser-based database.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>No data is sent to external servers - everything stays on your device</li>
            <li>Media files are stored as data URLs directly in the database</li>
            <li>Regularly export your data to avoid loss due to browser data clearing</li>
            <li>You can transfer your data between devices by exporting and importing</li>
          </ul>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Important:</p>
            <p>Clearing your browser data or storage will permanently delete all your trading records. 
            Make sure to export your data regularly.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExport;