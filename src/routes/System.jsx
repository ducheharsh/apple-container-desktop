import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings, Power, PowerOff, Globe, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const System = () => {
  const [systemStatus, setSystemStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dnsEntries, setDnsEntries] = useState([]);
  const [newDnsEntry, setNewDnsEntry] = useState('');
  const [defaultDns, setDefaultDns] = useState('');
  const [systemInfo, setSystemInfo] = useState(null);

  const checkSystemRequirements = async () => {
    try {
      // Check container CLI availability and version using new dedicated function
      const cliCheck = await invoke('check_container_cli');
      
      // Get basic system info (this will be detected from the browser/system)
      const isAppleSilicon = navigator.platform.includes('Mac') && 
                           (navigator.userAgent.includes('Apple Silicon') || 
                            navigator.platform.includes('arm'));
      
      setSystemInfo({
        containerVersion: cliCheck.version || 'Not available',
        hasContainer: cliCheck.available,
        isAppleSilicon: isAppleSilicon,
        platform: navigator.platform,
        cliPath: cliCheck.path,
        cliError: cliCheck.error
      });
    } catch (error) {
      console.error('Failed to check system requirements:', error);
      setSystemInfo({
        containerVersion: 'Error checking version',
        hasContainer: false,
        isAppleSilicon: false,
        platform: navigator.platform || 'Unknown',
        cliPath: null,
        cliError: error.toString()
      });
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check if system is running by trying to list containers
      const listResult = await invoke('run_container_command', { args: ['ls'] });
      if (listResult.success) {
        setSystemStatus('running');
      } else {
        setSystemStatus('stopped');
      }
    } catch (error) {
      console.error('Failed to check system status:', error);
      setSystemStatus('unknown');
    }
  };

  const fetchDnsEntries = async () => {
    try {
      const dnsResult = await invoke('run_container_command', { args: ['system', 'dns', 'list'] });
      if (dnsResult.success) {
        // Parse DNS entries from output
        const lines = dnsResult.stdout.trim().split('\n').filter(line => line && !line.startsWith('NAME'));
        const entries = lines.map(line => line.trim()).filter(entry => entry);
        setDnsEntries(entries);
      }
    } catch (error) {
      console.error('Failed to fetch DNS entries:', error);
    }
  };

  useEffect(() => {
    checkSystemRequirements();
    checkSystemStatus();
    fetchDnsEntries();
  }, []);

  const handleSystemAction = async (action) => {
    setLoading(true);
    setResult(null);

    try {
      const actionResult = await invoke('run_container_command', { args: ['system', action] });
      setResult(actionResult);
      
      if (actionResult.success) {
        await checkSystemStatus();
      }
    } catch (error) {
      setResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDnsCreate = async () => {
    if (!newDnsEntry) {
      alert('Please enter a DNS entry name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const dnsResult = await invoke('run_container_command', { 
        args: ['system', 'dns', 'create', newDnsEntry] 
      });
      setResult(dnsResult);
      
      if (dnsResult.success) {
        setNewDnsEntry('');
        await fetchDnsEntries();
      }
    } catch (error) {
      setResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDnsDelete = async (dnsName) => {
    setLoading(true);
    setResult(null);

    try {
      const dnsResult = await invoke('run_container_command', { 
        args: ['system', 'dns', 'delete', dnsName] 
      });
      setResult(dnsResult);
      
      if (dnsResult.success) {
        await fetchDnsEntries();
      }
    } catch (error) {
      setResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultDns = async () => {
    if (!defaultDns) {
      alert('Please enter a DNS name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const dnsResult = await invoke('run_container_command', { 
        args: ['system', 'dns', 'default', 'set', defaultDns] 
      });
      setResult(dnsResult);
      
      if (dnsResult.success) {
        setDefaultDns('');
      }
    } catch (error) {
      setResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600';
      case 'stopped':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Power className="h-5 w-5 text-green-600" />;
      case 'stopped':
        return <PowerOff className="h-5 w-5 text-red-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">System Control</h1>
      </div>

      {/* System Requirements Check */}
      {systemInfo && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            System Requirements
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Apple Container CLI:</span>
              <div className="flex items-center space-x-2">
                {systemInfo.hasContainer ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-mono ${systemInfo.hasContainer ? 'text-green-600' : 'text-red-600'}`}>
                  {systemInfo.containerVersion}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Architecture:</span>
              <div className="flex items-center space-x-2">
                {systemInfo.isAppleSilicon ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm font-mono">
                  {systemInfo.isAppleSilicon ? 'Apple Silicon' : 'Intel/Other'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CLI Location:</span>
              <span className="text-sm font-mono text-gray-800">
                {systemInfo.cliPath || 'Not found'}
              </span>
            </div>
            
            {!systemInfo.hasContainer && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Apple Container CLI not found.</strong>
                  {systemInfo.cliError && (
                    <span className="block mt-1 font-mono text-xs">{systemInfo.cliError}</span>
                  )}
                </p>
                <p className="text-sm text-red-800 mt-2">
                  Please install it from{' '}
                  <a 
                    href="https://github.com/apple/container/releases" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-700 underline hover:text-red-900"
                  >
                    GitHub Releases
                  </a>
                </p>
                <div className="mt-2 text-xs text-red-700">
                  <strong>Installation steps:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Download the installer package from GitHub</li>
                    <li>Double-click to install (requires admin password)</li>
                    <li>Run: <code className="bg-red-100 px-1 rounded">sudo container system start</code></li>
                    <li>Restart this application</li>
                  </ol>
                </div>
              </div>
            )}
            
            {!systemInfo.isAppleSilicon && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Apple Container is optimized for Apple silicon. 
                  Some features may not work as expected on Intel Macs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* System Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {getStatusIcon(systemStatus)}
              <span className="ml-2">Container System Status</span>
            </h2>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${getStatusColor(systemStatus)}`}>
                  {systemStatus}
                </span>
              </div>
              <button
                onClick={checkSystemStatus}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSystemAction('start')}
                disabled={loading || systemStatus === 'running'}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    <span>Start System</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSystemAction('stop')}
                disabled={loading || systemStatus === 'stopped'}
                className="btn-danger w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4" />
                    <span>Stop System</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DNS Management */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              DNS Management
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Create DNS Entry
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDnsEntry}
                    onChange={(e) => setNewDnsEntry(e.target.value)}
                    className="input-field flex-1"
                    placeholder="dns-entry-name"
                  />
                  <button
                    onClick={handleDnsCreate}
                    disabled={loading}
                    className="btn-primary flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Set Default DNS
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={defaultDns}
                    onChange={(e) => setDefaultDns(e.target.value)}
                    className="input-field flex-1"
                    placeholder="dns-entry-name"
                  />
                  <button
                    onClick={handleSetDefaultDns}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Set Default
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  DNS Entries ({dnsEntries.length})
                </h3>
                {dnsEntries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No DNS entries found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dnsEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm font-mono">{entry}</span>
                        <button
                          onClick={() => handleDnsDelete(entry)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800"
                          title="Delete DNS Entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <CommandOutput 
            result={result} 
            loading={loading}
            title="System Operation Result"
          />
        </div>
      </div>
    </div>
  );
};

export default System; 