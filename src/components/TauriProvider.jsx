import React, { createContext, useContext, useState, useEffect } from 'react';

const TauriContext = createContext();

export const useTauri = () => {
  const context = useContext(TauriContext);
  if (!context) {
    throw new Error('useTauri must be used within a TauriProvider');
  }
  return context;
};

export const TauriProvider = ({ children }) => {
  const [isTauriAvailable, setIsTauriAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTauri = () => {
      try {
        // Check if we're in a Tauri environment
        const available = typeof window !== 'undefined' && 
                         window.__TAURI_INTERNALS__ !== undefined;
        setIsTauriAvailable(available);
      } catch (error) {
        setIsTauriAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTauri();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Container GUI...</h2>
          <p className="text-gray-600">Initializing Tauri backend...</p>
        </div>
      </div>
    );
  }

  if (!isTauriAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              ⚠️ Web Browser Detected
            </h2>
            <p className="text-yellow-700 mb-4">
              You're accessing this application through a web browser. Container GUI requires the Tauri desktop application to function properly.
            </p>
            <div className="bg-white rounded p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">To access the app:</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Wait for Rust compilation to complete</li>
                <li>2. The Tauri desktop window will open automatically</li>
                <li>3. Use that window instead of this browser tab</li>
              </ol>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">Current status: <code>npm run tauri:dev</code> is running</p>
            <p>🔄 Compiling Rust backend...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TauriContext.Provider value={{ isTauriAvailable }}>
      {children}
    </TauriContext.Provider>
  );
}; 