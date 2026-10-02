import React, { useState } from 'react';
import { Booking, ScrapCategory, ScrapItemWeight } from '../../types/scrapgo';
import { useScrap } from '../../context/ScrapContext';
import {
  Scale,
  X,
  Plus,
  Trash2,
  Camera,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Banknote,
  QrCode,
  CreditCard,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DigitalScaleCalculatorProps {
  booking: Booking;
  onClose: () => void;
  onComplete: () => void;
}

export const DigitalScaleCalculator: React.FC<DigitalScaleCalculatorProps> = ({
  booking,
  onClose,
  onComplete,
}) => {
  const { categories, staffCompleteWeighing } = useScrap();

  // Initialize with the items expected from booking or defaults
  const [items, setItems] = useState<ScrapItemWeight[]>(() => {
    if (booking.items_collected && booking.items_collected.length > 0) {
      return booking.items_collected;
    }
    // Match expected categories
    const initialMatched = categories.filter((c) =>
      booking.category_ids?.includes(c.id)
    );

    if (initialMatched.length > 0) {
      return initialMatched.map((c, i) => ({
        category_id: c.id,
        category_name: c.name,
        rate_per_kg: c.rate_per_kg,
        weight_kg: i === 0 ? 15.5 : 8.0,
        subtotal: (i === 0 ? 15.5 : 8.0) * c.rate_per_kg,
      }));
    }

    const defaultCat = categories[0] || { id: 'cat-iron', name: 'Iron / Loha', rate_per_kg: 28 };
    return [
      {
        category_id: defaultCat.id,
        category_name: defaultCat.name,
        rate_per_kg: defaultCat.rate_per_kg,
        weight_kg: 20.0,
        subtotal: 20.0 * defaultCat.rate_per_kg,
      },
    ];
  });

  const [scalePhoto, setScalePhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500&auto=format&fit=crop&q=80'
  );
  const [driverNotes, setDriverNotes] = useState('Weighed on certified Omron electronic scale in customer presence.');

  const handleWeightChange = (index: number, newWeight: number) => {
    const updated = [...items];
    const item = updated[index];
    item.weight_kg = Math.max(0, newWeight);
    item.subtotal = Math.round(item.weight_kg * item.rate_per_kg);
    setItems(updated);
  };

  const handleCategoryChange = (index: number, catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const updated = [...items];
    updated[index] = {
      category_id: cat.id,
      category_name: cat.name,
      rate_per_kg: cat.rate_per_kg,
      weight_kg: updated[index].weight_kg,
      subtotal: Math.round(updated[index].weight_kg * cat.rate_per_kg),
    };
    setItems(updated);
  };

  const addItemRow = () => {
    const unusedCat =
      categories.find((c) => !items.some((i) => i.category_id === c.id)) ||
      categories[0];
    if (!unusedCat) return;

    setItems([
      ...items,
      {
        category_id: unusedCat.id,
        category_name: unusedCat.name,
        rate_per_kg: unusedCat.rate_per_kg,
        weight_kg: 5.0,
        subtotal: 5.0 * unusedCat.rate_per_kg,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalWeight = Number(
    items.reduce((sum, item) => sum + item.weight_kg, 0).toFixed(2)
  );
  const grandTotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalWeight <= 0 || grandTotalAmount <= 0) {
      alert('Total weight and scrap amount must be greater than zero.');
      return;
    }

    staffCompleteWeighing(
      booking.id,
      items,
      totalWeight,
      grandTotalAmount,
      scalePhoto || undefined,
      driverNotes
    );

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {
      // Ignore
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Scale className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Digital Scale & Scrap Bill</h3>
                <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                  {booking.booking_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Customer: {booking.customer_name} ({booking.customer_phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Digital Scale LED Banner Simulation */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Calibrated Electronic Scale Live Readout
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                  {totalWeight.toFixed(2)}
                </span>
                <span className="font-mono text-xl text-emerald-500 font-bold">KG</span>
              </div>
              <span className="text-[11px] text-slate-400">Tare: 0.00 kg • Calibration ISO-9001</span>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Total Payout Payable to Customer
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-black text-white">
                ₹{grandTotalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-400 block mt-0.5 font-semibold">
                via {booking.payout_method.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Itemized Scrap Breakdown
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 text-xs"
                >
                  {/* Category Dropdown */}
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Scrap Category
                    </label>
                    <select
                      value={item.category_id}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (₹{c.rate_per_kg}/{c.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Weight input */}
                  <div className="w-full sm:w-28">
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Weight (KG)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={item.weight_kg}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-full sm:w-28 text-right sm:text-center">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Subtotal
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Remove */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scale Photo & Verification details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Scale Photo Verification
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={scalePhoto || ''}
                  alt="Scale weight"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    ✓ Scale Display Captured
                  </span>
                  <span className="text-[10px] text-slate-500">Omron Certified Tare 0.0</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Staff / Customer Notes
              </label>
              <input
                type="text"
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="Notes regarding scrap condition..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Payout summary banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              {booking.payout_method === 'upi' ? (
                <QrCode className="w-5 h-5 text-amber-700" />
              ) : booking.payout_method === 'cash' ? (
                <Banknote className="w-5 h-5 text-amber-700" />
              ) : (
                <CreditCard className="w-5 h-5 text-amber-700" />
              )}
              <div>
                <p className="font-bold">
                  Customer Payout Mode: {booking.payout_method.toUpperCase()}
                </p>
                <p className="text-[11px] text-amber-800">
                  {booking.payout_method === 'upi'
                    ? `UPI ID: ${booking.upi_id || 'On File'}`
                    : booking.payout_method === 'bank_transfer'
                    ? `Bank A/C: ${booking.bank_details?.account_number || 'Direct Transfer'}`
                    : 'Cash to be handed directly to customer.'}
                </p>
              </div>
            </div>
            <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded text-[11px]">
              Admin Verification Required
            </span>
          </div>

          {/* Submit final button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm Bill (₹{grandTotalAmount}) & Complete Pickup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
