import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { Booking } from '../../types/scrapgo';
import {
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
  Star,
  MessageSquare,
  AlertCircle,
  Home,
  Edit3,
  Save,
  X,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Scale,
  DollarSign,
  ThumbsUp,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import {
  Skeleton,
  DashboardSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  CardGridSkeleton,
} from '../common/Skeleton';

interface CustomerDashboardProps {
  onBackToHome: () => void;
  onOpenBooking: () => void;
  onSelectTrackingBooking?: (booking: Booking) => void;
  onOpenLogin?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onBackToHome,
  onOpenBooking,
  onSelectTrackingBooking,
  onOpenLogin,
}) => {
  const {
    currentUser,
    setCurrentUser,
    logoutUser,
    bookings,
    getStatusLabel,
    submitPickupRating,
    cancelBookingCustomer,
  } = useScrap();

  const [activeTab, setActiveTab] = useState<'summary' | 'my_bookings' | 'active' | 'history' | 'reviews'>('my_bookings');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);

  const handleTabChange = (nextTab: 'summary' | 'my_bookings' | 'active' | 'history' | 'reviews') => {
    if (nextTab === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(nextTab);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 300);
  };
  const [copiedOtpBookingId, setCopiedOtpBookingId] = useState<string | null>(null);

  // My Bookings Search & Filter State
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelFeedbackMessage, setCancelFeedbackMessage] = useState<string | null>(null);

  // Address Editing State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddressInput, setNewAddressInput] = useState(currentUser?.address || '');
  const [addressSaveSuccess, setAddressSaveSuccess] = useState<string | null>(null);

  // Rating & Review State per booking
  const [ratingInput, setRatingInput] = useState<Record<string, number>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [reviewError, setReviewError] = useState<Record<string, string | null>>({});
  const [reviewSuccess, setReviewSuccess] = useState<Record<string, string | null>>({});

  // Popular Location Presets
  const popularLocations = [
    'Sector 14, Near Main Gate, Sonipat, Haryana',
    'Sector 15, HUDA Market, Sonipat, Haryana',
    'DLF Phase 3, Cyber City, Gurgaon, Haryana',
    'Model Town, Near Bus Stand, Rohtak, Haryana',
    'Sector 11, GT Road, Panipat, Haryana',
    'Sector 21, Faridabad, Haryana',
    'Sector 62, Noida, Delhi NCR',
  ];

  // Check if real customer is logged in
  const isRealCustomer = Boolean(
    currentUser &&
    currentUser.role === 'customer' &&
    currentUser.id !== 'cust-guest' &&
    currentUser.phone
  );

  if (!isRealCustomer) {
    return (
      <div className="min-h-screen w-full bg-[#f4f7fb] dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-md w-full text-center space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto text-4xl shadow-inner border border-emerald-200 dark:border-emerald-800">
            🔒
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Customer Login Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Please log in with your customer phone number to view your dedicated ScrapGo Dashboard, active pickup progress, earnings, and order history.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
              }}
              className="w-full bg-[#15803d] hover:bg-[#126b34] text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-700/30 transition-all active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <span>🔑 Login / Register as Customer</span>
            </button>
            <button
              onClick={onBackToHome}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to ScrapGo Homepage</span>
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
  const cancelledBookings = myBookings.filter((b) => b.status === 'cancelled');
  const ratedBookings = myBookings.filter((b) => typeof b.rating === 'number' && b.rating > 0);

  // Search and status filter for My Bookings section
  const filteredMyBookings = myBookings.filter((b) => {
    let matchesStatus = true;
    if (bookingStatusFilter === 'pending') {
      matchesStatus = b.status === 'pending';
    } else if (bookingStatusFilter === 'active') {
      matchesStatus = b.status !== 'completed' && b.status !== 'cancelled';
    } else if (bookingStatusFilter === 'completed') {
      matchesStatus = b.status === 'completed';
    } else if (bookingStatusFilter === 'cancelled') {
      matchesStatus = b.status === 'cancelled';
    }

    const q = bookingSearchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesNumber = b.booking_number?.toLowerCase().includes(q);
    const matchesItems = b.expected_scrap_items?.toLowerCase().includes(q);
    const matchesAddress = b.pickup_address?.toLowerCase().includes(q);
    const matchesDriver = b.staff_name?.toLowerCase().includes(q);

    return matchesStatus && (matchesNumber || matchesItems || matchesAddress || matchesDriver);
  });

  const handleConfirmCancelBooking = (bookingId: string) => {
    const res = cancelBookingCustomer(bookingId, cancelReasonInput || 'Customer cancelled request');
    setCancellingBookingId(null);
    setCancelReasonInput('');
    if (res.success) {
      setCancelFeedbackMessage(res.message);
      setTimeout(() => setCancelFeedbackMessage(null), 4000);
    }
  };

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

  const handleSaveAddress = () => {
    if (!newAddressInput.trim()) return;
    const updatedUser = {
      ...currentUser,
      address: newAddressInput.trim(),
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('scrapgo_auth_user_v2', JSON.stringify(updatedUser));
    setIsEditingAddress(false);
    setAddressSaveSuccess('Pickup address updated successfully!');
    setTimeout(() => setAddressSaveSuccess(null), 3000);
  };

  // Helper for status step index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'assigned':
        return 2;
      case 'journey_started':
      case 'arrived':
      case 'weighing':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f4f7fb] dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      {/* Top Navigation Header for Customer Dashboard */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Return to ScrapGo Home"
            >
              <Home className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">ScrapGo Home</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="hidden min-[400px]:block">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {currentUser?.full_name || 'Valued Customer'}
                  </h1>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  📱 {currentUser?.phone || '+91 Customer Account'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBooking}
              className="bg-gradient-to-r from-[#15803d] to-[#047857] hover:from-[#126b34] hover:to-[#035e45] text-white font-black text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden min-[480px]:inline">Schedule Pickup</span>
              <span className="min-[480px]:hidden">Book</span>
            </button>

            <button
              onClick={() => {
                logoutUser();
                onBackToHome();
              }}
              className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-start sm:justify-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => handleTabChange('summary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'summary'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📈 Summary</span>
          </button>

          <button
            onClick={() => handleTabChange('my_bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 relative shrink-0 ${
              activeTab === 'my_bookings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>📦 My Bookings ({myBookings.length})</span>
            {activeBookings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>⭐ Rate & My Reviews ({ratedBookings.length})</span>
          </button>
        </div>

        {isTabLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* TAB 1: SUMMARY & ACCOUNT SETTINGS */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Cash Earned</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold">
                    ₹
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">₹{totalPayoutEarned}</div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">Instant Digital UPI & Cash</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Active Requests</span>
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-sky-600 dark:text-sky-400">{activeBookings.length}</div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">
                    {activeBookings.length > 0 ? 'Doorstep pickup in progress' : 'No active pending orders'}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Completed Pickups</span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{completedBookings.length}</div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">Digital Scale Verified</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Est. Pending Valuation</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-400">₹{activeBookingsEstimate}</div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">Estimated Valuation</p>
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-black">Sell More Scrap & Earn Cash Today 💵</h3>
                <p className="text-xs text-emerald-100">Free doorstep pickup with digital weighing scales across Haryana & Sonipat.</p>
              </div>
              <button
                onClick={onOpenBooking}
                className="bg-white hover:bg-emerald-50 text-emerald-900 font-black px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer text-xs shrink-0 active:scale-95"
              >
                + Schedule Doorstep Pickup Now
              </button>
            </div>

            {/* Pickup Address & Account Settings Section with EDIT LOCATION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Pickup Address & Account Settings
                  </h3>
                </div>
                {!isEditingAddress && (
                  <button
                    onClick={() => {
                      setNewAddressInput(currentUser?.address || '');
                      setIsEditingAddress(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Location</span>
                  </button>
                )}
              </div>

              {addressSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{addressSaveSuccess}</span>
                </div>
              )}

              {/* Address Content OR Edit Form */}
              {isEditingAddress ? (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Enter New Default Pickup Address:
                    </label>
                    <button
                      onClick={() => setIsEditingAddress(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={newAddressInput}
                    onChange={(e) => setNewAddressInput(e.target.value)}
                    placeholder="E.g. House No. 42, Sector 14, Near Main Gate, Sonipat, Haryana"
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />

                  {/* Location Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Quick Location Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {popularLocations.map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewAddressInput(loc)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        >
                          📍 {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingAddress(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      disabled={!newAddressInput.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save New Location</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Default Pickup Address</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                      {currentUser?.address || 'Near Main Gate, Sector 14, City Center, Sonipat, Haryana'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registered Phone OTP</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white pt-1 font-mono">
                      {currentUser?.phone || '+91 9812345678'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS SECTION (Unified Past & Pending Scrap Pickup Requests) */}
        {activeTab === 'my_bookings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Status Filter Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Input Box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Booking #, items, driver, address..."
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-8 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {bookingSearchQuery && (
                    <button
                      onClick={() => setBookingSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sub-Filter Status Pills */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none text-xs pb-1 md:pb-0">
                  <button
                    onClick={() => setBookingStatusFilter('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      bookingStatusFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All ({myBookings.length})
                  </button>

                  <button
                    onClick={() => setBookingStatusFilter('active')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      bookingStatusFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Pending &amp; Active ({activeBookings.length})</span>
                  </button>

                  <button
                    onClick={() => setBookingStatusFilter('completed')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      bookingStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Completed ({completedBookings.length})</span>
                  </button>

                  <button
                    onClick={() => setBookingStatusFilter('cancelled')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      bookingStatusFilter === 'cancelled'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cancelled ({cancelledBookings.length})</span>
                  </button>
                </div>
              </div>

              {/* Feedback Banner */}
              {cancelFeedbackMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cancelFeedbackMessage}</span>
                </div>
              )}
            </div>

            {/* List of Filtered Customer Bookings */}
            {filteredMyBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  📦
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  No Scrap Pickup Requests Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {bookingSearchQuery
                    ? `No pickup records matched your search query "${bookingSearchQuery}".`
                    : 'You have no pickup requests under this category. Schedule a doorstep pickup to recycle your household or business scrap.'}
                </p>
                <button
                  onClick={onOpenBooking}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  + Schedule New Doorstep Pickup
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredMyBookings.map((booking) => {
                  const currentStepIdx = getStepIndex(booking.status);
                  const demoOtpCode = booking.pickup_otp || '----';
                  const isActive = booking.status !== 'completed' && booking.status !== 'cancelled';

                  return (
                    <div
                      key={booking.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5"
                    >
                      {/* Card Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                            #{booking.booking_number}
                          </span>

                          {/* Status Pill */}
                          {booking.status === 'pending' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Pending Assignment</span>
                            </span>
                          )}

                          {booking.status === 'assigned' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-sky-600" />
                              <span>Driver Assigned</span>
                            </span>
                          )}

                          {booking.status === 'on_the_way' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-400 flex items-center gap-1.5">
                              <Navigation className="w-3.5 h-3.5 text-sky-600 animate-bounce" />
                              <span>Driver En Route 📍</span>
                            </span>
                          )}

                          {booking.status === 'arrived' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Driver Arrived</span>
                            </span>
                          )}

                          {booking.status === 'weighing' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-purple-600" />
                              <span>Weighing Scale Active</span>
                            </span>
                          )}

                          {booking.status === 'completed' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Completed ✅</span>
                            </span>
                          )}

                          {booking.status === 'cancelled' && (
                            <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancelled</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-bold text-slate-400">
                          Requested on: {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </span>
                      </div>

                      {/* DOORSTEP OTP DISPLAY BANNER (For Active/In-Progress Pickups) */}
                      {isActive && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-black text-sm shrink-0">
                              🔑
                            </div>
                            <div>
                              <span className="font-extrabold block">
                                Doorstep Verification OTP: <strong className="text-base font-black tracking-widest text-amber-800 dark:text-amber-300 font-mono ml-1">{demoOtpCode}</strong>
                              </span>
                              <span className="text-[11px] text-amber-700 dark:text-amber-300/80 block font-medium">
                                Share this 4-digit OTP with driver when they arrive to verify doorstep pickup.
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyOtp(booking.id, demoOtpCode)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:bg-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                          >
                            {copiedOtpBookingId === booking.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy OTP</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* STEP-BY-STEP PROGRESS TRACKER (For Active Pickups) */}
                      {isActive && (
                        <div className="space-y-2 pt-1">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Pickup Progress Tracker
                          </h4>
                          <div className="grid grid-cols-4 gap-2 relative pt-1">
                            <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
                            <div
                              className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                              style={{ width: `${((currentStepIdx - 1) / 3) * 100}%` }}
                            />

                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStepIdx >= 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                1
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Requested</span>
                            </div>

                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStepIdx >= 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                2
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Assigned</span>
                            </div>

                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStepIdx >= 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                3
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">En Route</span>
                            </div>

                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStepIdx >= 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                4
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Completed</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pickup Info & Driver Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="space-y-1.5">
                          <div>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                              📅 Scheduled Time Slot:
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {booking.preferred_date} ({booking.preferred_time_slot})
                            </p>
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                              📍 Pickup Address:
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {booking.pickup_address} {booking.pickup_landmark ? `(Landmark: ${booking.pickup_landmark})` : ''}
                            </p>
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                              📦 Scrap Items:
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {booking.expected_scrap_items || 'Newspaper, Loha, Plastics'} (~{booking.estimated_weight_kg || 20} kg)
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                              👨‍✈️ Assigned Driver:
                            </span>
                            {booking.staff_name ? (
                              <div className="flex items-center gap-2.5 mt-1">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                                  {booking.staff_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-black text-slate-800 dark:text-slate-200">
                                    {booking.staff_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-bold">
                                    {booking.staff_vehicle || 'Mahindra Bolero Pickup'} • {booking.staff_phone || '+91 Driver Contact'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="font-bold text-slate-500 mt-1 italic">
                                Nearest driver assigning soon...
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                              💳 Preferred Payout Mode:
                            </span>
                            <p className="font-bold text-[#15803d] dark:text-emerald-400 capitalize">
                              {booking.payout_method === 'upi' ? `Instant UPI (${booking.upi_id || 'On Spot QR'})` : booking.payout_method === 'cash' ? 'Spot Cash on Delivery' : 'Bank Transfer'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COMPLETED DIGITAL SCALE RECEIPT SUMMARY */}
                      {booking.status === 'completed' && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                              Verified Digital Scale Receipt
                            </span>
                            <p className="font-bold text-slate-700 dark:text-slate-300">
                              Total Scrap Weight Collected: <strong>{booking.final_weight_kg || booking.estimated_weight_kg || 25} kg</strong>
                            </p>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              ISO Certified Scale • Zero Hidden Deductions
                            </span>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                              Total Payout Received
                            </span>
                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                              ₹{booking.final_amount || 450}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CARD ACTIONS ROW */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Live Driver Tracking */}
                          {isActive && onSelectTrackingBooking && (
                            <button
                              onClick={() => onSelectTrackingBooking(booking)}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Track Agent Live 📍</span>
                            </button>
                          )}

                          {/* Rate Pickup Button */}
                          {booking.status === 'completed' && (
                            <button
                              onClick={() => setActiveTab('reviews')}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Star className="w-3.5 h-3.5 fill-slate-950" />
                              <span>{booking.rating ? `Rated (${booking.rating}★)` : 'Rate Driver'}</span>
                            </button>
                          )}
                        </div>

                        {/* Cancel Request (For Pending / Unfulfilled Bookings) */}
                        {booking.status === 'pending' && (
                          <div className="shrink-0">
                            {cancellingBookingId === booking.id ? (
                              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                                <input
                                  type="text"
                                  placeholder="Reason for cancellation..."
                                  value={cancelReasonInput}
                                  onChange={(e) => setCancelReasonInput(e.target.value)}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleConfirmCancelBooking(booking.id)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                >
                                  Confirm Cancel
                                </button>
                                <button
                                  onClick={() => setCancellingBookingId(null)}
                                  className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCancellingBookingId(booking.id)}
                                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel Request</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RATE PICKUP & MY REVIEWS SECTION */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* SECTION 1: RATE PENDING COMPLETED PICKUPS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Rate Recent Pickups
                </h3>
              </div>

              {completedBookings.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No completed pickups available to rate yet.</p>
              ) : (
                <div className="space-y-6">
                  {completedBookings.map((booking) => {
                    const currentRating = ratingInput[booking.id] || booking.rating || 5;
                    const currentComment = commentInput[booking.id] !== undefined ? commentInput[booking.id] : (booking.review_comment || '');

                    return (
                      <div
                        key={booking.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                              #{booking.booking_number}
                            </span>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Driver: {booking.staff_name || 'Vikram Singh'} ({booking.preferred_date})
                            </p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            ₹{booking.final_amount || 300} Paid
                          </span>
                        </div>

                        {/* Star Rating selector */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Your Rating:</label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingInput({ ...ratingInput, [booking.id]: star })}
                                className="p-1 transition-transform hover:scale-110 cursor-pointer"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= currentRating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 ml-2">
                              {currentRating}.0 / 5.0
                            </span>
                          </div>
                        </div>

                        {/* Review text input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Feedback Comment:</label>
                          <textarea
                            rows={2}
                            value={currentComment}
                            onChange={(e) => setCommentInput({ ...commentInput, [booking.id]: e.target.value })}
                            placeholder="Write your feedback about driver punctuality, weighing accuracy..."
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {reviewSuccess[booking.id] && (
                          <p className="text-xs font-bold text-emerald-600">{reviewSuccess[booking.id]}</p>
                        )}

                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              const res = submitPickupRating(booking.id, currentRating, currentComment);
                              if (res.success) {
                                setReviewSuccess({ ...reviewSuccess, [booking.id]: 'Rating & Review saved successfully! ⭐' });
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            Submit Rating & Review
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: MY REVIEWS SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  My Submitted Reviews
                </h3>
              </div>

              {ratedBookings.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-500 italic">No reviews submitted yet.</p>
                  <p className="text-[11px] text-slate-400">Your past ratings and feedback will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (b.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-black text-amber-600 ml-1">
                            {b.rating}.0
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{b.booking_number}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium italic">
                        "{b.review_comment || 'Excellent doorstep pickup service! Driver was on time and weighed everything transparently on the digital scale.'}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                        <span>Driver: {b.staff_name || 'Vikram Singh'}</span>
                        <span>Date: {b.preferred_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
