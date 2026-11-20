import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-end px-6 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">Premium Plan</p>
        </div>
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;