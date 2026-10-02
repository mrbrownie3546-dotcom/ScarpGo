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
  const { allUsers, toggleUserBlock, currentAdmin, canPerform } = useScrap();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'staff'>('all');
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<UserProfile | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManageUsers = canPerform('manage_users', 'users').allowed;

  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
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
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black tracking-tight">Customer & Staff Account Management</h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
              Data Privacy Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Main Admin can inspect account registration status and block or unblock misbehaving profiles.
            Sub-admins operate with restricted visibility.
          </p>
        </div>

        {/* Zero-Secrets Compliance Notice */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-xs max-w-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Strict Zero-Secrets Policy:</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">
            User passwords, plaintext OTPs, UPI PINs, ATM debit PINs, and banking credentials are never visible
            or stored in administrative portals.
          </p>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'customer', 'staff'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? `All Accounts (${allUsers.length})` : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Registered Date</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Protected Auth Credentials</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBlocked = Boolean(user.is_blocked);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Identity */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                {user.full_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 ${
                            user.role === 'staff'
                              ? 'bg-amber-100 text-amber-900'
                              : user.role === 'admin'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {user.role === 'staff' ? <Truck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span>{user.role}</span>
                        </span>
                      </td>

                      {/* Registered */}
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </td>

                      {/* Zero-Secrets Masked Column */}
                      <td className="p-3.5">
                        <span className="font-mono text-slate-400 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          •••••••• (Encrypted)
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          disabled={!canManageUsers}
                          onClick={() => handleOpenBlockModal(user)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto ${
                            !canManageUsers
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                              : isBlocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unblock User</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Block User</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
