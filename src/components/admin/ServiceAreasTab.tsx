import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { ServiceArea } from '../../types/scrapgo';
import { MapPin, Plus, Trash2, CheckCircle2, Search, Building2 } from 'lucide-react';

export const ServiceAreasTab: React.FC = () => {
  const { serviceAreas, addServiceArea } = useScrap();

  const [localAreas, setLocalAreas] = useState<ServiceArea[]>(() => [...serviceAreas]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [areaName, setAreaName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Haryana');
  const [pincode, setPincode] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredAreas = localAreas.filter((a) => {
    const matchesSearch =
      a.area_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pincode.includes(searchTerm);
    const matchesCity = cityFilter === 'all' || a.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set(localAreas.map((a) => a.city)));

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim() || !city.trim() || !pincode.trim()) return;

    const newArea: ServiceArea = {
      id: `area-${Date.now()}`,
      area_name: areaName,
      city,
      state: state || 'Haryana',
      pincode,
      is_active: true,
    };

    addServiceArea({
      area_name: areaName,
      city,
      state: state || 'Haryana',
      pincode,
      is_active: true,
    });

    setLocalAreas((prev) => [newArea, ...prev]);

    setShowAddModal(false);
    setAreaName('');
    setCity('');
    setPincode('');
    showFeedback(`Service locality "${areaName}" added successfully!`);
  };

  const toggleArea = (id: string) => {
    setLocalAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
  };

  const deleteArea = (id: string) => {
    setLocalAreas((prev) => prev.filter((a) => a.id !== id));
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
            <MapPin className="w-5 h-5 text-emerald-600" />
            Service Areas & Locality Logistics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage cities, localities, and pincodes where doorstep scrap pickup drivers operate.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Location</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search area, city or pincode..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Cities ({uniqueCities.length})</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Service Areas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAreas.map((area) => (
          <div
            key={area.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all shadow-xs ${
              area.is_active
                ? 'border-slate-200 dark:border-slate-800'
                : 'border-rose-200 dark:border-rose-950 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Pincode: {area.pincode}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {area.area_name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {area.city}, {area.state}
                </p>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  area.is_active
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {area.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  toggleArea(area.id);
                  showFeedback(`Locality "${area.area_name}" status updated.`);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  area.is_active
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {area.is_active ? 'Disable Area' : 'Enable Area'}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Remove ${area.area_name} from active service locations?`)) {
                    deleteArea(area.id);
                    showFeedback(`Deleted locality ${area.area_name}.`);
                  }
                }}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Delete Location"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Area Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Add New Service Locality
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddArea} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Locality / Sector Name</label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Sector 14, Model Town, Rohini"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Sonipat, Delhi"
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 131001"
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Haryana, Delhi NCR"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
              >
                Save & Enable Service Area
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
