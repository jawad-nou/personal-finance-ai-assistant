import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getDashboardStats, getExpenseSummary, getRecentTransactions } from '../services/expenseService';
import { fetchCategoryStats } from '../services/categoryService';
import { fetchIncome } from '../services/incomeService';
import { fetchSavingsGoals } from '../services/savingsService';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#6366F1', '#06B6D4', '#64748B', '#F97316'];

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [expenseSummary, setExpenseSummary] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [dashboardStats, expSummary, catStats, incomeData, savingsData, transactions] = await Promise.all([
        getDashboardStats(currentMonth),
        getExpenseSummary(currentMonth),
        fetchCategoryStats(currentMonth),
        fetchIncome(),
        fetchSavingsGoals(),
        getRecentTransactions(50),
      ]);

      setStats(dashboardStats);
      setExpenseSummary(expSummary);
      setCategoryStats(catStats);
      setIncome(incomeData);
      setSavings(savingsData);
      setRecentTx(transactions);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading analytics...</p>
      </div>
    );
  }

  // Calculate metrics
  const totalExpenses = parseFloat(stats.monthlyExpenses) || 0;
  const totalIncome = parseFloat(stats.monthlyIncome) || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
  const totalSavings = parseFloat(stats.totalSavings) || 0;
  const transactionCount = recentTx.length;

  // Expense by category pie data
  const pieData = expenseSummary.map((item: any) => ({
    name: item.name,
    value: parseFloat(item.total),
    color: item.color,
  }));

  // Budget vs Actual bar data
  const budgetVsActual = categoryStats.map((cat: any) => ({
    name: cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name,
    Budget: parseFloat(cat.budget) || 0,
    Spent: parseFloat(cat.spent) || 0,
    fullName: cat.name,
  }));

  // Income by category
  const incomeByCategory = income.reduce((acc: any, inc: any) => {
    const cat = inc.category_name || 'Other';
    acc[cat] = (acc[cat] || 0) + parseFloat(inc.amount);
    return acc;
  }, {});

  const incomePieData = Object.keys(incomeByCategory).map((key, i) => ({
    name: key,
    value: incomeByCategory[key],
    color: COLORS[i % COLORS.length],
  }));

  // Monthly trend (simulated from current data)
  const monthlyTrend = [
    { name: 'Income', value: totalIncome, fill: '#10B981' },
    { name: 'Expenses', value: totalExpenses, fill: '#EF4444' },
    { name: 'Savings', value: totalSavings, fill: '#3B82F6' },
  ];

  // Top spending categories
  const topSpending = [...categoryStats]
    .sort((a, b) => parseFloat(b.spent) - parseFloat(a.spent))
    .slice(0, 5);

  const totalBudget = categoryStats.reduce((sum, cat) => sum + parseFloat(cat.budget || 0), 0);
  const totalSpent = categoryStats.reduce((sum, cat) => sum + parseFloat(cat.spent || 0), 0);
  const budgetUsage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Detailed analysis of your financial data for {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Savings Rate</p>
          <p className="text-xl font-bold text-gray-900">{savingsRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Income/Expense Ratio</p>
          <p className="text-xl font-bold text-gray-900">{totalExpenses > 0 ? (totalIncome / totalExpenses).toFixed(1) : 'N/A'}x</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Budget Usage</p>
          <p className="text-xl font-bold text-gray-900">{budgetUsage}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-xl font-bold text-gray-900">{transactionCount}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Budget vs Actual Spending</h3>
          {budgetVsActual.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No budget data available</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={11} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                    labelFormatter={(label) => budgetVsActual.find(b => b.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="Budget" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Spent" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Expense Breakdown</h3>
          {pieData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No expense data available</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {pieData.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || COLORS[i] }} />
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="text-gray-900 font-medium ml-auto">${item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {topSpending.length === 0 ? (
              <p className="text-gray-500 text-sm">No spending data</p>
            ) : (
              topSpending.map((cat, i) => {
                const pct = parseFloat(cat.percentage) || 0;
                const spent = parseFloat(cat.spent) || 0;
                const budget = parseFloat(cat.budget) || 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || COLORS[i] }} />
                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">${spent.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 100 ? '#EF4444' : cat.color || COLORS[i],
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{pct}% of budget</span>
                      {budget > 0 && (
                        <span className="text-xs text-gray-400">Budget: ${budget.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Income Sources */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Income Sources</h3>
          {incomePieData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-500">No income data available</div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomePieData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3} dataKey="value">
                    {incomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1">
            {incomePieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="text-gray-900 font-medium">${item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Income Summary</h4>
          </div>
          <p className="text-2xl font-bold text-blue-900">${totalIncome.toFixed(2)}</p>
          <p className="text-sm text-blue-700 mt-1">{income.length} income entries this month</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-900">Expense Summary</h4>
          </div>
          <p className="text-2xl font-bold text-red-900">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-red-700 mt-1">Across {categoryStats.length} categories</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Savings Summary</h4>
          </div>
          <p className="text-2xl font-bold text-green-900">${totalSavings.toFixed(2)}</p>
          <p className="text-sm text-green-700 mt-1">{savings.length} active goals</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;