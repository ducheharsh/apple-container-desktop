import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Activity, 
  Server, 
  Search, 
  Eye, 
  Code, 
  RefreshCw, 
  HardDrive,
  Cpu,
  Network,
  Settings,
  Database,
  Monitor
} from 'lucide-react';

const System = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [containers, setContainers] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [itemType, setItemType] = useState('container'); // 'container' or 'image'
  const [inspectResult, setInspectResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);
  const [formatJson, setFormatJson] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
    fetchContainers();
    fetchImages();
  }, []);

  const fetchSystemInfo = async () => {
    setSystemLoading(true);
    try {
      const result = await invoke('run_container_command', { args: ['system', 'info'] });
      if (result.success) {
        setSystemInfo(result.stdout);
      } else {
        setSystemInfo(`Error: ${result.stderr || 'Failed to get system info'}`);
      }
    } catch (error) {
      setSystemInfo(`Error: ${error.toString()}`);
    } finally {
      setSystemLoading(false);
    }
  };

  const fetchContainers = async () => {
    try {
      const result = await invoke('run_container_command', { 
        args: ['ls', '--format', 'json', '--all'] 
      });
      
      if (result.success && result.stdout) {
        try {
          const containerList = JSON.parse(result.stdout);
          setContainers(Array.isArray(containerList) ? containerList : []);
        } catch (parseError) {
          console.error('Failed to parse container list:', parseError);
          setContainers([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      setContainers([]);
    }
  };

  const fetchImages = async () => {
    try {
      const result = await invoke('run_container_command', { 
        args: ['images', 'list', '--format', 'json'] 
      });
      
      if (result.success && result.stdout) {
        try {
          const imageList = JSON.parse(result.stdout);
          setImages(Array.isArray(imageList) ? imageList : []);
        } catch (parseError) {
          console.error('Failed to parse image list:', parseError);
          setImages([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setImages([]);
    }
  };

  const handleInspect = async () => {
    if (!selectedItem) {
      alert('Please select an item to inspect');
      return;
    }

    setLoading(true);
    try {
      let args;
      if (itemType === 'container') {
        args = ['inspect', selectedItem];
      } else {
        args = ['images', 'inspect', selectedItem];
      }

      const result = await invoke('run_container_command', { args });

      if (result.success) {
        let output = result.stdout || '';
        
        if (formatJson && output.trim()) {
          try {
            // Try to parse and format JSON
            const parsed = JSON.parse(output);
            output = JSON.stringify(parsed, null, 2);
          } catch (e) {
            // If not valid JSON, keep original output
          }
        }
        
        setInspectResult(output);
      } else {
        setInspectResult(`Error: ${result.stderr || 'Inspection failed'}`);
      }
    } catch (error) {
      setInspectResult(`Error: ${error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSystemInfo();
    fetchContainers();
    fetchImages();
  };

  const getSystemStats = () => {
    if (!systemInfo) return null;

    // Parse basic info from system info
    const stats = {
      containers: containers.length,
      runningContainers: containers.filter(c => c.status === 'running').length,
      images: images.length,
      stoppedContainers: containers.filter(c => c.status === 'stopped' || c.status === 'exited').length
    };

    return stats;
  };

  const stats = getSystemStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Control</h1>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={systemLoading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* System Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Server className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Total Containers</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.containers}</div>
          </div>

          <div className="card text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Activity className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-gray-900">Running</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.runningContainers}</div>
          </div>

          <div className="card text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Database className="h-6 w-6 text-purple-600" />
              <span className="font-semibold text-gray-900">Images</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{stats.images}</div>
          </div>

          <div className="card text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Monitor className="h-6 w-6 text-gray-600" />
              <span className="font-semibold text-gray-900">Stopped</span>
            </div>
            <div className="text-3xl font-bold text-gray-600">{stats.stoppedContainers}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Inspection Panel */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Inspect Resources
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => {
                    setItemType(e.target.value);
                    setSelectedItem('');
                    setInspectResult('');
                  }}
                  className="input-field"
                >
                  <option value="container">Container</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select {itemType === 'container' ? 'Container' : 'Image'}
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Select {itemType} --</option>
                  {itemType === 'container' 
                    ? containers.map((container) => (
                        <option key={container.configuration?.id || container.id} value={container.configuration?.id || container.id}>
                          {container.configuration?.id || container.id} ({container.status || 'unknown'})
                        </option>
                      ))
                    : images.map((image) => (
                        <option key={image.name || image.id} value={image.name || image.id}>
                          {image.name || image.id}
                        </option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formatJson}
                    onChange={(e) => setFormatJson(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Format JSON output</span>
                </label>
              </div>

              <button
                onClick={handleInspect}
                disabled={loading || !selectedItem}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Inspecting...</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Inspect</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Information
            </h2>

            <div className="space-y-4">
              {systemLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600">Loading system info...</span>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {systemInfo || 'No system information available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inspection Results */}
        <div className="xl:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Inspection Results
              </h2>
              {inspectResult && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inspectResult);
                    // You could add a toast notification here
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Copy to clipboard
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={inspectResult}
                readOnly
                className="input-field font-mono text-sm resize-none"
                style={{ height: '600px' }}
                placeholder={
                  selectedItem 
                    ? `Click 'Inspect' to view detailed information about ${selectedItem}...`
                    : `Select a ${itemType} and click 'Inspect' to view detailed JSON information...`
                }
              />

              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="text-gray-700">Loading inspection data...</span>
                  </div>
                </div>
              )}
            </div>

            {inspectResult && (
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  Inspection data for {itemType}: {selectedItem}
                  {formatJson && " • Formatted JSON"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick System Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.hash = '#/dashboard'}
            className="btn-secondary flex flex-col items-center space-y-2 py-4"
          >
            <Server className="h-6 w-6" />
            <span>Containers</span>
          </button>

          <button
            onClick={() => window.location.hash = '#/images'}
            className="btn-secondary flex flex-col items-center space-y-2 py-4"
          >
            <Database className="h-6 w-6" />
            <span>Images</span>
          </button>

          <button
            onClick={() => window.location.hash = '#/logs'}
            className="btn-secondary flex flex-col items-center space-y-2 py-4"
          >
            <Monitor className="h-6 w-6" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => window.location.hash = '#/build-image'}
            className="btn-secondary flex flex-col items-center space-y-2 py-4"
          >
            <Settings className="h-6 w-6" />
            <span>Build</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default System; 