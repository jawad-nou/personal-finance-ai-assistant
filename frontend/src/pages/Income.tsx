import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowDownRight, Plus, Trash2 } from 'lucide-react';
import { fetchIncome, addIncome, deleteIncome } from '../services/incomeService';
import { fetchCategories } from '../services/categoryService';

const Income: React.FC = () => {
  const [incomeList, setIncomeList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category_id: '',
    amount: '',
    description: '',
    income_date: '',
    source: '',
    frequency: 'One-time',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomeData, categoryData] = await Promise.all([
        fetchIncome(),
        fetchCategories('income'),
      ]);
      setIncomeList(incomeData);
      setCategories(categoryData);
    } catch (err) {
      console.error('Failed to load income:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addIncome({
        category_id: parseInt(form.category_id),
        amount: parseFloat(form.amount),
        description: form.description,
        income_date: form.income_date,
        source: form.source,
        frequency: form.frequency,
      });
      setForm({ category_id: '', amount: '', description: '', income_date: '', source: '', frequency: 'One-time' });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to add income:', err);
      alert('Failed to add income');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this income entry?')) return;
    try {
      await deleteIncome(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const totalIncome = incomeList.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading income data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="text-sm text-gray-500 mt-1">Track your income sources and earnings.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Income
        </button>
      </div>

      {/* Total Income Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <p className="text-green-100 text-sm">Total Income</p>
        <h2 className="text-3xl font-bold mt-1">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        <p className="text-green-100 text-sm mt-2">{incomeList.length} income entries</p>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Add New Income</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" required>
                <option value="">Select category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Amount ($)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Date</label>
              <input type="date" value={form.income_date}
                onChange={(e) => setForm({ ...form, income_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Description</label>
              <input type="text" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="What was this income for?" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Source</label>
              <input type="text" value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="Employer, Client, etc." />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                <option>One-time</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Save Income
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      <div className="bg-white border  rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900">Income Entries</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Frequency</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {incomeList.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No income entries yet</td></tr>
            ) : (
              incomeList.map((income: any) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="font-medium text-gray-900">{income.description || income.category_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">{income.category_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(income.income_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{income.frequency}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-green-500 font-medium">+${parseFloat(income.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(income.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Income;