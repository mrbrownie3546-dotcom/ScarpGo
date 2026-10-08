import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { ScrapCategory } from '../../types/scrapgo';
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Power,
  Recycle,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';

export const ScrapCategoriesTab: React.FC = () => {
  const {
    categories,
    updateCategoryRate,
    updateCategoryDetails,
    addCategory,
    toggleCategoryStatus,
    deleteCategory,
    deleteScrapItem,
  } = useScrap();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Edit Modal State
  const [editingCat, setEditingCat] = useState<ScrapCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('kg');
  const [editType, setEditType] = useState<'paper' | 'plastic' | 'metal' | 'e-waste' | 'appliance'>('metal');
  const [editDesc, setEditDesc] = useState('');

  // Delete Modal State
  const [deletingCat, setDeletingCat] = useState<ScrapCategory | null>(null);

  // Add Modal State
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

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || c.category_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenEdit = (cat: ScrapCategory) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditRate(cat.rate_per_kg);
    setEditUnit(cat.unit || 'kg');
    setEditType((cat.category_type as any) || 'metal');
    setEditDesc(cat.description || '');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || editRate <= 0 || !editName.trim()) return;

    if (updateCategoryDetails) {
      updateCategoryDetails(editingCat.id, {
        name: editName,
        rate_per_kg: editRate,
        unit: editUnit,
        category_type: editType,
        description: editDesc,
      });
    } else {
      updateCategoryRate(editingCat.id, editRate);
    }

    setEditingCat(null);
    showFeedback(`Category "${editName}" updated successfully!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingCat) return;

    const res = deleteCategory(deletingCat.id);
    deleteScrapItem(deletingCat.id);

    showFeedback(res?.message || `Scrap category "${deletingCat.name}" deleted permanently.`);
    setDeletingCat(null);
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
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {toast}
          </span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Scrap Categories & Rates Master
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add new scrap materials, update live per-KG prices, enable/disable status, or delete scrap items.
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

      {/* Search & Filter Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scrap material or type..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-bold shrink-0">Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Types ({categories.length})</option>
            <option value="metal">Metals</option>
            <option value="paper">Paper & Cartons</option>
            <option value="plastic">Plastics</option>
            <option value="e-waste">E-Waste</option>
            <option value="appliance">Appliances</option>
          </select>
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
                : 'border-rose-200 dark:border-rose-950/80 bg-rose-50/20 dark:bg-rose-950/10 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {cat.description}
              </p>

              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Current Rate:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₹{cat.rate_per_kg} <span className="text-xs font-semibold text-slate-400">/ {cat.unit || 'kg'}</span>
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Edit Category Details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    toggleCategoryStatus(cat.id);
                    showFeedback(`Category "${cat.name}" status switched to ${cat.is_active ? 'Disabled' : 'Active'}.`);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    cat.is_active
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                  title={cat.is_active ? 'Disable this category' : 'Enable this category'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{cat.is_active ? 'Disable' : 'Enable'}</span>
                </button>
              </div>

              {/* DELETE BUTTON */}
              <button
                onClick={() => setDeletingCat(cat)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                title="Delete Scrap Category"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No scrap categories found matching filter.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting search query or adding a new category above.</p>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                Edit Category: {editingCat.name}
              </h3>
              <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Scrap Item Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full text-sm font-extrabold px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="kg">per KG</option>
                    <option value="piece">per Piece</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scrap Material Type</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="metal">Metal</option>
                  <option value="paper">Paper & Cartons</option>
                  <option value="plastic">Plastic & PET</option>
                  <option value="e-waste">E-Waste</option>
                  <option value="appliance">Appliance / Heavy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-rose-200 dark:border-rose-900/60 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              Delete Scrap Category?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">"{deletingCat.name}"</strong>?
            </p>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-left text-[11px] text-rose-800 dark:text-rose-300 mb-4 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Permanent Admin Action</span>
              </div>
              <p>This scrap material will be removed from customer rate cards, live earnings calculator, and pickup selection menu.</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Scrap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Recycle className="w-5 h-5 text-emerald-600" />
                Add New Scrap Master Category
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
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
                  <option value="paper">Paper & Cartons</option>
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
