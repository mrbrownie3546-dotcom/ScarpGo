import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { Booking, PayoutRecord, ScrapCategory, SupportTicket, AdminRole, AdminUser } from '../../types/scrapgo';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  Coins,
  CheckCircle2,
  Clock,
  MapPin,
  Scale,
  CreditCard,
  Banknote,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Send,
  UserCheck,
  AlertCircle,
  Database,
  ArrowUpRight,
  TrendingUp,
  FileText,
  LifeBuoy,
  X,
  ExternalLink,
  Users,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApprovalCenterTab } from './ApprovalCenterTab';
import { AuditLogsTab } from './AuditLogsTab';
import { AdminRolesTab } from './AdminRolesTab';
import { UsersManagementTab } from './UsersManagementTab';
import { WebsiteContentTab } from './WebsiteContentTab';
import { SystemSettingsTab } from './SystemSettingsTab';
import { AdminConfirmModal } from './AdminConfirmModal';

export const AdminDashboard: React.FC = () => {
  const {
    bookings,
    assignStaffToBooking,
    staffList,
    payouts,
    approvePayout,
    rejectPayout,
    updatePayoutAmount,
    updatePayoutStatusRecord,
    updateBookingOperationalStatus,
    categories,
    updateScrapItemRate,
    addCategory,
    toggleCategoryStatus,
    tickets,
    replyToTicket,
    closeTicket,
    currentAdmin,
    setCurrentAdmin,
    adminList,
    staffMembers,
    canPerform,
    approvalRequests,
    systemSettings,
    supabaseConnected,
  } = useScrap();

  type AdminTabType =
    | 'bookings'
    | 'payouts'
    | 'rates'
    | 'users'
    | 'content'
    | 'admins'
    | 'approvals'
    | 'audit'
    | 'settings'
    | 'fleet'
    | 'support';

  const [activeTab, setActiveTab] = useState<AdminTabType>('bookings');

  // Search & Filters for bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Rate edit modal state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<number>(0);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedCatForRate, setSelectedCatForRate] = useState<ScrapCategory | null>(null);

  // Payout amount edit modal state
  const [payoutAmountModalOpen, setPayoutAmountModalOpen] = useState(false);
  const [selectedPayoutForEdit, setSelectedPayoutForEdit] = useState<PayoutRecord | null>(null);
  const [newPayoutAmountInput, setNewPayoutAmountInput] = useState<number>(0);

  // Booking cancel modal state (Level 2 Action)
  const [bookingCancelModalOpen, setBookingCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);

  // Payout mark Paid modal state (Level 3 High-Risk Action)
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedPayoutForPaid, setSelectedPayoutForPaid] = useState<PayoutRecord | null>(null);
  const [transferRefInput, setTransferRefInput] = useState('');

  // Ticket reply modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // New category modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRate, setNewCatRate] = useState<number>(30);
  const [newCatUnit, setNewCatUnit] = useState('kg');
  const [newCatType, setNewCatType] = useState<'metal' | 'paper' | 'plastic' | 'e-waste' | 'appliance'>('metal');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stats
  const totalBookings = bookings.length;
  const totalWeightCollected = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.final_weight_kg || 0), 0);

  const pendingPayouts = payouts.filter((p) => p.status === 'pending_approval');
  const pendingPayoutsAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const totalPayoutsDisbursed = payouts
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovalsCount = approvalRequests.filter((r) => r.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'closed').length;

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.booking_number.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.pickup_address.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action Permissions Checks
  const canManagePickups = canPerform('manage_pickups', 'pickups').allowed;
  const canManagePayouts = canPerform('manage_payouts', 'payouts').allowed;
  const canManageRates = canPerform('manage_rates', 'rates').allowed;
  const canManageUsers = canPerform('manage_users', 'users').allowed;
  const canManageContent = canPerform('manage_content', 'content').allowed;
  const canManageAdmins = canPerform('manage_admins', 'admins').allowed;
  const canManageSettings = canPerform('manage_settings', 'settings').allowed;
  const isViewOnly = currentAdmin.adminRole === 'VIEW_ONLY_ADMIN';

  // Handlers for Operational Bookings
  const handleAssignStaff = (bookingId: string, staffId: string) => {
    if (!canManagePickups) {
      showToast('error', 'Permission Denied: Sub-admin role cannot assign pickup staff.');
      return;
    }
    assignStaffToBooking(bookingId, staffId);
    showToast('success', 'Pickup assigned to field driver successfully.');
  };

  const handleUpdateBookingStatus = (bookingId: string, status: any) => {
    if (!canManagePickups) {
      showToast('error', 'Permission Denied: Sub-admin role cannot change operational pickup statuses.');
      return;
    }
    const res = updateBookingOperationalStatus(bookingId, status);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handleOpenCancelBooking = (booking: Booking) => {
    if (!canManagePickups) {
      showToast('error', 'Permission Denied: Only authorized logistics admins can cancel bookings.');
      return;
    }
    setSelectedBookingForCancel(booking);
    setBookingCancelModalOpen(true);
  };

  const handleConfirmCancelBooking = (reason: string) => {
    if (!selectedBookingForCancel) return;
    const res = updateBookingOperationalStatus(selectedBookingForCancel.id, 'cancelled', reason);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
    setBookingCancelModalOpen(false);
    setSelectedBookingForCancel(null);
  };

  // Handlers for Financial Payouts
  const handleOpenEditPayoutAmount = (payout: PayoutRecord) => {
    if (!canManagePayouts) {
      showToast('error', 'Permission Denied: Only PAYOUT_ADMIN and MAIN_ADMIN can modify financial amounts.');
      return;
    }
    if (payout.status === 'successful' && currentAdmin.adminRole !== 'MAIN_ADMIN') {
      showToast('error', 'Paid Record Protected: Completed payouts cannot be edited without Main Admin exception.');
      return;
    }
    setSelectedPayoutForEdit(payout);
    setNewPayoutAmountInput(payout.amount);
    setPayoutAmountModalOpen(true);
  };

  const handleConfirmPayoutAmountChange = (reason: string) => {
    if (!selectedPayoutForEdit) return;
    const res = updatePayoutAmount(selectedPayoutForEdit.id, Number(newPayoutAmountInput), reason);
    if (res.success) {
      showToast('success', res.message);
      if (res.requiresApproval) {
        setActiveTab('approvals');
      }
    } else {
      showToast('error', res.message);
    }
    setPayoutAmountModalOpen(false);
    setSelectedPayoutForEdit(null);
  };

  const handleOpenMarkPaid = (payout: PayoutRecord) => {
    if (!canManagePayouts) {
      showToast('error', 'Permission Denied: Sub-admin cannot authorize financial disbursements.');
      return;
    }
    setSelectedPayoutForPaid(payout);
    setTransferRefInput(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = (reason: string) => {
    if (!selectedPayoutForPaid) return;
    const res = updatePayoutStatusRecord(
      selectedPayoutForPaid.id,
      'successful',
      transferRefInput,
      reason || 'Disbursed via instant bank transfer'
    );
    if (res.success) {
      showToast('success', res.message);
      try {
        confetti({ particleCount: 60, spread: 50, colors: ['#10b981', '#3b82f6'] });
      } catch (e) {
        // ignore
      }
    } else {
      showToast('error', res.message);
    }
    setMarkPaidModalOpen(false);
    setSelectedPayoutForPaid(null);
  };

  // Handlers for Scrap Rates
  const handleOpenRateModal = (cat: ScrapCategory) => {
    if (!canManageRates) {
      showToast('error', 'Permission Denied: Only MAIN_ADMIN can modify master scrap rates.');
      return;
    }
    setSelectedCatForRate(cat);
    setEditingRate(cat.rate_per_kg);
    setRateModalOpen(true);
  };

  const handleConfirmRateChange = (reason: string) => {
    if (!selectedCatForRate) return;
    const res = updateScrapItemRate(selectedCatForRate.id, Number(editingRate), reason);
    if (res.success) {
      showToast('success', res.message);
      if (res.requiresApproval) {
        setActiveTab('approvals');
      }
    } else {
      showToast('error', res.message);
    }
    setRateModalOpen(false);
    setSelectedCatForRate(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRates) {
      showToast('error', 'Permission Denied: Only MAIN_ADMIN can add scrap master categories.');
      return;
    }
    if (!newCatName.trim() || newCatRate <= 0) return;

    addCategory({
      name: newCatName,
      rate_per_kg: newCatRate,
      unit: newCatUnit,
      icon_name: 'Recycle',
      category_type: newCatType,
      description: newCatDesc || 'Clean recyclable scrap material.',
      is_active: true,
      min_weight_kg: 1,
    });

    setShowAddCatModal(false);
    setNewCatName('');
    setNewCatRate(30);
    setNewCatDesc('');
    showToast('success', `Scrap category "${newCatName}" published successfully!`);
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyText.trim()) return;

    replyToTicket(selectedTicket.id, adminReplyText);
    setAdminReplyText('');
    setSelectedTicket(null);
    showToast('success', 'Official resolution sent to customer via SMS and ticket queue.');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* INTERACTIVE ADMIN IDENTITY & ROLE SWITCHER BANNER */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            {/* Identity & Active Role */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-md">
                <img src={currentAdmin.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black">{currentAdmin.name}</h1>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shadow-xs ${
                      currentAdmin.adminRole === 'MAIN_ADMIN'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : currentAdmin.adminRole === 'PICKUP_ADMIN'
                        ? 'bg-blue-500 text-white font-black'
                        : currentAdmin.adminRole === 'PAYOUT_ADMIN'
                        ? 'bg-emerald-500 text-white font-black'
                        : currentAdmin.adminRole === 'CONTENT_ADMIN'
                        ? 'bg-purple-500 text-white font-black'
                        : 'bg-slate-600 text-white font-black'
                    }`}
                  >
                    {currentAdmin.adminRole}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Session Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentAdmin.permissions_summary}</p>
              </div>
            </div>

            {/* Test Role Switcher Dropdown */}
            <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">
                🧪 Switch Admin Persona (Testing Matrix):
              </span>
              <select
                value={currentAdmin.id}
                onChange={(e) => {
                  const target = adminList.find((a) => a.id === e.target.value);
                  if (target) {
                    setCurrentAdmin(target);
                    showToast('success', `Active admin switched to ${target.name} (${target.adminRole}). Role boundaries updated.`);
                  }
                }}
                className="text-xs bg-slate-900 text-white border border-slate-600 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {adminList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.adminRole}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-Time Permission Boundaries Matrix for current role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AUTHORIZED CAPABILITIES FOR {currentAdmin.adminRole}:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentAdmin.adminRole === 'MAIN_ADMIN' &&
                  'Full business authority: Pickups, Scrap Rates, Payout Approvals, User Moderation, Settings, Role Delegation, and Audit Trail.'}
                {currentAdmin.adminRole === 'PICKUP_ADMIN' &&
                  'Logistics & Dispatch: View bookings, assign drivers, mark On The Way/Picked Up/Completed, cancel pickups, add operational notes.'}
                {currentAdmin.adminRole === 'PAYOUT_ADMIN' &&
                  'Financial Operations: View payouts, adjust disbursement amounts, mark Processing/Paid, record reference IDs, retry failures.'}
                {currentAdmin.adminRole === 'CONTENT_ADMIN' &&
                  'Public Website Management: Edit homepage copy, About Us, Contact info, FAQs, How It Works, announcement banners.'}
                {currentAdmin.adminRole === 'VIEW_ONLY_ADMIN' &&
                  'Read-Only Auditor: View all dashboards, bookings, payouts, reports, and audit logs. Zero modification permissions.'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>RESTRICTED BOUNDARIES (BLOCKS ENFORCED):</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentAdmin.adminRole === 'MAIN_ADMIN' &&
                  'Zero-Secrets Compliance: Cannot view user passwords, plaintext OTPs, UPI PINs, ATM debit PINs, or banking passwords.'}
                {currentAdmin.adminRole === 'PICKUP_ADMIN' &&
                  'Cannot change scrap master rates, cannot approve payouts, cannot manage other admins, cannot change WhatsApp number.'}
                {currentAdmin.adminRole === 'PAYOUT_ADMIN' &&
                  'Cannot create/delete admins, cannot change Firebase security roles, cannot modify scrap master rates, cannot delete audit logs.'}
                {currentAdmin.adminRole === 'CONTENT_ADMIN' &&
                  'Cannot access financial payouts, cannot manage customer accounts, cannot change admin roles, cannot delete audit logs.'}
                {currentAdmin.adminRole === 'VIEW_ONLY_ADMIN' &&
                  'Cannot edit records, cannot change statuses, cannot adjust payout sums, cannot add scrap categories, cannot change settings.'}
              </p>
            </div>
          </div>

          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Bookings</span>
              <span className="text-xl font-black text-white mt-0.5 block">{totalBookings}</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Scrap Collected</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                {totalWeightCollected.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
              </span>
            </div>

            <div className="bg-slate-800/60 border border-amber-500/40 p-3 rounded-xl">
              <span className="text-[10px] text-amber-300 block font-bold uppercase">Pending Payouts</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">
                ₹{pendingPayoutsAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-800/60 border border-indigo-500/40 p-3 rounded-xl">
              <span className="text-[10px] text-indigo-300 block font-bold uppercase">Dual Approvals</span>
              <span className="text-xl font-black text-indigo-400 mt-0.5 block">
                {pendingApprovalsCount} <span className="text-xs font-normal text-slate-400">Pending Review</span>
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Support Queue</span>
              <span className="text-xl font-black text-purple-400 mt-0.5 block">{openTicketsCount}</span>
            </div>
          </div>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* ADMIN NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Bookings & Logistics</span>
            <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px]">{bookings.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'payouts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Payout Disbursals</span>
            {pendingPayouts.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px] animate-pulse">
                {pendingPayouts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Scrap Rates & Items</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Dual Approval Center</span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full text-[10px] animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Website Content</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Admin & Staff Hierarchy</span>
            <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {adminList.length + staffMembers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Security Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'support'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support & AI Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'fleet'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Fleet GPS</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS & LOGISTICS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter and search bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search booking number, name, address..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                {['all', 'pending', 'assigned', 'on_the_way', 'arrived', 'weighing', 'completed', 'cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap transition-colors ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Booking / OTP</th>
                      <th className="p-3.5">Customer & Address</th>
                      <th className="p-3.5">Expected Scrap</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Assign Driver</th>
                      <th className="p-3.5 text-right">Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No bookings found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              {b.booking_number}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                              OTP: {b.pickup_otp}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <span className="font-bold text-slate-900 block">{b.customer_name}</span>
                            <span className="text-slate-500 block truncate">{b.pickup_address}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              {b.preferred_date} • {b.preferred_time_slot}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-slate-800 line-clamp-1">
                              {b.expected_scrap_items}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ~{b.estimated_weight_kg || 25} kg est.
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                b.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'on_the_way'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'arrived'
                                  ? 'bg-amber-100 text-amber-800'
                                  : b.status === 'weighing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : b.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {b.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              disabled={!canManagePickups || isViewOnly || b.status === 'completed' || b.status === 'cancelled'}
                              value={b.staff_id || ''}
                              onChange={(e) => handleAssignStaff(b.id, e.target.value)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${
                                !canManagePickups || isViewOnly
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : b.staff_id
                                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                                  : 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                              }`}
                            >
                              <option value="">-- Assign Driver --</option>
                              {staffList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name} ({s.vehicle_number?.split(' ')[0]})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            {b.status === 'assigned' && (
                              <button
                                type="button"
                                disabled={!canManagePickups || isViewOnly}
                                onClick={() => handleUpdateBookingStatus(b.id, 'on_the_way')}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-xs"
                              >
                                On The Way
                              </button>
                            )}

                            {b.status === 'weighing' && (
                              <button
                                type="button"
                                disabled={!canManagePickups || isViewOnly}
                                onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-xs"
                              >
                                Mark Completed
                              </button>
                            )}

                            {b.status !== 'completed' && b.status !== 'cancelled' && (
                              <button
                                type="button"
                                disabled={!canManagePickups || isViewOnly}
                                onClick={() => handleOpenCancelBooking(b)}
                                className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold text-xs"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYOUT APPROVALS & DISBURSALS */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm">Customer Scrap Payout Disbursement Matrix</h3>
                <p className="text-amber-800 mt-0.5">
                  Controlled Financial Progression: PENDING ➔ PROCESSING ➔ PAID (Instant UPI/Bank Transfer).
                  Paid records are locked to prevent casual reversal.
                </p>
              </div>
              <span className="bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-full text-xs">
                {pendingPayouts.length} Requiring Action
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payouts.map((payout) => {
                const booking = bookings.find((b) => b.id === payout.booking_id);
                const isPaid = payout.status === 'successful';
                const isPending = payout.status === 'pending_approval';

                return (
                  <div
                    key={payout.id}
                    className={`bg-white rounded-2xl p-5 border transition-all ${
                      isPending
                        ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20'
                        : isPaid
                        ? 'border-emerald-300 shadow-xs bg-emerald-50/10'
                        : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {payout.booking_number}
                        </span>
                        <p className="text-xs text-slate-500">
                          Customer: <strong>{payout.customer_name}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-700">
                          ₹{payout.amount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full block uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : payout.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {payout.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Scale Weight Breakdown */}
                    {booking && booking.items_collected && booking.items_collected.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Verified Scale Slip ({booking.final_weight_kg} kg total):
                        </span>
                        {booking.items_collected.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-700">
                            <span>{item.category_name} ({item.weight_kg} kg @ ₹{item.rate_per_kg}/kg)</span>
                            <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Destination details */}
                    <div className="text-xs text-slate-600 space-y-1 mb-4">
                      <div>
                        <strong>Payout Channel: </strong>
                        <span className="uppercase font-semibold text-emerald-800">
                          {payout.payout_method}
                        </span>
                      </div>
                      <div>
                        <strong>Target Destination: </strong>
                        <span className="font-mono">{payout.payout_destination}</span>
                      </div>
                      {payout.transaction_reference && (
                        <div>
                          <strong>Transfer Reference: </strong>
                          <span className="font-mono text-emerald-700">{payout.transaction_reference}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Left: Modify sum button */}
                      <button
                        type="button"
                        disabled={!canManagePayouts || isViewOnly || (isPaid && currentAdmin.adminRole !== 'MAIN_ADMIN')}
                        onClick={() => handleOpenEditPayoutAmount(payout)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                          !canManagePayouts || isViewOnly || (isPaid && currentAdmin.adminRole !== 'MAIN_ADMIN')
                            ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                            : 'text-amber-800 hover:bg-amber-50 border border-amber-300'
                        }`}
                      >
                        Adjust Payout Sum
                      </button>

                      {/* Right: Disbursement buttons */}
                      {isPaid ? (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>PAID • Protected Record</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!canManagePayouts || isViewOnly}
                            onClick={() => handleOpenMarkPaid(payout)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark as Paid (Disburse)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SCRAP RATES & ITEMS */}
        {activeTab === 'rates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Scrap Master Categories & Mandi Rates
                </h3>
                <p className="text-xs text-slate-500">
                  Rate changes show Current Rate, New Rate, and Difference (+/-). High-risk changes trigger second-admin verification.
                </p>
              </div>

              {canManageRates && (
                <button
                  onClick={() => setShowAddCatModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Scrap Category</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {cat.category_type}
                      </span>
                      <button
                        disabled={!canManageRates || isViewOnly}
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cat.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Master Rate</span>
                      <span className="text-lg font-black text-emerald-700">
                        ₹{cat.rate_per_kg}
                        <span className="text-xs font-normal text-slate-500">/{cat.unit}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canManageRates || isViewOnly}
                      onClick={() => handleOpenRateModal(cat)}
                      className={`text-xs font-bold p-1.5 px-2.5 rounded-xl border flex items-center gap-1 transition-colors ${
                        !canManageRates || isViewOnly
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Update Rate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ACCOUNT MODERATION */}
        {activeTab === 'users' && <UsersManagementTab />}

        {/* TAB 5: WEBSITE CONTENT */}
        {activeTab === 'content' && <WebsiteContentTab />}

        {/* TAB 6: ADMIN ROLE GOVERNANCE */}
        {activeTab === 'admins' && <AdminRolesTab />}

        {/* TAB 7: DUAL APPROVAL CENTER */}
        {activeTab === 'approvals' && <ApprovalCenterTab />}

        {/* TAB 8: SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && <AuditLogsTab />}

        {/* TAB 9: SYSTEM SETTINGS */}
        {activeTab === 'settings' && <SystemSettingsTab />}

        {/* TAB 10: FLEET GPS MAP */}
        {activeTab === 'fleet' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Field Driver GPS Map</h3>
                <p className="text-xs text-slate-500">
                  Real-time positions of active scrap collection vans in Sonipat & Delhi NCR.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>3 Drivers Online</span>
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-96 p-4 flex flex-col justify-between">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 25% 25%, #10b981 1.5px, transparent 1.5px), radial-gradient(circle at 75% 75%, #3b82f6 1.5px, transparent 1.5px)',
                  backgroundSize: '30px 30px',
                }}
              ></div>

              <div className="relative z-10 flex items-center justify-between text-xs text-white">
                <span className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold">
                  Sonipat & North Delhi Regional Sector Grid
                </span>
                <span className="bg-emerald-950/80 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/40 font-mono">
                  GPS Refresh: 4s
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-slate-900/90 border border-slate-700 p-3.5 rounded-xl text-white text-xs shadow-lg space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400">
                        <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold block">{staff.full_name}</span>
                        <span className="text-[10px] text-emerald-400">● En Route • Speed 32 km/h</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono">Vehicle: {staff.vehicle_number}</p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                      <span>Battery/Fuel: 84%</span>
                      <span className="text-amber-400 font-semibold">Assigned: Active Run</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 text-[11px] text-slate-400 text-center">
                All vehicles equipped with certified tamper-proof GPS and digital Bluetooth scales.
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: SUPPORT QUEUE */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Support Bot Escalations & Customer Tickets
              </h3>
              <p className="text-xs text-slate-500">
                Tickets raised by customers or escalated by ScrapBot when automated lookup needs manual staff review.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No open complaints or support tickets in queue.
                </div>
              ) : (
                tickets.map((tkt) => (
                  <div key={tkt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {tkt.ticket_number}
                        </span>
                        {tkt.ticket_type === 'complaint' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                            🚨 Grievance / Complaint
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                            General Inquiry
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tkt.status === 'closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tkt.status === 'escalated_to_admin'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tkt.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 text-slate-600">
                          {tkt.priority} Priority
                        </span>
                        {tkt.booking_number && (
                          <span className="text-xs text-slate-500">
                            Booking: <strong>{tkt.booking_number}</strong>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-1">{tkt.subject}</h4>
                      <p className="text-xs text-slate-600">{tkt.description}</p>

                      {tkt.admin_reply && (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 mt-2">
                          <strong className="text-blue-700">Admin Response: </strong>
                          {tkt.admin_reply}
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block mt-1">
                        By {tkt.customer_name} ({tkt.customer_phone}) • {new Date(tkt.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tkt.status !== 'closed' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTicket(tkt);
                              setAdminReplyText('');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => closeTicket(tkt.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                          >
                            Close Ticket
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Level 2 Action: Cancel Booking Modal */}
      {selectedBookingForCancel && (
        <AdminConfirmModal
          isOpen={bookingCancelModalOpen}
          onClose={() => {
            setBookingCancelModalOpen(false);
            setSelectedBookingForCancel(null);
          }}
          onConfirm={handleConfirmCancelBooking}
          level={2}
          requireReason={true}
          title="Cancel Pickup Booking"
          actionText="Confirm Cancellation"
          targetTitle={`${selectedBookingForCancel.booking_number} (${selectedBookingForCancel.customer_name})`}
          currentValue={selectedBookingForCancel.status}
          newValue="cancelled"
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning="Cancelling a booking sends an alert to the customer and unassigns the field driver."
        />
      )}

      {/* Level 3 High-Risk Action: Adjust Payout Amount Modal */}
      {selectedPayoutForEdit && (
        <AdminConfirmModal
          isOpen={payoutAmountModalOpen}
          onClose={() => {
            setPayoutAmountModalOpen(false);
            setSelectedPayoutForEdit(null);
          }}
          onConfirm={handleConfirmPayoutAmountChange}
          level={3}
          requireReason={true}
          title="Modify Customer Payout Sum"
          actionText="Authorize Payout Adjustment"
          targetTitle={`Payout for ${selectedPayoutForEdit.customer_name} (${selectedPayoutForEdit.booking_number})`}
          currentValue={`₹${selectedPayoutForEdit.amount}`}
          newValue={`₹${newPayoutAmountInput}`}
          difference={`₹${selectedPayoutForEdit.amount} ➔ ₹${newPayoutAmountInput} (${
            newPayoutAmountInput > selectedPayoutForEdit.amount ? '+' : ''
          }₹${newPayoutAmountInput - selectedPayoutForEdit.amount})`}
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning="Adjusting payout values impacts financial accounts. If Dual Approval is active, this request will be sent to the Approval Center for second-admin verification."
        />
      )}

      {/* Level 3 High-Risk Action: Mark Paid Modal */}
      {selectedPayoutForPaid && (
        <AdminConfirmModal
          isOpen={markPaidModalOpen}
          onClose={() => {
            setMarkPaidModalOpen(false);
            setSelectedPayoutForPaid(null);
          }}
          onConfirm={handleConfirmMarkPaid}
          level={3}
          requireReason={false}
          title="Disburse Scrap Payout (Mark Paid)"
          actionText="Confirm Payout Disbursal"
          targetTitle={`₹${selectedPayoutForPaid.amount} to ${selectedPayoutForPaid.customer_name} (${selectedPayoutForPaid.payout_destination})`}
          currentValue="pending_approval"
          newValue="successful"
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning="Once marked PAID, this financial transaction is locked and cannot be casually reverted by sub-admins."
        />
      )}

      {/* Level 2 / Level 3 Action: Scrap Rate Change Modal */}
      {selectedCatForRate && (
        <AdminConfirmModal
          isOpen={rateModalOpen}
          onClose={() => {
            setRateModalOpen(false);
            setSelectedCatForRate(null);
          }}
          onConfirm={handleConfirmRateChange}
          level={Math.abs(editingRate - selectedCatForRate.rate_per_kg) >= 30 ? 3 : 2}
          requireReason={true}
          title="Update Scrap Master Mandi Rate"
          actionText="Save Rate Modification"
          targetTitle={`${selectedCatForRate.name}`}
          currentValue={`₹${selectedCatForRate.rate_per_kg}/${selectedCatForRate.unit}`}
          newValue={`₹${editingRate}/${selectedCatForRate.unit}`}
          difference={`₹${selectedCatForRate.rate_per_kg} ➔ ₹${editingRate} (${
            editingRate > selectedCatForRate.rate_per_kg ? '+' : ''
          }₹${editingRate - selectedCatForRate.rate_per_kg}/${selectedCatForRate.unit})`}
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning="Scrap rate modifications take effect instantly across all customer price quotes and staff digital scales."
        />
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Add New Scrap Category</h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Copper Armature Wire, Old Tyre"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={newCatRate}
                    onChange={(e) => setNewCatRate(Number(e.target.value))}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newCatUnit}
                    onChange={(e) => setNewCatUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="kg">Per KG</option>
                    <option value="piece">Per Piece</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Type</label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="metal">Metal</option>
                  <option value="paper">Paper & Cardboard</option>
                  <option value="plastic">Plastic & PET</option>
                  <option value="e-waste">E-Waste</option>
                  <option value="appliance">Appliance / Heavy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="What scrap items are accepted under this rate..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Add Category & Publish Rate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Reply to {selectedTicket.ticket_number}
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs mb-3 space-y-1">
              <p><strong>Customer: </strong>{selectedTicket.customer_name} ({selectedTicket.customer_phone})</p>
              <p><strong>Issue: </strong>{selectedTicket.subject}</p>
              <p className="text-slate-600">{selectedTicket.description}</p>
            </div>

            <form onSubmit={handleReplyTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Admin Response</label>
                <textarea
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Type resolution message sent to customer..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Send Reply & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
