import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserRole } from '../../types/scrapgo';
import {
  Recycle,
  Truck,
  ShieldAlert,
  Bell,
  Database,
  Flame,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  User,
  Sparkles,
  PhoneCall,
  Clock,
  RotateCcw,
  LogIn,
  LogOut,
  Smartphone,
  Menu,
  X,
  Leaf,
  Sun,
  Moon,
} from 'lucide-react';
import { FirebaseModal } from './FirebaseModal';
import { AuthModal } from './AuthModal';
import { ScrapGoMenuDrawer } from './ScrapGoMenuDrawer';

export const Header: React.FC = () => {
  const {
    activePortal,
    setActivePortal,
    language,
    theme,
    toggleTheme,
    t,
    currentUser,
    logoutUser,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    supabaseConnected,
    selectedStaffAgent,
    setSelectedStaffAgent,
    staffList,
    resetToSampleData,
    bookings,
  } = useScrap();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('customer');
  const [authAllowedRoles, setAuthAllowedRoles] = useState<UserRole[]>(['customer', 'staff']);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const pendingPayoutsCount = bookings.filter((b) => b.payout_status === 'pending_approval' && b.status === 'completed').length;

  return (
    <>
      {/* Top Banner / System Portal Bar (Hidden on Customer view, only visible to Staff/Admin) */}
      {activePortal !== 'customer' && (
        <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Subdomain / Portal Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium hidden sm:inline">Active Portal:</span>
            <div className="inline-flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 shadow-inner">
              <button
                onClick={() => setActivePortal('customer')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                <Recycle className="w-3.5 h-3.5 text-emerald-300" />
                <span>scrapgo.in</span>
                <span className="text-[10px] opacity-75 hidden md:inline">(Customer)</span>
              </button>

              <button
                onClick={() => setActivePortal('staff')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                  activePortal === 'staff'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>staff.scrapgo.in</span>
                <span className="text-[10px] opacity-75 hidden md:inline">(Driver App)</span>
              </button>

              <button
                onClick={() => setActivePortal('admin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                  activePortal === 'admin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-300" />
                <span>admin.scrapgo.in</span>
                {pendingPayoutsCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingPayoutsCount}
                  </span>
                )}
                <span className="text-[10px] opacity-75 hidden md:inline">(Admin)</span>
              </button>
            </div>
          </div>

          {/* Right Action Badges */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Firebase Status Pill */}
            <button
              onClick={() => setShowSupabaseModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors border bg-orange-950/60 border-orange-500/40 text-orange-300 hover:bg-orange-900/60"
              title="Click to view Firebase Auth & Firestore Status"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Firebase Active</span>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            </button>

            {/* Supabase User & Phone OTP Login Button */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-emerald-400">
                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="max-w-[100px] truncate">{currentUser.full_name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] font-black uppercase px-1 rounded ${
                    currentUser.role === 'admin'
                      ? 'bg-blue-900/80 text-blue-300'
                      : currentUser.role === 'staff'
                      ? 'bg-amber-900/80 text-amber-300'
                      : 'bg-emerald-900/80 text-emerald-300'
                  }`}
                >
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="p-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900">{currentUser.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{currentUser.phone}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full inline-block mt-1 uppercase">
                      Role: {currentUser.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Login with Another Phone/OTP</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logoutUser();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset sample data button */}
            <button
              onClick={() => {
                if (confirm('Reset SCRAPGO data back to initial sample state?')) {
                  resetToSampleData();
                }
              }}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title="Reset sample demo bookings & rates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm">System Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-slate-300 hover:text-white underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                            !n.read ? 'bg-emerald-50/60' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.type === 'payout' ? (
                              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg inline-block">💰</span>
                            ) : n.type === 'staff' ? (
                              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg inline-block">🚚</span>
                            ) : n.type === 'booking' ? (
                              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg inline-block">📦</span>
                            ) : (
                              <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg inline-block">⚡</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{n.title}</p>
                            <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Main Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Portal Identity - Exactly as in user screenshot */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActivePortal('customer')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-600/30 bg-emerald-50/50 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6 fill-emerald-600/20 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Scrap<span className="text-[#15803d]">Go</span>
                </div>
                <div className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                  {t('tagline', 'BUY • SELL • RECYCLE')}
                </div>
              </div>
            </div>
          </div>

          {/* Center portal specific badges for desktop */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
            {activePortal === 'customer' && (
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {t('free_pickup', 'Free Doorstep Pickup')}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {t('certified_weighing', 'Certified Digital Weighing')}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {t('instant_payout', 'Instant UPI / Cash Payout')}
                </span>
              </div>
            )}

            {activePortal === 'staff' && (
              <div className="relative">
                <button
                  onClick={() => setShowStaffSelector(!showStaffSelector)}
                  className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold hover:bg-amber-100 transition-colors"
                >
                  <img
                    src={selectedStaffAgent.avatar_url}
                    alt={selectedStaffAgent.full_name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>Logged in as: <strong>{selectedStaffAgent.full_name}</strong></span>
                  <span className="text-xs bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">{selectedStaffAgent.vehicle_number?.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showStaffSelector && (
                  <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2">
                    <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase">Switch Staff Driver</p>
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => {
                          setSelectedStaffAgent(staff);
                          setShowStaffSelector(false);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedStaffAgent.id === staff.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <img src={staff.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-800 font-medium">{staff.full_name}</p>
                          <p className="text-[10px] text-slate-500">{staff.vehicle_number}</p>
                        </div>
                        {selectedStaffAgent.id === staff.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePortal === 'admin' && (
              <div className="flex items-center gap-3">
                <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Super Admin Console
                </span>
                {pendingBookingsCount > 0 && (
                  <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">
                    {pendingBookingsCount} Pickups Need Driver
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls matching screenshot */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs shadow-inner">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            {activePortal === 'customer' ? (
              <>
                <button
                  onClick={() => {
                    const el = document.getElementById('pickup-modal-trigger');
                    if (el) el.click();
                  }}
                  className="bg-[#15803d] hover:bg-[#126b34] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>{t('book_btn', 'Book')}</span>
                </button>

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePortal('customer')}
                  className="bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-lg"
                >
                  {t('back_to_customer', 'Back to Customer Site')}
                </button>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ScrapGo Drawer Menu matching user screenshot */}
      {showMobileMenu && (
        <ScrapGoMenuDrawer
          onClose={() => setShowMobileMenu(false)}
          onOpenCustomerStaffLogin={() => {
            setAuthAllowedRoles(['customer', 'staff']);
            setAuthInitialRole('customer');
            setShowAuthModal(true);
          }}
          onOpenAdminLogin={() => {
            setAuthAllowedRoles(['admin']);
            setAuthInitialRole('admin');
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Firebase Status & Connection Modal */}
      {showSupabaseModal && (
        <FirebaseModal onClose={() => setShowSupabaseModal(false)} />
      )}

      {/* Supabase Phone OTP Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          initialRole={authInitialRole}
          allowedRoles={authAllowedRoles}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};
