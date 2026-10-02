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

  // View mode: 'tree' | 'admins' | 'staff'
  const [viewMode, setViewMode] = useState<'tree' | 'admins' | 'staff'>('tree');

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
      {/* SECTION 1: HEADER WITH 3-LEVEL ROLE HIERARCHY BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black tracking-tight">
                Admin, Sub-Admin & Staff Governance System
              </h2>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                Flexible RBAC System
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Main Admin exercises supreme governance. Admins operate with delegated permissions and can supervise
              field staff. Staff handle operational doorstep collection. Securely enforced via Firebase & backend rules.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canCreateAdmin && (
              <button
                type="button"
                onClick={() => setCreateAdminModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Admin</span>
              </button>
            )}

            {canCreateStaff && (
              <button
                type="button"
                onClick={() => setCreateStaffModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Create New Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Level Visual Hierarchy Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-800/80 border border-amber-500/40 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>LEVEL 1: MAIN ADMIN</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.2 rounded-full">
                {adminList.filter((a) => a.role_level === 'MAIN_ADMIN').length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Supreme authority: Creates Admins, sets custom titles, grants/revokes permissions, reassigns staff, and audits.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-blue-500/40 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>LEVEL 2: ADMIN</span>
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.2 rounded-full">
                {adminList.filter((a) => a.role_level === 'ADMIN').length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Operational managers with custom titles. Can create and direct field Staff if empowered with Can Create Staff.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-emerald-500/40 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>LEVEL 3: STAFF</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.2 rounded-full">
                {staffMembers.length} Members
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Field drivers & verification staff. Operates only under supervising Admin. Cannot create accounts.
            </p>
          </div>
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'tree' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>🏢 Hierarchy Tree</span>
            </button>
            <button
              onClick={() => setViewMode('admins')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'admins' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>👥 Admins Ledger ({adminList.length})</span>
            </button>
            <button
              onClick={() => setViewMode('staff')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>🚚 Staff Fleet ({staffMembers.length})</span>
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500"
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
                    Staff under {a.name} ({a.custom_title})
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
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ScrapGo Administrative Chain of Command
              </h3>
              <p className="text-xs text-slate-500">
                Click any administrator card to expand or collapse subordinate staff reporting to them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allExpanded: Record<string, boolean> = {};
                  adminList.forEach((a) => (allExpanded[a.id] = true));
                  setExpandedAdmins(allExpanded);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                Expand All
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setExpandedAdmins({})}
                className="text-xs text-slate-500 hover:text-slate-700 font-bold"
              >
                Collapse All
              </button>
            </div>
          </div>

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
                      ? 'border-amber-300 ring-1 ring-amber-200/50'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Admin Row Card */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-slate-50/50">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                          <img src={admin.avatar_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-white ${
                            admin.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{admin.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full">
                              You (Active Session)
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full uppercase ${
                              admin.role_level === 'MAIN_ADMIN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
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
                          <span className="font-bold text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                            {admin.custom_title}
                          </span>
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
                          className="font-bold text-amber-600 hover:text-amber-800 underline text-xs"
                        >
                          {admin.permissions.length} Capabilities
                        </button>
                      </div>

                      {admin.can_create_staff && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
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
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Staff Reporting to {admin.name}:</span>
                        </span>
                        {canCreateStaff && (
                          <button
                            type="button"
                            onClick={() => setCreateStaffModalOpen(true)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                          >
                            + Onboard Another Staff
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {staffUnderThisAdmin.map((staff) => (
                          <div
                            key={staff.id}
                            className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2 hover:border-blue-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                  <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
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

                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2 text-[11px] space-y-0.5">
                              <span className="font-bold text-blue-950 block">{staff.staff_title}</span>
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
                                className="text-blue-600 hover:underline font-bold text-[10px]"
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              All Configured Administrators ({filteredAdmins.length})
            </h3>
            <span className="text-xs text-slate-500">
              Granular permissions strictly enforced on Firestore Security Rules
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Admin Profile</th>
                  <th className="p-3.5">Title / Designation</th>
                  <th className="p-3.5">Role Level</th>
                  <th className="p-3.5">Staff Authority</th>
                  <th className="p-3.5">Supervised Staff</th>
                  <th className="p-3.5">Permissions</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => {
                  const staffCount = staffMembers.filter(
                    (s) => s.managed_by === admin.id || s.created_by === admin.id
                  ).length;
                  const isCurrent = admin.id === currentAdmin.id;

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profile */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                            <img src={admin.avatar_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{admin.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Custom Title */}
                      <td className="p-3.5">
                        <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-block">
                          {admin.custom_title}
                        </span>
                      </td>

                      {/* Level */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-block ${
                            admin.role_level === 'MAIN_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {admin.role_level}
                        </span>
                      </td>

                      {/* Can Create Staff */}
                      <td className="p-3.5">
                        {admin.can_create_staff ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Can Create Staff</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">No Staff Rights</span>
                        )}
                      </td>

                      {/* Supervised Staff */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setManagerFilter(admin.id);
                            setViewMode('staff');
                          }}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {staffCount} Staff Members
                        </button>
                      </td>

                      {/* Permissions Pill */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setInspectUser(admin)}
                          className="text-[11px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-lg inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>{admin.permissions.length} Perms</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            admin.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {admin.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAdmin(admin)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isMainAdmin && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleOpenToggleAdminStatus(admin)}
                            className={`p-1.5 rounded-xl border transition-colors ${
                              admin.is_active
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard Staff</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Staff Profile</th>
                  <th className="p-3.5">Designated Title</th>
                  <th className="p-3.5">Reporting Manager</th>
                  <th className="p-3.5">Vehicle Details</th>
                  <th className="p-3.5">Completed Pickups</th>
                  <th className="p-3.5">Allowed Tasks</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Staff Profile */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <strong className="text-slate-900 block">{staff.name}</strong>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {staff.phone} • {staff.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Operational Title */}
                    <td className="p-3.5">
                      <span className="font-bold text-blue-950 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg inline-block">
                        {staff.staff_title}
                      </span>
                    </td>

                    {/* Reporting Manager */}
                    <td className="p-3.5">
                      <div>
                        <strong className="text-slate-800 block">{staff.managed_by_name}</strong>
                        <span className="text-[10px] text-slate-400">
                          Created by: {staff.created_by_name.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="p-3.5 font-mono text-[11px]">
                      {staff.vehicle_number ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{staff.vehicle_number}</span>
                          <span className="text-[10px] text-slate-500 font-sans">{staff.vehicle_type}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans">Desk / Office</span>
                      )}
                    </td>

                    {/* Pickups */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">
                        {staff.total_pickups_completed || 0}
                      </span>
                      {staff.rating && (
                        <span className="text-[10px] text-amber-600 block">★ {staff.rating}</span>
                      )}
                    </td>

                    {/* Permissions */}
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setInspectUser(staff)}
                        className="text-[11px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-lg inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>{staff.permissions.length} Tasks</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          staff.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStaffActive(staff)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-colors ${
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
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Edit Staff Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT PERMISSIONS MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200">
                  <img src={inspectUser.avatar_url} alt="" className="w-full h-full object-cover" />
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
