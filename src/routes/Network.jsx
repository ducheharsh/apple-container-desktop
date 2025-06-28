import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CommandOutput from '../components/CommandOutput';

// Auto-generated page for 'container network' command
// Generated from 0.2.0 release

export default function Network() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});

  const executeNetwork = async () => {
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const result = await invoke('execute_container_command', {
        args: ['network', ...Object.entries(formData)
          .filter(([key, value]) => value)
          .flatMap(([key, value]) => [`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value])]
      });

      setOutput(result);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Container Network</h1>
        <p className="text-gray-600 mt-2">
          Execute 'container network' command with advanced options
        </p>
        <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md inline-block">
          New in 0.2.0
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Command Options</h2>
            
            {/* Add form fields based on detected flags */}
            <div className="space-y-4">
              <button
                onClick={executeNetwork}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Executing...' : `Execute container network`}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CommandOutput 
            output={output} 
            error={error} 
            loading={loading}
            title={`container network output`}
          />
        </div>
      </div>
    </div>
  );
}