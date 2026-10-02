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

          {/* Interactive Simulated GPS Map Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 h-56 sm:h-64 shadow-inner flex flex-col justify-between p-4">
            {/* Background Map Grid simulation */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, #10b981 1px, transparent 1px), radial-gradient(circle at 80% 80%, #3b82f6 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>

            {/* Simulated Road Route SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 60 180 Q 150 140 240 160 T 420 90 T 540 60"
                fill="transparent"
                stroke="#334155"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 60 180 Q 150 140 240 160 T 420 90 T 540 60"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
            </svg>

            {/* Map Top Overlay */}
            <div className="relative z-10 flex items-center justify-between text-xs text-white">
              <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-semibold">Live GPS Simulation</span>
                <span className="text-slate-400">• Sonipat Sector 14-15 Zone</span>
              </div>
              <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400 font-mono font-bold">
                {booking.staff_distance_km ? `${booking.staff_distance_km} KM` : 'At Location'}
              </div>
            </div>

            {/* Visual Markers inside Map */}
            <div className="relative z-10 flex items-center justify-between my-auto px-6">
              {/* Staff Driver Pin */}
              <div
                className="transition-all duration-1000 flex flex-col items-center"
                style={{ transform: `translateX(${Math.min(progressPct * 3.5, 320)}px)` }}
              >
                <div className="relative group">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/50 border-2 border-white animate-bounce">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-950/90 text-amber-200 text-[10px] px-2 py-0.5 rounded whitespace-nowrap font-bold">
                    {booking.staff_name || 'Driver'}
                  </span>
                </div>
              </div>

              {/* Customer Destination Pin */}
              <div className="flex flex-col items-center ml-auto">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-white">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-950/90 text-emerald-200 text-[10px] px-2 py-0.5 rounded whitespace-nowrap font-bold">
                    Your Home
                  </span>
                </div>
              </div>
            </div>

            {/* Map Bottom Stats */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-700">
              <span className="truncate max-w-[280px]">
                <strong className="text-white">To: </strong>
                {booking.pickup_address}
              </span>
              <span className="text-emerald-400 font-semibold shrink-0">
                {isCompleted ? 'Finished' : isArrived ? 'Arrived' : `ETA: ~${booking.staff_eta_minutes ?? 10} min`}
              </span>
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
