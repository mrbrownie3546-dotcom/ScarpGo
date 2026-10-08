import React from 'react';
import { Booking } from '../../types/scrapgo';
import { useScrap } from '../../context/ScrapContext';
import {
  X,
  MapPin,
  Truck,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  KeyRound,
  Coins,
  AlertCircle,
} from 'lucide-react';

interface LiveTrackingModalProps {
  booking: Booking;
  onClose: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ booking, onClose }) => {
  const { t, language, getStatusLabel } = useScrap();
  const isEnRoute = booking.status === 'on_the_way';
  const isArrived = booking.status === 'arrived';
  const isWeighing = booking.status === 'weighing';
  const isCompleted = booking.status === 'completed';

  // Calculate percentage of journey completed for visual progress
  let progressPct = 20;
  if (booking.status === 'assigned') progressPct = 30;
  if (booking.status === 'on_the_way') {
    const remainingKm = booking.staff_distance_km ?? 2;
    progressPct = Math.min(85, Math.max(35, Math.round(100 - remainingKm * 20)));
  }
  if (booking.status === 'arrived') progressPct = 90;
  if (booking.status === 'weighing') progressPct = 95;
  if (booking.status === 'completed') progressPct = 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">{t('tracking_title', 'Live Doorstep Pickup Tracking')}</h2>
                <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-semibold">
                  {booking.booking_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Doorstep Scrap Pickup &amp; Real-time Staff GPS
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              isCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : isArrived
                ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                : isEnRoute
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isArrived
                    ? 'bg-amber-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isArrived ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <Truck className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {getStatusLabel(booking.status)}
                </p>
                <p className="text-xs opacity-80">
                  {isCompleted
                    ? `Collected ${booking.final_weight_kg ?? 0} kg • Total ₹${booking.final_amount ?? 0} disbursed`
                    : isArrived
                    ? (language === 'hindi' ? 'कृपया नीचे दिया गया 4-अंकीय ओटीपी ड्राइवर को बताएं।' : language === 'hinglish' ? 'Kripya neeche diya 4-digit OTP driver ko share karein.' : 'Please share your 4-digit verification OTP with the driver below.')
                    : isEnRoute
                    ? `Estimated arrival: ~${booking.staff_eta_minutes ?? 12} mins (${booking.staff_distance_km ?? 2.8} km away)`
                    : 'Our certified agent is preparing your collection route.'}
                </p>
              </div>
            </div>

            {/* Quick ETA Badge */}
            {isEnRoute && (
              <div className="text-right shrink-0 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs">
                <span className="text-[10px] text-blue-600 font-bold block uppercase">ETA</span>
                <span className="text-base sm:text-lg font-black text-blue-800">
                  ~{booking.staff_eta_minutes ?? 12}m
                </span>
              </div>
            )}
          </div>

          {/* Clean Step Progress Bar (No Map) */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Pickup Status</span>
                <p className="text-sm sm:text-base font-bold">{getStatusLabel(booking.status)}</p>
              </div>
              {isEnRoute && (
                <div className="text-right bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase">Est. Arrival</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">~{booking.staff_eta_minutes ?? 12} min</span>
                </div>
              )}
            </div>

            {/* Visual 4-Step Progress Tracker */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-semibold">
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    booking.status === 'pending'
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 font-extrabold shadow-md'
                      : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">1. Requested</span>
                  <span className="text-[9px] opacity-80">Order Placed</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    booking.status === 'assigned'
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 font-extrabold shadow-md'
                      : booking.status === 'on_the_way' || isArrived || isWeighing || isCompleted
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">2. Assigned</span>
                  <span className="text-[9px] opacity-80">Agent Ready</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isEnRoute || isArrived || isWeighing
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 font-extrabold shadow-md animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">3. In Progress</span>
                  <span className="text-[9px] opacity-80">Doorstep Arrival</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-400 font-extrabold shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">4. Completed</span>
                  <span className="text-[9px] opacity-80">{isCompleted ? 'Ready to Review ⭐' : 'Review Unlocks'}</span>
                </div>
              </div>

              {/* Informative Guidance Callout for Customer Review */}
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
                  isCompleted
                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isCompleted ? '⭐ Pickup Complete!' : '⏳ Status Info:'}
                  <span className="font-medium">
                    {isCompleted
                      ? 'You can now rate driver & scale accuracy in your Customer Account.'
                      : 'Customer reviews unlock automatically at Step 4 (Completed).'}
                  </span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 shrink-0">
                  {isCompleted ? 'Review Available' : 'Step ' + (booking.status === 'pending' ? '1' : booking.status === 'assigned' ? '2' : isCompleted ? '4' : '3') + '/4'}
                </span>
              </div>
            </div>
          </div>

          {/* CRITICAL PICKUP OTP BOX */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                  {t('otp_box_title', 'Customer Verification OTP')}
                </p>
                <p className="text-xs text-white/90">
                  {booking.otp_verified
                    ? (language === 'hindi' ? 'ओटीपी सफलतापूर्वक सत्यापित!' : language === 'hinglish' ? 'OTP successfully verified!' : 'OTP successfully verified with agent!')
                    : t('otp_box_desc', 'Share this 4-digit secret OTP with driver when he arrives at your door.')}
                </p>
              </div>
            </div>

            <div className="bg-white text-emerald-800 rounded-xl px-5 py-2.5 shadow-inner flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest">
                {booking.pickup_otp}
              </span>
              {booking.otp_verified ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  {language === 'hindi' ? 'सत्यापित' : 'Verified'}
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  {language === 'hindi' ? 'प्रतीक्षित' : 'Pending'}
                </span>
              )}
            </div>
          </div>

          {/* Assigned Staff Information */}
          {booking.staff_name && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt={booking.staff_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{booking.staff_name}</h4>
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                      ★ 4.9 {t('verified_driver', 'Verified Driver')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {t('vehicle_info', 'Vehicle:')} {booking.staff_vehicle || 'HR 10 AB 4921 (Mahindra Bolero)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`tel:${booking.staff_phone || '+919876543210'}`}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors w-full sm:w-auto"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('driver_phone', 'Call Driver')}</span>
                </a>
              </div>
            </div>
          )}

          {/* Itemized bill if completed */}
          {isCompleted && booking.items_collected && booking.items_collected.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Digital Scale Weighing Bill
                </h4>
                <span className="text-xs font-semibold text-emerald-700">
                  Total: {booking.final_weight_kg} kg
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {booking.items_collected.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-700">
                    <span>
                      {item.category_name} ({item.weight_kg} kg @ ₹{item.rate_per_kg}/kg)
                    </span>
                    <span className="font-semibold text-slate-900">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-emerald-900">
                    Final Payout Disbursed: ₹{booking.final_amount}
                  </span>
                  <span className="block text-[11px] text-emerald-700">
                    Paid via {booking.payout_method.toUpperCase()}{' '}
                    {booking.payout_reference ? `(Ref: ${booking.payout_reference})` : ''}
                  </span>
                </div>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Successful
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Preferred Slot: <strong>{booking.preferred_date} • {booking.preferred_time_slot}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
