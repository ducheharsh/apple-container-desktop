import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useParams } from 'react-router-dom';
import { FileText, Play, Square, Download, Trash2 } from 'lucide-react';

const Logs = () => {
  const { containerName: paramContainerName } = useParams();
  const [containerName, setContainerName] = useState(paramContainerName || '');
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [follow, setFollow] = useState(true);
  const [streamId, setStreamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef(null);
  const unlistenRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
      if (streamId) {
        stopLogStream();
      }
    };
  }, [streamId]);

  const startLogStream = async () => {
    if (!containerName) {
      alert('Please enter a container name');
      return;
    }

    try {
      setLoading(true);
      setLogs([]);

      // Setup event listener
      const unlisten = await listen(`container-log-${containerName}`, (event) => {
        const logLine = event.payload;
        setLogs(prev => [...prev, logLine]);
      });
      unlistenRef.current = unlisten;

      // Start streaming
      const id = await invoke('stream_container_logs', {
        containerName,
        follow
      });
      
      setStreamId(id);
      setIsStreaming(true);
    } catch (error) {
      console.error('Failed to start log stream:', error);
      alert(`Failed to start log stream: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const stopLogStream = async () => {
    if (streamId) {
      try {
        await invoke('stop_log_stream', { streamId });
        if (unlistenRef.current) {
          unlistenRef.current();
          unlistenRef.current = null;
        }
      } catch (error) {
        console.error('Failed to stop log stream:', error);
      }
    }
    setStreamId(null);
    setIsStreaming(false);
  };

  const getStaticLogs = async () => {
    if (!containerName) {
      alert('Please enter a container name');
      return;
    }

    try {
      setLoading(true);
      const result = await invoke('run_container_command', {
        args: ['logs', containerName]
      });

      if (result.success) {
        const logLines = result.stdout.split('\n').filter(line => line.trim()).map((line, index) => ({
          timestamp: new Date().toISOString(),
          line: line,
          stream: 'stdout'
        }));
        setLogs(logLines);
      } else {
        alert(`Failed to get logs: ${result.stderr}`);
      }
    } catch (error) {
      console.error('Failed to get logs:', error);
      alert(`Failed to get logs: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.line}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${containerName}_logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatLogLine = (log, index) => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const isError = log.stream === 'stderr';
    
    return (
      <div
        key={index}
        className={`font-mono text-sm py-1 px-3 border-l-2 ${
          isError ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      >
        <span className="text-gray-500 text-xs mr-3">{timestamp}</span>
        <span className={isError ? 'text-red-800' : 'text-gray-800'}>
          {log.line}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Container Logs</h1>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Name
            </label>
            <input
              type="text"
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
              className="input-field"
              placeholder="Enter container name"
              disabled={isStreaming}
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => setFollow(e.target.checked)}
                className="mr-2"
                disabled={isStreaming}
              />
              <span className="text-sm text-gray-700">Follow logs</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={getStaticLogs}
            disabled={loading || isStreaming || !containerName}
            className="btn-secondary flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Get Logs</span>
          </button>

          {!isStreaming ? (
            <button
              onClick={startLogStream}
              disabled={loading || !containerName}
              className="btn-primary flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Live Stream</span>
            </button>
          ) : (
            <button
              onClick={stopLogStream}
              className="btn-danger flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>Stop Stream</span>
            </button>
          )}

          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="btn-secondary flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading logs...</span>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 && !loading ? (
            <div className="text-center text-gray-400 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs to display</p>
              <p className="text-sm">Enter a container name and click "Get Logs" or "Start Live Stream"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => formatLogLine(log, index))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {isStreaming && (
          <div className="flex items-center justify-center mt-4 text-green-600">
            <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Live streaming logs...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs; 