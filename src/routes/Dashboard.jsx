import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const Dashboard = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [commandResult, setCommandResult] = useState(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const result = await invoke('get_container_status');
      console.log('Raw container data:', result);
      
      // Transform Apple Container JSON to our expected format
      const transformedContainers = result.map(container => ({
        id: container.configuration?.id || 'Unknown',
        name: container.configuration?.id || 'Unknown',
        Names: container.configuration?.id || 'Unknown',
        Image: container.configuration?.image?.reference || 'Unknown',
        Status: container.status || 'Unknown',
        status: container.status || 'Unknown',
        Ports: container.networks?.map(net => net.address).join(', ') || '-',
        networks: container.networks || []
      }));
      
      console.log('Transformed containers:', transformedContainers);
      setContainers(transformedContainers);
      setCommandResult(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      setCommandResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
      setContainers([]); // Clear containers on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleContainerAction = async (containerName, action) => {
    // Validate inputs
    if (!containerName || !action) {
      setCommandResult({
        success: false,
        stdout: '',
        stderr: 'Invalid container name or action',
        exit_code: 1
      });
      return;
    }

    try {
      setActionLoading(`${containerName}-${action}`);
      // Ensure all arguments are strings
      const args = [String(action), String(containerName)];
      const result = await invoke('run_container_command', { args });
      setCommandResult(result);
      
      if (result.success) {
        await fetchContainers();
      }
    } catch (error) {
      setCommandResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('running')) {
      return <span className="status-badge status-running">Running</span>;
    } else if (statusLower.includes('exited')) {
      return <span className="status-badge status-stopped">Stopped</span>;
    } else if (statusLower.includes('paused')) {
      return <span className="status-badge status-paused">Paused</span>;
    }
    return <span className="status-badge">{status}</span>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading containers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Container className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Container Dashboard</h1>
        </div>
        <button
          onClick={fetchContainers}
          className="btn-secondary flex items-center space-x-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
        {/* <button
          onClick={async () => {
            console.log('Testing container list command...');
            try {
              const result = await invoke('run_container_command', { args: ['ls', '--format', 'json'] });
              console.log('Test result:', result);
              alert(`Container list test:\nSuccess: ${result.success}\nFound ${JSON.parse(result.stdout || '[]').length} containers`);
            } catch (error) {
              console.error('Test failed:', error);
              alert(`Test failed: ${error}`);
            }
          }}
          className="btn-secondary text-sm"
        >
          Test
        </button> */}
      </div>

      {commandResult && (
        <CommandOutput 
          result={commandResult} 
          title="Last Action Result"
        />
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Containers ({containers.length})
        </h2>
        
        {containers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Container className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No containers found</p>
            <p className="text-sm">
              <Link to="/run" className="text-primary-600 hover:text-primary-700">
                Create your first container
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containers.map((container, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {container.Names || container.name || container.id || `container-${index}` || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {container.Image || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(container.Status || container.status || 'Unknown')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {container.Ports || container.ports || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const containerName = container.Names || container.name || container.id || `container-${index}`;
                          return (
                            <>
                              <button
                                onClick={() => handleContainerAction(containerName, 'start')}
                                disabled={actionLoading === `${containerName}-start`}
                                className="p-1.5 rounded-full text-green-600 hover:text-green-900 hover:bg-green-50"
                                title="Start"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleContainerAction(containerName, 'stop')}
                                disabled={actionLoading === `${containerName}-stop`}
                                className="p-1.5 rounded-full text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Stop"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleContainerAction(containerName, 'restart')}
                                disabled={actionLoading === `${containerName}-restart`}
                                className="p-1.5 rounded-full text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                title="Restart"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <Link
                                to={`/logs/${containerName}`}
                                className="p-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                title="View Logs"
                              >
                                <FileText className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleContainerAction(containerName, 'delete')}
                                disabled={actionLoading === `${containerName}-delete`}
                                className="p-1.5 rounded-full text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 