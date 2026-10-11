import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { ScrapCategory } from '../../types/scrapgo';
import {
  Calculator,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Truck,
  Leaf,
  RefreshCw,
  Zap,
  Tag,
  ShieldCheck,
  TrendingUp,
  Info,
} from 'lucide-react';

interface SelectedEstimateItem {
  category: ScrapCategory;
  quantity: number;
}

interface ScrapPriceEstimatorProps {
  onSchedulePickup?: (catIds: string[], expectedItemsSummary: string, estimatedWeight: number) => void;
}

export const ScrapPriceEstimator: React.FC<ScrapPriceEstimatorProps> = ({ onSchedulePickup }) => {
  const { categories, getCategoryName, getCategoryDesc } = useScrap();

  // Active items for estimation map: categoryId -> quantity
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() => {
    // Default preset with Newspaper 20kg & Iron 15kg
    return {
      'cat-newspaper': 20,
      'cat-iron': 15,
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'estimator' | 'breakdown'>('estimator');

  // Active available categories
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.is_active);
  }, [categories]);

  // Filtered categories for selection list
  const filteredCategories = useMemo(() => {
    return activeCategories.filter((cat) => {
      const matchesType = selectedTypeFilter === 'all' || cat.category_type === selectedTypeFilter;
      const catName = getCategoryName(cat).toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = catName.includes(q) || cat.description.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [activeCategories, selectedTypeFilter, searchQuery, getCategoryName]);

  // Compute selected items list
  const selectedItemsList = useMemo(() => {
    const list: SelectedEstimateItem[] = [];
    Object.entries(selectedQuantities).forEach(([catId, qty]) => {
      if (qty > 0) {
        const cat = activeCategories.find((c) => c.id === catId);
        if (cat) {
          list.push({ category: cat, quantity: qty });
        }
      }
    });
    return list;
  }, [selectedQuantities, activeCategories]);

  // Total Estimated Price
  const totalEstimatedPrice = useMemo(() => {
    return selectedItemsList.reduce((sum, item) => {
      return sum + item.quantity * item.category.rate_per_kg;
    }, 0);
  }, [selectedItemsList]);

  // Total Estimated Weight (kg)
  const totalEstimatedWeight = useMemo(() => {
    return selectedItemsList.reduce((sum, item) => {
      // If unit is piece, estimate avg 10kg per appliance/piece or use quantity directly
      const multiplier = item.category.unit === 'piece' ? 10 : 1;
      return sum + item.quantity * multiplier;
    }, 0);
  }, [selectedItemsList]);

  // Eco Savings Metrics
  const co2SavedKg = Math.round(totalEstimatedWeight * 1.8);
  const treesSaved = (totalEstimatedWeight * 0.08).toFixed(1);

  // Helper handlers
  const handleQuantityChange = (catId: string, delta: number, minVal: number = 0) => {
    setSelectedQuantities((prev) => {
      const current = prev[catId] || 0;
      const next = Math.max(minVal, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[catId];
        return copy;
      }
      return { ...prev, [catId]: next };
    });
  };

  const handleSetDirectQuantity = (catId: string, value: number) => {
    const cleanValue = isNaN(value) ? 0 : Math.max(0, value);
    setSelectedQuantities((prev) => {
      if (cleanValue <= 0) {
        const copy = { ...prev };
        delete copy[catId];
        return copy;
      }
      return { ...prev, [catId]: cleanValue };
    });
  };

  const handleRemoveItem = (catId: string) => {
    setSelectedQuantities((prev) => {
      const copy = { ...prev };
      delete copy[catId];
      return copy;
    });
  };

  const handleResetAll = () => {
    setSelectedQuantities({});
  };

  // Presets
  const applyPreset = (presetType: 'household' | 'appliances' | 'office' | 'construction') => {
    if (presetType === 'household') {
      setSelectedQuantities({
        'cat-newspaper': 25,
        'cat-cardboard': 15,
        'cat-plastic-mix': 8,
      });
    } else if (presetType === 'appliances') {
      setSelectedQuantities({
        'cat-ac-split': 1,
        'cat-fridge': 1,
        'cat-washing-machine': 1,
      });
    } else if (presetType === 'office') {
      setSelectedQuantities({
        'cat-books': 40,
        'cat-cardboard': 30,
        'cat-ewaste-mix': 15,
      });
    } else if (presetType === 'construction') {
      setSelectedQuantities({
        'cat-iron': 50,
        'cat-copper': 5,
        'cat-aluminium': 12,
        'cat-brass': 4,
      });
    }
  };

  // Format expected summary for booking
  const getExpectedSummary = () => {
    if (selectedItemsList.length === 0) return 'Scrap Items';
    return selectedItemsList
      .map((i) => `${getCategoryName(i.category)} (${i.quantity} ${i.category.unit})`)
      .join(', ');
  };

  const handleTriggerBooking = () => {
    if (onSchedulePickup) {
      const catIds = selectedItemsList.map((i) => i.category.id);
      const summary = getExpectedSummary();
      onSchedulePickup(catIds, summary, totalEstimatedWeight || 20);
    }
  };

  return (
    <div id="scrap-price-estimator" className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200/90 dark:border-slate-800 shadow-[0_10px_30px_rgba(16,185,129,0.08)] overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-black border border-white/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>LIVE SCRAP RATE CALCULATOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Scrap Price Estimator 🧮
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed">
              Select your scrap items & adjust quantities to instantly estimate your earnings based on today's live market prices in Haryana & NCR.
            </p>
          </div>

          {/* Total Price Quick Counter Widget */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shrink-0 text-right space-y-1 shadow-lg">
            <span className="text-[11px] font-extrabold text-emerald-200 uppercase tracking-wider block">
              Estimated Total Payout
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 flex items-center justify-end gap-1">
              <span>₹</span>
              <motion.span
                key={totalEstimatedPrice}
                initial={{ scale: 1.1, color: '#fef08a' }}
                animate={{ scale: 1, color: '#fde047' }}
                transition={{ duration: 0.2 }}
              >
                {totalEstimatedPrice.toLocaleString('en-IN')}
              </motion.span>
            </div>
            <span className="text-[10px] text-emerald-100 font-bold block">
              {selectedItemsList.length} items selected • {totalEstimatedWeight} kg est.
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Estimator Body */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Presets Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Quick Presets (1-Click Load)</span>
            </span>
            {selectedItemsList.length > 0 && (
              <button
                onClick={handleResetAll}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => applyPreset('household')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5">
                <span>📰 Household Paper</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Newspaper, Cardboard & Plastic
              </span>
            </button>

            <button
              onClick={() => applyPreset('appliances')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5">
                <span>❄️ Old Appliances</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Split AC, Refrigerator & Washing Machine
              </span>
            </button>

            <button
              onClick={() => applyPreset('office')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5">
                <span>🏢 Office Records</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Books, Office Files & E-Waste
              </span>
            </button>

            <button
              onClick={() => applyPreset('construction')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 flex items-center gap-1.5">
                <span>🔨 Heavy Metals</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Iron, Copper, Brass & Aluminium
              </span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Left Item Selector, Right Estimate Summary Panel */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Scrap Category Selector & Quantity Adjuster */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search and Category Filter Pills */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scrap item (e.g. Copper, Newspaper, Fridge...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'paper', label: 'Paper' },
                  { id: 'metal', label: 'Metals' },
                  { id: 'plastic', label: 'Plastics' },
                  { id: 'e-waste', label: 'E-Waste' },
                  { id: 'appliance', label: 'Appliances' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTypeFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrap Category Items Selection Cards Grid */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCategories.map((cat) => {
                const currentQty = selectedQuantities[cat.id] || 0;
                const isSelected = currentQty > 0;
                const itemSubtotal = currentQty * cat.rate_per_kg;

                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/80 shadow-xs'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Item Info Left */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {getCategoryName(cat)}
                        </h4>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 shrink-0">
                          ₹{cat.rate_per_kg} / {cat.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                        {getCategoryDesc(cat)}
                      </p>
                    </div>

                    {/* Quantity Controls & Subtotal Right */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                      {isSelected ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(cat.id, -5)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            title="Decrease 5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              value={currentQty === 0 ? '' : currentQty}
                              onChange={(e) => handleSetDirectQuantity(cat.id, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500 text-center text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] font-bold text-slate-400 ml-1">
                              {cat.unit}
                            </span>
                          </div>

                          <button
                            onClick={() => handleQuantityChange(cat.id, 5)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            title="Increase 5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuantityChange(cat.id, 10)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                      )}

                      {/* Subtotal Display */}
                      {isSelected && (
                        <div className="text-right min-w-[70px]">
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 block">
                            ₹{itemSubtotal.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block">
                            Subtotal
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <Info className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No scrap items found matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTypeFilter('all');
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Live Estimate Calculation Summary & Action Box */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-white">
                    Estimated Valuation Summary
                  </h3>
                </div>

                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  NCR LIVE RATES
                </span>
              </div>

              {/* Selected Items Breakdown List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedItemsList.length > 0 ? (
                  selectedItemsList.map((item) => {
                    const itemCost = item.quantity * item.category.rate_per_kg;
                    return (
                      <div
                        key={item.category.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <strong className="text-white font-bold block truncate">
                            {getCategoryName(item.category)}
                          </strong>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {item.quantity} {item.category.unit} × ₹{item.category.rate_per_kg}/{item.category.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-amber-400">
                            ₹{itemCost.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.category.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                    <p className="font-semibold">No scrap items selected yet.</p>
                    <p className="text-[10px] text-slate-500">
                      Select items on the left or click a quick preset above.
                    </p>
                  </div>
                )}
              </div>

              {/* Total Calculation Numbers Box */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Total Estimated Quantity:</span>
                  <strong className="text-white font-bold">{totalEstimatedWeight} kg approx.</strong>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Doorstep Pickup Fee:</span>
                  <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    FREE (₹0)
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                      Net Estimated Earnings
                    </span>
                    <span className="text-2xl font-black text-amber-300">
                      ₹{totalEstimatedPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {totalEstimatedWeight >= 15 ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Free Doorstep Eligible
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded-full">
                      Add {15 - totalEstimatedWeight} kg for Free Pickup
                    </span>
                  )}
                </div>
              </div>

              {/* Environmental Savings Quick Meter */}
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Leaf className="w-3.5 h-3.5" />
                    Environmental Impact
                  </span>
                  <span>~{co2SavedKg} kg CO₂ Saved</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 font-medium leading-normal">
                  Recycling this lot prevents {totalEstimatedWeight} kg waste from entering local Haryana landfills and preserves ~{treesSaved} trees.
                </p>
              </div>

              {/* Main Booking Action Button */}
              <button
                onClick={handleTriggerBooking}
                disabled={selectedItemsList.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  selectedItemsList.length > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Schedule Doorstep Pickup With This Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-slate-500 text-center font-medium">
                * Note: Final payout is calculated during doorstep weighing with an ISO digital scale. Zero hidden deductions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
