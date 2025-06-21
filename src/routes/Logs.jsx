import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText, Download, Play, Square, Monitor, Settings } from 'lucide-react';

const Logs = () => {
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [logOptions, setLogOptions] = useState({
    follow: false,
    boot: false,
    tail: '',
    since: '',
    until: ''
  });
  const [systemLogs, setSystemLogs] = useState('');
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [systemLogsLoading, setSystemLogsLoading] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    let interval;
    if (streaming && selectedContainer) {
      interval = setInterval(() => {
        fetchLogs(true);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streaming, selectedContainer, logOptions]);

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

  const fetchLogs = async (isStreaming = false) => {
    if (!selectedContainer) return;

    setLoading(!isStreaming);

    try {
      const args = ['logs'];

      if (logOptions.follow && !isStreaming) {
        // For follow mode, we'll handle streaming separately
        args.push('--follow');
      }

      if (logOptions.boot) {
        args.push('--boot');
      }

      if (logOptions.tail && logOptions.tail.trim()) {
        args.push('--tail', logOptions.tail.trim());
      }

      if (logOptions.since && logOptions.since.trim()) {
        args.push('--since', logOptions.since.trim());
      }

      if (logOptions.until && logOptions.until.trim()) {
        args.push('--until', logOptions.until.trim());
      }

      args.push(selectedContainer);

      const result = await invoke('run_container_command', { args });

      if (result.success) {
        if (isStreaming) {
          // Append new logs for streaming
          setLogs(prev => {
            const newLogs = result.stdout || '';
            return prev + (newLogs ? '\n' + newLogs : '');
          });
        } else {
          setLogs(result.stdout || '');
        }
      } else {
        setLogs(`Error fetching logs: ${result.stderr || 'Unknown error'}`);
      }
    } catch (error) {
      setLogs(`Failed to fetch logs: ${error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    setSystemLogsLoading(true);

    try {
      const args = ['system', 'logs'];
      const result = await invoke('run_container_command', { args });

      if (result.success) {
        setSystemLogs(result.stdout || '');
      } else {
        setSystemLogs(`Error fetching system logs: ${result.stderr || 'Unknown error'}`);
      }
    } catch (error) {
      setSystemLogs(`Failed to fetch system logs: ${error.toString()}`);
    } finally {
      setSystemLogsLoading(false);
    }
  };

  const handleContainerChange = (e) => {
    setSelectedContainer(e.target.value);
    setLogs('');
    setStreaming(false);
  };

  const handleOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLogOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleStreaming = () => {
    if (streaming) {
      setStreaming(false);
    } else {
      setStreaming(true);
      fetchLogs();
    }
  };

  const downloadLogs = () => {
    if (!logs) return;

    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContainer || 'container'}_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSystemLogs = () => {
    if (!systemLogs) return;

    const blob = new Blob([systemLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSystemLogsToggle = () => {
    if (!showSystemLogs) {
      setShowSystemLogs(true);
      fetchSystemLogs();
    } else {
      setShowSystemLogs(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Container Logs</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Container Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Container Selection
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Container
                </label>
                <select
                  value={selectedContainer}
                  onChange={handleContainerChange}
                  className="input-field"
                >
                  <option value="">-- Select a container --</option>
                  {containers.map((container) => (
                    <option key={container.configuration?.id || container.id} value={container.configuration?.id || container.id}>
                      {container.configuration?.id || container.id} ({container.status || 'unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={fetchContainers}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Refresh
                </button>
                <button
                  onClick={handleSystemLogsToggle}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showSystemLogs 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={systemLogsLoading}
                >
                  <Monitor className="h-4 w-4" />
                  <span>{showSystemLogs ? 'Hide' : 'System'} Logs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Log Options */}
          {!showSystemLogs && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Log Options
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="follow"
                      checked={logOptions.follow}
                      onChange={handleOptionChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Follow logs (live stream)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="boot"
                      checked={logOptions.boot}
                      onChange={handleOptionChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Show boot logs</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tail Lines
                  </label>
                  <input
                    type="text"
                    name="tail"
                    value={logOptions.tail}
                    onChange={handleOptionChange}
                    className="input-field"
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of lines from the end of logs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Since
                  </label>
                  <input
                    type="text"
                    name="since"
                    value={logOptions.since}
                    onChange={handleOptionChange}
                    className="input-field"
                    placeholder="2024-01-01T00:00:00Z"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Show logs since timestamp
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Until
                  </label>
                  <input
                    type="text"
                    name="until"
                    value={logOptions.until}
                    onChange={handleOptionChange}
                    className="input-field"
                    placeholder="2024-01-02T00:00:00Z"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Show logs until timestamp
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h2>

            <div className="space-y-2">
              {!showSystemLogs && (
                <>
                  <button
                    onClick={() => fetchLogs()}
                    disabled={loading || !selectedContainer}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Fetch Logs</span>
                      </>
                    )}
                  </button>

                  {logOptions.follow && (
                    <button
                      onClick={toggleStreaming}
                      disabled={!selectedContainer}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        streaming 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {streaming ? (
                        <>
                          <Square className="h-4 w-4" />
                          <span>Stop Streaming</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Start Streaming</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={downloadLogs}
                    disabled={!logs}
                    className="btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Logs</span>
                  </button>
                </>
              )}

              {showSystemLogs && (
                <button
                  onClick={downloadSystemLogs}
                  disabled={!systemLogs}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download System Logs</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs Display */}
        <div className="xl:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {showSystemLogs ? 'System Logs' : 
                 selectedContainer ? `Logs for ${selectedContainer}` : 'Container Logs'}
              </h2>
              {streaming && !showSystemLogs && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={showSystemLogs ? systemLogs : logs}
                readOnly
                className="input-field font-mono text-sm resize-none"
                style={{ height: '600px' }}
                placeholder={
                  showSystemLogs 
                    ? "Click 'System Logs' to load system logs..."
                    : selectedContainer 
                      ? "Click 'Fetch Logs' to load container logs..."
                      : "Select a container to view its logs..."
                }
              />

              {(loading || systemLogsLoading) && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="text-gray-700">Loading logs...</span>
                  </div>
                </div>
              )}
            </div>

            {(logs || systemLogs) && (
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  {showSystemLogs 
                    ? `System logs loaded • ${systemLogs.split('\n').length} lines`
                    : `Container logs loaded • ${logs.split('\n').length} lines`}
                  {streaming && !showSystemLogs && " • Live streaming"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs; 