import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserProfile } from '../../types/scrapgo';
import {
  Users,
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  User,
} from 'lucide-react';
import { AdminConfirmModal } from './AdminConfirmModal';

export const UsersManagementTab: React.FC = () => {
  const { allUsers, bookings, toggleUserBlock, currentAdmin, canPerform } = useScrap();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<UserProfile | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManageUsers = canPerform('manage_users', 'users').allowed;

  const customers = allUsers.filter((u) => u.role === 'customer' || !u.role);
  const blockedCount = customers.filter((u) => u.is_blocked).length;
  const activeCount = customers.length - blockedCount;
  const bookingStats = (phone: string) => {
    const mine = bookings.filter((b) => b.customer_phone === phone);
    const last = mine.map((b) => b.created_at || b.preferred_date).filter(Boolean).sort().pop();
    return { count: mine.length, last };
  };
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';

  const filteredUsers = customers.filter((u) => {
    const matchesRole =
      roleFilter === 'all' || (roleFilter === 'blocked' ? Boolean(u.is_blocked) : !u.is_blocked);
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.full_name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const handleOpenBlockModal = (user: UserProfile) => {
    if (!canManageUsers) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: Only MAIN_ADMIN can block or moderate user accounts.',
      });
      return;
    }
    setSelectedUserForBlock(user);
    setBlockModalOpen(true);
  };

  const handleConfirmBlock = (reason: string) => {
    if (!selectedUserForBlock) return;
    const res = toggleUserBlock(selectedUserForBlock.id, reason);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setBlockModalOpen(false);
    setSelectedUserForBlock(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#047857] shadow-md">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Users className="w-6 h-6" /> Customers
        </h2>
        <p className="text-xs opacity-90 mt-1">All customers and their bookings in one place</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { n: customers.length, l: 'Total', c: 'text-green-700' },
          { n: activeCount, l: 'Active', c: 'text-green-700' },
          { n: blockedCount, l: 'Blocked', c: 'text-rose-700' },
        ].map((x) => (
          <div key={x.l} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
            <span className={`block text-xl font-black ${x.c}`}>{x.n}</span>
            <span className="text-[10px] font-bold text-slate-500">{x.l}</span>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full text-sm pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-2">
        {([
          ['all', `All (${customers.length})`],
          ['active', 'Active'],
          ['blocked', 'Blocked'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setRoleFilter(k)}
            className={`px-4 py-2 rounded-full text-xs font-extrabold border ${
              roleFilter === k ? 'bg-[#15803d] text-white border-[#15803d]' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          No customers found.
        </div>
      ) : (
        filteredUsers.map((user) => {
          const isBlocked = Boolean(user.is_blocked);
          const st = bookingStats(user.phone);
          return (
            <div key={user.id} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full text-white font-black text-lg flex items-center justify-center shrink-0 ${
                    isBlocked ? 'bg-red-600' : 'bg-green-600'
                  }`}
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-slate-900 truncate">{user.full_name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {user.phone}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                    isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                </span>
              </div>
              <div className="flex gap-2 my-3">
                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="block text-[10px] font-bold text-slate-500">Last booking</span>
                  <b className="text-sm">{fmt(st.last)}</b>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="block text-[10px] font-bold text-slate-500">Bookings</span>
                  <b className="text-sm">{st.count}</b>
                </div>
              </div>
              <button
                type="button"
                disabled={!canManageUsers}
                onClick={() => handleOpenBlockModal(user)}
                className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border ${
                  !canManageUsers
                    ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200'
                    : isBlocked
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          );
        })
      )}

      {/* Block Confirmation Modal (Level 2 Action) */}
      {selectedUserForBlock && (
        <AdminConfirmModal
          isOpen={blockModalOpen}
          onClose={() => {
            setBlockModalOpen(false);
            setSelectedUserForBlock(null);
          }}
          onConfirm={handleConfirmBlock}
          level={2}
          requireReason={true}
          title={selectedUserForBlock.is_blocked ? 'Unblock User Account' : 'Block User Account'}
          actionText={selectedUserForBlock.is_blocked ? 'Confirm Unblock' : 'Confirm Block Account'}
          targetTitle={`${selectedUserForBlock.full_name} (${selectedUserForBlock.phone})`}
          currentValue={selectedUserForBlock.is_blocked ? 'Blocked' : 'Active'}
          newValue={selectedUserForBlock.is_blocked ? 'Active' : 'Blocked'}
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning={
            selectedUserForBlock.is_blocked
              ? 'Unblocking will allow this customer/staff to immediately log in and schedule pickups again.'
              : 'Blocking this user will prevent future booking requests, OTP verification, and app sign-ins.'
          }
        />
      )}
    </div>
  );
};
