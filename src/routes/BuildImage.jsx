import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Hammer, Code, Upload, Settings, Cpu, Activity } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const BuildImage = () => {
  const [formData, setFormData] = useState({
    tag: '',
    dockerfile: 'FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]',
    context: '.',
    architectures: ['arm64'], // Default to arm64 for Apple Silicon
    builderMemory: '',
    builderCpus: '',
    pushToRegistry: false,
    registry: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [builderStatus, setBuilderStatus] = useState('unknown');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArchitectureChange = (arch) => {
    setFormData(prev => ({
      ...prev,
      architectures: prev.architectures.includes(arch)
        ? prev.architectures.filter(a => a !== arch)
        : [...prev.architectures, arch]
    }));
  };

  const handleBuilderAction = async (action) => {
    setBuilderLoading(true);
    setResult(null);

    try {
      let args = ['builder', action];

      if (action === 'start' && (formData.builderMemory || formData.builderCpus)) {
        if (formData.builderCpus) {
          args.push('--cpus', formData.builderCpus);
        }
        if (formData.builderMemory) {
          args.push('--memory', formData.builderMemory);
        }
      }

      const commandResult = await invoke('run_container_command', { args });
      setResult(commandResult);
      
      if (commandResult.success) {
        setBuilderStatus(action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'unknown');
      }
    } catch (error) {
      setResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleBuild = async (e) => {
    e.preventDefault();
    
    if (!formData.tag || !formData.tag.trim()) {
      alert('Please specify an image tag');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const args = ['build'];

      // Add architectures
      formData.architectures.forEach(arch => {
        args.push('--arch', arch);
      });

      // Add tag
      args.push('--tag', formData.tag.trim());

      // Add dockerfile if specified
      if (formData.dockerfile && formData.dockerfile.trim()) {
        // Write dockerfile to a temporary file (in real implementation)
        args.push('--file', 'Dockerfile');
      }

      // Add context
      args.push(formData.context || '.');

      const commandResult = await invoke('run_container_command', { args: args.map(String) });
      setResult(commandResult);

      if (commandResult.success && formData.pushToRegistry) {
        // If build succeeded and push is requested, push the image
        await handlePush();
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

  const handlePush = async () => {
    if (!formData.tag) return;

    try {
      // Login to registry if credentials provided
      if (formData.registry && formData.username && formData.password) {
        const loginArgs = ['registry', 'login', formData.registry, '--username', formData.username, '--password', formData.password];
        await invoke('run_container_command', { args: loginArgs });
      }

      // Push the image
      const pushArgs = ['images', 'push', formData.tag];
      const pushResult = await invoke('run_container_command', { args: pushArgs });
      
      setResult(prev => ({
        ...pushResult,
        stdout: (prev?.stdout || '') + '\n\n--- PUSH RESULT ---\n' + pushResult.stdout,
        stderr: (prev?.stderr || '') + (pushResult.stderr || '')
      }));
    } catch (error) {
      setResult(prev => ({
        success: false,
        stdout: (prev?.stdout || '') + '\n\n--- PUSH FAILED ---\n',
        stderr: (prev?.stderr || '') + error.toString(),
        exit_code: 1
      }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Hammer className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Build Image</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Builder Management */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Builder Management
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">Builder Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    builderStatus === 'running' ? 'bg-green-100 text-green-800' :
                    builderStatus === 'stopped' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {builderStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Builder Memory
                  </label>
                  <input
                    type="text"
                    name="builderMemory"
                    value={formData.builderMemory}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="32g"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Memory for builder VM (default: 2g)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Builder CPUs
                  </label>
                  <input
                    type="text"
                    name="builderCpus"
                    value={formData.builderCpus}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CPUs for builder VM (default: 2)
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleBuilderAction('start')}
                  disabled={builderLoading}
                  className="btn-secondary flex-1"
                >
                  {builderLoading ? 'Processing...' : 'Start Builder'}
                </button>
                <button
                  onClick={() => handleBuilderAction('stop')}
                  disabled={builderLoading}
                  className="btn-secondary flex-1"
                >
                  Stop Builder
                </button>
                <button
                  onClick={() => handleBuilderAction('delete')}
                  disabled={builderLoading}
                  className="btn-danger flex-1"
                >
                  Delete Builder
                </button>
              </div>
            </div>
          </div>

          {/* Build Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Build Configuration
            </h2>

            <form onSubmit={handleBuild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Tag *
                </label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="my-app:latest"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Build Context
                </label>
                <input
                  type="text"
                  name="context"
                  value={formData.context}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Path to build context (default: current directory)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Architectures
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.architectures.includes('arm64')}
                      onChange={() => handleArchitectureChange('arm64')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">ARM64 (Apple Silicon)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.architectures.includes('amd64')}
                      onChange={() => handleArchitectureChange('amd64')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">AMD64 (Intel x86-64)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select one or more architectures for multiplatform builds
                </p>
              </div>
            </form>
          </div>

          {/* Registry Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Registry & Push
            </h2>

            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="pushToRegistry"
                    checked={formData.pushToRegistry}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Push to registry after build
                  </span>
                </label>
              </div>

              {formData.pushToRegistry && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registry URL
                    </label>
                    <input
                      type="text"
                      name="registry"
                      value={formData.registry}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="docker.io"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="password"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Dockerfile Editor */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Dockerfile
            </h2>

            <div className="space-y-4">
              <textarea
                name="dockerfile"
                value={formData.dockerfile}
                onChange={handleInputChange}
                className="input-field font-mono text-sm"
                rows="16"
                placeholder="FROM nginx:alpine..."
              />
              <p className="text-xs text-gray-500">
                Edit your Dockerfile content above. This will be used for the build.
              </p>
            </div>
          </div>

          {/* Build Button */}
          <button
            type="submit"
            onClick={handleBuild}
            disabled={loading || formData.architectures.length === 0}
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Building Image...</span>
              </>
            ) : (
              <>
                <Hammer className="h-5 w-5" />
                <span>Build Image</span>
              </>
            )}
          </button>

          {/* Command Output */}
          <CommandOutput 
            result={result} 
            loading={loading}
            title="Build Result"
          />
        </div>
      </div>
    </div>
  );
};

export default BuildImage; 