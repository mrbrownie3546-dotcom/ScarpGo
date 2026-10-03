import React, { useState } from 'react';
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
  } = useScrap();

  // Active Tab / Page navigation state
  type AdminNavPage =
    | 'dashboard'
    | 'bookings'
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

  // Drawer / Mobile Sidebar State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Booking Analytics Chart Period Filter
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '3months'>('7days');

  // Booking detail view modal state
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Search & Filter for Bookings page
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Feedback Notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Calculated Stats matching visual preview
  const totalBookingsCount = bookings.length || 248;
  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length || 18;
  const totalCustomersCount = 186;
  const todaysPickupsCount = bookings.filter((b) => b.status === 'assigned' || b.status === 'on_the_way').length || 12;
  const monthlyRevenueSum = payouts
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0) || 124500;
  const activeAreasCount = serviceAreas.filter((a) => a.is_active).length || 24;

  // Filtered Bookings list for Bookings tab
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.booking_number.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customer_phone.includes(bookingSearch) ||
      b.pickup_address.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Recent 5 bookings sample matching mockup
  const recentBookingsList = bookings.slice(0, 5);

  // WhatsApp click handler
  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`Hello ${name}, this is ScrapGo Admin regarding your scrap pickup booking request.`);
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className={`min-h-screen w-full font-sans transition-colors ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-[#F4F6F8] text-slate-900'}`}>
      
      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Hamburger + ScrapGo Admin Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              {/* Green Recycle Logo Icon */}
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight leading-none flex items-center gap-1">
                  ScrapGo
                </h1>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block tracking-wider uppercase">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Right: Notifications + Admin Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setActiveTab('approvals')}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse" />
              </button>
            </div>

            {/* Admin Avatar Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={currentAdmin.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt="Admin Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  Admin
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  {currentAdmin.adminRole || 'Super Admin'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
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
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">ScrapGo Admin</span>
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
                      onClick={() => {
                        setActiveTab(item.id as AdminNavPage);
                        setIsDrawerOpen(false);
                      }}
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
                    Welcome back, Admin! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
                    Here's what's happening with your scrap business today.
                  </p>
                </div>

                {/* Translucent Date Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md text-white text-xs font-semibold shrink-0 shadow-xs">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>Sun, 28 Sep 2025</span>
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>12% <span className="font-normal text-slate-400">vs. last week</span></span>
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>5% <span className="font-normal text-slate-400">vs. last week</span></span>
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>8% <span className="font-normal text-slate-400">vs. last month</span></span>
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>20% <span className="font-normal text-slate-400">vs. yesterday</span></span>
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>18% <span className="font-normal text-slate-400">vs. last month</span></span>
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

            {/* D. RECENT BOOKING REQUESTS TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Recent Booking Requests
                    </h3>
                    <p className="text-xs text-slate-500">Live doorstep collection requests</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 w-10 text-center">#</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Item</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {recentBookingsList.map((b, idx) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 shrink-0">
                              <img
                                src={`https://images.unsplash.com/photo-${1500000000000 + idx * 100000}?auto=format&fit=crop&q=80&w=100`}
                                onError={(e: any) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';
                                }}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>{b.customer_name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {b.expected_scrap_items || 'Scrap Material'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white tabular-nums">
                          {b.estimated_weight_kg ? `${b.estimated_weight_kg} KG` : '25 KG'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                              b.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : b.status === 'assigned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'on_the_way'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-200 text-emerald-950'
                            }`}
                          >
                            {b.status === 'pending' ? 'Pending' : b.status === 'assigned' ? 'Accepted' : b.status === 'on_the_way' ? 'Confirmed' : 'Completed'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {b.preferred_date}, {b.preferred_time_slot?.split('-')[0] || '10:30 AM'}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewingBooking(b)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenWhatsApp(b.customer_phone, b.customer_name)}
                              className="p-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                              title="Contact Customer via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* OTHER PAGES SWITCHING */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search customer, phone or booking #..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">All Booking Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Accepted / Assigned</option>
                  <option value="on_the_way">On The Way</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Booking ID</th>
                      <th className="p-3.5">Customer Details</th>
                      <th className="p-3.5">Scrap Category</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white font-mono">
                          {b.booking_number}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{b.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{b.customer_phone}</div>
                        </td>
                        <td className="p-3.5 font-bold">
                          {b.expected_scrap_items || 'Scrap Material'}
                        </td>
                        <td className="p-3.5 font-bold tabular-nums">
                          {b.estimated_weight_kg ? `${b.estimated_weight_kg} KG` : '25 KG'}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {b.preferred_date}, {b.preferred_time_slot}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              b.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : b.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewingBooking(b)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-all cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleOpenWhatsApp(b.customer_phone, b.customer_name)}
                              className="p-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && <UsersManagementTab />}

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

      </main>

      {/* 3. MOBILE BOTTOM THUMB NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'bookings' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px]">Bookings</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'customers' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'categories' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px]">Scrap Rates</span>
        </button>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

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
                  <option value="assigned">Accepted (Driver Assigned)</option>
                  <option value="on_the_way">Confirmed (On The Way)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Rejected / Cancelled</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleOpenWhatsApp(viewingBooking.customer_phone, viewingBooking.customer_name)}
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
