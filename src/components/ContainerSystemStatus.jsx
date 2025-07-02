import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Power, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useToast } from './ToastProvider';
import { checkContainerSystemStatus, startContainerSystem } from '../utils/containerUtils';

const ContainerSystemStatus = ({ onStatusChange }) => {
  const [systemStatus, setSystemStatus] = useState({
    isRunning: false,
    status: null,
    error: null,
    checking: true
  });
  const [startingSystem, setStartingSystem] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const checkStatus = useCallback(async () => {
    setSystemStatus(prev => ({ ...prev, checking: true }));
    try {
      const status = await checkContainerSystemStatus(invoke);
      setSystemStatus({
        ...status,
        checking: false
      });
      
      if (onStatusChange) {
        onStatusChange(status.isRunning);
      }
    } catch (error) {
      setSystemStatus({
        isRunning: false,
        status: null,
        error: error.toString(),
        checking: false
      });
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleStartSystem = async () => {
    setStartingSystem(true);
    showInfo('Starting container system...', 3000);
    
    try {
      const result = await startContainerSystem(invoke);
      
      if (result.success) {
        showSuccess('Container system started successfully!', 5000);
        // Wait a moment then check status
        setTimeout(checkStatus, 2000);
      } else {
        showError(`Failed to start container system: ${result.stderr}`, 8000);
      }
    } catch (error) {
      showError(`Error starting container system: ${error.toString()}`, 8000);
    } finally {
      setStartingSystem(false);
    }
  };

  // Don't render anything if system is running
  if (systemStatus.isRunning && !systemStatus.checking) {
    return null;
  }

  // Don't render during initial check
  if (systemStatus.checking && systemStatus.status === null) {
    return null;
  }

  return (
    <div className="p-3 mx-4 my-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {systemStatus.checking ? (
            <Loader className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
          ) : systemStatus.isRunning ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {systemStatus.checking ? 'Checking Container System...' : 
             systemStatus.isRunning ? 'Container System Running' : 
             'Container System Not Running'}
          </h4>
          {!systemStatus.isRunning && !systemStatus.checking && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              {systemStatus.status && systemStatus.status.includes('not registered with launchd') 
                ? 'API server is not registered with launchd' 
                : 'Start the container system to use container features'}
            </p>
          )}
          {systemStatus.isRunning && systemStatus.status && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              API server is running and ready
            </p>
          )}
        </div>
        
        {!systemStatus.isRunning && !systemStatus.checking && (
          <button
            onClick={handleStartSystem}
            disabled={startingSystem}
            className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {startingSystem ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Power className="h-3 w-3" />
                <span>Start</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ContainerSystemStatus; 