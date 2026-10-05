import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { Booking, ScrapCategory } from '../../types/scrapgo';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
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
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { LiveTrackingModal } from './LiveTrackingModal';
import { AiSupportDrawer } from './AiSupportDrawer';
import { BottomNavBar } from '../common/BottomNavBar';
import { AuthModal } from '../common/AuthModal';
import { CustomerAccountModal } from './CustomerAccountModal';

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
  const [showAccountModal, setShowAccountModal] = useState(false);

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

  // Strict Customer Login Check
  const isCustomerLoggedIn = Boolean(
    currentUser &&
    currentUser.role === 'customer' &&
    currentUser.id !== 'cust-guest' &&
    currentUser.phone
  );

  // Customer active & past bookings
  const myBookings = bookings.filter(
    (b) => b.customer_id === currentUser.id || (currentUser.phone && b.customer_phone === currentUser.phone)
  );
  const activeBookings = myBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const completedBookings = myBookings.filter((b) => b.status === 'completed');

  // Booking completion subtle animation state
  const [prevBookingsCount, setPrevBookingsCount] = useState<number>(myBookings.length);
  const [recentBookingSuccess, setRecentBookingSuccess] = useState<Booking | null>(null);

  useEffect(() => {
    if (myBookings.length > prevBookingsCount) {
      const latestBooking = myBookings[0] || myBookings[myBookings.length - 1];
      setRecentBookingSuccess(latestBooking);
      const timer = setTimeout(() => {
        setRecentBookingSuccess(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
    setPrevBookingsCount(myBookings.length);
  }, [myBookings.length, prevBookingsCount]);

  // Order history filter state
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled'>('all');

  const filteredHistoryBookings = myBookings.filter((b) => {
    if (historyFilter === 'completed') return b.status === 'completed';
    if (historyFilter === 'in_progress') return b.status !== 'completed' && b.status !== 'cancelled';
    if (historyFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const totalPayoutEarned = completedBookings.reduce(
    (sum, b) => sum + (b.final_amount || 0),
    0
  );

  const activeBookingsEstimate = activeBookings.reduce(
    (sum, b) =>
      sum +
      (b.final_amount ||
        (b.estimated_weight_kg ? b.estimated_weight_kg * 30 : 250)),
    0
  );

  const getOrderItemsSummary = (booking: Booking) => {
    if (booking.items_collected && booking.items_collected.length > 0) {
      return booking.items_collected.map((i) => `${i.category_name} (${i.weight_kg} kg)`).join(', ');
    }
    if (booking.expected_scrap_items) {
      return booking.expected_scrap_items;
    }
    return 'Household Scrap';
  };

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

  // Dynamic FAQ State & Fetching from Database / Supabase 'faq' table
  interface DynamicFaqItem {
    id: string;
    q: string;
    a: string;
    category?: 'pickup' | 'rates' | 'payments' | 'items' | 'safety' | string;
  }

  const defaultFaqs: DynamicFaqItem[] = [
    {
      id: 'faq-1',
      q: 'How does SCRAPGO doorstep pickup work?',
      a: 'Select your scrap items, enter your address, and choose a preferred time slot. Our verified pickup agent will arrive with an ISO-certified electronic scale, weigh your scrap in front of you, and transfer instant cash or UPI payment on the spot!',
      category: 'pickup',
    },
    {
      id: 'faq-2',
      q: 'Is there any pickup fee or delivery charge?',
      a: 'No! Doorstep pickup is 100% FREE for all orders above minimum quantity (typically 15 kg or ₹300 scrap value). Zero hidden deductions!',
      category: 'pickup',
    },
    {
      id: 'faq-3',
      q: 'How do I know the weighing scale is accurate?',
      a: 'Our pickup agents carry ISO 9001 certified tamper-proof digital electronic scales. The tare weight is set to 0.00 kg live in front of you, and an automated SMS invoice is generated immediately.',
      category: 'rates',
    },
    {
      id: 'faq-4',
      q: 'How and when do I get paid for my scrap?',
      a: 'Payment is instantaneous! As soon as weighing is finished, you receive payment via Instant UPI (Google Pay, PhonePe, Paytm, BHIM), Direct Bank Transfer (IMPS), or Cash on spot as per your choice.',
      category: 'payments',
    },
    {
      id: 'faq-5',
      q: 'What types of scrap do you accept?',
      a: 'We accept Newspapers, Books, Cardboard, Plastics (PET bottles, buckets), Metals (Iron, Brass, Copper, Aluminum, Stainless Steel), E-Waste (Laptops, Phones, Circuit boards), and Home Appliances (ACs, Fridges, Washing Machines).',
      category: 'items',
    },
    {
      id: 'faq-6',
      q: 'What is the Secret Pickup OTP and when should I share it?',
      a: 'Your 4-digit secret OTP is shown in your booking details. Share this OTP with the pickup driver ONLY when he arrives at your doorstep with the digital scale to confirm authorized collection.',
      category: 'safety',
    },
    {
      id: 'faq-7',
      q: 'Can I reschedule or cancel my pickup order?',
      a: 'Yes, absolutely! You can cancel or reschedule your pickup anytime for free directly from your active booking card or via ScrapBot AI Chatbot.',
      category: 'pickup',
    },
  ];

  const [dbFaqs, setDbFaqs] = useState<DynamicFaqItem[]>([]);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('all');
  const [faqFeedback, setFaqFeedback] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchFaqsFromSupabaseOrFirestore() {
      try {
        if (db) {
          const snapshot = await getDocs(collection(db, 'faq'));
          if (!snapshot.empty) {
            const fetched: DynamicFaqItem[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              fetched.push({
                id: doc.id,
                q: data.question || data.q || '',
                a: data.answer || data.a || '',
                category: data.category || 'pickup',
              });
            });
            if (isMounted && fetched.length > 0) {
              setDbFaqs(fetched);
            }
          }
        }
      } catch (e) {
        // Fallback to defaultFaqs gracefully
      }
    }
    fetchFaqsFromSupabaseOrFirestore();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeFaqList = dbFaqs.length > 0 ? dbFaqs : defaultFaqs;

  const filteredFaqs = activeFaqList.filter((faq) => {
    const matchesCategory = selectedFaqCategory === 'all' || faq.category === selectedFaqCategory;
    const q = faqSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-28 transition-colors">
      {/* HERO BANNER SECTION */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>YOUR EVERYDAY RECYCLING TOOLKIT</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                Less hassle. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                  More done.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0">
                Doorstep scrap pickup with ISO certified digital weighing, transparent daily market rates, and instant UPI or Cash payouts.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => handleOpenBooking()}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Truck className="w-5 h-5 text-slate-950" />
                  <span>Explore Doorstep Pickup →</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('rates-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Check Today's Rates</span>
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

            {/* Right Side: Animated Floating Neumorphic 3D Interactive Card ("hilti hui / moving elements") */}
            <div className="lg:col-span-6 relative">
              {/* Background Glowing Soft Orb */}
              <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>

              {/* Floating Decorative Sparkles & Doodles */}
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-6 left-4 z-20 hidden sm:block text-emerald-400"
              >
                <Sparkles className="w-8 h-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </motion.div>

              {/* FLOATING ANIMATED 3D NEUMORPHIC APP WINDOW CARD */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 1.2, -1.2, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="bg-[#f4f7fb] text-slate-900 rounded-3xl p-5 sm:p-6 shadow-[12px_12px_30px_rgba(0,0,0,0.35),-6px_-6px_20px_rgba(255,255,255,0.15)] border-2 border-white/60 relative z-10 space-y-4"
              >
                {/* Window Bar Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                    <span className="text-xs font-black text-slate-700 ml-2 font-mono">
                      ScrapGo Doorstep Hub ⚡
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Active
                  </span>
                </div>

                {/* 4 Soft Neumorphic Interactive Feature Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Feature 1: Scale */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleOpenBooking()}
                    className="p-3.5 rounded-2xl bg-[#f4f7fb] border border-white/90 shadow-[5px_5px_12px_rgba(166,180,200,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] text-left flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:bg-emerald-50/50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">ISO Scale Verified</strong>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">0.00 kg Live Tare</span>
                    </div>
                  </motion.button>

                  {/* Feature 2: Pickup */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleOpenBooking()}
                    className="p-3.5 rounded-2xl bg-[#f4f7fb] border border-white/90 shadow-[5px_5px_12px_rgba(166,180,200,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] text-left flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:bg-emerald-50/50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">Doorstep Pickup</strong>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Free Above 15 kg</span>
                    </div>
                  </motion.button>

                  {/* Feature 3: Instant UPI */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleOpenBooking()}
                    className="p-3.5 rounded-2xl bg-[#f4f7fb] border border-white/90 shadow-[5px_5px_12px_rgba(166,180,200,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] text-left flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:bg-emerald-50/50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">Instant Spot Cash</strong>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Spot UPI / Bank</span>
                    </div>
                  </motion.button>

                  {/* Feature 4: Live Rates */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const el = document.getElementById('rates-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-3.5 rounded-2xl bg-[#f4f7fb] border border-white/90 shadow-[5px_5px_12px_rgba(166,180,200,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] text-left flex flex-col justify-between space-y-2 cursor-pointer transition-all hover:bg-emerald-50/50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-slate-900 block">Live Market Rates</strong>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Updated Daily</span>
                    </div>
                  </motion.button>
                </div>

                {/* Instant Calculator Bar */}
                <div className="bg-[#eaf0f6] shadow-[inset_3px_3px_8px_rgba(166,180,200,0.35),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Estimated Valuation</span>
                    <span className="text-xl font-black text-emerald-700 block">
                      ₹{calculatedPayout.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(calcCategoryId)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBTLE SUCCESS ANIMATION BANNER (Framer Motion) */}
      <AnimatePresence>
        {recentBookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed top-5 left-4 right-4 max-w-xl mx-auto z-50 bg-slate-900/95 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-emerald-500/50 backdrop-blur-md"
          >
            <div className="flex items-start gap-3.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 1] }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 shrink-0 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-6 h-6" />
              </motion.div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-black text-sm text-white flex items-center gap-1.5 truncate">
                    <span>Doorstep Pickup Scheduled!</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    #{recentBookingSuccess.booking_number}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Scheduled for <strong className="text-white">{recentBookingSuccess.preferred_date}</strong> ({recentBookingSuccess.preferred_time_slot}). Pickup driver will arrive with an ISO certified scale.
                </p>

                <div className="flex items-center gap-3 pt-1.5 text-xs">
                  <span className="text-emerald-400 font-extrabold">
                    Est. Value: ₹{recentBookingSuccess.final_amount || (recentBookingSuccess.estimated_weight_kg ? recentBookingSuccess.estimated_weight_kg * 30 : 250)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTrackingBooking(recentBookingSuccess);
                      setRecentBookingSuccess(null);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Track Live Agent →
                  </button>
                </div>
              </div>

              <button
                onClick={() => setRecentBookingSuccess(null)}
                className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* FREQUENTLY ASKED QUESTIONS SECTION (DYNAMICALLY FETCHED FROM SUPABASE/DATABASE 'FAQ' TABLE) */}
      <section id="faq-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <HelpCircle className="w-4 h-4" />
            <span>Instant Help &amp; Support</span>
            {dbFaqs.length > 0 && (
              <span className="ml-1 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-extrabold">
                Database Synced
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Everything you need to know about free doorstep pickup, ISO digital scales, and instant UPI payouts.
          </p>
        </div>

        {/* Live Search & Category Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. payment, scale, rates, OTP, cancel)..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'pickup', label: '🚚 Doorstep Pickup' },
              { id: 'rates', label: '📊 Scrap Rates & Scale' },
              { id: 'payments', label: '💰 Payments & UPI' },
              { id: 'items', label: '📦 Accepted Materials' },
              { id: 'safety', label: '🔑 OTP & Safety' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFaqCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFaqCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">No matching questions found.</p>
              <p className="text-slate-400">Try searching with a different keyword or chat with ScrapBot AI Assistant.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              const feedback = faqFeedback[faq.id || idx];

              return (
                <div
                  key={faq.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:border-emerald-500/40 transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>{faq.q}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-3">
                      <p>{faq.a}</p>

                      {/* Helpful Micro-feedback */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Was this answer helpful?</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFaqFeedback((prev) => ({ ...prev, [faq.id || idx]: 'up' as const }))}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              feedback === 'up'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3 text-emerald-500" />
                            <span>Helpful</span>
                          </button>
                          <button
                            onClick={() => setFaqFeedback((prev) => ({ ...prev, [faq.id || idx]: 'down' as const }))}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              feedback === 'down'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            <ThumbsDown className="w-3 h-3 text-rose-500" />
                            <span>Needs Info</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Can't Find Answer Instant Support Card */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-900/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Still need custom assistance?</span>
            </div>
            <p className="text-xs text-slate-300">
              Our 24/7 ScrapBot AI Assistant can track your pickup, calculate rates, or escalate complaints immediately.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setAiDrawerDefaultTab('chat');
                setShowAiDrawer(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span>Ask ScrapBot AI</span>
            </button>
            <a
              href="https://wa.me/918287214705"
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
          </div>
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
        onOpenAccount={() => {
          if (isCustomerLoggedIn) {
            setShowAccountModal(true);
          } else {
            setShowAuthModal(true);
          }
        }}
      />

      {/* PROFESSIONAL FLOATING SIDE CHAT WIDGET (Neumorphic 3D Floating Action Button) */}
      {!showAiDrawer && (
        <div className="fixed bottom-26 sm:bottom-8 right-4 sm:right-8 z-40 flex items-center gap-2.5 group animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Tooltip / Prompt bubble */}
          <button
            onClick={() => {
              setAiDrawerDefaultTab('chat');
              setShowAiDrawer(true);
            }}
            className="hidden sm:flex items-center gap-2 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer hover:border-emerald-500/60 hover:scale-105 active:scale-95 group-hover:shadow-emerald-500/20"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Ask ScrapBot AI ⚡</span>
          </button>

          <button
            onClick={() => {
              setAiDrawerDefaultTab('chat');
              setShowAiDrawer(true);
            }}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_10px_25px_rgba(16,185,129,0.45)] flex items-center justify-center border-2 border-white/40 ring-4 ring-emerald-500/20 active:scale-90 transition-all cursor-pointer group"
            title="Open ScrapBot AI Support"
          >
            <Bot className="w-7 h-7 text-white group-hover:scale-110 group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-400 text-slate-950 font-black text-[9px] rounded-full border border-white shadow-xs tracking-wider">
              ONLINE
            </span>
          </button>
        </div>
      )}

      {/* MODALS AND DRAWERS */}
      {showAccountModal && (
        <CustomerAccountModal
          onClose={() => setShowAccountModal(false)}
          onOpenBooking={() => handleOpenBooking()}
          onSelectTrackingBooking={(booking) => setSelectedTrackingBooking(booking)}
          onOpenLogin={() => {
            setShowAccountModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

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
