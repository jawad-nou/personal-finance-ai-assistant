import React, { useEffect, useState } from 'react';
import { Bell, X, Check, AlertCircle, Info, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { fetchExpenses } from '../services/expenseService';
import { fetchCategoryStats } from '../services/categoryService';
import { fetchIncome } from '../services/incomeService';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info';
  time: string;
  read: boolean;
  icon: any;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    generateNotifications();
  }, []);

  const generateNotifications = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [expenses, categoryStats, income] = await Promise.all([
        fetchExpenses({ limit: 100 }),
        fetchCategoryStats(currentMonth),
        fetchIncome(),
      ]);

      const newNotifications: Notification[] = [];
      let id = 1;

      // Budget alerts
      categoryStats.forEach((cat: any) => {
        const pct = parseFloat(cat.percentage) || 0;
        if (pct >= 90) {
          newNotifications.push({
            id: id++,
            title: 'Budget Alert',
            message: `You have spent ${pct}% of your ${cat.name} budget ($${parseFloat(cat.spent).toFixed(0)} of $${parseFloat(cat.budget).toFixed(0)})`,
            type: 'warning',
            time: 'Just now',
            read: readIds.includes(id - 1),
            icon: AlertCircle,
          });
        }
      });

      // Recent large expenses
      const recentExpenses = expenses.slice(0, 5);
      recentExpenses.forEach((exp: any) => {
        if (parseFloat(exp.amount) > 100) {
          const currentId = id++;
          newNotifications.push({
            id: currentId,
            title: 'Large Expense',
            message: `$${parseFloat(exp.amount).toFixed(2)} spent on ${exp.description || exp.category_name}`,
            type: 'info',
            time: new Date(exp.expense_date).toLocaleDateString(),
            read: readIds.includes(currentId),
            icon: CreditCard,
          });
        }
      });

      // Recent income
      const recentIncome = income.slice(0, 3);
      recentIncome.forEach((inc: any) => {
        const currentId = id++;
        newNotifications.push({
          id: currentId,
          title: 'Income Received',
          message: `$${parseFloat(inc.amount).toFixed(2)} received from ${inc.description || inc.category_name}`,
          type: 'success',
          time: new Date(inc.income_date).toLocaleDateString(),
          read: readIds.includes(currentId),
          icon: TrendingUp,
        });
      });

      // General info
      if (expenses.length === 0 && income.length === 0) {
        const currentId = id++;
        newNotifications.push({
          id: currentId,
          title: 'Welcome!',
          message: 'Start adding your expenses and income to track your finances.',
          type: 'info',
          time: 'Now',
          read: readIds.includes(currentId),
          icon: Info,
        });
      }

      if (categoryStats.length > 0) {
        const totalBudget = categoryStats.reduce((sum: number, cat: any) => sum + parseFloat(cat.budget || 0), 0);
        const totalSpent = categoryStats.reduce((sum: number, cat: any) => sum + parseFloat(cat.spent || 0), 0);
        const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
        const currentId = id++;
        
        newNotifications.push({
          id: currentId,
          title: 'Monthly Overview',
          message: `You've spent ${totalPct}% of your total monthly budget ($${totalSpent.toFixed(0)} of $${totalBudget.toFixed(0)})`,
          type: 'info',
          time: currentMonth,
          read: readIds.includes(currentId),
          icon: Wallet,
        });
      }

      setNotifications(newNotifications);
    } catch (err) {
      console.error('Failed to generate notifications:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const combined = [...readIds, ...allIds];
    const newReadIds = combined.filter((id, index) => combined.indexOf(id) === index);
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your financial activity.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-500 hover:text-blue-400 font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white border rounded-xl p-5 transition-all ${
                notification.read ? 'border-gray-200 opacity-70' : 'border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'warning'
                      ? 'bg-yellow-100'
                      : notification.type === 'success'
                      ? 'bg-green-100'
                      : 'bg-blue-100'
                  }`}
                >
                  <notification.icon
                    className={`w-5 h-5 ${
                      notification.type === 'warning'
                        ? 'text-yellow-600'
                        : notification.type === 'success'
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${notification.read ? 'text-gray-400' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;