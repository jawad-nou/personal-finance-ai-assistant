import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { fetchBudgets, createBudget, deleteBudget } from '../services/budgetService';
import { fetchCategories } from '../services/categoryService';

const Budgets: React.FC = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthName = new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, buds] = await Promise.all([
        fetchCategories('expense'),
        fetchBudgets(currentMonth),
      ]);
      console.log('Categories loaded:', cats);
      console.log('Budgets loaded:', buds);
      setCategories(Array.isArray(cats) ? cats : []);
      setBudgets(Array.isArray(buds) ? buds : []);
      setError('');
    } catch (err: any) {
      console.error('Failed to load budgets:', err);
      setError('Failed to load data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await createBudget({
        category_id: parseInt(form.category_id),
        amount: parseFloat(form.amount),
        month: currentMonth,
      });

      // Find the category name for success message
      const selectedCat = categories.find(c => c.id === parseInt(form.category_id));
      setSuccess(`Budget set for "${selectedCat?.name || 'category'}" successfully!`);
      
      // Reset form
      setForm({ category_id: '', amount: '' });
      
      // Reload data
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to create budget:', err);
      setError(err.response?.data?.message || 'Failed to set budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete budget for "${name}"?`)) return;
    try {
      await deleteBudget(id);
      setSuccess(`Budget for "${name}" deleted.`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete:', err);
      setError('Failed to delete budget.');
    }
  };

  // Get categories that don't have a budget set yet
  const availableCategories = categories.filter(
    (cat: any) => !budgets.some((bud: any) => bud.category_id === cat.id)
  );

  const totalBudget = budgets.reduce((sum: number, bud: any) => sum + parseFloat(bud.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading budgets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Set monthly budgets for your expense categories - {monthName}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500">Total Budget</p>
          <p className="text-xl font-bold text-gray-900">${totalBudget.toFixed(2)}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add Budget Form */}
      {availableCategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-gray-900 font-semibold mb-4">Set New Budget</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-500 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category...</option>
                {availableCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-500 mb-1">Budget Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Saving...' : 'Set Budget'}
            </button>
          </form>
        </div>
      )}

      {/* Current Budgets */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900">Current Budgets for {monthName}</h3>
        </div>
        
        {budgets.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No budgets set for this month</p>
            <p className="text-gray-500 text-sm mt-1">
              {categories.length === 0 
                ? 'No categories available. Create categories first.' 
                : 'Select a category above to set your first budget!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Category</th>
                  <th className="px-6 py-3 text-right font-medium">Budget Amount</th>
                  <th className="px-6 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {budgets.map((budget: any) => (
                  <tr key={budget.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: budget.category_color || '#3B82F6' }} 
                        />
                        <span className="text-gray-900 font-medium">{budget.category_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-900 font-semibold">${parseFloat(budget.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(budget.id, budget.category_name)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Categories Overview */}
      {categories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900">All Expense Categories</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Category</th>
                  <th className="px-6 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {categories.map((cat: any) => {
                  const hasBudget = budgets.some((b: any) => b.category_id === cat.id);
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color || '#3B82F6' }} 
                          />
                          <span className="text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasBudget ? (
                          <span className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                            Budget Set
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-medium">
                            No Budget
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;