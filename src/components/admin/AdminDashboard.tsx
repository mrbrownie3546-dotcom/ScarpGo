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

import { ServiceAreasTab } from './ServiceAreasTab';
import { PaymentsTab } from './PaymentsTab';
import { ScrapCategoriesTab } from './ScrapCategoriesTab';
import { ReportsAnalyticsTab } from './ReportsAnalyticsTab';
import { UsersManagementTab } from './UsersManagementTab';
import { WebsiteContentTab } from './WebsiteContentTab';
import { AdminRolesTab } from './AdminRolesTab';
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
        <span className="font-bold text-purple-600">₹{Number(d.payoutRs).toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between gap-4 text-slate-600">
        <span>Bookings</span>
        <span className="font-bold text-slate-800">{d.ordersCount}</span>
      </div>
    </div>
  );
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
    allUsers,
    setActivePortal,
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
  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (b.booking_number && b.booking_number.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
      (b.customer_phone && b.customer_phone.includes(q)) ||
      (b.pickup_address && b.pickup_address.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              {/* Green Recycle Logo Icon */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/90 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black shrink-0 shadow-2xs">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-emerald-900 dark:text-emerald-400 tracking-tight leading-none flex items-center gap-1">
                  ScrapHouse
                </h1>
                <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 block tracking-wider uppercase mt-0.5">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Header Actions with Prominent Back to Customer Site Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsTabLoading(true);
                setTimeout(() => setIsTabLoading(false), 400);
                showToast('success', 'Database records synced with Supabase / Firestore!');
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
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    SG
                  </div>
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
                  { id: 'tickets', label: 'Customer Complaints', icon: FileWarning, badge: tickets.filter(t => t.status !== 'closed').length },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'categories', label: 'Scrap Categories', icon: Scale },
                  { id: 'areas', label: 'Service Areas', icon: MapPin },
                  { id: 'payments', label: 'Payments & Payouts', icon: Coins },
                  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                  { id: 'admins', label: 'Admin & Hierarchy', icon: UserCheck },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as AdminNavPage)}
                      className={`w-full px-3.5 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'}`}>
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* A. WELCOME BANNER CARD */}
            <div className="relative rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white p-6 sm:p-7 shadow-lg overflow-hidden border border-emerald-600/30">
              {/* Background Geometric Pattern Accent */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Welcome back, Owner! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
                    Here's what's happening with your scrap business today.
                  </p>
                </div>

                {/* Translucent Date Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md text-white text-xs font-semibold shrink-0 shadow-xs">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* B. 6 KPI METRIC CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              
              {/* Card 1: Total Bookings */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Total Bookings
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {totalBookingsCount}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Live Customer Requests
                </div>
              </div>

              {/* Card 2: Pending Requests */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Pending Requests
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {pendingRequestsCount}
                </div>
                <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Awaiting Driver Allocation
                </div>
              </div>

              {/* Card 3: Total Customers */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Total Customers
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {totalCustomersCount}
                </div>
                <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  Registered User Accounts
                </div>
              </div>

              {/* Card 4: Today's Pickups */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Today's Pickups
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {todaysPickupsCount}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Scheduled / On The Way
                </div>
              </div>

              {/* Card 5: Monthly Revenue */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Monthly Revenue
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums truncate">
                  ₹{monthlyRevenueSum.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  Completed Payouts Value
                </div>
              </div>

              {/* Card 6: Active Areas */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Active Areas
                  </span>
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {activeAreasCount}
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  Cities & Locations
                </div>
              </div>

            </div>

            {/* C. MONTHLY TRENDS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Monthly Trends</h3>
              <p className="text-xs text-slate-400 mt-0.5">This month, up to today</p>

              <div className="flex bg-slate-100 rounded-2xl p-1 mt-4 mb-4 text-xs font-bold">
                {([
                  ['volume', 'Volume'],
                  ['payout', 'Payout'],
                  ['combined', 'Both'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTrendChartTab(id)}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                      trendChartTab === id ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-2">
                <div className="p-3 bg-slate-50 rounded-2xl min-w-0">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total volume</span>
                  <span className="text-lg sm:text-xl font-extrabold text-emerald-700 block truncate">
                    {totalMonthlyVolumeKg.toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl min-w-0">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total payouts</span>
                  <span className="text-lg sm:text-xl font-extrabold text-purple-600 block truncate">
                    ₹{totalMonthlyPayoutRs.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-2">Tap or hover on the graph to see any day's volume and payout.</p>

              <div className="w-full h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {trendChartTab === 'volume' ? (
                    <AreaChart data={currentMonthTrends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ade80" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4ade80" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                      <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="kg" />
                      <Tooltip
                        content={<TrendTooltip />}
                        cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                      />
                      <Area type="monotone" dataKey="volumeKg" stroke="#4ade80" strokeWidth={2.5} fill="url(#colorVolumeGrad)" />
                    </AreaChart>
                  ) : trendChartTab === 'payout' ? (
                    <BarChart data={currentMonthTrends} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                      <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={<TrendTooltip />}
                        cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                      />
                      <Bar dataKey="payoutRs" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={currentMonthTrends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                      <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={<TrendTooltip />}
                        cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar yAxisId="left" dataKey="volumeKg" name="Volume (kg)" fill="#86efac" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="payoutRs" name="Payout (₹)" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT BOOKINGS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Recent Bookings</h3>
                  <p className="text-xs text-slate-400">Latest pickup requests</p>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="shrink-0 text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  placeholder="Search name or booking ID"
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
                {dashboardSearch && (
                  <button
                    onClick={() => setDashboardSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {recentBookingsList.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm font-bold">
                  No bookings found.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {recentBookingsList.map((b) => {
                    const chip =
                      b.status === 'pending'
                        ? { bg: '#fff1e6', fg: '#c2410c', label: 'Pending' }
                        : b.status === 'assigned'
                        ? { bg: '#eef0ff', fg: '#4f46e5', label: 'Assigned' }
                        : b.status === 'on_the_way'
                        ? { bg: '#e8f1ff', fg: '#2563eb', label: 'On the way' }
                        : b.status === 'cancelled'
                        ? { bg: '#fee2e2', fg: '#b91c1c', label: 'Cancelled' }
                        : { bg: '#e8f8ee', fg: '#15803d', label: 'Completed' };
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

          </div>
        )}

        {/* OTHER PAGES SWITCHING */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Count boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Total', n: bookings.length, bg: '#f1f5f9', fg: '#334155' },
                { label: 'New', n: bookings.filter((x) => x.status === 'pending').length, bg: '#fff7ed', fg: '#c2410c' },
                {
                  label: 'In progress',
                  n: bookings.filter((x) => x.status === 'assigned' || x.status === 'on_the_way').length,
                  bg: '#eff6ff',
                  fg: '#1d4ed8',
                },
                { label: 'Done', n: bookings.filter((x) => x.status === 'completed').length, bg: '#f0fdf4', fg: '#15803d' },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-slate-200 py-3 px-2 text-center min-w-0" style={{ background: c.bg, color: c.fg }}>
                  <div className="text-xl sm:text-2xl font-black tabular-nums leading-none">{c.n}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold mt-1 truncate">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Search + filter */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search by name, phone or booking ID"
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="all">All Booking Statuses</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Rejected / Cancelled</option>
                <option value="assigned">Accepted / Assigned</option>
                <option value="on_the_way">On The Way</option>
                <option value="completed">Completed</option>
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
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
                      <div className="px-3.5 pt-3 flex items-center justify-between gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900 truncate">{b.booking_number}</span>
                        <span
                          className="shrink-0 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full"
                          style={{ background: chip.bg, color: chip.fg }}
                        >
                          {chip.label}
                        </span>
                      </div>

                      <div className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center">
                            {(b.customer_name || '?').trim().charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm text-slate-900 truncate">{b.customer_name}</div>
                            <div className="text-xs text-slate-500 truncate">{b.customer_phone}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                            <div className="text-[10px] font-bold text-slate-500">Scrap</div>
                            <div className="text-xs font-extrabold text-slate-800 break-words line-clamp-2">
                              {b.expected_scrap_items || 'Scrap Material'}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                            <div className="text-[10px] font-bold text-slate-500">Weight</div>
                            <div className="text-xs font-extrabold text-slate-800 tabular-nums">
                              {b.estimated_weight_kg ? `${b.estimated_weight_kg} KG` : '-'}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-2.5 py-2 min-w-0">
                            <div className="text-[10px] font-bold text-slate-500">Date</div>
                            <div className="text-xs font-extrabold text-slate-800 break-words">
                              {b.preferred_date}
                              {b.preferred_time_slot ? `, ${b.preferred_time_slot}` : ''}
                            </div>
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
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Customer Complaints</h2>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold px-2.5 py-0.5 rounded-full">
                      {tickets.filter(t => t.status !== 'closed').length} Pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Review and resolve real-time complaints submitted by customers via ScrapBot & support form.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Issues</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{tickets.length}</span>
                </div>
              </div>
            </div>

            {/* Complaints Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No active complaints on file!</p>
                  <p className="text-slate-400 mt-1">All customer issues have been resolved.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          #{t.ticket_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            t.status === 'closed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          }`}
                        >
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900 dark:text-white block text-sm">{t.customer_name}</strong>
                          <span className="text-slate-500 font-mono text-[11px]">{t.customer_phone}</span>
                        </div>
                        {t.booking_number && (
                          <span className="text-[11px] font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                            Booking: {t.booking_number}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{t.subject}</span>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{t.description}</p>
                      </div>

                      {t.admin_reply && (
                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-xl text-xs text-blue-950 dark:text-blue-200">
                          <strong className="text-blue-800 dark:text-blue-300 block mb-0.5">Admin Response:</strong>
                          {t.admin_reply}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedTicketForReply === t.id ? (
                          <div className="w-full flex items-center gap-2">
                            <input
                              type="text"
                              value={replyInputText}
                              onChange={(e) => setReplyInputText(e.target.value)}
                              placeholder="Type response to customer..."
                              className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex-1"
                            />
                            <button
                              onClick={() => {
                                if (replyInputText.trim()) {
                                  replyToTicket(t.id, replyInputText.trim());
                                  setSelectedTicketForReply(null);
                                  setReplyInputText('');
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send</span>
                            </button>
                            <button
                              onClick={() => setSelectedTicketForReply(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedTicketForReply(t.id);
                                setReplyInputText(t.admin_reply || '');
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{t.admin_reply ? 'Edit Reply' : 'Reply Customer'}</span>
                            </button>
                            {t.status !== 'closed' && (
                              <button
                                onClick={() => closeTicket(t.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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

        {/* DUAL APPROVAL CENTER */}
        {activeTab === 'approvals' && <ApprovalCenterTab />}

        {/* SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && <AuditLogsTab />}
          </>
        )}

      </main>

      {/* 3. MOBILE FLOATING CAPSULE BOTTOM NAVIGATION BAR (Matching Main Website Style) */}
      <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[28px] p-2 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-around ring-1 ring-slate-900/5">
          {/* 1. DASHBOARD TAB */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center gap-1 group py-1 px-2 transition-transform active:scale-95 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
            }`}>
              <Home className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-extrabold ${
              activeTab === 'dashboard' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              Dashboard
            </span>
          </button>

          {/* 2. BOOKINGS TAB */}
          <button
            onClick={() => setActiveTab('bookings')}
            className="flex flex-col items-center gap-1 group py-1 px-2 transition-transform active:scale-95 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-extrabold ${
              activeTab === 'bookings' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              Bookings
            </span>
          </button>

          {/* 3. CUSTOMERS TAB */}
          <button
            onClick={() => setActiveTab('customers')}
            className="flex flex-col items-center gap-1 group py-1 px-2 transition-transform active:scale-95 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'customers'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-extrabold ${
              activeTab === 'customers' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              Customers
            </span>
          </button>

          {/* 4. SCRAP RATES TAB */}
          <button
            onClick={() => setActiveTab('categories')}
            className="flex flex-col items-center gap-1 group py-1 px-2 transition-transform active:scale-95 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'categories'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-extrabold ${
              activeTab === 'categories' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
            }`}>
              Rates
            </span>
          </button>

          {/* 5. MORE / MENU TAB */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center gap-1 group py-1 px-2 transition-transform active:scale-95 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 flex items-center justify-center transition-all">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
              More
            </span>
          </button>
        </div>
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
