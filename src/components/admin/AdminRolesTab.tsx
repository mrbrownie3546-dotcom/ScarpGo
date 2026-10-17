import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { AdminRole, AdminUser, StaffMember, RoleLevel, AccountStatus } from '../../types/scrapgo';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  Truck,
  Users,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  Key,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Award,
} from 'lucide-react';
import { AdminConfirmModal } from './AdminConfirmModal';
import { CreateAdminModal } from './CreateAdminModal';
import { EditAdminModal } from './EditAdminModal';
import { CreateStaffModal } from './CreateStaffModal';
import { EditStaffModal } from './EditStaffModal';
import { PERMISSION_MODULE_GROUPS } from '../../data/permissionsConfig';

export const AdminRolesTab: React.FC = () => {
  const {
    adminList,
    staffMembers,
    currentAdmin,
    setCurrentAdmin,
    toggleAdminStatus,
    updateStaffMember,
    canCreateStaff,
    canCreateAdmin,
    canPerform,
  } = useScrap();

  // View mode: 'admins' | 'staff' | 'tree'
  const [viewMode, setViewMode] = useState<'admins' | 'staff' | 'tree'>('admins');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');

  // Modals state
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null);

  const [createStaffModalOpen, setCreateStaffModalOpen] = useState(false);
  const [editStaffModalOpen, setEditStaffModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffMember | null>(null);

  // Status confirm modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAdminForStatus, setSelectedAdminForStatus] = useState<AdminUser | null>(null);

  // Inspect Permissions modal
  const [inspectUser, setInspectUser] = useState<AdminUser | StaffMember | null>(null);

  // Expanded admins in tree view
  const [expandedAdmins, setExpandedAdmins] = useState<Record<string, boolean>>({
    'adm-pickup-1': true,
    'adm-payout-1': true,
    'adm-content-1': true,
  });

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';

  const toggleExpand = (adminId: string) => {
    setExpandedAdmins((prev) => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  const handleOpenEditAdmin = (admin: AdminUser) => {
    if (!isMainAdmin && admin.id !== currentAdmin.id) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: Only Main Admin can modify other administrator accounts.',
      });
      return;
    }
    setSelectedAdminForEdit(admin);
    setEditAdminModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    const isDirectManager = staff.managed_by === currentAdmin.id || staff.created_by === currentAdmin.id;
    if (!isMainAdmin && !isDirectManager) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: You can only edit staff reporting directly under your administration.',
      });
      return;
    }
    setSelectedStaffForEdit(staff);
    setEditStaffModalOpen(true);
  };

  const handleOpenToggleAdminStatus = (admin: AdminUser) => {
    if (!isMainAdmin) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: Only Main Admin can activate or deactivate administrators.',
      });
      return;
    }
    if (admin.id === currentAdmin.id) {
      setFeedback({
        type: 'error',
        message: 'Self-Deactivation Prohibited: You cannot deactivate your active session.',
      });
      return;
    }
    setSelectedAdminForStatus(admin);
    setStatusModalOpen(true);
  };

  const handleConfirmToggleAdminStatus = (reason: string) => {
    if (!selectedAdminForStatus) return;
    const res = toggleAdminStatus(selectedAdminForStatus.id, reason);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setStatusModalOpen(false);
    setSelectedAdminForStatus(null);
  };

  const handleToggleStaffActive = (staff: StaffMember) => {
    const isDirectManager = staff.managed_by === currentAdmin.id || staff.created_by === currentAdmin.id;
    if (!isMainAdmin && !isDirectManager) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: You can only toggle status of staff under your administration.',
      });
      return;
    }

    const newStatus: AccountStatus = staff.status === 'active' ? 'inactive' : 'active';
    const res = updateStaffMember(
      staff.id,
      { status: newStatus },
      `Staff ${staff.name} toggled to ${newStatus}`
    );
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Filtered Admins
  const filteredAdmins = adminList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.custom_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Staff
  const filteredStaff = staffMembers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staff_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.vehicle_number && s.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesManager = managerFilter === 'all' || s.managed_by === managerFilter;
    return matchesSearch && matchesStatus && matchesManager;
  });

  return (
    <div className="space-y-5">
      {/* SECTION 1: CLEAN HEADER WITH ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-900 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Admin & Staff Directory</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage administrator accounts, field staff members, and system access permissions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateAdmin && (
            <button
              type="button"
              onClick={() => setCreateAdminModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-slate-950 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          )}

          {canCreateStaff && (
            <button
              type="button"
              onClick={() => setCreateStaffModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Create New Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in ${
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

      {/* TOOLBAR: VIEW TOGGLES & SEARCH & FILTERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setViewMode('admins')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'admins' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admins ({adminList.length})</span>
            </button>
            <button
              onClick={() => setViewMode('staff')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'staff' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staff ({staffMembers.length})</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tree' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Hierarchy View</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, title, email, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {viewMode !== 'admins' && (
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="all">All Managing Admins</option>
              {adminList
                .filter((a) => a.can_create_staff || a.role_level === 'MAIN_ADMIN')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    Staff under {a.name} {a.custom_title && a.custom_title !== a.name ? `(${a.custom_title})` : ''}
                  </option>
                ))}
            </select>
          )}

          {(searchQuery || statusFilter !== 'all' || managerFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setManagerFilter('all');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: ORGANIZATIONAL HIERARCHY TREE */}
      {viewMode === 'tree' && (
        <div className="space-y-4">
          {/* Tree hierarchy cards */}
          <div className="space-y-4">
            {filteredAdmins.map((admin) => {
              const staffUnderThisAdmin = staffMembers.filter(
                (s) => s.managed_by === admin.id || s.created_by === admin.id
              );
              const isExpanded = Boolean(expandedAdmins[admin.id]);
              const isCurrent = admin.id === currentAdmin.id;

              return (
                <div
                  key={admin.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    admin.role_level === 'MAIN_ADMIN'
                      ? 'border-slate-300 ring-1 ring-slate-200/50'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Admin Row Card */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-slate-50/50">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-950/60 text-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-center font-black text-base">
                          {admin.name.charAt(0)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{admin.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                              You (Active Session)
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full uppercase ${
                              admin.role_level === 'MAIN_ADMIN'
                                ? 'bg-slate-100 text-slate-900 border border-slate-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {admin.role_level}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                              admin.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {admin.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {admin.custom_title && admin.custom_title !== admin.name && (
                            <span className="font-bold text-xs text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                              {admin.custom_title}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {admin.email} • {admin.phone}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                          {admin.description || 'Administrative leadership role.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
                      <div className="text-right text-xs pr-2 hidden lg:block">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">
                          Permissions
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectUser(admin)}
                          className="font-bold text-slate-600 hover:text-slate-800 underline text-xs"
                        >
                          {admin.permissions.length} Capabilities
                        </button>
                      </div>

                      {admin.can_create_staff && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Staff Creation ON</span>
                        </span>
                      )}

                      {/* Action buttons */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditAdmin(admin)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Edit Admin Profile & Permissions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isMainAdmin && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleOpenToggleAdminStatus(admin)}
                          className={`p-2 rounded-xl border transition-colors ${
                            admin.is_active
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Expand staff toggle */}
                      {staffUnderThisAdmin.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(admin.id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <span>{staffUnderThisAdmin.length} Staff</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 px-2">No staff assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Subordinate Staff Drawer / Nesting */}
                  {isExpanded && staffUnderThisAdmin.length > 0 && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-4 pl-6 sm:pl-10 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Staff Reporting to {admin.name}:</span>
                        </span>
                        {canCreateStaff && (
                          <button
                            type="button"
                            onClick={() => setCreateStaffModalOpen(true)}
                            className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                          >
                            + Onboard Another Staff
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {staffUnderThisAdmin.map((staff) => (
                          <div
                            key={staff.id}
                            className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 hover:border-emerald-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 flex items-center justify-center font-extrabold text-xs">
                                  {staff.name.charAt(0)}
                                </div>
                                <div>
                                  <strong className="text-slate-900 block text-xs">{staff.name}</strong>
                                  <span className="text-[10px] text-slate-400 font-mono">{staff.phone}</span>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                  staff.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {staff.status}
                              </span>
                            </div>

                            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2 text-[11px] space-y-0.5">
                              <span className="font-bold text-emerald-950 block">{staff.staff_title}</span>
                              {staff.vehicle_number && (
                                <span className="text-[10px] font-mono text-slate-600 block">
                                  🚗 {staff.vehicle_number} ({staff.vehicle_type})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setInspectUser(staff)}
                                className="text-emerald-600 hover:underline font-bold text-[10px]"
                              >
                                {staff.permissions.length} Tasks Allowed
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffActive(staff)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                    staff.status === 'active'
                                      ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {staff.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStaff(staff)}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  title="Edit Staff Member"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ADMINISTRATORS LEDGER */}
      {viewMode === 'admins' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-bold text-slate-900 text-sm">
              All Configured Administrators ({filteredAdmins.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Granular access permissions enforced
            </span>
          </div>

          <div className="p-3 space-y-3">
            {filteredAdmins.map((admin) => {
              const staffCount = staffMembers.filter(
                (s) => s.managed_by === admin.id || s.created_by === admin.id
              ).length;
              const isCurrent = admin.id === currentAdmin.id;
              return (
                <div key={admin.id} className="rounded-3xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#15803d] to-[#16a34a] text-white font-black text-lg flex items-center justify-center shrink-0">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span>{admin.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 break-all">{admin.email}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {admin.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="block text-[10px] font-bold text-slate-500">Role</span>
                      <b className="text-xs text-slate-900">{admin.custom_title || admin.role_level}</b>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="block text-[10px] font-bold text-slate-500">Staff</span>
                      <button type="button" onClick={() => { setManagerFilter(admin.id); setViewMode('staff'); }} className="text-xs font-bold text-green-700">
                        {staffCount} Members
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="block text-[10px] font-bold text-slate-500">Can create staff</span>
                      <b className="text-xs text-slate-900">{admin.can_create_staff ? 'Yes' : 'No'}</b>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="block text-[10px] font-bold text-slate-500">Permissions</span>
                      <b className="text-xs text-slate-900">{admin.permissions.length}</b>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setInspectUser(admin)} className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Permissions
                    </button>
                    <button type="button" onClick={() => handleOpenEditAdmin(admin)} className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {isMainAdmin && !isCurrent && (
                      <button type="button" onClick={() => handleOpenToggleAdminStatus(admin)} className={`px-4 rounded-xl border ${admin.is_active ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-green-50 text-green-700 border-green-200'}`} title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}>
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF FLEET TABLE */}
      {viewMode === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Field Staff & Operational Fleet ({filteredStaff.length})
              </h3>
              <p className="text-xs text-slate-500">
                Staff operate on mobile collection devices under assigned managing admins.
              </p>
            </div>

            {canCreateStaff && (
              <button
                type="button"
                onClick={() => setCreateStaffModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard Staff</span>
              </button>
            )}
          </div>

          <div className="p-3 space-y-3">
            {filteredStaff.map((staff) => (
              <div key={staff.id} className="rounded-3xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#15803d] to-[#16a34a] text-white font-black text-lg flex items-center justify-center shrink-0">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-slate-900 text-sm">{staff.name}</div>
                    <div className="text-xs text-slate-500 break-all">{staff.phone}</div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 ${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {staff.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-bold text-slate-500">Title</span>
                    <b className="text-xs text-slate-900">{staff.staff_title}</b>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-bold text-slate-500">Manager</span>
                    <b className="text-xs text-slate-900">{staff.managed_by_name}</b>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-bold text-slate-500">Vehicle</span>
                    <b className="text-xs text-slate-900">{staff.vehicle_number || 'Desk / Office'}</b>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-bold text-slate-500">Pickups done</span>
                    <b className="text-xs text-slate-900">{staff.total_pickups_completed || 0}</b>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setInspectUser(staff)} className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Tasks
                  </button>
                  <button type="button" onClick={() => handleOpenEditStaff(staff)} className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-green-50 text-green-700 border border-green-200 flex items-center justify-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => handleToggleStaffActive(staff)} className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border ${staff.status === 'active' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {staff.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECT PERMISSIONS MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 shrink-0 flex items-center justify-center font-black text-sm">
                  {inspectUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{inspectUser.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {inspectUser.role_level} •{' '}
                    {'custom_title' in inspectUser ? inspectUser.custom_title : inspectUser.staff_title}
                  </span>
                </div>
              </div>
              <button onClick={() => setInspectUser(null)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Active Granular Permissions ({inspectUser.permissions.length} enabled):
              </span>

              <div className="space-y-2">
                {PERMISSION_MODULE_GROUPS.map((group) => {
                  const activeInGroup = group.permissions.filter((p) =>
                    inspectUser.permissions.includes(p.key)
                  );
                  if (activeInGroup.length === 0) return null;

                  return (
                    <div key={group.moduleId} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <strong className="text-[11px] text-slate-900 block mb-1.5">{group.title}</strong>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeInGroup.map((p) => (
                          <span
                            key={p.key}
                            className="bg-white border border-slate-200 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs"
                          >
                            ✓ {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      <CreateAdminModal
        isOpen={createAdminModalOpen}
        onClose={() => setCreateAdminModalOpen(false)}
        onSuccess={(msg) => setFeedback({ type: 'success', message: msg })}
      />

      {/* EDIT ADMIN MODAL */}
      <EditAdminModal
        isOpen={editAdminModalOpen}
        admin={selectedAdminForEdit}
        onClose={() => {
          setEditAdminModalOpen(false);
          setSelectedAdminForEdit(null);
        }}
        onSuccess={(msg) => setFeedback({ type: 'success', message: msg })}
      />

      {/* CREATE STAFF MODAL */}
      <CreateStaffModal
        isOpen={createStaffModalOpen}
        onClose={() => setCreateStaffModalOpen(false)}
        onSuccess={(msg) => setFeedback({ type: 'success', message: msg })}
      />

      {/* EDIT STAFF MODAL */}
      <EditStaffModal
        isOpen={editStaffModalOpen}
        staff={selectedStaffForEdit}
        onClose={() => {
          setEditStaffModalOpen(false);
          setSelectedStaffForEdit(null);
        }}
        onSuccess={(msg) => setFeedback({ type: 'success', message: msg })}
      />

      {/* CONFIRM STATUS TOGGLE MODAL */}
      {selectedAdminForStatus && (
        <AdminConfirmModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedAdminForStatus(null);
          }}
          onConfirm={handleConfirmToggleAdminStatus}
          level={2}
          requireReason={true}
          title={
            selectedAdminForStatus.is_active
              ? `Deactivate ${selectedAdminForStatus.name}`
              : `Activate ${selectedAdminForStatus.name}`
          }
          actionText={selectedAdminForStatus.is_active ? 'Confirm Deactivation' : 'Confirm Activation'}
          targetTitle={`${selectedAdminForStatus.name} (${selectedAdminForStatus.custom_title})`}
          currentValue={selectedAdminForStatus.is_active ? 'active' : 'inactive'}
          newValue={selectedAdminForStatus.is_active ? 'inactive' : 'active'}
          actingAdminName={currentAdmin.name}
          actingAdminRole={currentAdmin.adminRole}
          warning="Deactivating an administrator immediately blocks their access to all administrative workflows and operations."
        />
      )}
    </div>
  );
};
