import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { Booking, ScrapCategory } from '../../types/scrapgo';
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Search,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Bot,
  Leaf,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
  Zap,
  TrendingUp,
  CreditCard,
  QrCode,
  Award,
  Users,
  Building2,
  Navigation,
  FileText,
  User,
  ExternalLink,
  Info,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { LiveTrackingModal } from './LiveTrackingModal';
import { AiSupportDrawer } from './AiSupportDrawer';
import { BottomNavBar } from '../common/BottomNavBar';
import { AuthModal } from '../common/AuthModal';

export const CustomerHome: React.FC = () => {
  const {
    categories,
    bookings,
    currentUser,
    serviceAreas,
    language,
    t,
    getCategoryName,
    getCategoryDesc,
    getStatusLabel,
  } = useScrap();

  // Modals & Drawers state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<Booking | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiDrawerDefaultTab, setAiDrawerDefaultTab] = useState<'chat' | 'complaint' | 'history'>('chat');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search & Filter state for Scrap Rates
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Calculator State
  const [calcCategoryId, setCalcCategoryId] = useState<string>('cat-iron');
  const [calcWeight, setCalcWeight] = useState<number>(25);

  // Eco Calculator State
  const [ecoScrapKg, setEcoScrapKg] = useState<number>(50);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Copy OTP state
  const [copiedOtpBookingId, setCopiedOtpBookingId] = useState<string | null>(null);

  // Customer active bookings
  const myBookings = bookings.filter((b) => b.customer_id === currentUser.id);
  const activeBookings = myBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const completedBookings = myBookings.filter((b) => b.status === 'completed');

  // Handlers
  const handleOpenBooking = (catId?: string) => {
    setPreselectedCategoryId(catId);
    setShowBookingModal(true);
  };

  const handleCopyOtp = (bookingId: string, otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtpBookingId(bookingId);
    setTimeout(() => setCopiedOtpBookingId(null), 2000);
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesType = selectedTypeFilter === 'all' || cat.category_type === selectedTypeFilter;
    const catName = getCategoryName(cat).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = catName.includes(query) || cat.description.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  const selectedCalcCategory = categories.find((c) => c.id === calcCategoryId) || categories[0];
  const calculatedPayout = selectedCalcCategory ? selectedCalcCategory.rate_per_kg * calcWeight : 0;

  // Environmental impact calculations (approximate benchmarks)
  const co2SavedKg = Math.round(ecoScrapKg * 1.8);
  const treesSaved = (ecoScrapKg * 0.08).toFixed(1);
  const waterSavedLiters = Math.round(ecoScrapKg * 22);

  const faqs = [
    {
      q: 'How does SCRAPGO doorstep pickup work?',
      a: 'Select your scrap items, enter your address, and choose a time slot. Our verified pickup agent will arrive with a certified digital weighing scale, measure your scrap in front of you, and transfer instant cash/UPI payment!',
    },
    {
      q: 'Is there any pickup fee or delivery charge?',
      a: 'No! Doorstep pickup is 100% FREE for all orders above minimum estimated quantity (typically 15 kg or ₹300 value).',
    },
    {
      q: 'How do I know the weighing scale is accurate?',
      a: 'Our pickup agents carry ISO 9001 certified tamper-proof digital scales. You can verify the reading live on screen, and a photo of the scale is attached to your digital bill.',
    },
    {
      q: 'How and when do I get paid for my scrap?',
      a: 'Payment is instantaneous! As soon as weighing is finished, you receive payment via UPI (Google Pay, PhonePe, Paytm, BHIM) or Cash on the spot as per your selected choice.',
    },
    {
      q: 'What types of scrap do you accept?',
      a: 'We accept Newspaper, Books, Cardboard, Plastics (PET bottles, buckets), Metals (Iron, Brass, Copper, Aluminum), E-Waste (Laptops, Phones, Circuit boards), and Home Appliances (ACs, Fridges, Washing Machines).',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-28 transition-colors">
      {/* HERO BANNER SECTION */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>#1 Scrap Recycling Platform in India</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Turn Your Junk Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">Instant Cash</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Doorstep scrap pickup with ISO certified digital weighing, transparent daily rates, and instant UPI or Cash payment.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => handleOpenBooking()}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Truck className="w-5 h-5 text-slate-950" />
                  <span>Book Free Pickup Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('rates-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Check Today's Rates</span>
                </button>

                <button
                  onClick={() => {
                    setAiDrawerDefaultTab('chat');
                    setShowAiDrawer(true);
                  }}
                  className="px-4 py-3.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-teal-400" />
                  <span>Ask ScrapBot</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Digital Scale Verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant UPI Transfer</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Zero Pickup Fee</span>
                </div>
              </div>
            </div>

            {/* Right Card: Quick Rate Estimator */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Instant Earnings Calculator</h3>
                      <p className="text-[11px] text-slate-400">Estimate money you will earn today</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    Live Rates
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Select Scrap Item
                    </label>
                    <select
                      value={calcCategoryId}
                      onChange={(e) => setCalcCategoryId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {getCategoryName(cat)} — ₹{cat.rate_per_kg}/{cat.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Estimated Quantity ({selectedCalcCategory?.unit || 'kg'})</span>
                      <span className="text-emerald-400 font-bold">{calcWeight} {selectedCalcCategory?.unit || 'kg'}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>5 kg</span>
                      <span>50 kg</span>
                      <span>100 kg</span>
                      <span>200 kg</span>
                    </div>
                  </div>

                  <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-300 font-medium block">Estimated Earnings</span>
                      <span className="text-2xl font-black text-emerald-400">
                        ₹{calculatedPayout.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenBooking(calcCategoryId)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <span>Book Pickup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE BOOKINGS SECTION */}
      {activeBookings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Active Doorstep Pickup Requests ({activeBookings.length})
                </h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Real-time Tracking
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {activeBookings.map((b) => {
                const isAssigned = b.status === 'assigned' || b.status === 'on_the_way' || b.status === 'arrived' || b.status === 'weighing';
                return (
                  <div
                    key={b.id}
                    className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3 relative hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
                            {b.booking_number}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 mt-1">
                          📍 {b.pickup_address}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        {getStatusLabel(b.status)}
                      </span>
                    </div>

                    {/* Secret Pickup OTP Display */}
                    <div className="bg-emerald-900/10 dark:bg-emerald-950/50 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Share Secret OTP with Pickup Agent:
                        </span>
                        <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest">
                          {b.pickup_otp}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyOtp(b.id, b.pickup_otp)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
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

                    {/* Driver details if assigned */}
                    {isAssigned && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                            {b.staff_name ? b.staff_name[0] : 'D'}
                          </div>
                          <div>
                            <span className="font-bold block">{b.staff_name || 'Driver Assigned'}</span>
                            <span className="text-[10px] text-slate-500">{b.staff_vehicle || 'Bolero Pickup'}</span>
                          </div>
                        </div>

                        {b.staff_phone && (
                          <a
                            href={`tel:${b.staff_phone}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedTrackingBooking(b)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Live Track Driver & Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SCRAP CATEGORIES & TODAY'S RATES SECTION */}
      <section id="rates-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Verified Market Rate Card</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              Today's Scrap Buying Rates <span className="whitespace-nowrap text-emerald-600 dark:text-emerald-400 text-xl sm:text-2xl">(₹/kg)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Updated daily based on regional mandi market indexes. No hidden deductions!
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search newspaper, iron, AC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'paper', label: '📄 Paper & Books' },
            { id: 'metal', label: '⚙️ Metals' },
            { id: 'plastic', label: '🥤 Plastics' },
            { id: 'e-waste', label: '💻 E-Waste' },
            { id: 'appliance', label: '🔌 Appliances' },
            { id: 'vehicle', label: '🚗 Vehicles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Rate Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
                    {cat.category_type === 'paper' && '📄'}
                    {cat.category_type === 'metal' && '⚙️'}
                    {cat.category_type === 'plastic' && '🥤'}
                    {cat.category_type === 'e-waste' && '💻'}
                    {cat.category_type === 'appliance' && '🔌'}
                    {cat.category_type === 'vehicle' && '🚗'}
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{cat.rate_per_kg}
                    </span>
                    <span className="text-xs text-slate-400 font-bold block">
                      per {cat.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition-colors">
                    {getCategoryName(cat)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {getCategoryDesc(cat)}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Min {cat.min_weight_kg || 10} {cat.unit}
                </span>

                <button
                  onClick={() => handleOpenBooking(cat.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Sell This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-slate-900 text-white py-14 my-10 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              How SCRAPGO Doorstep Pickup Works
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Hassle-free recycling right from your home, apartment, or office.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Check Rates & Items',
                desc: 'Browse our live daily rate list or calculate your earnings using our instant calculator.',
                icon: Calculator,
              },
              {
                step: '02',
                title: 'Schedule Pickup Slot',
                desc: 'Choose your preferred date, time slot, and address. Enter expected scrap details.',
                icon: Calendar,
              },
              {
                step: '03',
                title: 'Free Doorstep Weighing',
                desc: 'Our agent arrives at your door with an ISO certified digital weighing scale.',
                icon: Truck,
              },
              {
                step: '04',
                title: 'Instant Cash or UPI',
                desc: 'Receive instant payment directly into your UPI account or cash before agent leaves.',
                icon: CreditCard,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono font-black text-2xl text-slate-600">{s.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GREEN ENVIRONMENTAL IMPACT CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-emerald-500/30">
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>Environmental Savings Meter</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Your Recycling Makes a Real Difference 🌱
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                By selling scrap to certified recyclers instead of sending it to landfills, you help reduce carbon emissions and conserve natural resources.
              </p>

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-200 block mb-2">
                  Total Scrap Sold / Recycled ({ecoScrapKg} kg)
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={ecoScrapKg}
                  onChange={(e) => setEcoScrapKg(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-2.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-3 gap-3">
              <div className="bg-slate-900/80 backdrop-blur-xs rounded-2xl p-4 border border-emerald-500/30 text-center space-y-1">
                <div className="text-emerald-400 text-2xl sm:text-3xl font-black">{co2SavedKg} kg</div>
                <div className="text-[11px] font-bold text-slate-300">CO₂ Emissions Saved</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xs rounded-2xl p-4 border border-emerald-500/30 text-center space-y-1">
                <div className="text-emerald-400 text-2xl sm:text-3xl font-black">{treesSaved}</div>
                <div className="text-[11px] font-bold text-slate-300">Trees Preserved</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xs rounded-2xl p-4 border border-emerald-500/30 text-center space-y-1">
                <div className="text-emerald-400 text-2xl sm:text-3xl font-black">{waterSavedLiters} L</div>
                <div className="text-[11px] font-bold text-slate-300">Water Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE AREAS & COVERAGE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Active Service Hubs &amp; Coverage
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We provide doorstep pickup across all major sectors and pincodes.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {serviceAreas.filter((a) => a.is_active).length} Hubs Online
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {serviceAreas.map((area) => (
            <div
              key={area.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{area.area_name}, {area.city} ({area.pincode})</span>
            </div>
          ))}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
              SG
            </div>
            <span className="font-bold text-white text-sm">SCRAPGO India</span>
            <span className="text-slate-500">| Certified Recycling Portal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => {
                setAiDrawerDefaultTab('chat');
                setShowAiDrawer(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              24/7 AI Support
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setAiDrawerDefaultTab('complaint');
                setShowAiDrawer(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Register Complaint
            </button>
            <span>•</span>
            <a href="tel:18001237272" className="hover:text-white transition-colors">
              Helpline Number
            </a>
          </div>

          <div className="text-[11px] text-slate-500">
            © 2026 SCRAPGO Recycling Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* BOTTOM NAV BAR */}
      <BottomNavBar
        onOpenBooking={() => handleOpenBooking()}
        onOpenRates={() => {
          const el = document.getElementById('rates-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenChat={() => {
          setAiDrawerDefaultTab('chat');
          setShowAiDrawer(true);
        }}
        onOpenAccount={() => setShowAuthModal(true)}
      />

      {/* MODALS AND DRAWERS */}
      {showBookingModal && (
        <BookingModal
          onClose={() => setShowBookingModal(false)}
          preselectedCategoryId={preselectedCategoryId}
        />
      )}

      {selectedTrackingBooking && (
        <LiveTrackingModal
          booking={selectedTrackingBooking}
          onClose={() => setSelectedTrackingBooking(null)}
        />
      )}

      {showAiDrawer && (
        <AiSupportDrawer
          onClose={() => setShowAiDrawer(false)}
          defaultTab={aiDrawerDefaultTab}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialRole="customer"
          allowedRoles={['customer', 'staff', 'admin']}
        />
      )}
    </div>
  );
};
