import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Wallet, TrendingUp,
  BarChart3, FileText, Target, Calendar, Bell, User, LogOut, X, Menu, Bot
} from 'lucide-react';
import { fetchCategoryStats } from '../services/categoryService';

const sidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reports', icon: PieChart, label: 'Categories' },
  { to: '/budgets', icon: Wallet, label: 'Budget Planner' },
  { to: '/income', icon: TrendingUp, label: 'Income' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reports-page', icon: FileText, label: 'Reports' },
  { to: '/savings', icon: Target, label: 'Savings Goals' },
  { to: '/assistant', icon: Bot, label: 'Money Assistant' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number | null>(null);

  useEffect(() => {
    loadNotificationCount();
    
    // Listen for notification updates
    const handleNotificationUpdate = () => loadNotificationCount();
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, [location.pathname]);

  const loadNotificationCount = async () => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const categoryStats = await fetchCategoryStats(currentMonth);
    
    // Get read notification IDs
    const saved = localStorage.getItem('readNotifications');
    const readIds: number[] = saved ? JSON.parse(saved) : [];
    
    // Count unread alerts
    const alerts = categoryStats.filter((cat: any) => {
      const pct = parseFloat(cat.percentage) || 0;
      return pct >= 90;
    });

    // Only count alerts that haven't been read
    const count = alerts.length > 0 && readIds.length < alerts.length ? alerts.length - readIds.length : null;
    
    if (count && count > 0) {
      setNotificationCount(count);
    } else {
      setNotificationCount(null);
    }
  } catch (err) {
    console.error('Failed to load notification count:', err);
  }
};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const accountLinks = [
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 text-gray-500 hover:text-white bg-white rounded-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Empty top bar */}
<div className="h-16 border-b border-gray-200" />

        {/* Navigation */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-4">
          <div className="space-y-1 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main Menu</p>
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-500'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : ''}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Account Section */}
          <div className="space-y-1 pt-4 border-t border-gray-200 mt-auto">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account</p>
            {accountLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </div>
                {link.badge !== null && link.badge !== undefined && (
                  <span className="bg-blue-600 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-600/20 hover:text-red-500 transition-colors mt-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
