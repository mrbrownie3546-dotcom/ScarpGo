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

const TYPE_STYLE: Record<string, { bg: string; fg: string; emoji: string }> = {
  metal: { bg: '#fff7ed', fg: '#c2410c', emoji: '🔩' },
  paper: { bg: '#fefce8', fg: '#a16207', emoji: '📰' },
  plastic: { bg: '#f5f3ff', fg: '#6d28d9', emoji: '🧴' },
  'e-waste': { bg: '#eff6ff', fg: '#1d4ed8', emoji: '🔌' },
  appliance: { bg: '#ecfeff', fg: '#0e7490', emoji: '🧊' },
  vehicle: { bg: '#f0fdf4', fg: '#15803d', emoji: '🚗' },
};

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
          className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredCategories.map((cat) => {
          const t = TYPE_STYLE[cat.category_type] || TYPE_STYLE.metal;
          return (
            <div
              key={cat.id}
              className={`relative min-w-0 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex flex-col ${
                cat.is_active ? '' : 'opacity-70'
              }`}
            >
              <div className="relative h-16 sm:h-20 flex items-center justify-center text-3xl sm:text-4xl" style={{ background: t.bg }}>
                <span
                  className="absolute top-2 left-2 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/90"
                  style={{ color: t.fg }}
                >
                  {cat.category_type}
                </span>
                <span
                  className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    cat.is_active ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                  title={cat.is_active ? 'Active' : 'Disabled'}
                />
                <span aria-hidden="true">{t.emoji}</span>
              </div>

              <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
                <h3 className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight break-words min-h-[2rem]">
                  {cat.name}
                </h3>
                <div className="mt-1.5 mb-2.5 font-black tabular-nums text-xl sm:text-2xl leading-none" style={{ color: t.fg }}>
                  ₹{cat.rate_per_kg}
                  <span className="text-[11px] font-bold text-slate-500"> /{cat.unit || 'kg'}</span>
                </div>
                {!cat.is_active && (
                  <p className="text-[10px] font-bold text-slate-500 mb-2">Disabled</p>
                )}

                <div className="mt-auto flex items-stretch gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="flex-1 min-w-0 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingCat(cat)}
                    className="shrink-0 w-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
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

              <button
                type="button"
                onClick={() => {
                  toggleCategoryStatus(editingCat.id);
                  setEditingCat({ ...editingCat, is_active: !editingCat.is_active });
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Power className="w-4 h-4" />
                <span>{editingCat.is_active ? 'Disable this item' : 'Enable this item'}</span>
              </button>

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
