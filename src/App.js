import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import { TauriProvider } from './components/TauriProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';
import { 
  Dashboard, 
  RunContainer, 
  Logs, 
  Images, 
  BuildImage, 
  Registry, 
  System, 
  Marketplace 
} from './routes';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TauriProvider>
          <Router>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/run-container" element={<RunContainer />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/logs/:containerName" element={<Logs />} />
                  <Route path="/images" element={<Images />} />
                  <Route path="/build-image" element={<BuildImage />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/registry" element={<Registry />} />
                  <Route path="/system" element={<System />} />
                </Routes>
              </main>
            </div>
          </Router>
        </TauriProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
