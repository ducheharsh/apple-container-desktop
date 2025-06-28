import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Play, Settings, Info, Cpu, HardDrive } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const RunContainer = () => {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    detach: true,
    interactive: false,
    tty: false,
    remove: false,
    volumes: '',
    mounts: '',
    environment: '',
    command: '',
    memory: '',
    cpus: '',
    arch: '',
    dnsDomain: ''
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

      // Add resource limits
      if (formData.memory && formData.memory.trim()) {
        addArg('--memory', formData.memory.trim());
      }

      if (formData.cpus && formData.cpus.trim()) {
        addArg('--cpus', formData.cpus.trim());
      }

      // Add architecture if specified
      if (formData.arch && formData.arch.trim()) {
        addArg('--arch', formData.arch.trim());
      }

      // Add DNS domain if specified
      if (formData.dnsDomain && formData.dnsDomain.trim()) {
        addArg('--dns-domain', formData.dnsDomain.trim());
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

      // Handle volume mappings (--volume syntax)
      if (formData.volumes && formData.volumes.trim()) {
        const volumeMappings = formData.volumes.split(',')
          .map(v => v.trim())
          .filter(v => v && v.length > 0);
        volumeMappings.forEach(volume => {
          addArg('--volume', volume);
        });
      }

      // Handle mount mappings (--mount syntax)
      if (formData.mounts && formData.mounts.trim()) {
        const mountMappings = formData.mounts.split(',')
          .map(m => m.trim())
          .filter(m => m && m.length > 0);
        mountMappings.forEach(mount => {
          addArg('--mount', mount);
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
          volumes: '',
          mounts: '',
          environment: '',
          command: '',
          memory: '',
          cpus: '',
          arch: '',
          dnsDomain: ''
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

      {/* Apple Container Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Apple Container Networking</h3>
            <p className="text-sm text-blue-700 mt-1">
              Apple containers don't support Docker-style port mapping (<code>-p</code> or <code>--publish</code>). 
              Instead, each container gets its own dedicated IP address that you can access directly from your Mac. 
              After starting a container, check its IP address using <code>container ls</code> and connect directly to that IP.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Example:</strong> If your container runs on 192.168.64.3:8080, you can access it directly at that address.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Basic Configuration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    DNS Domain (optional)
                  </label>
                  <input
                    type="text"
                    name="dnsDomain"
                    value={formData.dnsDomain}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="test"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Allows access via hostname.domain (e.g., my-app.test)
                  </p>
                </div>
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
                <h3 className="text-sm font-medium text-gray-700">Runtime Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="detach"
                      checked={formData.detach}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Run in background (--detach)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="interactive"
                      checked={formData.interactive}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Interactive mode (--interactive)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="tty"
                      checked={formData.tty}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Allocate TTY (--tty)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="remove"
                      checked={formData.remove}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Remove on exit (--rm)</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Resource Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Cpu className="h-5 w-5 mr-2" />
              Resource Limits
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Memory Limit
                  </label>
                  <input
                    type="text"
                    name="memory"
                    value={formData.memory}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="4g"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: 1g, 512m, 2048m (default: 1g)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPU Limit
                  </label>
                  <input
                    type="text"
                    name="cpus"
                    value={formData.cpus}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of CPUs (default: 4)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Architecture
                </label>
                <select
                  name="arch"
                  value={formData.arch}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Auto (match host)</option>
                  <option value="arm64">ARM64 (Apple Silicon)</option>
                  <option value="amd64">AMD64 (Intel x86-64)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Force specific architecture (amd64 runs under Rosetta)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Storage Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Storage & Environment
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume Mounts (--volume syntax)
                </label>
                <textarea
                  name="volumes"
                  value={formData.volumes}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="2"
                  placeholder="/host/path:/container/path"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: host_path:container_path (comma-separated)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mount Points (--mount syntax)
                </label>
                <textarea
                  name="mounts"
                  value={formData.mounts}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="2"
                  placeholder="source=/host/path,target=/container/path"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: source=host_path,target=container_path (comma-separated)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment Variables
                </label>
                <textarea
                  name="environment"
                  value={formData.environment}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="NODE_ENV=production, PORT=3000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: KEY=value (comma-separated)
                </p>
              </div>
            </div>
          </div>

          {/* Run Button */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Starting Container...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Run Container</span>
              </>
            )}
          </button>

          {/* Command Output */}
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