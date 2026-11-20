import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;