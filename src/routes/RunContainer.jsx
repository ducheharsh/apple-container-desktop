import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Play, Settings } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const RunContainer = () => {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    detach: true,
    interactive: false,
    tty: false,
    remove: false,
    ports: '',
    volumes: '',
    environment: '',
    command: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image || !formData.image.trim()) {
      alert('Please specify an image name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const args = ['run'];

      // Helper function to ensure string and add to args
      const addArg = (flag, value) => {
        if (value && String(value).trim()) {
          args.push(String(flag), String(value).trim());
        }
      };

      // Add container name if provided
      if (formData.name && formData.name.trim()) {
        addArg('--name', formData.name.trim());
      }

      // Add boolean flags
      if (formData.detach) {
        args.push('--detach');
      }

      if (formData.interactive) {
        args.push('--interactive');
      }

      if (formData.tty) {
        args.push('--tty');
      }

      if (formData.remove) {
        args.push('--rm');
      }

      // Handle port mappings
      if (formData.ports && formData.ports.trim()) {
        const portMappings = formData.ports.split(',')
          .map(p => p.trim())
          .filter(p => p && p.length > 0);
        portMappings.forEach(port => {
          addArg('--publish', port);
        });
      }

      // Handle volume mappings
      if (formData.volumes && formData.volumes.trim()) {
        const volumeMappings = formData.volumes.split(',')
          .map(v => v.trim())
          .filter(v => v && v.length > 0);
        volumeMappings.forEach(volume => {
          addArg('--volume', volume);
        });
      }

      // Handle environment variables
      if (formData.environment && formData.environment.trim()) {
        const envVars = formData.environment.split(',')
          .map(e => e.trim())
          .filter(e => e && e.length > 0);
        envVars.forEach(env => {
          addArg('--env', env);
        });
      }

      // Add the image name (required)
      args.push(String(formData.image).trim());

      // Handle command override
      if (formData.command && formData.command.trim()) {
        const commandParts = formData.command.trim().split(' ')
          .map(c => c.trim())
          .filter(c => c && c.length > 0);
        commandParts.forEach(part => {
          args.push(String(part));
        });
      }

      // Ensure all arguments are strings (final validation)
      const validArgs = args.map(arg => String(arg)).filter(arg => arg.length > 0);

      const commandResult = await invoke('run_container_command', { args: validArgs });
      setResult(commandResult);

      if (commandResult.success) {
        // Reset form on success
        setFormData({
          name: '',
          image: '',
          detach: true,
          interactive: false,
          tty: false,
          remove: false,
          ports: '',
          volumes: '',
          environment: '',
          command: ''
        });
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Play className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Run Container</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Container Configuration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container Name (optional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="my-container"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Name *
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="input-field"
                placeholder="nginx:latest"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port Mappings (comma-separated)
              </label>
              <input
                type="text"
                name="ports"
                value={formData.ports}
                onChange={handleInputChange}
                className="input-field"
                placeholder="8080:80, 3000:3000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: host_port:container_port
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume Mounts (comma-separated)
              </label>
              <input
                type="text"
                name="volumes"
                value={formData.volumes}
                onChange={handleInputChange}
                className="input-field"
                placeholder="/host/path:/container/path"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment Variables (comma-separated)
              </label>
              <input
                type="text"
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
                className="input-field"
                placeholder="NODE_ENV=production, PORT=3000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Command Override
              </label>
              <input
                type="text"
                name="command"
                value={formData.command}
                onChange={handleInputChange}
                className="input-field"
                placeholder="/bin/bash -c 'echo hello'"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Options</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="detach"
                    checked={formData.detach}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Run in background (--detach)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="interactive"
                    checked={formData.interactive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Interactive mode (--interactive)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="tty"
                    checked={formData.tty}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Allocate TTY (--tty)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="remove"
                    checked={formData.remove}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Remove container when it exits (--rm)
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting Container...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Container</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div>
          <CommandOutput 
            result={result} 
            loading={loading}
            title="Container Run Result"
          />
        </div>
      </div>
    </div>
  );
};

export default RunContainer; 