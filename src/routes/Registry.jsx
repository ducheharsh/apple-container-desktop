import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Cloud, LogIn, Upload, Download, Settings } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const Registry = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    registry: '',
    username: '',
    password: ''
  });
  const [pushData, setPushData] = useState({
    imageName: '',
    repository: ''
  });
  const [pullData, setPullData] = useState({
    imageName: ''
  });
  const [defaultRegistry, setDefaultRegistry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleLogin = async () => {
    if (!loginData.username || !loginData.password) {
      alert('Please enter username and password');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Use Docker Hub registry if none specified
      const registry = loginData.registry || 'registry-1.docker.io';
      
      const args = [
        'registry', 
        'login', 
        '--username', 
        loginData.username, 
        '--password-stdin',
        registry
      ];

      // Create a login command that pipes the password
      const loginResult = await invoke('run_container_command_with_stdin', { 
        args, 
        stdin: loginData.password 
      });
      
              setResult(loginResult);

      if (loginResult && loginResult.success) {
        setLoginData({ registry: '', username: '', password: '' });
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
    if (!pushData.imageName) {
      alert('Please enter an image name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const imageToPush = pushData.repository 
        ? `${pushData.repository}/${pushData.imageName}`
        : pushData.imageName;

      const pushResult = await invoke('run_container_command', { 
        args: ['images', 'push', imageToPush] 
      });
      setResult(pushResult);

      if (pushResult.success) {
        setPushData({ imageName: '', repository: '' });
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

  const handlePull = async () => {
    if (!pullData.imageName) {
      alert('Please enter an image name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const pullResult = await invoke('run_container_command', { 
        args: ['images', 'pull', pullData.imageName] 
      });
      setResult(pullResult);

      if (pullResult.success) {
        setPullData({ imageName: '' });
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

  const handleSetDefaultRegistry = async () => {
    if (!defaultRegistry) {
      alert('Please enter a registry URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const registryResult = await invoke('run_container_command', { 
        args: ['registry', 'default', 'set', defaultRegistry] 
      });
      setResult(registryResult);

      if (registryResult.success) {
        setDefaultRegistry('');
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

  const TabButton = ({ id, children, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === id
          ? 'bg-primary-100 text-primary-700 border border-primary-200'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Cloud className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Registry Management</h1>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 pb-4">
        <TabButton id="login" icon={LogIn}>Login</TabButton>
        <TabButton id="push" icon={Upload}>Push Image</TabButton>
        <TabButton id="pull" icon={Download}>Pull Image</TabButton>
        <TabButton id="settings" icon={Settings}>Settings</TabButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          {activeTab === 'login' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Registry Login
              </h2>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Docker Hub requires authentication for most operations. 
                  Use your Docker Hub username and password/token to authenticate.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registry URL (optional)
                  </label>
                  <input
                    type="text"
                    value={loginData.registry}
                    onChange={(e) => setLoginData(prev => ({ ...prev, registry: e.target.value }))}
                    className="input-field"
                    placeholder="registry.example.com (leave empty for Docker Hub)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    className="input-field"
                    placeholder="your-username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    placeholder="your-password"
                    required
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeTab === 'push' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Push Image
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository (optional)
                  </label>
                  <input
                    type="text"
                    value={pushData.repository}
                    onChange={(e) => setPushData(prev => ({ ...prev, repository: e.target.value }))}
                    className="input-field"
                    placeholder="username or registry.example.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Name *
                  </label>
                  <input
                    type="text"
                    value={pushData.imageName}
                    onChange={(e) => setPushData(prev => ({ ...prev, imageName: e.target.value }))}
                    className="input-field"
                    placeholder="my-app:latest"
                    required
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Full image name: {pushData.repository ? `${pushData.repository}/` : ''}{pushData.imageName || 'my-app:latest'}
                </div>
                <button
                  onClick={handlePush}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Pushing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Push Image</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeTab === 'pull' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Pull Image
              </h2>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Common Images:</strong> nginx:latest, ubuntu:20.04, node:18, python:3.9
                  <br />
                  <strong>Note:</strong> Make sure to spell image names correctly (e.g., "nginx" not "ngnix")
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Name *
                  </label>
                  <input
                    type="text"
                    value={pullData.imageName}
                    onChange={(e) => setPullData(prev => ({ ...prev, imageName: e.target.value }))}
                    className="input-field"
                    placeholder="nginx:latest, ubuntu:20.04, etc."
                    required
                  />
                </div>
                <button
                  onClick={handlePull}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Pulling...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Pull Image</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Registry Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Registry
                  </label>
                  <input
                    type="text"
                    value={defaultRegistry}
                    onChange={(e) => setDefaultRegistry(e.target.value)}
                    className="input-field"
                    placeholder="registry.example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set a default registry for push/pull operations
                  </p>
                </div>
                <button
                  onClick={handleSetDefaultRegistry}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      <span>Set Default Registry</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div>
          <CommandOutput 
            result={result} 
            loading={loading}
            title="Registry Operation Result"
          />
        </div>
      </div>
    </div>
  );
};

export default Registry; 