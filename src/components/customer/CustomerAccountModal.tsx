import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { Booking } from '../../types/scrapgo';
import {
  X,
  User,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Zap,
  TrendingUp,
  Copy,
  Check,
  LogOut,
  Navigation,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CustomerAccountModalProps {
  onClose: () => void;
  onOpenBooking: () => void;
  onSelectTrackingBooking: (booking: Booking) => void;
  onOpenLogin?: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  onClose,
  onOpenBooking,
  onSelectTrackingBooking,
  onOpenLogin,
}) => {
  const { currentUser, logoutUser, bookings, getStatusLabel } = useScrap();

  const [copiedOtpBookingId, setCopiedOtpBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'active' | 'history'>('summary');

  // Strict check: Must be a real logged in customer (not admin, staff, or guest)
  const isRealCustomer = Boolean(
    currentUser &&
    currentUser.role === 'customer' &&
    currentUser.id !== 'cust-guest' &&
    currentUser.phone
  );

  if (!isRealCustomer) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 max-w-md w-full text-center space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🔒
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Customer Login Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Pehle apna customer mobile number login karein tabhi aap apne active pickups, earnings, or booking history dekh sakte hain.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenLogin) onOpenLogin();
              }}
              className="w-full bg-[#15803d] hover:bg-[#126b34] text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer text-sm"
            >
              🔑 Login / Register as Customer
            </button>
            <button
              onClick={onClose}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter bookings for logged-in customer
  const myBookings = bookings.filter(
    (b) =>
      b.customer_id === currentUser.id ||
      (currentUser.phone && b.customer_phone === currentUser.phone)
  );

  const activeBookings = myBookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  );
  const completedBookings = myBookings.filter((b) => b.status === 'completed');

  const totalPayoutEarned = completedBookings.reduce(
    (sum, b) => sum + (b.final_amount || (b.estimated_weight_kg ? b.estimated_weight_kg * 30 : 200)),
    0
  );

  const activeBookingsEstimate = activeBookings.reduce(
    (sum, b) => sum + (b.estimated_weight_kg ? b.estimated_weight_kg * 30 : 250),
    0
  );

  const handleCopyOtp = (bookingId: string, otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtpBookingId(bookingId);
    setTimeout(() => setCopiedOtpBookingId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[#f4f7fb] dark:bg-slate-900 rounded-[32px] w-full max-w-3xl overflow-hidden shadow-[12px_12px_35px_rgba(166,180,200,0.4),-12px_-12px_35px_rgba(255,255,255,0.95)] dark:shadow-[12px_12px_35px_rgba(0,0,0,0.6),-12px_-12px_35px_rgba(30,41,59,0.5)] border border-white/80 dark:border-slate-800 my-auto flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="bg-[#eaf0f6] dark:bg-slate-800/80 p-5 sm:p-6 border-b border-white/80 dark:border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentUser?.full_name || 'Valued Customer'}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>📱 {currentUser?.phone || '+91 Customer Account'}</span>
                {currentUser?.email && <span>• {currentUser.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900 p-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Earnings & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Active Requests ({activeBookings.length})</span>
            {activeBookings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Past History ({completedBookings.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* RECYCLING SUMMARY & EARNINGS CARD */}
              <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-[6px_6px_20px_rgba(166,180,200,0.3),-6px_-6px_20px_rgba(255,255,255,0.9)] dark:shadow-none border border-white dark:border-slate-700 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Recycling Summary & Earnings
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                          LIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Overview of your doorstep pickup orders and total cash received
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenBooking();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Schedule Pickup</span>
                  </button>
                </div>

                {/* 4 Stats Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Stat 1: Total Earned */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Cash Earned</span>
                      <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                        <CreditCard className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight block">
                        ₹{totalPayoutEarned.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-300/80 block mt-0.5">
                        Instant UPI / Cash Payouts
                      </span>
                    </div>
                  </div>

                  {/* Stat 2: Active Pickups */}
                  <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Active Requests</span>
                      <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 relative">
                        <Truck className="w-4 h-4" />
                        {activeBookings.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 absolute -top-0.5 -right-0.5 animate-ping"></span>
                        )}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 tracking-tight">
                          {activeBookings.length}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                          {activeBookings.length === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-800/80 dark:text-blue-300/80 block mt-0.5 truncate">
                        {activeBookings.length > 0 ? 'Agent Assigned / En Route' : 'No Pending Orders'}
                      </span>
                    </div>
                  </div>

                  {/* Stat 3: Completed Orders */}
                  <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Completed Pickups</span>
                      <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400 tracking-tight">
                          {completedBookings.length}
                        </span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300">
                          {completedBookings.length === 1 ? 'Pickup' : 'Pickups'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-800/80 dark:text-purple-300/80 block mt-0.5 truncate">
                        Digital Scale Verified
                      </span>
                    </div>
                  </div>

                  {/* Stat 4: Est. Pending Value */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Est. Pending Value</span>
                      <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300">
                        <Zap className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tight block">
                        ₹{activeBookingsEstimate.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-300/80 block mt-0.5 truncate">
                        {activeBookings.length > 0 ? 'Collectable on Arrival' : 'Estimated Valuation'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Card */}
              <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Pickup Address & Account Settings
                </h4>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Default Pickup Address:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      📍 {currentUser?.address || 'Near Main Gate, Sector 14, City Center'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Registered Phone OTP:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      📞 {currentUser?.phone || '+91 98287 21470'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Active Doorstep Pickup Orders ({activeBookings.length})</span>
                </h3>

                <button
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Order</span>
                </button>
              </div>

              {activeBookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center space-y-3 border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                    <Truck className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Active Pickup Orders
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You don't have any ongoing scrap pickup requests right now. Schedule a pickup to sell your household or commercial scrap!
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBooking();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Pickup Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeBookings.map((b) => {
                    const isAssigned =
                      b.status === 'assigned' ||
                      b.status === 'on_the_way' ||
                      b.status === 'arrived' ||
                      b.status === 'weighing';
                    return (
                      <div
                        key={b.id}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                              {b.booking_number}
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 mt-1">
                              📍 {b.pickup_address}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            {getStatusLabel(b.status)}
                          </span>
                        </div>

                        {/* Secret OTP Display */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Share OTP with Pickup Driver:
                            </span>
                            <div className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-widest">
                              {b.pickup_otp}
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyOtp(b.id, b.pickup_otp)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {copiedOtpBookingId === b.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy OTP</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onSelectTrackingBooking(b);
                          }}
                          className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Track Driver & Live Status</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completed Pickup Orders ({completedBookings.length})</span>
              </h3>

              {completedBookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center space-y-2 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">No completed pickup history found yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {b.booking_number}
                        </span>
                        <span className="text-slate-400 ml-2">
                          {new Date(b.created_at).toLocaleDateString()}
                        </span>
                        <p className="text-slate-500 mt-0.5 line-clamp-1">{b.pickup_address}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                          +₹{b.final_amount || 250}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          Paid via UPI / Cash
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
