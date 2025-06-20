import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TauriProvider } from './components/TauriProvider';
import Sidebar from './components/Sidebar';
import Dashboard from './routes/Dashboard';
import RunContainer from './routes/RunContainer';
import Logs from './routes/Logs';
import Images from './routes/Images';
import BuildImage from './routes/BuildImage';
import Registry from './routes/Registry';
import System from './routes/System';

function App() {
  return (
    <TauriProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/run" element={<RunContainer />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/logs/:containerName" element={<Logs />} />
              <Route path="/images" element={<Images />} />
              <Route path="/build" element={<BuildImage />} />
              <Route path="/registry" element={<Registry />} />
              <Route path="/system" element={<System />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TauriProvider>
  );
}

export default App;
