import React, { useEffect, useState } from 'react';
import { Target, Plus, Trash2, Edit3 } from 'lucide-react';
import { fetchSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../services/savingsService';

const Savings: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    color: '#3B82F6',
    target_date: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await fetchSavingsGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, {
          name: form.name,
          target_amount: parseFloat(form.target_amount),
          current_amount: parseFloat(form.current_amount),
          color: form.color,
          target_date: form.target_date || null,
        });
      } else {
        await createSavingsGoal({
          name: form.name,
          target_amount: parseFloat(form.target_amount),
          current_amount: parseFloat(form.current_amount),
          color: form.color,
          target_date: form.target_date || null,
        });
      }
      setForm({ name: '', target_amount: '', current_amount: '0', color: '#3B82F6', target_date: '' });
      setShowForm(false);
      setEditingGoal(null);
      loadGoals();
    } catch (err) {
      console.error('Failed to save goal:', err);
      alert('Failed to save goal');
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      color: goal.color,
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await deleteSavingsGoal(id);
      loadGoals();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading savings goals...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Track your progress towards financial goals.</p>
        </div>
        <button
          onClick={() => { setEditingGoal(null); setForm({ name: '', target_amount: '', current_amount: '0', color: '#3B82F6', target_date: '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h3>
            <button onClick={() => { setShowForm(false); setEditingGoal(null); }} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Goal Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" placeholder="e.g., Emergency Fund" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Target Amount ($)</label>
              <input type="number" step="0.01" min="0.01" value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Current Amount ($)</label>
              <input type="number" step="0.01" min="0" value={form.current_amount}
                onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Color</label>
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                <option value="#3B82F6">Blue</option>
                <option value="#10B981">Green</option>
                <option value="#F59E0B">Yellow</option>
                <option value="#8B5CF6">Purple</option>
                <option value="#EF4444">Red</option>
                <option value="#EC4899">Pink</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Target Date (optional)</label>
              <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No savings goals yet. Create your first goal!</p>
          </div>
        ) : (
          goals.map((goal: any) => {
            const percentage = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
            return (
              <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                      <Target className="w-5 h-5" style={{ color: goal.color }} />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{goal.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(goal)} className="text-gray-500 hover:text-blue-500">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900 font-medium">{percentage}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">${parseFloat(goal.current_amount).toLocaleString()}</span>
                    <span className="text-gray-500">${parseFloat(goal.target_amount).toLocaleString()}</span>
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-gray-500">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Savings;