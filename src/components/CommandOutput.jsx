import React from 'react';
import { AlertCircle, CheckCircle, Terminal } from 'lucide-react';

const CommandOutput = ({ result, loading, title }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Terminal className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title || 'Command Output'}</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Executing command...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title || 'Command Output'}</h3>
        <span className={`status-badge ${result.success ? 'status-running' : 'status-stopped'}`}>
          {result.success ? 'Success' : 'Failed'}
        </span>
      </div>

      {result.stdout && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Output:</h4>
          <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
            {result.stdout}
          </pre>
        </div>
      )}

      {result.stderr && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-red-700 mb-2">Error:</h4>
          <pre className="bg-red-50 p-3 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap text-red-800">
            {result.stderr}
          </pre>
        </div>
      )}

      {result.exit_code !== null && (
        <div className="text-xs text-gray-500">
          Exit Code: {result.exit_code}
        </div>
      )}
    </div>
  );
};

export default CommandOutput; 