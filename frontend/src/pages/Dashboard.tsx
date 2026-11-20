import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, PiggyBank, CreditCard, ArrowRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getDashboardStats, getExpenseSummary, getRecentTransactions } from '../services/expenseService';
import { fetchCategoryStats } from '../services/categoryService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ currentBalance: 0, monthlyIncome: 0, monthlyExpenses: 0, totalSavings: 0 });
  const [pieData, setPieData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardStats, expenseSummary, recentTx, categoryStatsData] = await Promise.all([
          getDashboardStats(currentMonth),
          getExpenseSummary(currentMonth),
          getRecentTransactions(5),
          fetchCategoryStats(currentMonth),
        ]);

        setStats(dashboardStats);
        setPieData(expenseSummary.map((item: any) => ({
          name: item.name,
          value: parseFloat(item.total),
          color: item.color,
        })));
        setTransactions(recentTx);
        setBudgetItems(categoryStatsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { icon: <Wallet className="w-5 h-5 text-blue-500" />, label: 'Current Balance', value: `$${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '+4.5%', positive: true },
    { icon: <ArrowDownRight className="w-5 h-5 text-green-500" />, label: 'Monthly Income', value: `$${stats.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '+12.5%', positive: true },
    { icon: <ArrowUpRight className="w-5 h-5 text-red-500" />, label: 'Monthly Expenses', value: `$${stats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '-2.4%', positive: false },
    { icon: <PiggyBank className="w-5 h-5 text-yellow-500" />, label: 'Total Savings', value: `$${stats.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '+8.2%', positive: true },
  ];

  const barData = [
    { name: 'Jan', Income: 4000, Expenses: 2400 },
    { name: 'Feb', Income: 3000, Expenses: 1398 },
    { name: 'Mar', Income: 2000, Expenses: 3800 },
    { name: 'Apr', Income: 2780, Expenses: 3908 },
    { name: 'May', Income: 1890, Expenses: 4800 },
    { name: 'Jun', Income: 2390, Expenses: 3800 },
    { name: 'Jul', Income: 3490, Expenses: 4300 },
  ];

  const totalExpenses = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Here's a summary of your financial activity this month.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">{stat.icon}</div>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Income vs Expenses</h3>
            <button onClick={() => navigate('/reports-page')} className="text-sm text-blue-600 hover:underline font-medium">
              View Report
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={26} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827' }} />
                <Legend wrapperStyle={{ color: '#4B5563' }} />
                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">Expenses by Category</h3>
          <div className="h-[240px] w-full flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827' }} />
              </PieChart>
            </ResponsiveContainer>
            {totalExpenses > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="text-lg font-bold text-gray-900">${(totalExpenses / 1000).toFixed(1)}k</span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {pieData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">${item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900">Recent Transactions</h3>
            <button onClick={() => navigate('/expenses')} className="flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Transaction</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No transactions yet</td>
                  </tr>
                ) : (
                  transactions.map((tx: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tx.description || tx.category_name}</p>
                            <p className="text-xs text-gray-500">{tx.category_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className={`px-5 py-4 text-right font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Budget Progress</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-5">
            {budgetItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No budget data yet</p>
            ) : (
              budgetItems.slice(0, 4).map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-500">
                      <strong className={parseFloat(item.percentage) >= 100 ? 'text-red-500' : 'text-gray-900'}>
                        ${parseFloat(item.spent).toFixed(0)}
                      </strong> / ${parseFloat(item.budget).toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(parseFloat(item.percentage) || 0, 100)}%`,
                        backgroundColor: parseFloat(item.percentage) >= 100 ? '#EF4444' : item.color || '#3B82F6'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/budgets')} className="w-full mt-8 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Manage Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;