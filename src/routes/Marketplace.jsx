import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Search, 
  Download, 
  Star, 
  Shield,
  Package,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

const STORAGE_KEYS = {
  PULLING_IMAGES: 'marketplace_pulling_images',
  PULL_PROGRESS: 'marketplace_pull_progress',
  LOCAL_IMAGES: 'marketplace_local_images',
  LOCAL_IMAGES_TIMESTAMP: 'marketplace_local_images_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Marketplace = () => {
  // Helper functions for persistent state
  const loadFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from storage:`, error);
      return defaultValue;
    }
  };

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to storage:`, error);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [featuredImages, setFeaturedImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Persistent state - restored from localStorage
  const [pullingImages, setPullingImages] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.PULLING_IMAGES, []);
    return new Set(stored);
  });
  
  const [pullProgress, setPullProgress] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.PULL_PROGRESS, {});
  });
  
  const [localImages, setLocalImages] = useState(() => {
    const timestamp = loadFromStorage(STORAGE_KEYS.LOCAL_IMAGES_TIMESTAMP, 0);
    const now = Date.now();
    
    // If cache is still valid, use cached data
    if (now - timestamp < CACHE_DURATION) {
      const cached = loadFromStorage(STORAGE_KEYS.LOCAL_IMAGES, []);
      return new Set(cached);
    }
    
    return new Set();
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [checkingImages, setCheckingImages] = useState(false);

  // Save persistent state to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PULLING_IMAGES, Array.from(pullingImages));
  }, [pullingImages]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PULL_PROGRESS, pullProgress);
  }, [pullProgress]);

  useEffect(() => {
    const localImagesArray = Array.from(localImages);
    saveToStorage(STORAGE_KEYS.LOCAL_IMAGES, localImagesArray);
    if (localImagesArray.length > 0) {
      saveToStorage(STORAGE_KEYS.LOCAL_IMAGES_TIMESTAMP, Date.now());
    }
  }, [localImages]);

  // Popular/Featured images curated list
  const popularImages = [
    { name: 'nginx', description: 'Official build of Nginx', category: 'web' },
    { name: 'redis', description: 'Redis is an open source key-value store', category: 'database' },
    { name: 'postgres', description: 'Official PostgreSQL Docker image', category: 'database' },
    { name: 'mysql', description: 'MySQL Server Docker image', category: 'database' },
    { name: 'node', description: 'Official Node.js runtime Docker image', category: 'runtime' },
    { name: 'python', description: 'Official Python runtime Docker image', category: 'runtime' },
    { name: 'alpine', description: 'Minimal Docker image based on Alpine Linux', category: 'base' },
    { name: 'ubuntu', description: 'Official Ubuntu Docker image', category: 'base' },
    { name: 'mongo', description: 'Official MongoDB Docker image', category: 'database' },
    { name: 'httpd', description: 'Official Apache HTTP Server Docker image', category: 'web' },
    { name: 'golang', description: 'Official Go programming language image', category: 'runtime' },
    { name: 'openjdk', description: 'Official OpenJDK Docker image', category: 'runtime' },
    { name: 'rabbitmq', description: 'Official RabbitMQ Docker image', category: 'messaging' },
    { name: 'elasticsearch', description: 'Official Elasticsearch Docker image', category: 'search' },
    { name: 'jenkins', description: 'Official Jenkins Docker image', category: 'ci-cd' },
    { name: 'traefik', description: 'Modern HTTP reverse proxy and load balancer', category: 'proxy' }
  ];

  const imageCategories = [
    { id: 'all', name: 'All Images', icon: Package },
    { id: 'base', name: 'Base Images', icon: Package },
    { id: 'web', name: 'Web Servers', icon: Package },
    { id: 'database', name: 'Databases', icon: Package },
    { id: 'runtime', name: 'Runtimes', icon: Package },
    { id: 'messaging', name: 'Messaging', icon: Package },
    { id: 'search', name: 'Search', icon: Package },
    { id: 'ci-cd', name: 'CI/CD', icon: Package },
    { id: 'proxy', name: 'Proxy/LB', icon: Package }
  ];

  // Clean up old progress entries that may be stuck
  const cleanupOldProgress = useCallback(() => {
    const currentPulling = Array.from(pullingImages);
    const progressKeys = Object.keys(pullProgress);
    
    const updatedProgress = { ...pullProgress };
    let hasChanges = false;
    
    progressKeys.forEach(key => {
      // Remove progress entries for images that are no longer being pulled
      if (!currentPulling.includes(key)) {
        const progress = pullProgress[key];
        // Only keep completed or error states briefly, remove stuck "downloading" states
        if (progress && !progress.includes('completed') && !progress.includes('Error')) {
          delete updatedProgress[key];
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setPullProgress(updatedProgress);
    }
  }, [pullingImages, pullProgress]);

  const checkLocalImages = useCallback(async () => {
    setCheckingImages(true);
    try {
      const result = await invoke('run_container_command', { args: ['images', 'list', '--format', 'json'] });
      
      if (result.success && result.stdout) {
        const localImageNames = new Set();
        
        try {
          const imagesData = JSON.parse(result.stdout);
          
          if (Array.isArray(imagesData)) {
            imagesData.forEach(imageItem => {
              if (imageItem.reference) {
                const reference = imageItem.reference;
                
                // Add the full reference
                localImageNames.add(reference);
                
                // Extract and add the short name (e.g., "nginx" from "docker.io/library/nginx:latest")
                const parts = reference.split('/');
                if (parts.length >= 2) {
                  const nameWithTag = parts[parts.length - 1]; // "nginx:latest"
                  const shortName = nameWithTag.split(':')[0]; // "nginx"
                  localImageNames.add(shortName);
                  
                  // Also add without the docker.io/library prefix for official images
                  if (reference.startsWith('docker.io/library/')) {
                    const withoutPrefix = reference.replace('docker.io/library/', '');
                    localImageNames.add(withoutPrefix);
                    localImageNames.add(withoutPrefix.split(':')[0]);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Failed to parse images JSON:', error);
        }
        
        setLocalImages(localImageNames);
      }
    } catch (error) {
      console.error('Failed to check local images:', error);
    } finally {
      setCheckingImages(false);
    }
  }, []);

  const loadFeaturedImages = useCallback(async () => {
    setLoading(true);
    try {
      const enrichedImages = await Promise.all(
        popularImages.map(async (image) => {
          try {
            const details = await fetchImageDetails(image.name, 'library');
            return {
              ...image,
              fullName: image.name,
              namespace: 'library',
              pullCount: details?.pull_count || 0,
              starCount: details?.star_count || 0,
              lastUpdated: details?.last_updated || new Date().toISOString(),
              isOfficial: true,
              shortDescription: details?.description || image.description
            };
          } catch (error) {
            return {
              ...image,
              fullName: image.name,
              namespace: 'library',
              pullCount: 0,
              starCount: 0,
              lastUpdated: new Date().toISOString(),
              isOfficial: true,
              shortDescription: image.description
            };
          }
        })
      );
      setFeaturedImages(enrichedImages);
    } catch (error) {
      console.error('Failed to load featured images:', error);
      // Fallback to basic data
      setFeaturedImages(popularImages.map(img => ({
        ...img,
        fullName: img.name,
        namespace: 'library',
        pullCount: 0,
        starCount: 0,
        lastUpdated: new Date().toISOString(),
        isOfficial: true,
        shortDescription: img.description
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedImages();
    setCategories(imageCategories);
    
    // Check if we need to refresh local images (cache expired or empty)
    const timestamp = loadFromStorage(STORAGE_KEYS.LOCAL_IMAGES_TIMESTAMP, 0);
    const now = Date.now();
    
    if (now - timestamp >= CACHE_DURATION || localImages.size === 0) {
      checkLocalImages();
    }
    
    // Clean up any stuck progress states
    cleanupOldProgress();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically check for any pull operations that might have completed outside the app
  useEffect(() => {
    const interval = setInterval(() => {
      if (pullingImages.size > 0) {
        // Check if any images were actually pulled by checking local images
        checkLocalImages();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [pullingImages, checkLocalImages]);

  const fetchImageDetails = async (imageName, namespace = 'library') => {
    try {
      const response = await fetch(`https://hub.docker.com/v2/repositories/${namespace}/${imageName}/`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch details for ${imageName}:`, error);
      return null;
    }
  };

  const searchImages = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=20`);
      const data = await response.json();
      
      const enrichedResults = data.results?.map(result => ({
        name: result.repo_name?.split('/').pop() || result.repo_name,
        fullName: result.repo_name,
        namespace: result.repo_name?.includes('/') ? result.repo_name.split('/')[0] : 'library',
        shortDescription: result.short_description || 'No description available',
        starCount: result.star_count || 0,
        pullCount: result.pull_count || 0,
        isOfficial: result.is_official || false,
        isAutomated: result.is_automated || false,
        category: 'search-result'
      })) || [];

      setSearchResults(enrichedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchImages(searchQuery);
  };

  const handlePullImage = async (image) => {
    const imageKey = image.fullName;
    setPullingImages(prev => new Set(prev).add(imageKey));
    setPullProgress(prev => ({ ...prev, [imageKey]: 'Starting pull...' }));

    try {
      const args = ['images', 'pull', image.fullName];
      
      // Simulate progress updates
      setPullProgress(prev => ({ ...prev, [imageKey]: 'Downloading layers...' }));
      
      const result = await invoke('run_container_command', { args });
      
      if (result.success) {
        setPullProgress(prev => ({ ...prev, [imageKey]: 'Pull completed!' }));
        
        // Update local images list
        await checkLocalImages();
        
        // Clear progress after a delay
        setTimeout(() => {
          setPullProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[imageKey];
            return newProgress;
          });
          setPullingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(imageKey);
            return newSet;
          });
        }, 3000);
        
        console.log(`Successfully pulled ${image.fullName}`);
      } else {
        setPullProgress(prev => ({ ...prev, [imageKey]: `Error: ${result.stderr}` }));
        console.error(`Failed to pull ${image.fullName}:`, result.stderr);
        
        // Clear error after a delay
        setTimeout(() => {
          setPullProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[imageKey];
            return newProgress;
          });
          setPullingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(imageKey);
            return newSet;
          });
        }, 8000);
      }
    } catch (error) {
      setPullProgress(prev => ({ ...prev, [imageKey]: `Error: ${error.toString()}` }));
      console.error(`Error pulling ${image.fullName}:`, error);
      
      // Clear error after a delay
      setTimeout(() => {
        setPullProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[imageKey];
          return newProgress;
        });
        setPullingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageKey);
          return newSet;
        });
      }, 8000);
    }
  };

  const handleImageClick = async (image) => {
    setSelectedImage(image);
    setDetailsLoading(true);
    setImageDetails(null);

    try {
      const details = await fetchImageDetails(image.name, image.namespace);
      setImageDetails(details);
    } catch (error) {
      console.error('Failed to fetch image details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDisplayImages = () => {
    const images = searchQuery.trim() ? searchResults : featuredImages;
    if (selectedCategory === 'all') return images;
    return images.filter(img => img.category === selectedCategory);
  };

  const isImageLocal = (image) => {
    return localImages.has(image.fullName) || localImages.has(image.name);
  };

  const ImageCard = ({ image }) => {
    const isPulling = pullingImages.has(image.fullName);
    const isLocal = isImageLocal(image);
    const progress = pullProgress[image.fullName];

    const getButtonContent = () => {
      if (isPulling) {
        return (
          <>
            <Loader className="h-3 w-3 animate-spin" />
            <span>Pulling...</span>
          </>
        );
      }
      
      if (isLocal) {
        return (
          <>
            <CheckCircle className="h-3 w-3" />
            <span>Installed</span>
          </>
        );
      }
      
      return (
        <>
          <Download className="h-3 w-3" />
          <span>Pull</span>
        </>
      );
    };

    const getButtonClass = () => {
      if (isLocal) {
        return "btn-secondary text-sm px-3 py-1 flex items-center space-x-1";
      }
      return "btn-primary text-sm px-3 py-1 flex items-center space-x-1";
    };

    return (
      <div 
        className="card hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleImageClick(image)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">{image.name}</h3>
              {image.isOfficial && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  <Shield className="h-3 w-3" />
                  <span>Official</span>
                </span>
              )}
              {isLocal && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  <span>Local</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{image.shortDescription}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>{formatNumber(image.pullCount || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{formatNumber(image.starCount || 0)}</span>
            </div>
          </div>
          <span className="text-xs">{image.namespace}</span>
        </div>

        {/* Progress indicator */}
        {progress && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-center space-x-2">
              {progress.includes('Error') ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : progress.includes('completed') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Loader className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              <span className={`${progress.includes('Error') ? 'text-red-600' : progress.includes('completed') ? 'text-green-600' : 'text-blue-600'}`}>
                {progress}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Updated {formatDate(image.lastUpdated || new Date().toISOString())}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocal && !isPulling) {
                handlePullImage(image);
              }
            }}
            disabled={isPulling || isLocal}
            className={getButtonClass()}
            title={isLocal ? 'Image already installed locally' : isPulling ? 'Pulling image...' : 'Pull this image'}
          >
            {getButtonContent()}
          </button>
        </div>
      </div>
    );
  };

  // Show active pulls indicator if there are any ongoing pulls
  const activePulls = Array.from(pullingImages).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Image Marketplace</h1>
          {activePulls > 0 && (
            <span className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              <Loader className="h-4 w-4 animate-spin" />
              <span>{activePulls} pulling</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {checkingImages && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Checking local images...</span>
            </div>
          )}
          <button
            onClick={() => {
              loadFeaturedImages();
              checkLocalImages();
            }}
            disabled={loading || checkingImages}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || checkingImages) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Search for images (e.g., nginx, postgres, python)..."
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {searchLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="xl:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Categories
            </h2>
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="xl:col-span-3">
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Featured Images'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({getDisplayImages().length} images)
                </span>
              </h2>
              {searchQuery.trim() && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Loading State */}
            {(loading || searchLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <Loader className="h-6 w-6 animate-spin text-primary-600" />
                  <span className="text-gray-600">
                    {searchLoading ? 'Searching images...' : 'Loading featured images...'}
                  </span>
                </div>
              </div>
            )}

            {/* Images Grid */}
            {!loading && !searchLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getDisplayImages().map((image, index) => (
                  <ImageCard key={`${image.fullName}-${index}`} image={image} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !searchLoading && getDisplayImages().length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
                <p className="text-gray-500">
                  {searchQuery.trim()
                    ? 'Try adjusting your search terms or browse featured images'
                    : 'Unable to load featured images'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedImage.fullName}</h2>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary-600" />
                <span className="ml-2">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">{imageDetails?.description || selectedImage.shortDescription}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Namespace:</span> {selectedImage.namespace}
                  </div>
                  <div>
                    <span className="font-medium">Official:</span> {selectedImage.isOfficial ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Pull Count:</span> {formatNumber(selectedImage.pullCount || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Stars:</span> {formatNumber(selectedImage.starCount || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Local Status:</span> 
                    <span className={`ml-1 ${isImageLocal(selectedImage) ? 'text-green-600' : 'text-gray-500'}`}>
                      {isImageLocal(selectedImage) ? 'Installed' : 'Not installed'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (!isImageLocal(selectedImage) && !pullingImages.has(selectedImage.fullName)) {
                        handlePullImage(selectedImage);
                      }
                    }}
                    disabled={pullingImages.has(selectedImage.fullName) || isImageLocal(selectedImage)}
                    className={isImageLocal(selectedImage) ? "btn-secondary flex items-center space-x-2" : "btn-primary flex items-center space-x-2"}
                  >
                    {isImageLocal(selectedImage) ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Already Installed</span>
                      </>
                    ) : pullingImages.has(selectedImage.fullName) ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Pulling...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Pull Image</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`https://hub.docker.com/r/${selectedImage.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Docker Hub</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace; 