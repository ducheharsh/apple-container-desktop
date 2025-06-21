import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Image, Download, Tag, Trash2, RefreshCw } from 'lucide-react';
import CommandOutput from '../components/CommandOutput';

const Images = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [commandResult, setCommandResult] = useState(null);
  const [showPullForm, setShowPullForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [pullImageName, setPullImageName] = useState('');
  const [tagData, setTagData] = useState({ sourceImage: '', targetTag: '' });

  const fetchImages = async () => {
    try {
      setLoading(true);
      const result = await invoke('run_container_command', { args: ['images', 'ls'] });
      
      if (result.success) {
        // Parse the output to create a basic list (Apple Container format: NAME TAG DIGEST)
        console.log('Raw images output:', result.stdout);
        const lines = result.stdout.trim().split('\n').filter(line => line && !line.startsWith('NAME'));
        console.log('Filtered lines:', lines);
        
        const imageList = lines.map((line, index) => {
          const parts = line.split(/\s+/);
          const imageData = {
            Repository: parts[0] || 'Unknown',
            Tag: parts[1] || 'Unknown',
            ID: parts[2] ? parts[2].substring(0, 12) : 'Unknown',
            Created: 'N/A',
            Size: 'N/A'
          };
          console.log(`Image ${index}:`, imageData);
          return imageData;
        });
        
        console.log('Final image list:', imageList);
        setImages(imageList);
        setCommandResult(null); // Clear any previous errors
      } else {
        console.error('Failed to fetch images:', result);
        setCommandResult(result);
        setImages([]); // Clear images on error
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setCommandResult({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleImageAction = async (action, imageName) => {
    try {
      setActionLoading(`${imageName}-${action}`);
      const args = ['images', action === 'delete' ? 'delete' : action, imageName];
      const result = await invoke('run_container_command', { args });
      setCommandResult(result);
      
      if (result.success && action === 'delete') {
        await fetchImages();
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

  const handlePullImage = async () => {
    if (!pullImageName) {
      alert('Please enter an image name');
      return;
    }

    try {
      setActionLoading('pull');
      const result = await invoke('run_container_command', { args: ['images', 'pull', pullImageName] });
      setCommandResult(result);
      
      if (result.success) {
        setPullImageName('');
        setShowPullForm(false);
        await fetchImages();
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

  const handleTagImage = async () => {
    if (!tagData.sourceImage || !tagData.targetTag) {
      alert('Please enter both source image and target tag');
      return;
    }

    try {
      setActionLoading('tag');
      const result = await invoke('run_container_command', { 
        args: ['images', 'tag', tagData.sourceImage, tagData.targetTag] 
      });
      setCommandResult(result);
      
      if (result.success) {
        setTagData({ sourceImage: '', targetTag: '' });
        setShowTagForm(false);
        await fetchImages();
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Image Management</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPullForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Pull Image</span>
          </button>
          <button
            onClick={() => setShowTagForm(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Tag className="h-4 w-4" />
            <span>Tag Image</span>
          </button>
          <button
            onClick={fetchImages}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {/* <button
            onClick={async () => {
              console.log('Testing images command...');
              try {
                const result = await invoke('run_container_command', { args: ['images', 'ls'] });
                console.log('Test result:', result);
                alert(`Images command test:\nSuccess: ${result.success}\nOutput: ${result.stdout.substring(0, 100)}...`);
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
      </div>

      {showPullForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull Image</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              value={pullImageName}
              onChange={(e) => setPullImageName(e.target.value)}
              className="input-field flex-1"
              placeholder="nginx:latest, ubuntu:20.04, etc."
            />
            <button
              onClick={handlePullImage}
              disabled={actionLoading === 'pull'}
              className="btn-primary"
            >
              {actionLoading === 'pull' ? 'Pulling...' : 'Pull'}
            </button>
            <button
              onClick={() => setShowPullForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showTagForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tag Image</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={tagData.sourceImage}
              onChange={(e) => setTagData(prev => ({ ...prev, sourceImage: e.target.value }))}
              className="input-field"
              placeholder="Source image (e.g., nginx:latest)"
            />
            <input
              type="text"
              value={tagData.targetTag}
              onChange={(e) => setTagData(prev => ({ ...prev, targetTag: e.target.value }))}
              className="input-field"
              placeholder="Target tag (e.g., my-nginx:v1.0)"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleTagImage}
                disabled={actionLoading === 'tag'}
                className="btn-primary"
              >
                {actionLoading === 'tag' ? 'Tagging...' : 'Tag'}
              </button>
              <button
                onClick={() => setShowTagForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {commandResult && (
        <CommandOutput 
          result={commandResult} 
          title="Last Action Result"
        />
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Images ({images.length})
        </h2>
        
        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No images found</p>
            <p className="text-sm">Pull an image to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Digest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {images.map((image, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {image.Repository}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {image.Tag}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">
                        {image.ID}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleImageAction('delete', `${image.Repository}:${image.Tag}`)}
                        disabled={actionLoading === `${image.Repository}:${image.Tag}-delete`}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

export default Images; 