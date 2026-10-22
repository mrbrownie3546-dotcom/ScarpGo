import React, { useState, useEffect, useRef } from 'react';
import scrapgoLogo from '../../assets/scrapgo-logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { Booking, ScrapCategory } from '../../types/scrapgo';
import { db } from '../../lib/firebase';
import { normalizePhoneDigits, phoneHashForBooking } from '../../lib/trackingPhone';
import { getMyBookings, saveMyBooking, clearMyBookings, MyBooking } from '../../lib/myBookings';
import { consumeTrackTokenFromUrl } from '../../lib/trackLinks';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import confetti from 'canvas-confetti';
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
  X,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { LiveTrackingModal } from './LiveTrackingModal';
import { AiSupportDrawer } from './AiSupportDrawer';
import { BottomNavBar } from '../common/BottomNavBar';
import { ScrapPriceEstimator } from './ScrapPriceEstimator';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';
import { getPayoutMethodLabel } from '../../i18n/translations';

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
    systemSettings,
  } = useScrap();

  const isKeyboardVisible = useKeyboardStatus();

  // Modals & Drawers state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);
  const [bookingEstimateData, setBookingEstimateData] = useState<{
    catIds?: string[];
    expectedItems?: string;
    estimatedWeight?: number;
  } | null>(null);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<Booking | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiDrawerDefaultTab, setAiDrawerDefaultTab] = useState<'complaint' | 'history'>('complaint');
  const [showTrackModal, setShowTrackModal] = useState(false);

const [trackBookingId, setTrackBookingId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<Booking | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);
  const [savedTrackBookings, setSavedTrackBookings] = useState<MyBooking[]>([]);
  const [trackToken, setTrackToken] = useState<string | null>(null);

  // Shared helper (src/lib/trackingPhone.ts) - mirror wahi normalization use karta hai
  const normalizeTrackPhone = normalizePhoneDigits;

  const resetTrackForm = () => {
    setTrackResult(null);
    setTrackNotFound(false);
    setTrackLoading(false);
    setTrackBookingId('');
    setTrackPhone('');
    setTrackToken(null);
  };

  // WhatsApp confirmation wala track link (?track=TOKEN) kholte hi seedha
  // Track Status modal me resolve hota hai - ID/phone type karne ki zarurat nahi.
  useEffect(() => {
    const token = consumeTrackTokenFromUrl();
    if (token) {
      setTrackToken(token);
      setShowTrackModal(true);
    }
  }, []);

  // Track modal khulne par: is device ki saved booking(s) se seedha fresh
  // status dikhao (form nahi). List khali ho to khali form.
  useEffect(() => {
    if (!showTrackModal) return;
    const list = getMyBookings();
    setSavedTrackBookings(list);
    if (trackToken) {
      runTokenLookup(trackToken);
      return;
    }
    const first = list[0];
    if (first) {
      if (first.phone) {
        setTrackBookingId(first.id);
        setTrackPhone(first.phone);
        runTrackLookup(first.id, first.phone);
      } else if (first.token) {
        setTrackToken(first.token);
        runTokenLookup(first.token);
      }
      return;
    }
    resetTrackForm();
  }, [showTrackModal]);

  // Token link se lookup: token -> booking_number -> public tracking doc.
  // Link ka possession hi proof hai, phone check nahi chahiye (sirf safe
  // status fields hi milte hain, address/OTP kabhi nahi).
  const runTokenLookup = async (token: string) => {
    setTrackLoading(true);
    setTrackNotFound(false);
    setTrackResult(null);
    try {
      const linkSnap = await getDoc(doc(db, 'track_links', token));
      if (linkSnap.exists()) {
        const bookingNumber = String(linkSnap.data().booking_number || '');
        if (bookingNumber) {
          const snap = await getDoc(doc(db, 'tracking', bookingNumber));
          if (snap.exists()) {
            setTrackResult(snap.data() as Booking);
            setTrackBookingId(bookingNumber);
            saveMyBooking({ id: bookingNumber, token });
            setSavedTrackBookings(getMyBookings());
            setTrackLoading(false);
            return;
          }
        }
      }
    } catch (e) { /* rules abhi publish nahi hui / network - form pe fallback */ }
    setTrackNotFound(true);
    setTrackLoading(false);
  };

  // Saved booking chip tap: phone wali seedha lookup, token wali link lookup.
  const selectMyBooking = (b: MyBooking) => {
    setTrackNotFound(false);
    setTrackResult(null);
    if (b.phone) {
      setTrackBookingId(b.id);
      setTrackPhone(b.phone);
      setTrackToken(null);
      runTrackLookup(b.id, b.phone);
    } else if (b.token) {
      setTrackBookingId(b.id);
      setTrackPhone('');
      setTrackToken(b.token);
      runTokenLookup(b.token);
    }
  };

  // "Not you? Clear" - is device ka saara saved track data hatao.
  const clearSavedTrackings = () => {
    clearMyBookings();
    setSavedTrackBookings([]);
    resetTrackForm();
  };

  const runTrackLookup = async (idRaw: string, phoneRaw: string) => {
    const idInput = idRaw.trim().toUpperCase().replace(/\s/g, '');
    const phoneDigits = normalizeTrackPhone(phoneRaw);
    if (!idInput || phoneDigits.length < 10) return;
    setTrackLoading(true);
    setTrackNotFound(false);
    setTrackResult(null);
    const idDigits = idInput.replace(/\D/g, '');
    const idMatches = (bNumRaw: string) => {
      const bNum = (bNumRaw || '').toUpperCase();
      const bDigits = bNum.replace(/\D/g, '');
      return bNum === idInput || (idDigits.length >= 4 && bDigits.endsWith(idDigits));
    };
    const matches = (b: Booking) =>
      idMatches(b.booking_number || '') && normalizeTrackPhone(b.customer_phone || '') === phoneDigits;
    try {
      let found = bookings.find(matches) || null;
      if (!found) {
        // Public tracking collection - guest-friendly. Rules: sirf GET allowed,
        // LIST band hai (koi saari bookings dump nahi kar sakta). Doc-id = booking
        // number, isliye seedha getDoc se fetch hota hai. Partial digits diye to
        // known prefixes try karte hain. Sirf safe status fields, koi address/OTP nahi.
        const tryIds = [idInput];
        if (idDigits.length >= 4 && idInput !== `SH-${idDigits}`) {
          tryIds.push(`SH-${idDigits}`, `SG-2026-${idDigits}`);
        }
        // Naye lambe IDs sirf suffix type karne pe bhi mil jayein (SH- laga ke try)
        if (!idInput.startsWith('SH-') && !idInput.startsWith('SG-')) {
          tryIds.push(`SH-${idInput}`);
        }
        for (const tryId of tryIds) {
          try {
            const snap = await getDoc(doc(db, 'tracking', tryId));
            if (!snap.exists()) continue;
            const remote = snap.data() as Booking & { phone_hash?: string };
            if (!idMatches(remote.booking_number || tryId)) continue;
            // Phone check: naye docs me sirf SHA-256 hash hota hai (plain phone
            // kabhi nahi). Bahut purane docs me plain phone ho sakta hai, jab
            // tak kisi staff/admin device se refresh na ho.
            let phoneOk = false;
            if (typeof remote.phone_hash === 'string' && remote.phone_hash.length === 64) {
              phoneOk = (await phoneHashForBooking(phoneRaw, remote.booking_number || tryId)) === remote.phone_hash;
            } else if (remote.customer_phone) {
              phoneOk = normalizeTrackPhone(remote.customer_phone) === phoneDigits;
            }
            if (phoneOk) {
              found = remote;
              break;
            }
          } catch (e) { /* try next id */ }
        }
      }
      if (found) {
        setTrackResult(found);
        saveMyBooking({ id: (found.booking_number || idInput), phone: phoneRaw });
        setSavedTrackBookings(getMyBookings());
      } else {
        setTrackNotFound(true);
      }
    } catch (err) {
      console.warn('Track status lookup notice:', err);
      setTrackNotFound(true);
    }
    setTrackLoading(false);
  };

  const handleTrackLookup = async () => {
    await runTrackLookup(trackBookingId, trackPhone);
  };

  const TRACK_STATUS_STEPS: Booking['status'][] = [
    'pending',
    'assigned',
    'on_the_way',
    'arrived',
    'weighing',
    'completed',
  ];

  const getPayoutStatusInfo = (ps: string): { label: string; tone: string } => {
    switch (ps) {
      case 'successful':
        return { label: 'Paid ✓', tone: 'text-emerald-700' };
      case 'processing':
        return { label: 'Payment processing', tone: 'text-blue-700' };
      case 'approved':
        return { label: 'Payment approved - on the way', tone: 'text-blue-700' };
      case 'failed':
        return { label: 'Payment failed - contact support', tone: 'text-red-600' };
      default:
        return { label: 'Payment under review', tone: 'text-amber-700' };
    }
  };

  // Android back button: close any open overlay instead of leaving the site
  const overlayPushedRef = useRef(false);
  const anyOverlayOpen =
    showBookingModal || showAiDrawer || showTrackModal || !!selectedTrackingBooking;
  useEffect(() => {
    if (!anyOverlayOpen) {
      overlayPushedRef.current = false;
      return;
    }
    if (!overlayPushedRef.current) {
      window.history.pushState({ scraphouseOverlay: true }, '');
      overlayPushedRef.current = true;
    }
    const closeAll = () => {
      setShowBookingModal(false);
      setShowAiDrawer(false);
      setShowTrackModal(false);
      setSelectedTrackingBooking(null);
    };
    window.addEventListener('popstate', closeAll);
    return () => window.removeEventListener('popstate', closeAll);
  }, [anyOverlayOpen]);

  const handleSchedulePickupFromEstimator = (
    catIds: string[],
    expectedItems: string,
    estimatedWeight: number
  ) => {
    setBookingEstimateData({ catIds, expectedItems, estimatedWeight });
    setShowBookingModal(true);
  };

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



  // Rotating Animated Titles List for Hero Section (No ISO mention)
  const heroTitles = [
    { line1: 'Trusted Scrap Pickup', line2: 'Across Haryana & Sonipat' },
    { line1: 'Ghar Baithe Kabaad Bechein.', line2: 'Instant UPI Cash Paayein.' },
    { line1: 'Sell Scrap Online.', line2: 'Best Daily Market Rates.' },
    { line1: 'Recycle Old Appliances.', line2: 'Save The Environment.' },
    { line1: 'Zero Pickup Charges.', line2: 'Fast Doorstep Service.' },
  ];

  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % heroTitles.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [heroTitles.length]);

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
      q: 'How does SCRAPHOUSE doorstep pickup work?',
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
      {/* HERO BANNER SECTION (Bright, Light, Soft Neumorphic Style) */}
      <section className="relative bg-gradient-to-br from-[#ebf2fa] via-[#f4f7fb] to-[#e6eef7] dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-white overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:18px_18px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-[3px_3px_8px_rgba(166,180,200,0.3),-3px_-3px_8px_rgba(255,255,255,0.95)]">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>YOUR EVERYDAY RECYCLING TOOLKIT</span>
              </div>

              <div className="min-h-[130px] sm:min-h-[150px] flex items-center justify-center lg:justify-start overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={currentTitleIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white text-center lg:text-left"
                  >
                    <span className="block">{heroTitles[currentTitleIndex].line1}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#15803d] via-[#059669] to-[#0d9488] block">
                      {heroTitles[currentTitleIndex].line2}
                    </span>
                  </motion.h1>
                </AnimatePresence>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium">
                Doorstep scrap pickup with certified digital weighing, transparent daily market rates, and instant UPI or Cash payouts.
              </p>

              {/* Action Buttons (Enlarged & Prominent) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  id="pickup-modal-trigger"
                  onClick={() => handleOpenBooking()}
                  className="w-full sm:w-auto px-8 sm:px-10 py-4.5 sm:py-5 rounded-2xl bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#047857] hover:from-[#126b34] hover:to-[#035e45] text-white font-black text-base sm:text-lg shadow-[0_12px_28px_rgba(21,128,61,0.45),-4px_-4px_14px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-emerald-300/60 flex items-center justify-center gap-3.5 group"
                >
                  <Truck className="w-7 h-7 text-white group-hover:rotate-12 transition-transform shrink-0" />
                  <span>Explore Doorstep Pickup →</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('rates-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 sm:px-10 py-4.5 sm:py-5 rounded-2xl bg-[#f4f7fb] dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border-2 border-white/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-base sm:text-lg shadow-[6px_6px_20px_rgba(166,180,200,0.32),-6px_-6px_20px_rgba(255,255,255,0.95)] hover:text-emerald-700 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
                >
                  <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Check Today's Rates</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Digital Scale Verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Instant UPI Transfer</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
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

              {/* SOLID STATIC 3D NEUMORPHIC APP WINDOW CARD */}
              <div className="bg-[#f4f7fb] dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-6 shadow-[12px_12px_30px_rgba(166,180,200,0.35),-6px_-6px_20px_rgba(255,255,255,0.95)] dark:shadow-none border-2 border-white/90 dark:border-slate-800 relative z-10 space-y-4">
                {/* Window Bar Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                    <span className="text-xs font-black text-slate-700 ml-2 font-mono">
                      ScrapHouse Doorstep Hub ⚡
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
                      <strong className="text-xs font-black text-slate-900 block">Certified Scale</strong>
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
              </div>
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

      {/* SCRAP PRICE ESTIMATOR SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ScrapPriceEstimator onSchedulePickup={handleSchedulePickupFromEstimator} />
      </section>

      {/* SCRAP CATEGORIES & TODAY'S RATES SECTION (Clean Minimalist Design) */}
      <section id="rates-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Compact Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-extrabold text-sm pl-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Live Scrap Rates</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search newspaper, iron, AC, copper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  (e.target as HTMLElement).blur();
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'paper', label: 'Paper & Books' },
            { id: 'metal', label: 'Metals' },
            { id: 'plastic', label: 'Plastics' },
            { id: 'e-waste', label: 'E-Waste' },
            { id: 'appliance', label: 'Appliances' },
            { id: 'vehicle', label: 'Vehicles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Rate Cards Grid (Clean Layout Without Heavy Icon Boxes) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-[4px_4px_15px_rgba(166,180,200,0.18)] hover:shadow-lg hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Clean Top Header Row: Item Name Left, Rate Right */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition-colors leading-snug">
                    {getCategoryName(cat)}
                  </h3>

                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{cat.rate_per_kg}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">
                      per {cat.unit}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                  {getCategoryDesc(cat)}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  Min {cat.min_weight_kg || 10} {cat.unit}
                </span>

                <button
                  onClick={() => handleOpenBooking(cat.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-[0_3px_10px_rgba(5,150,105,0.35)]"
                >
                  <span>Sell This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION (Light Modern Neumorphic Theme) */}
      <section className="bg-[#f0f4f9] dark:bg-slate-900 text-slate-900 dark:text-white py-14 my-10 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/80 dark:bg-emerald-950 px-3.5 py-1 rounded-full border border-emerald-300/60 dark:border-emerald-800">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              How SCRAPHOUSE Doorstep Pickup Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
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
            ].map((s, i) => {
              const Icon = s.icon;
              const palette = [
                { box: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700', num: 'text-emerald-500 dark:text-emerald-500' },
                { box: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700', num: 'text-amber-500 dark:text-amber-500' },
                { box: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-700', num: 'text-sky-500 dark:text-sky-500' },
                { box: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-700', num: 'text-violet-500 dark:text-violet-500' },
              ][i % 4];
              return (
                <div key={s.step} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-[6px_6px_20px_rgba(166,180,200,0.25)] space-y-4 relative hover:scale-102 transition-transform">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl ${palette.box} flex items-center justify-center border shadow-2xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-mono font-black text-2xl ${palette.num}`}>{s.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{s.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* SERVICE AREAS & COVERAGE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Active Service Hubs &amp; Coverage
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-black shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {serviceAreas.filter((a) => a.is_active).length} Hubs Online
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We provide doorstep pickup across all major sectors and pincodes.
          </p>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  (e.target as HTMLElement).blur();
                }
              }}
              placeholder="Search questions (e.g. payment, scale, rates, OTP, cancel)..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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

        {/* Can't Find Answer Instant Support Card (Light Neumorphic Theme) */}
        <div className="bg-gradient-to-r from-[#eef7f2] via-[#f4faf6] to-[#e8f5ee] dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white rounded-2xl p-5 border border-emerald-200/90 dark:border-slate-800 shadow-[6px_6px_20px_rgba(166,180,200,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Still need custom assistance?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Need help? Contact our support team or register a complaint instantly - we are here for you 24/7.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setAiDrawerDefaultTab('complaint');
                setShowAiDrawer(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Bot className="w-4 h-4 text-white" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </section>

      {/* SEO INFORMATIONAL SECTION (Google Search & Regional Coverage) */}
      <section className="py-12 bg-white dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-600/30 shadow-2xs shrink-0">
              <img src={scrapgoLogo} alt="ScrapHouse logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ScrapHouse – Free Doorstep Scrap Pickup in Haryana & Sonipat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trusted online scrap dealer with instant digital weighing & daily market scrap rates
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-relaxed font-normal">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Doorstep Scrap Pickup Services
              </h3>
              <p>
                ScrapHouse provides hassle-free, <strong>free doorstep scrap pickup</strong> across <strong>Sonipat, Haryana</strong> and nearby areas including Kundli, Murthal, Rai, Ganaur, Gohana, and Kharkhoda. Skip visiting the local scrap dealer — book online and get instant doorstep collection.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Transparent Live Scrap Rates
              </h3>
              <p>
                Get guaranteed market-best <strong>scrap rates</strong> updated daily. Sell <strong>iron scrap</strong>, <strong>copper</strong>, <strong>aluminium</strong>, <strong>brass</strong>, <strong>paper</strong>, <strong>cardboard</strong>, <strong>plastic</strong>, and household scrap with certified digital weighing scales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                E-Waste & Appliances Recycling
              </h3>
              <p>
                Dispose of electronic waste responsibly! We collect old laptops, mobile phones, <strong>e-waste</strong>, air conditioners, refrigerators, and washing machines with instant UPI cash payout directly to your bank account upon pickup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Clean Light Theme) */}
      <footer className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs py-8 border-t border-slate-200/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
              SG
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">SCRAPHOUSE India</span>
            <span className="text-slate-500">| Certified Recycling Portal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <button
              onClick={() => {
                setAiDrawerDefaultTab('complaint');
                setShowAiDrawer(true);
              }}
              className="hover:text-emerald-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              24/7 Support
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setAiDrawerDefaultTab('complaint');
                setShowAiDrawer(true);
              }}
              className="hover:text-emerald-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Register Complaint
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setAiDrawerDefaultTab('complaint');
                setShowAiDrawer(true);
              }}
              className="hover:text-emerald-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            © 2026 SCRAPHOUSE Recycling Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Hidden Triggers for Header/Nav Clicks */}
      <button
        id="pickup-modal-trigger"
        className="hidden"
        onClick={() => handleOpenBooking()}
      />
      <button
        id="customer-account-trigger"
        className="hidden"
        onClick={() => {
          setShowTrackModal(true);
        }}
      />

      {/* BOTTOM NAV BAR */}
      <BottomNavBar
        onOpenBooking={() => handleOpenBooking()}
        onOpenRates={() => {
          const el = document.getElementById('rates-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenChat={() => {
          setAiDrawerDefaultTab('complaint');
          setShowAiDrawer(true);
        }}
        onOpenAccount={() => setShowTrackModal(true)}
      />

      {/* UNIQUE CUTE SCRAPBOT AI CHATBOT WIDGET (Customer Homepage Exclusive) */}
      {!showAiDrawer && !isKeyboardVisible && (
        <div className="fixed bottom-26 sm:bottom-8 right-4 sm:right-8 z-40 flex items-center gap-3 group animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Cute 3D Bot Avatar Button */}
          <button
            onClick={() => {
              setAiDrawerDefaultTab('complaint');
              setShowAiDrawer(true);
            }}
            className="relative w-15 h-15 rounded-3xl bg-gradient-to-tr from-[#15803d] via-[#10b981] to-[#34d399] hover:from-[#126b34] hover:to-[#059669] text-white shadow-[0_12px_28px_rgba(16,185,129,0.45)] flex items-center justify-center border-2 border-white ring-4 ring-emerald-400/25 active:scale-90 transition-all cursor-pointer group hover:rotate-6"
            title="ScrapHouse Support"
          >
            <div className="relative flex items-center justify-center">
              {/* Cute Bot Face */}
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/40 shadow-inner group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-bounce" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full border border-white shadow-xs tracking-wider uppercase">
              ONLINE ⚡
            </span>
          </button>
        </div>
      )}

      {/* MODALS AND DRAWERS */}
      {showBookingModal && (
        <BookingModal
          onClose={() => {
            setShowBookingModal(false);
            setBookingEstimateData(null);
          }}
          preselectedCategoryId={preselectedCategoryId}
          preselectedCatIds={bookingEstimateData?.catIds}
          initialExpectedItems={bookingEstimateData?.expectedItems}
          initialEstimatedWeight={bookingEstimateData?.estimatedWeight}
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

      {showTrackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className={`bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#047857] px-4 ${trackResult ? 'pt-4 pb-12' : 'py-3.5'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/70 shadow-md shrink-0">
                  <img src={scrapgoLogo} alt="ScrapHouse logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">{t('track_modal_title', 'Track Your Pickup 📦')}</h3>
                  <p className="text-[11px] font-semibold text-emerald-100 mt-0.5">{t('track_modal_subtitle', 'See live status with your Booking ID + phone number')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrackModal(false);
                }}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
            {!trackResult ? (
              <>
                {savedTrackBookings.length > 0 && (
                  <div>
                    <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      {language === 'hindi' ? 'इस डिवाइस की बुकिंग' : 'Your bookings on this device'}
                    </p>
                    <div className="space-y-1.5">
                      {savedTrackBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => selectMyBooking(b)}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <span className="text-[13px] font-extrabold text-[#15803d] tracking-wide">{b.id}</span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {b.phone ? `•••••${normalizeTrackPhone(b.phone).slice(-5)}` : '🔗 link'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={clearSavedTrackings}
                      className="mt-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {language === 'hindi' ? 'आप नहीं हैं? साफ़ करें' : 'Not you? Clear'}
                    </button>
                    <div className="flex items-center gap-2 mt-3 mb-1">
                      <span className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        {language === 'hindi' ? 'या दूसरी बुकिंग देखें' : 'Or track another booking'}
                      </span>
                      <span className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1"><span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">1</span> {t('track_booking_id_label', 'Booking ID')}</label>
                  <input
                    type="text"
                    value={trackBookingId}
                    onChange={(e) => setTrackBookingId(e.target.value)}
                    placeholder="e.g. SH-48291"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1"><span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">2</span> {t('track_phone_label', 'Phone Number')}</label>
                  <input
                    type="tel"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {trackNotFound && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    {t('track_not_found', 'Booking not found. Please check your Booking ID and phone number, then try again.')}
                  </p>
                )}

                <button
                  onClick={handleTrackLookup}
                  disabled={!trackBookingId.trim() || normalizeTrackPhone(trackPhone).length < 10 || trackLoading}
                  className="w-full bg-gradient-to-r from-[#16a34a] to-[#047857] hover:from-[#15803d] hover:to-[#065f46] disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-[0_8px_18px_rgba(5,150,105,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  {trackLoading ? t('track_checking', 'Checking...') : t('track_check_btn', 'Check My Status 🔍')}
                </button>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-emerald-800 flex items-start gap-2">
                  <span>ℹ️</span>
                  <span>{t('track_info_note', 'You received your Booking ID in the WhatsApp confirmation message. Enter the same details you gave while booking.')}</span>
                </div>

                <button
                  onClick={() => {
                    const adminDigits = systemSettings.whatsapp_number.replace(/\D/g, '');
                    const msg = `Hello ScrapHouse team! I need help with my booking.\n\nBooking ID: ${trackBookingId.trim() || '-'}\nPhone: ${trackPhone.trim() || '-'}`;
                    window.open(`https://wa.me/${adminDigits}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="w-full text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer text-center"
                >
                  {t('track_need_help', 'Need help? Chat with us on WhatsApp 💬')}
                </button>
              </>
            ) : (
              <div className="space-y-4 -mt-8 relative z-10">
                {/* Floating Booking ID card */}
                <div className="bg-white border-[1.5px] border-slate-100 rounded-2xl px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-[1.2px]">Booking ID</p>
                      <p className="font-black text-[#15803d] text-lg tracking-wide mt-0.5">{trackResult.booking_number}</p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm ${
                        trackResult.status === 'completed'
                          ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800'
                          : trackResult.status === 'cancelled'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800'
                      }`}
                    >
                      {getStatusLabel(trackResult.status)}
                    </span>
                  </div>
                </div>

                {trackResult.status === 'cancelled' ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-sm font-extrabold text-red-700">This pickup was cancelled</p>
                    <p className="text-xs text-slate-600 mt-1">No worries - you can book a new pickup anytime.</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      // 5 simple display steps mapped from internal statuses
                      const DISPLAY_STEPS = [
                        { en: 'Pickup Requested', hi: 'पिकअप रिक्वेस्ट मिल गई' },
                        { en: 'Request Accepted', hi: 'रिक्वेस्ट एक्सेप्ट हो गई' },
                        { en: 'Driver Arrived at Your Doorstep', hi: 'ड्राइवर आपके घर पहुंच गया' },
                        { en: 'Pickup Completed', hi: 'पिकअप पूरा हो गया' },
                        { en: 'Payment Done', hi: 'पेमेंट हो गई' },
                      ];
                      const s = trackResult.status;
                      let currentIdx = 0;
                      if (s === 'assigned' || s === 'on_the_way') currentIdx = 1;
                      else if (s === 'arrived' || s === 'weighing') currentIdx = 2;
                      else if (s === 'completed') currentIdx = trackResult.payout_status === 'successful' ? 4 : 3;
                      const pct = Math.round(((currentIdx + 1) / DISPLAY_STEPS.length) * 100);
                      return (
                        <>
                          {/* Progress bar */}
                          <div className="px-0.5">
                            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 mb-1.5">
                              <span>Progress</span>
                              <span className="text-[#16a34a]">Step {currentIdx + 1} of {DISPLAY_STEPS.length}</span>
                            </div>
                            <div className="h-[7px] bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#16a34a] to-[#4ade80] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="px-0.5">
                            {DISPLAY_STEPS.map((step, idx) => {
                              const done = idx < currentIdx;
                              const isCurrent = idx === currentIdx;
                              const isLast = idx === DISPLAY_STEPS.length - 1;
                              const label = language === 'hindi' ? step.hi : step.en;
                              return (
                                <div key={idx} className="flex gap-3 relative pb-4 last:pb-0">
                                  {!isLast && (
                                    <span className={`absolute left-[13.5px] top-[30px] bottom-0 w-[2.5px] rounded ${done ? 'bg-[#16a34a]' : 'bg-slate-200'}`} />
                                  )}
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-extrabold relative z-10 ${
                                      done
                                        ? 'bg-[#16a34a] text-white shadow-[0_3px_10px_rgba(22,163,74,0.35)]'
                                        : isCurrent
                                          ? 'bg-[#16a34a] text-white ring-4 ring-emerald-100 shadow-[0_4px_12px_rgba(22,163,74,0.4)]'
                                          : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                                    }`}
                                  >
                                    {done || isCurrent ? '✓' : idx + 1}
                                  </div>
                                  {isCurrent ? (
                                    <div className="flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100 border-[1.5px] border-emerald-300 rounded-2xl px-3.5 py-2.5">
                                      <p className="text-[13px] font-extrabold text-emerald-900 flex items-center gap-1.5">
                                        {label}
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                        </span>
                                      </p>
                                      <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                        {language === 'hindi' ? 'यह आपकी वर्तमान स्थिति है' : 'This is your current status'}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className={`text-[13px] font-semibold pt-1 ${done ? 'text-slate-700' : 'text-slate-400'}`}>
                                      {label}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Details with icons */}
                <div className="bg-slate-50 border-[1.5px] border-slate-200 rounded-2xl px-4 py-1.5">
                  {[
                    ...(trackResult.preferred_date ? [{ icon: '🕒', k: language === 'hindi' ? 'पिकअप स्लॉट' : 'Pickup Slot', v: `${trackResult.preferred_date}${trackResult.preferred_time_slot ? ` · ${trackResult.preferred_time_slot}` : ''}` }] : []),
                    ...(trackResult.pickup_address ? [{ icon: '📍', k: language === 'hindi' ? 'पता' : 'Address', v: trackResult.pickup_address }] : []),
                    ...(trackResult.expected_scrap_items ? [{ icon: '📦', k: language === 'hindi' ? 'सामान' : 'Items', v: trackResult.expected_scrap_items }] : []),
                    ...(trackResult.estimated_weight_kg ? [{ icon: '⚖️', k: language === 'hindi' ? 'अंदाज़न वज़न' : 'Est. Weight', v: `${trackResult.estimated_weight_kg} kg` }] : []),
                    ...(trackResult.staff_name ? [{ icon: '🛵', k: language === 'hindi' ? 'पिकअप पार्टनर' : 'Pickup Partner', v: trackResult.staff_name }] : []),
                  ].map((row, i, arr) => (
                    <div key={i} className={`flex items-center gap-2.5 py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-200' : ''}`}>
                      <span className="w-[30px] h-[30px] rounded-lg bg-emerald-100 flex items-center justify-center text-sm shrink-0">{row.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{row.k}</div>
                        <div className="text-[13px] text-slate-800 font-semibold truncate">{row.v}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment */}
                {(() => {
                  const isPaidComplete = trackResult.status === 'completed' && trackResult.final_amount != null;
                  const w = trackResult.estimated_weight_kg;
                  const rates = (trackResult.category_ids || [])
                    .map((cid) => categories.find((c) => c.id === cid)?.rate_per_kg)
                    .filter((r): r is number => typeof r === 'number' && r > 0);
                  const estMax = w && rates.length ? Math.round(Math.max(...rates) * w) : null;
                  return (
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-[1.5px] border-emerald-200 rounded-2xl px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white flex items-center justify-center text-[15px] shrink-0 shadow-md">💰</span>
                        <p className="text-[12.5px] font-extrabold text-emerald-900">
                          {language === 'hindi' ? 'पेमेंट' : 'Payment'}
                        </p>
                      </div>

                      {isPaidComplete ? (
                        <div className="mt-2.5 space-y-2">
                          {trackResult.items_collected && trackResult.items_collected.length > 0 && (
                            <div className="bg-white/70 rounded-xl px-3 py-2 space-y-1">
                              {trackResult.items_collected.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[12px]">
                                  <span className="font-semibold text-slate-700">
                                    {item.category_name} · {item.weight_kg} kg
                                  </span>
                                  <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                                </div>
                              ))}
                              {trackResult.final_weight_kg != null && (
                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-100">
                                  <span className="font-bold text-emerald-800">{language === 'hindi' ? 'कुल वज़न' : 'Total weight'}</span>
                                  <span className="font-bold text-emerald-800">{trackResult.final_weight_kg} kg</span>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-2xl font-black text-emerald-700 leading-tight">₹{trackResult.final_amount}</p>
                          <p className={`text-[11px] font-bold ${getPayoutStatusInfo(trackResult.payout_status).tone}`}>
                            {getPayoutStatusInfo(trackResult.payout_status).label}
                            {trackResult.payout_method ? ` · ${getPayoutMethodLabel(trackResult.payout_method, language)}` : ''}
                          </p>
                        </div>
                      ) : estMax != null ? (
                        <div className="mt-1.5 pl-[46px]">
                          <p className="text-lg font-black text-emerald-700 leading-tight">
                            {language === 'hindi' ? `₹${estMax} तक मिल सकते हैं` : `You can get up to ₹${estMax}`}
                          </p>
                          <p className="text-[11px] font-semibold text-emerald-700 leading-snug mt-0.5">
                            {language === 'hindi'
                              ? 'ये अंदाज़ा है - फाइनल अमाउंट तौल (weighing) के बाद कन्फर्म होगा।'
                              : 'This is an estimate - final amount is confirmed after weighing.'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11.5px] font-semibold text-emerald-700 leading-snug mt-1.5 pl-[46px]">
                          {language === 'hindi'
                            ? 'फाइनल अमाउंट पिकअप और तौल के बाद कन्फर्म होगा।'
                            : 'Final amount is confirmed after pickup and weighing. You will see it here.'}
                        </p>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={resetTrackForm}
                  className="w-full bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:from-[#15803d] hover:to-[#14532d] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-[0_6px_16px_rgba(22,163,74,0.35)] transition-all cursor-pointer active:scale-98"
                >
                  {language === 'hindi' ? 'दूसरी बुकिंग देखें' : 'Check Another Booking'}
                </button>

                <button
                  onClick={() => {
                    const adminDigits = systemSettings.whatsapp_number.replace(/\D/g, '');
                    const msg = `Hello ScrapHouse team! I need help with my booking.\n\nBooking ID: ${trackResult.booking_number}\nPhone: ${trackPhone.trim() || '-'}`;
                    window.open(`https://wa.me/${adminDigits}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="w-full text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer text-center"
                >
                  {t('track_need_help', 'Need help? Chat with us on WhatsApp 💬')}
                </button>

                {savedTrackBookings.length > 0 && (
                  <button
                    onClick={clearSavedTrackings}
                    className="w-full text-[11px] font-bold text-slate-400 hover:text-slate-600 py-0.5 cursor-pointer text-center"
                  >
                    {language === 'hindi' ? 'आप नहीं हैं? साफ़ करें' : 'Not you? Clear saved bookings'}
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


