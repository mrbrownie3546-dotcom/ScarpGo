import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { ScrapCategory } from '../../types/scrapgo';
import { Scale, Plus, Edit2, Trash2, CheckCircle2, Search, Power, Recycle } from 'lucide-react';

export const ScrapCategoriesTab: React.FC = () => {
  const { categories, updateScrapItemRate, addCategory, toggleCategoryStatus, canPerform } = useScrap();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCat, setEditingCat] = useState<ScrapCategory | null>(null);
  const [editRateInput, setEditRateInput] = useState<number>(0);
  const [editNameInput, setEditNameInput] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRate, setNewCatRate] = useState<number>(30);
  const [newCatUnit, setNewCatUnit] = useState('kg');
  const [newCatType, setNewCatType] = useState<'paper' | 'plastic' | 'metal' | 'e-waste' | 'appliance'>('metal');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || editRateInput <= 0) return;

    updateScrapItemRate(editingCat.id, editRateInput, 'Updated by Admin from Scrap Rates Master');
    setEditingCat(null);
    showFeedback(`Rate for "${editingCat.name}" updated to ₹${editRateInput}/${editingCat.unit}`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || newCatRate <= 0) return;

    addCategory({
      name: newCatName,
      rate_per_kg: newCatRate,
      unit: newCatUnit,
      icon_name: 'Recycle',
      category_type: newCatType,
      description: newCatDesc || 'Clean recyclable scrap material.',
      is_active: true,
      min_weight_kg: 1,
    });

    setShowAddModal(false);
    setNewCatName('');
    setNewCatRate(30);
    setNewCatDesc('');
    showFeedback(`New scrap category "${newCatName}" published live on website!`);
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {toast && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toast}
          </span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            Scrap Categories & Rate Master
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit rates per KG/Piece, or enable/disable categories. Changes reflect live on customer website.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scrap Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category name or type..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
              cat.is_active
                ? 'border-slate-200 dark:border-slate-800'
                : 'border-rose-200 dark:border-rose-950 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Type: {cat.category_type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    cat.is_active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {cat.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {cat.description}
              </p>

              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Current Rate:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₹{cat.rate_per_kg} <span className="text-xs font-semibold text-slate-400">/ {cat.unit}</span>
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setEditingCat(cat);
                  setEditRateInput(cat.rate_per_kg);
                  setEditNameInput(cat.name);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Rate</span>
              </button>

              <button
                onClick={() => {
                  toggleCategoryStatus(cat.id);
                  showFeedback(`Category "${cat.name}" status toggled.`);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  cat.is_active
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{cat.is_active ? 'Disable' : 'Enable'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rate Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
              Update Rate for {editingCat.name}
            </h3>

            <form onSubmit={handleSaveRate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Rate (₹ per {editingCat.unit})</label>
                <input
                  type="number"
                  value={editRateInput}
                  onChange={(e) => setEditRateInput(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full text-base font-extrabold px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Save & Publish Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Recycle className="w-5 h-5 text-emerald-600" />
                Add New Scrap Master Category
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Item Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Brass & Heavy Metals, Battery"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={newCatRate}
                    onChange={(e) => setNewCatRate(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={newCatUnit}
                    onChange={(e) => setNewCatUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="kg">per KG</option>
                    <option value="piece">per Piece</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scrap Type</label>
                <select
                  value={newCatType}
                  onChange={(e: any) => setNewCatType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="metal">Metal</option>
                  <option value="paper">Paper & Cardboard</option>
                  <option value="plastic">Plastic & PET</option>
                  <option value="e-waste">E-Waste</option>
                  <option value="appliance">Appliance / Heavy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Items accepted under this rate..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Add Category & Publish Rate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
