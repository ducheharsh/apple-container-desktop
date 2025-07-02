import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Container, 
  Play, 
  FileText, 
  Image, 
  Hammer, 
  Cloud, 
  Settings,
  ShoppingCart,
  Sun,
  Moon
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from './ThemeProvider';
import ContainerSystemStatus from './ContainerSystemStatus';

const Sidebar = () => {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Container },
    { name: 'Run Container', path: '/run-container', icon: Play },
    { name: 'Logs', path: '/logs', icon: FileText },
    { name: 'Images', path: '/images', icon: Image },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingCart },
    { name: 'Build Image', path: '/build-image', icon: Hammer },
    { name: 'Registry', path: '/registry', icon: Cloud },
    { name: 'System', path: '/system', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* <Package className="h-8 w-8 text-primary-600" /> */}
          <img src="/logo512.png" alt="Container GUI" className="h-8 w-8" /> 
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Container GUI</h1>
        </div>
        
        {/* Theme Toggle Button */}
        <div className="mt-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4" />
                <span className="text-sm">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span className="text-sm">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/dashboard' && location.pathname === '/');
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'sidebar-item',
                isActive && 'active'
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Container System Status */}
      <div className="mt-auto mb-16">
        <ContainerSystemStatus />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Container GUI v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 