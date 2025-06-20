import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Hammer, Upload, FileText } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const BuildImage = () => {
  const [formData, setFormData] = useState({
    imageName: '',
    tag: 'latest',
    contextPath: '.',
    buildArgs: '',
    noCache: false
  });
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [showDockerfileEditor, setShowDockerfileEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const createDockerfile = () => {
    const defaultDockerfile = `# Use an official base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]`;
    
    setDockerfileContent(defaultDockerfile);
    setShowDockerfileEditor(true);
  };

  const handleBuild = async () => {
    if (!formData.imageName) {
      alert('Please enter an image name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const args = ['build'];
      
      if (formData.tag && formData.tag !== 'latest') {
        args.push('--tag', `${formData.imageName}:${formData.tag}`);
      } else {
        args.push('--tag', formData.imageName);
      }

      if (formData.noCache) {
        args.push('--no-cache');
      }

      args.push(formData.contextPath);

      const buildResult = await invoke('run_container_command', { args });
      setResult(buildResult);

      if (buildResult.success) {
        setFormData({
          imageName: '',
          tag: 'latest',
          contextPath: '.',
          buildArgs: '',
          noCache: false
        });
        setDockerfileContent('');
        setShowDockerfileEditor(false);
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
        <Hammer className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Build Image</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Hammer className="h-5 w-5 mr-2" />
              Build Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Name *
                </label>
                <input
                  type="text"
                  name="imageName"
                  value={formData.imageName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="my-app"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="latest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Path
                </label>
                <input
                  type="text"
                  name="contextPath"
                  value={formData.contextPath}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="noCache"
                  checked={formData.noCache}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  No cache (force rebuild)
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dockerfile
            </h3>

            <button
              onClick={createDockerfile}
              className="btn-primary flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Create Template</span>
            </button>
          </div>

          <button
            onClick={handleBuild}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Building...</span>
              </>
            ) : (
              <>
                <Hammer className="h-4 w-4" />
                <span>Build Image</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {showDockerfileEditor && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Dockerfile Editor
                </h3>
                <button
                  onClick={() => setShowDockerfileEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <textarea
                value={dockerfileContent}
                onChange={(e) => setDockerfileContent(e.target.value)}
                className="input-field font-mono text-sm"
                rows={20}
                placeholder="Enter Dockerfile content..."
              />
            </div>
          )}

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