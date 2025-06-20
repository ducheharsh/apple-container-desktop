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
  Box
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Container },
    { name: 'Run Container', path: '/run', icon: Play },
    { name: 'Logs', path: '/logs', icon: FileText },
    { name: 'Images', path: '/images', icon: Image },
    { name: 'Build Image', path: '/build', icon: Hammer },
    { name: 'Registry', path: '/registry', icon: Cloud },
    { name: 'System', path: '/system', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Box className="h-8 w-8 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Container GUI</h1>
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
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Container GUI v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 