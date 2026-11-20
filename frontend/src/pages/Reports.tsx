import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Package, Coffee, Car, ShoppingBag, Film, Home, Zap, HeartPulse, GraduationCap, Gift, Briefcase, TrendingUp, Laptop, PlusCircle, Plane } from 'lucide-react';
import { fetchCategoryStats, createCategory, deleteCategory } from '../services/categoryService';

const iconOptions = [
  { value: 'coffee', label: '☕ Coffee / Food', icon: Coffee },
  { value: 'car', label: '🚗 Car / Transport', icon: Car },
  { value: 'shopping-bag', label: '🛍️ Shopping', icon: ShoppingBag },
  { value: 'film', label: '🎬 Entertainment', icon: Film },
  { value: 'home', label: '🏠 Housing / Rent', icon: Home },
  { value: 'zap', label: '⚡ Utilities', icon: Zap },
  { value: 'heart-pulse', label: '❤️ Healthcare', icon: HeartPulse },
  { value: 'graduation-cap', label: '🎓 Education', icon: GraduationCap },
  { value: 'gift', label: '🎁 Gifts', icon: Gift },
  { value: 'package', label: '📦 Other', icon: Package },
  { value: 'briefcase', label: '💼 Business', icon: Briefcase },
  { value: 'trending-up', label: '📈 Investments', icon: TrendingUp },
  { value: 'laptop', label: '💻 Freelance', icon: Laptop },
  { value: 'plus-circle', label: '➕ Other Income', icon: PlusCircle },
  { value: 'plane', label: '✈️ Travel', icon: Plane },
];

const colorOptions = [
  { value: '#3B82F6', label: '🔵 Blue' },
  { value: '#10B981', label: '🟢 Green' },
  { value: '#F59E0B', label: '🟡 Yellow' },
  { value: '#8B5CF6', label: '🟣 Purple' },
  { value: '#EF4444', label: '🔴 Red' },
  { value: '#EC4899', label: '🩷 Pink' },
  { value: '#6366F1', label: '🔷 Indigo' },
  { value: '#06B6D4', label: '🩵 Cyan' },
  { value: '#64748B', label: '⚫ Gray' },
  { value: '#F97316', label: '🟠 Orange' },
];

const Reports: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense', icon: 'coffee', color: '#3B82F6', budget: '0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategoryStats(currentMonth);
      console.log('Categories loaded:', data);
      setCategories(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Is the backend running?');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      console.log('Creating category:', form);
      await createCategory({
        name: form.name,
        type: form.type,
        icon: form.icon,
        color: form.color,
        budget: parseFloat(form.budget) || 0,
      });

      setSuccessMsg(`Category "${form.name}" created successfully!`);
      setForm({ name: '', type: 'expense', icon: 'coffee', color: '#3B82F6', budget: '0' });
      setShowForm(false);
      
      // Reload categories
      setTimeout(async () => {
        await loadCategories();
        setSuccessMsg('');
      }, 500);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      const message = err.response?.data?.message || err.message || 'Failed to create category';
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete category');
    }
  };

  const filtered = categories.filter((cat: any) =>
    (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find(opt => opt.value === iconName);
    return found ? found.icon : Package;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Track your spending across different budget categories.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Find category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />New Category
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">New Category</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Food & Dining"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Icon</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {iconOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Color</label>
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Monthly Budget ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No categories found</p>
            <p className="text-sm mt-1">Click "New Category" to create your first one!</p>
          </div>
        ) : (
          filtered.map((cat: any) => {
            const pct = parseFloat(cat.percentage) || 0;
            const spent = parseFloat(cat.spent) || 0;
            const budget = parseFloat(cat.budget) || 0;
            const remaining = parseFloat(cat.remaining) || 0;
            const IconComp = getIconComponent(cat.icon);

            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-500/50 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color || '#3B82F6' }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{cat.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {cat.type === 'expense' && (
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-900">
                      ${spent.toFixed(0)}
                      <span className="text-sm text-gray-500 font-normal"> / ${budget.toFixed(0)}</span>
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className={pct >= 90 ? 'text-yellow-500 font-medium' : 'text-gray-500'}>
                        ${remaining.toFixed(0)} remaining
                      </span>
                      <span className="text-gray-900 font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 100 ? '#EF4444' : cat.color || '#3B82F6',
                        }}
                      />
                    </div>
                  </div>
                )}

                {cat.type === 'income' && (
                  <p className="text-sm text-gray-500 mt-2">Income category</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reports;