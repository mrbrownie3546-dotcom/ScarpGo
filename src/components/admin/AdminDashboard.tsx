import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useScrap } from '../../context/ScrapContext';
import { Booking, ScrapCategory, UserProfile } from '../../types/scrapgo';
import {
  Menu,
  Bell,
  ChevronDown,
  Calendar,
  ClipboardList,
  Clock,
  Users,
  Truck,
  Coins,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  Eye,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Home,
  Scale,
  MoreHorizontal,
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Settings,
  Lock,
  LogOut,
  Moon,
  Sun,
  ExternalLink,
  QrCode,
  ShieldAlert,
  FileWarning,
  Send,
  RotateCcw,
} from 'lucide-react';
import scrapgoLogo from '../../assets/scrapgo-logo.jpg';

import { ServiceAreasTab } from './ServiceAreasTab';
import { PaymentsTab } from './PaymentsTab';
import { ScrapCategoriesTab } from './ScrapCategoriesTab';
import { ReportsAnalyticsTab } from './ReportsAnalyticsTab';
import { UsersManagementTab } from './UsersManagementTab';
import { WebsiteContentTab } from './WebsiteContentTab';
import { AdminRolesTab } from './AdminRolesTab';
import { BlockedNumbersTab } from './BlockedNumbersTab';
import { SystemSettingsTab } from './SystemSettingsTab';
import { ApprovalCenterTab } from './ApprovalCenterTab';
import { AuditLogsTab } from './AuditLogsTab';
import {
  Skeleton,
  DashboardSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  CardGridSkeleton,
  ChartSkeleton,
} from '../common/Skeleton';

const TrendTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md px-3 py-2 text-xs min-w-[130px]">
      <div className="font-extrabold text-slate-900 mb-1">{d.dayLabel}</div>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>Volume</span>
        <span className="font-bold text-emerald-700">{d.volumeKg} kg</span>
      </div>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>Payout</span>
        <span className="font-bold text-emerald-600">₹{Number(d.payoutRs).toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>Bookings</span>
        <span className="font-bold text-slate-800">{d.ordersCount}</span>
      </div>
    </div>
  );
};

// ---- Customer Complaints helpers ----
type TicketViewStatus = 'open' | 'replied' | 'resolved';

// Purane status values ko simple flow me map karta hai:
// open/escalated_to_admin -> open, replied -> replied, closed/ai_resolved -> resolved
const ticketViewStatus = (t: { status: string }): TicketViewStatus =>
  t.status === 'closed' || t.status === 'ai_resolved'
    ? 'resolved'
    : t.status === 'replied'
    ? 'replied'
    : 'open';

const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  driver_delayed: 'Driver Delayed',
  payment_issue: 'Payment Issue',
  weight_scale_issue: 'Weight / Scale Issue',
  staff_behavior: 'Staff Behaviour',
  cancellation: 'Cancellation',
  other: 'Other',
};

const QUICK_TICKET_REPLIES = [
  'Manager will call you within 30 minutes.',
  'Payment sent, please check your account.',
  'Sorry for the delay. We are looking into it.',
];

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export const AdminDashboard: React.FC = () => {
  const {
    bookings,
    payouts,
    categories,
    serviceAreas,
    currentAdmin,
    setCurrentAdmin,
    updateBookingOperationalStatus,
    adminList,
    staffMembers,
    tickets,
    replyToTicket,
    closeTicket,
    reopenTicket,
    allUsers,
    setActivePortal,
    refreshSharedData,
    firebaseRole,
  } = useScrap();

  // Active Tab / Page navigation state
  type AdminNavPage =
    | 'dashboard'
    | 'bookings'
    | 'tickets'
    | 'customers'
    | 'categories'
    | 'areas'
    | 'payments'
    | 'reports'
    | 'admins'
    | 'settings'
    | 'blocked'
    | 'approvals'
    | 'audit';

  const [activeTab, setActiveTab] = useState<AdminNavPage>('dashboard');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);

  const handleTabChange = (nextTab: AdminNavPage) => {
    if (nextTab === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(nextTab);
    setIsDrawerOpen(false);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 350);
  };

  // Ticket reply modal state
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Complaints filter & search
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'replied' | 'resolved'>('all');
  const [ticketSearch, setTicketSearch] = useState('');

  // Drawer / Mobile Sidebar State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Booking Analytics Chart Period Filter & Recharts Trends Tab
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '3months'>('7days');
  const [trendChartTab, setTrendChartTab] = useState<'volume' | 'payout' | 'combined'>('volume');

  // Booking detail view modal state
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Search & Filter for Bookings page and Main Dashboard
  const [bookingSearch, setBookingSearch] = useState('');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState<'any' | 'today' | 'tomorrow' | 'date'>('any');
  const [pickedDate, setPickedDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'weight'>('newest');

  // Feedback Notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Calculated Stats strictly computed from real live website data
  const totalBookingsCount = bookings.length;
  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length;
  
  // Calculate unique real customers
  const uniqueCustomerSet = new Set(
    [
      ...bookings.map((b) => b.customer_phone || b.customer_id),
      ...(allUsers || []).filter((u) => u.role === 'customer').map((u) => u.phone || u.id),
    ].filter(Boolean)
  );
  const totalCustomersCount = uniqueCustomerSet.size;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysPickupsCount = bookings.filter(
    (b) => b.preferred_date === todayStr || b.status === 'assigned' || b.status === 'on_the_way' || b.status === 'arrived'
  ).length;

  const monthlyRevenueSum = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.final_amount || 0), 0) +
    payouts
      .filter((p) => p.status === 'successful')
      .reduce((sum, p) => sum + p.amount, 0);

  const activeAreasCount = serviceAreas.filter((a) => a.is_active).length;

  // Recharts Trends Data computation for current month
  const currentMonthTrends = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthName = now.toLocaleString('en-IN', { month: 'short' });

    const daysMap: Record<
      number,
      { day: number; dayLabel: string; volumeKg: number; payoutRs: number; ordersCount: number }
    > = {};

    for (let d = 1; d <= daysInMonth; d++) {
      daysMap[d] = {
        day: d,
        dayLabel: `${d} ${monthName}`,
        volumeKg: 0,
        payoutRs: 0,
        ordersCount: 0,
      };
    }

    bookings.forEach((b) => {
      const bDate = new Date(b.created_at || b.preferred_date);
      if (!isNaN(bDate.getTime()) && bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth) {
        const d = bDate.getDate();
        if (daysMap[d]) {
          daysMap[d].volumeKg += b.estimated_weight_kg || 18;
          daysMap[d].payoutRs += b.final_amount || (b.estimated_weight_kg ? b.estimated_weight_kg * 30 : 250);
          daysMap[d].ordersCount += 1;
        }
      }
    });

    payouts.forEach((p) => {
      if (!p.created_at) return;
      const pDate = new Date(p.created_at);
      if (!isNaN(pDate.getTime()) && pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        const d = pDate.getDate();
        if (daysMap[d]) {
          daysMap[d].payoutRs += p.amount || 0;
        }
      }
    });

    const today = now.getDate();
    return Object.values(daysMap).filter((item) => item.day <= today);
  }, [bookings, payouts]);

  const totalMonthlyVolumeKg = currentMonthTrends.reduce((sum, d) => sum + d.volumeKg, 0);
  const totalMonthlyPayoutRs = currentMonthTrends.reduce((sum, d) => sum + d.payoutRs, 0);
  const peakVolumeDay = [...currentMonthTrends].sort((a, b) => b.volumeKg - a.volumeKg)[0];

  // Filtered Bookings list for Bookings tab
  const filteredBookingsRaw = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (b.booking_number && b.booking_number.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_phone && b.customer_phone.includes(q)) ||
      (b.pickup_address && b.pickup_address.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && b.status === 'pending') ||
      (statusFilter === 'active' && (b.status === 'assigned' || b.status === 'on_the_way')) ||
      (statusFilter === 'completed' && b.status === 'completed') ||
      (statusFilter === 'cancelled' && b.status === 'cancelled');
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayD = new Date();
    const tomorrowD = new Date();
    tomorrowD.setDate(tomorrowD.getDate() + 1);
    const bDay = (b.preferred_date || '').slice(0, 10);
    const matchesDay =
      dayFilter === 'any' ||
      (dayFilter === 'today' && bDay === ymd(todayD)) ||
      (dayFilter === 'tomorrow' && bDay === ymd(tomorrowD)) ||
      (dayFilter === 'date' && (!pickedDate || bDay === pickedDate));
    return matchesSearch && matchesStatus && matchesDay;
  });
  const filteredBookings = [...filteredBookingsRaw].sort((x, y) => {
    if (sortBy === 'weight') return (y.estimated_weight_kg || 0) - (x.estimated_weight_kg || 0);
    const tx = new Date(x.created_at || x.preferred_date).getTime() || 0;
    const ty = new Date(y.created_at || y.preferred_date).getTime() || 0;
    return sortBy === 'oldest' ? tx - ty : ty - tx;
  });

  // Search filtered bookings for Main Dashboard overview
  const dashboardFilteredBookings = bookings.filter((b) => {
    if (!dashboardSearch.trim()) return true;
    const q = dashboardSearch.toLowerCase().trim();
    return (
      (b.booking_number && b.booking_number.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_phone && b.customer_phone.includes(q)) ||
      (b.pickup_address && b.pickup_address.toLowerCase().includes(q))
    );
  });

  const recentBookingsList = dashboardSearch.trim() ? dashboardFilteredBookings : bookings.slice(0, 5);

  // WhatsApp click handler with status-specific message
  const handleOpenWhatsApp = (booking: Booking) => {
    const phone = booking.customer_phone || '';
    const name = booking.customer_name || 'Customer';
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let messageText = '';

    switch (booking.status) {
      case 'assigned':
        messageText = `Hello ${name}, your ScrapHouse scrap pickup request #${booking.booking_number} has been ACCEPTED!\n\nStatus: ACCEPTED (Driver Assigned)\nPickup Address: ${booking.pickup_address}\nPickup Date: ${booking.preferred_date} (${booking.preferred_time_slot})\nSecret Verification OTP: ${booking.pickup_otp || '----'}\n\nOur agent will arrive at your location. Thank you!`;
        break;

      case 'on_the_way':
        messageText = `Hello ${name}, your ScrapHouse scrap pickup request #${booking.booking_number} is CONFIRMED and ON THE WAY!\n\nStatus: CONFIRMED (On The Way)\nPickup Address: ${booking.pickup_address}\nSecret Verification OTP: ${booking.pickup_otp || '----'}\n\nOur pickup agent is arriving at your doorstep with a certified scale. Please keep your scrap ready!`;
        break;

      case 'completed':
        messageText = `Hello ${name}, your ScrapHouse scrap pickup request #${booking.booking_number} has been COMPLETED successfully!\n\nStatus: COMPLETED\nAmount Paid: ₹${booking.final_amount || 0}\nPayout Mode: ${booking.payout_method?.toUpperCase() || 'CASH'}\n\nThank you for choosing ScrapHouse!`;
        break;

      case 'cancelled':
        messageText = `Hello ${name}, regarding your ScrapHouse scrap pickup request #${booking.booking_number}:\n\nStatus: REJECTED / CANCELLED\nWe regret to inform you that your pickup request has been cancelled or rejected. If you have any questions, please reply directly to this message.`;
        break;

      case 'pending':
      default:
        messageText = `Hello ${name}, this is ScrapHouse Admin regarding your scrap pickup booking request #${booking.booking_number}.\n\nStatus: PENDING\nYour request is currently under review. We will assign a pickup agent shortly.\nPickup Address: ${booking.pickup_address}\n\nThank you for your patience!`;
        break;
    }

    const msg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden font-sans transition-colors ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-[#F4F6F8] text-slate-900'}`}>
      
      {/* 1. TOP HEADER BAR (Thicker & Fuller Header) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md px-3 sm:px-6 py-3.5 sm:py-4.5 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Hamburger + ScrapHouse Admin Brand */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
              <img src={scrapgoLogo} alt="ScrapHouse logo" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-emerald-600/30 shrink-0" />
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-emerald-900 dark:text-emerald-400 tracking-tight leading-none flex items-center gap-1">
                  ScrapHouse
                </h1>
                <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 block tracking-wider uppercase mt-0.5">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Header Actions with Prominent Back to Customer Site Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsTabLoading(true);
                refreshSharedData()
                  .catch(() => {})
                  .finally(() => {
                    setIsTabLoading(false);
                    if (firebaseRole) {
                      showToast('success', 'Latest data synced from Firestore!');
                    } else {
                      showToast(
                        'error',
                        'Firebase not connected - showing this device\'s local data only. Please log in again with your Firebase email and password.'
                      );
                    }
                  });
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh and sync backend data"
            >
              <RotateCcw className={`w-4 h-4 ${isTabLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              onClick={() => setActivePortal('customer')}
              className="bg-[#0f6233] hover:bg-[#0c5028] text-white font-black text-xs sm:text-sm px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 sm:gap-2 border border-emerald-400/40 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Site</span>
              <span className="hidden sm:inline">Back to Customer Site</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. SIDEBAR NAVIGATION DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-5 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <img src={scrapgoLogo} alt="ScrapHouse logo" className="w-9 h-9 rounded-full object-cover border-2 border-emerald-600/30" />
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">ScrapHouse Admin</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Menu Options */}
              <nav className="space-y-1 text-xs font-bold">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'bookings', label: 'Bookings Management', icon: ClipboardList, badge: bookings.length },
                  { id: 'tickets', label: 'Customer Complaints', icon: FileWarning, badge: tickets.filter((t) => ticketViewStatus(t) !== 'resolved').length },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'categories', label: 'Scrap Categories', icon: Scale },
                  { id: 'areas', label: 'Service Areas', icon: MapPin },
                  { id: 'payments', label: 'Payout Requests', icon: Coins },
                  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                  { id: 'admins', label: 'Admin & Hierarchy', icon: UserCheck },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'blocked', label: 'Blocked Numbers', icon: ShieldCheck },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as AdminNavPage)}
                      className={`w-full px-3.5 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-emerald-600" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                  {currentAdmin.name?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{currentAdmin.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentAdmin.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">

        {/* Toast Notification */}
        {toastMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in ${
              toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* PAGE SWITCHING */}
        {isTabLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* PAGE 1: MAIN DASHBOARD */}
        {activeTab === 'dashboard' && (() => {
          const todayStr = new Date().toDateString();
          const todays = bookings.filter((b) => new Date(b.created_at).toDateString() === todayStr);
          const done = bookings.filter((b) => b.status === 'completed');
          const revenue = done.reduce((s, b) => s + (b.final_amount || 0), 0);
          const kg = done.reduce((s, b) => s + (b.final_weight_kg || 0), 0);
          const pendingPickups = bookings.filter((b) => ['pending', 'assigned', 'on_the_way', 'arrived', 'weighing'].includes(b.status)).length;
          const payoutsDue = payouts.filter((p) => p.status !== 'successful' && p.status !== 'failed').length;
          const openTickets = tickets.filter((t) => ticketViewStatus(t) !== 'resolved').length;
          const recent = [...bookings].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
          const Stat = ({ icon: I, v, l }: { icon: any; v: string | number; l: string }) => (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2"><I className="w-5 h-5" /></div>
              <p className="text-2xl font-black text-emerald-700">{v}</p>
              <p className="text-xs text-slate-500 font-semibold">{l}</p>
            </div>
          );
          return (
            <div className="space-y-4">
              <div className="bg-emerald-700 text-white rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs opacity-80">Welcome back</p>
                    <h2 className="text-2xl font-black mt-0.5">Admin Dashboard</h2>
                    <p className="text-xs opacity-80 mt-0.5">Here is your business today</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center"><BarChart3 className="w-6 h-6" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/15 rounded-2xl p-3"><p className="text-2xl font-black">{todays.length}</p><p className="text-[11px] opacity-90">Bookings today</p></div>
                  <div className="bg-white/15 rounded-2xl p-3"><p className="text-2xl font-black">₹{revenue.toLocaleString('en-IN')}</p><p className="text-[11px] opacity-90">Revenue</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat icon={ClipboardList} v={pendingPickups} l="Pending pickups" />
                <Stat icon={Coins} v={payoutsDue} l="Payouts due" />
                <Stat icon={Scale} v={`${Math.round(kg * 10) / 10} kg`} l="Scrap collected" />
                <Stat icon={FileWarning} v={openTickets} l="Open complaints" />
              </div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase px-1 pt-1">Quick actions</p>
              <div className="grid grid-cols-4 gap-2">
                {([['bookings', 'Bookings', ClipboardList], ['payments', 'Payouts', Coins], ['customers', 'Customers', Users], ['reports', 'Reports', BarChart3]] as const).map(([id, label, I]) => (
                  <button key={id} onClick={() => handleTabChange(id as AdminNavPage)} className="bg-white border border-slate-200 rounded-2xl py-3 flex flex-col items-center gap-1.5 text-[11px] font-bold text-emerald-700 cursor-pointer">
                    <I className="w-5 h-5" />{label}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900">Recent bookings</h4>
                  <button onClick={() => handleTabChange('bookings')} className="text-xs font-bold text-emerald-700 cursor-pointer">View all</button>
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-2">Nothing here yet</p>
                ) : (
                  <div className="mt-2 divide-y divide-slate-100">
                    {recent.map((b) => (
                      <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{b.customer_name}</p>
                          <p className="text-xs text-slate-500">{b.booking_number}</p>
                        </div>
                        <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-slate-100 text-slate-600 capitalize">{String(b.status).replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* OTHER PAGES SWITCHING */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search name, phone or booking ID"
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
              {bookingSearch && (
                <button
                  onClick={() => setBookingSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { id: 'all', label: 'All', n: bookings.length },
                { id: 'pending', label: 'New', n: bookings.filter((x) => x.status === 'pending').length },
                {
                  id: 'active',
                  label: 'Active',
                  n: bookings.filter((x) => x.status === 'assigned' || x.status === 'on_the_way').length,
                },
                { id: 'completed', label: 'Done', n: bookings.filter((x) => x.status === 'completed').length },
                { id: 'cancelled', label: 'Cancelled', n: bookings.filter((x) => x.status === 'cancelled').length },
              ]
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setStatusFilter(c.id)}
                    className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-extrabold border transition-colors cursor-pointer ${
                      statusFilter === c.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                    <span className="ml-1.5 opacity-70 tabular-nums">{c.n}</span>
                  </button>
                ))}
            </div>

            {/* Day + sort */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 -mt-1">
              {([
                ['today', 'Today'],
                ['tomorrow', 'Tomorrow'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setDayFilter(dayFilter === id ? 'any' : id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                    dayFilter === id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              <label
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                  dayFilter === 'date' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span>Pick date</span>
                <input
                  type="date"
                  value={pickedDate}
                  onChange={(e) => {
                    setPickedDate(e.target.value);
                    setDayFilter(e.target.value ? 'date' : 'any');
                  }}
                  className="bg-transparent outline-none text-[11px] w-[104px]"
                />
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'weight')}
                className="shrink-0 ml-auto px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="weight">Sort: Most weight</option>
              </select>
            </div>

            {/* Booking cards */}
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm font-bold">
                No bookings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredBookings.map((b) => {
                  const chip =
                    b.status === 'completed'
                      ? { bg: '#dcfce7', fg: '#15803d', label: 'Completed' }
                      : b.status === 'cancelled'
                      ? { bg: '#fee2e2', fg: '#b91c1c', label: 'Cancelled' }
                      : b.status === 'on_the_way'
                      ? { bg: '#dbeafe', fg: '#1d4ed8', label: 'On the way' }
                      : b.status === 'assigned'
                      ? { bg: '#e0e7ff', fg: '#4338ca', label: 'Assigned' }
                      : { bg: '#ffedd5', fg: '#c2410c', label: 'New' };
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center">
                          {(b.customer_name || '?').trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-sm text-slate-900 truncate">{b.customer_name}</div>
                          <div className="font-mono text-[11px] text-slate-500 truncate">{b.booking_number}</div>
                        </div>
                        <span
                          className="shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                          style={{ background: chip.bg, color: chip.fg }}
                        >
                          {chip.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                          <div className="text-[10px] font-bold text-slate-400">Item</div>
                          <div className="text-xs font-extrabold text-slate-800 break-words line-clamp-2">
                            {b.expected_scrap_items || 'Scrap'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                          <div className="text-[10px] font-bold text-slate-400">Qty</div>
                          <div className="text-xs font-extrabold text-slate-800 tabular-nums">
                            {b.estimated_weight_kg ? `${b.estimated_weight_kg} KG` : '-'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                          <div className="text-[10px] font-bold text-slate-400">Date</div>
                          <div className="text-xs font-extrabold text-slate-800 break-words">{b.preferred_date}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setViewingBooking(b)}
                          className="flex-1 min-w-0 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenWhatsApp(b)}
                          className="flex-1 min-w-0 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && <UsersManagementTab />}

        {/* CUSTOMER COMPLAINTS TAB */}
        {activeTab === 'tickets' && (() => {
          const counts = {
            open: tickets.filter((t) => ticketViewStatus(t) === 'open').length,
            replied: tickets.filter((t) => ticketViewStatus(t) === 'replied').length,
            resolved: tickets.filter((t) => ticketViewStatus(t) === 'resolved').length,
          };
          const q = ticketSearch.trim().toLowerCase();
          const filteredTickets = tickets
            .filter((t) => ticketFilter === 'all' || ticketViewStatus(t) === ticketFilter)
            .filter(
              (t) =>
                !q ||
                `${t.customer_name || ''} ${t.customer_phone || ''} ${t.ticket_number || ''} ${t.booking_number || ''}`
                  .toLowerCase()
                  .includes(q)
            )
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Customer Complaints</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reply to customers and resolve their issues.</p>
              </div>

              {/* Summary chips - tap karke filter hota hai */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'open', label: 'Open', n: counts.open, cls: 'text-rose-700', ring: 'ring-rose-400' },
                  { id: 'replied', label: 'Replied', n: counts.replied, cls: 'text-amber-700', ring: 'ring-amber-400' },
                  { id: 'resolved', label: 'Resolved', n: counts.resolved, cls: 'text-emerald-700', ring: 'ring-emerald-400' },
                ] as const).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTicketFilter(ticketFilter === c.id ? 'all' : c.id)}
                    className={`rounded-xl border px-2 py-2 text-center transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${c.cls} ${ticketFilter === c.id ? `ring-2 ${c.ring} border-transparent` : ''}`}
                  >
                    <span className="text-lg font-black block leading-tight">{c.n}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search name, phone, ticket or booking..."
                  className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Complaint cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTickets.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {ticketFilter === 'all' && !ticketSearch ? 'No complaints on file!' : 'No complaints match this filter.'}
                    </p>
                    <p className="text-slate-400 mt-1">All customer issues have been resolved.</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const vs = ticketViewStatus(t);
                    return (
                      <div
                        key={t.id}
                        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 ${vs === 'resolved' ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            #{t.ticket_number}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                              vs === 'open'
                                ? 'bg-rose-100 text-rose-700 border-rose-300'
                                : vs === 'replied'
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            }`}
                          >
                            {vs}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] font-bold text-slate-500">
                          <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                            {COMPLAINT_CATEGORY_LABELS[t.complaint_category || 'other']}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              t.priority === 'high' ? 'bg-rose-600' : t.priority === 'medium' ? 'bg-amber-600' : 'bg-slate-500'
                            }`}
                          />
                          {(t.priority || 'low').toUpperCase()}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <strong className="text-slate-900 dark:text-white block text-sm">{t.customer_name || 'Customer'}</strong>
                            <span className="text-slate-500 font-mono text-[11px]">{t.customer_phone}</span>
                          </div>
                          {t.customer_phone && (
                            <a
                              href={`tel:${t.customer_phone}`}
                              className="text-[10.5px] font-extrabold text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full"
                            >
                              Call
                            </a>
                          )}
                        </div>

                        {t.booking_number && (
                          <div>
                            <span className="text-[10.5px] font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-md">
                              Booking: {t.booking_number}
                            </span>
                          </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">{t.subject}</span>
                          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mt-0.5">{t.description}</p>
                        </div>

                        {t.admin_reply && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 rounded-xl">
                            <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 block mb-0.5">
                              Your reply
                            </span>
                            <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">{t.admin_reply}</p>
                          </div>
                        )}

                        {selectedTicketForReply === t.id ? (
                          <div className="border-2 border-emerald-600 rounded-xl p-3 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2">
                            <textarea
                              value={replyInputText}
                              onChange={(e) => setReplyInputText(e.target.value)}
                              rows={3}
                              placeholder="Type your reply to the customer..."
                              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_TICKET_REPLIES.map((qr) => (
                                <button
                                  key={qr}
                                  onClick={() => setReplyInputText(qr)}
                                  className="text-[10px] font-bold text-emerald-700 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full cursor-pointer"
                                >
                                  {qr}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                              Customer sees this reply in their Tickets tab. Status changes to "Replied" automatically.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (replyInputText.trim()) {
                                    replyToTicket(t.id, replyInputText.trim());
                                    setSelectedTicketForReply(null);
                                    setReplyInputText('');
                                  }
                                }}
                                disabled={!replyInputText.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send Reply</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTicketForReply(null);
                                  setReplyInputText('');
                                }}
                                className="text-slate-500 border border-slate-200 dark:border-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            {vs === 'resolved' ? (
                              <>
                                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                  Resolved · {timeAgo(t.resolved_at || t.created_at)}
                                </span>
                                <button
                                  onClick={() => reopenTicket(t.id)}
                                  className="text-slate-500 border border-slate-200 dark:border-slate-700 font-bold text-[10.5px] px-2.5 py-1 rounded-lg cursor-pointer"
                                >
                                  Reopen
                                </button>
                              </>
                            ) : vs === 'replied' ? (
                              <>
                                <span className="text-[10px] text-slate-400">{timeAgo(t.created_at)}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => closeTicket(t.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    Mark Resolved
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTicketForReply(t.id);
                                      setReplyInputText(t.admin_reply || '');
                                    }}
                                    className="bg-white dark:bg-slate-900 text-emerald-700 border-[1.5px] border-emerald-600 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    Reply Again
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] text-slate-400">{timeAgo(t.created_at)}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => closeTicket(t.id)}
                                    className="bg-white dark:bg-slate-900 text-emerald-700 border-[1.5px] border-emerald-600 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    Resolve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTicketForReply(t.id);
                                      setReplyInputText(t.admin_reply || '');
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    Reply Customer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* SCRAP CATEGORIES TAB */}
        {activeTab === 'categories' && <ScrapCategoriesTab />}

        {/* SERVICE AREAS TAB */}
        {activeTab === 'areas' && <ServiceAreasTab />}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && <PaymentsTab />}

        {/* REPORTS & ANALYTICS TAB */}
        {activeTab === 'reports' && <ReportsAnalyticsTab />}

        {/* ADMIN & Hierarchy TAB */}
        {activeTab === 'admins' && <AdminRolesTab />}

        {/* SYSTEM SETTINGS TAB */}
        {activeTab === 'settings' && <SystemSettingsTab />}

        {activeTab === 'blocked' && <BlockedNumbersTab />}

        {/* DUAL APPROVAL CENTER */}
        {activeTab === 'approvals' && <ApprovalCenterTab />}

        {/* SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && <AuditLogsTab />}
          </>
        )}

      </main>

      {/* BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        {([['dashboard', 'Home', Home], ['bookings', 'Bookings', ClipboardList], ['payments', 'Payouts', Coins], ['customers', 'Customers', Users]] as const).map(([id, label, I]) => (
          <button key={id} onClick={() => handleTabChange(id as AdminNavPage)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold cursor-pointer ${activeTab === id ? 'text-emerald-700' : 'text-slate-500'}`}>
            <I className="w-5 h-5" />{label}
          </button>
        ))}
        <button onClick={() => setIsDrawerOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-slate-500 cursor-pointer">
          <Menu className="w-5 h-5" />More
        </button>
      </div>

      {/* 4. BOOKING DETAIL MODAL */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                  Request ID: {viewingBooking.booking_number}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Pickup Request Details
                </h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{viewingBooking.customer_name}</p>
                <p className="text-slate-500 font-medium">{viewingBooking.customer_phone}</p>
                <p className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                  📍 {viewingBooking.pickup_address} {viewingBooking.pickup_landmark ? `(Landmark: ${viewingBooking.pickup_landmark})` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Items & Category</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">
                    {viewingBooking.expected_scrap_items || 'Scrap Material'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Quantity / Est. Weight</span>
                  <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">
                    {viewingBooking.estimated_weight_kg ? `${viewingBooking.estimated_weight_kg} KG` : '25 KG'}
                  </span>
                </div>
              </div>

              {/* QR Screenshot if attached */}
              {viewingBooking.upi_qr_url && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-950 dark:text-emerald-200">Customer Attached Payment QR</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Attached for payout disbursal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(viewingBooking.upi_qr_url, '_blank')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                  >
                    View QR Image
                  </button>
                </div>
              )}

              {/* Status Update Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Update Booking Operational Status
                </label>
                <select
                  value={viewingBooking.status}
                  onChange={(e: any) => {
                    updateBookingOperationalStatus(viewingBooking.id, e.target.value);
                    setViewingBooking({ ...viewingBooking, status: e.target.value });
                    showToast('success', `Status updated to ${e.target.value}`);
                  }}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="cancelled">Rejected / Cancelled</option>
                  <option value="assigned">Accepted (Driver Assigned)</option>
                  <option value="on_the_way">Confirmed (On The Way)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleOpenWhatsApp(viewingBooking)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp Contact</span>
                </button>
                <button
                  onClick={() => setViewingBooking(null)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};


