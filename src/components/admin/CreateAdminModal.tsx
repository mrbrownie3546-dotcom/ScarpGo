import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { GranularPermission, AccountStatus } from '../../types/scrapgo';
import {
  PERMISSION_MODULE_GROUPS,
  ALL_PERMISSIONS,
  PRESET_MAIN_ADMIN_PERMISSIONS,
  PRESET_PICKUP_ADMIN_PERMISSIONS,
  PRESET_PAYOUT_ADMIN_PERMISSIONS,
  PRESET_CONTENT_ADMIN_PERMISSIONS,
  PRESET_VIEW_ONLY_PERMISSIONS,
  ADMIN_DESIGNATIONS,
} from '../../data/permissionsConfig';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
  Key,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createAdminAccount, currentAdmin } = useScrap();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customTitle, setCustomTitle] = useState('Pickup Operations Admin');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(true);
  const [canCreateStaff, setCanCreateStaff] = useState(true);
  const [canCreateAdmin, setCanCreateAdmin] = useState(false);
  const [status, setStatus] = useState<AccountStatus>('active');
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>([
    ...PRESET_PICKUP_ADMIN_PERMISSIONS,
  ]);

  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'SG-';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleApplyPreset = (presetName: string) => {
    switch (presetName) {
      case 'pickup':
        setSelectedPermissions([...PRESET_PICKUP_ADMIN_PERMISSIONS]);
        setCustomTitle('Pickup Operations Admin');
        setCanCreateStaff(true);
        break;
      case 'payout':
        setSelectedPermissions([...PRESET_PAYOUT_ADMIN_PERMISSIONS]);
        setCustomTitle('Payout & Finance Admin');
        setCanCreateStaff(true);
        break;
      case 'content':
        setSelectedPermissions([...PRESET_CONTENT_ADMIN_PERMISSIONS]);
        setCustomTitle('Website Content Admin');
        setCanCreateStaff(false);
        break;
      case 'view_only':
        setSelectedPermissions([...PRESET_VIEW_ONLY_PERMISSIONS]);
        setCustomTitle('Compliance & Audit Observer');
        setCanCreateStaff(false);
        break;
      case 'all':
        if (isMainAdmin) {
          setSelectedPermissions([...ALL_PERMISSIONS]);
          setCanCreateStaff(true);
          setCanCreateAdmin(true);
        }
        break;
      case 'clear':
        setSelectedPermissions([]);
        break;
    }
  };

  const togglePermission = (permKey: GranularPermission) => {
    // If not main admin, cannot grant admin management permissions
    if (!isMainAdmin && permKey.startsWith('manage_admin')) return;

    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const toggleModulePermissions = (moduleId: string) => {
    const group = PERMISSION_MODULE_GROUPS.find((g) => g.moduleId === moduleId);
    if (!group) return;

    const moduleKeys = group.permissions.map((p) => p.key);
    const allSelected = moduleKeys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !moduleKeys.includes(k)));
    } else {
      const toAdd = moduleKeys.filter((k) => !selectedPermissions.includes(k));
      setSelectedPermissions((prev) => [...prev, ...toAdd]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveTitle = customTitle === 'Custom Title' ? customTitleInput.trim() : customTitle;
    if (!name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required');
      return;
    }
    if (!effectiveTitle) {
      setErrorMsg('Please specify an admin title / designation');
      return;
    }
    if (selectedPermissions.length === 0) {
      setErrorMsg('Please grant at least one permission to this administrator');
      return;
    }

    const res = createAdminAccount({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      custom_title: effectiveTitle,
      description: description.trim() || undefined,
      permissions: selectedPermissions,
      can_create_staff: canCreateStaff,
      can_create_admin: canCreateAdmin && isMainAdmin,
      status,
      initial_password: password,
    });

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const displayedGroups =
    activeModuleFilter === 'all'
      ? PERMISSION_MODULE_GROUPS
      : PERMISSION_MODULE_GROUPS.filter((g) => g.moduleId === activeModuleFilter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-6 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-white text-slate-900 p-4 sm:p-5 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Create New Administrator</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Appointed by {currentAdmin.name} {currentAdmin.custom_title && currentAdmin.custom_title !== currentAdmin.name ? `(${currentAdmin.custom_title})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Admin Information */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <span>1. Administrative Credentials & Profile</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul.admin@scrapgo.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 99990 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all font-bold text-slate-900"
                >
                  <option value="active">Active (Enabled Immediately)</option>
                  <option value="inactive">Inactive (Access Paused)</option>
                  <option value="suspended">Suspended (Locked)</option>
                </select>
              </div>
            </div>

            {/* Custom Title & Designation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Professional Title / Designation</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">Defines Responsibility</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  {ADMIN_DESIGNATIONS.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                {customTitle === 'Custom Title' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom professional title..."
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-amber-400 rounded-xl font-bold text-amber-950 focus:ring-1 focus:ring-amber-500"
                  />
                )}
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Titles clarify responsibility within the organization. Permissions below strictly govern access.
              </p>
            </div>

            {/* Initial Password Setup */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Initial Password & Secure Account Setup</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold underline"
                >
                  Generate Strong Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="forceReset"
                  checked={forcePasswordReset}
                  onChange={(e) => setForcePasswordReset(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="forceReset" className="text-[11px] text-slate-600 cursor-pointer">
                  Require administrator to change password on first login (Zero-Secrets policy)
                </label>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Description / Operating Scope</label>
              <textarea
                rows={2}
                placeholder="e.g. Manages scrap collection logistics and field driver fleet across Sonipat hubs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          {/* Section 2: Authority Delegation (Staff & Admin Creation) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              2. Staff & Delegation Authority
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setCanCreateStaff(!canCreateStaff)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  canCreateStaff
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={canCreateStaff}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <strong className="block text-xs">Authorize Staff Creation (Can Create Staff)</strong>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Permits this Admin to create, onboard, and assign Level 3 Staff members under their supervision.
                  </span>
                </div>
              </div>

              {isMainAdmin && (
                <div
                  onClick={() => setCanCreateAdmin(!canCreateAdmin)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    canCreateAdmin
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={canCreateAdmin}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <strong className="block text-xs">Can Create Sub-Admins</strong>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Empowers this admin to provision other sub-admins (Cannot grant permissions higher than own).
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Granular Permissions Matrix */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  3. Granular Module Permissions
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selected: <strong className="text-amber-600">{selectedPermissions.length}</strong> of{' '}
                  {ALL_PERMISSIONS.length} capabilities
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('pickup')}
                  className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px]"
                >
                  Pickup Ops
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('payout')}
                  className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px]"
                >
                  Payouts
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('content')}
                  className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[10px]"
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('view_only')}
                  className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px]"
                >
                  View-Only
                </button>
                {isMainAdmin && (
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('all')}
                    className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px]"
                  >
                    Full Access
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleApplyPreset('clear')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-[10px]"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Module Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveModuleFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeModuleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Modules ({PERMISSION_MODULE_GROUPS.length})
              </button>
              {PERMISSION_MODULE_GROUPS.map((group) => {
                const count = group.permissions.filter((p) => selectedPermissions.includes(p.key)).length;
                return (
                  <button
                    key={group.moduleId}
                    type="button"
                    onClick={() => setActiveModuleFilter(group.moduleId)}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      activeModuleFilter === group.moduleId
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{group.title.split(' ')[0]}</span>
                    {count > 0 && (
                      <span className="text-[9px] px-1 rounded-full bg-white/25">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Permission Checkbox Groups */}
            <div className="space-y-3">
              {displayedGroups.map((group) => {
                const groupSelectedCount = group.permissions.filter((p) =>
                  selectedPermissions.includes(p.key)
                ).length;
                const isAllSelected = groupSelectedCount === group.permissions.length;

                return (
                  <div
                    key={group.moduleId}
                    className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <strong className="text-slate-900 font-bold block">{group.title}</strong>
                        <span className="text-[10px] text-slate-500">{group.description}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(group.moduleId)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'} ({groupSelectedCount}/
                        {group.permissions.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        const isRestrictedForSubAdmin =
                          !isMainAdmin && perm.key.startsWith('manage_admin');

                        return (
                          <div
                            key={perm.key}
                            onClick={() => !isRestrictedForSubAdmin && togglePermission(perm.key)}
                            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                              isRestrictedForSubAdmin
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isChecked
                                ? 'bg-amber-50/60 border-amber-300 text-slate-900 cursor-pointer'
                                : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/70 text-slate-600 cursor-pointer'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </span>
                            <div className="flex-1">
                              <span className="font-bold block text-[11px]">{perm.label}</span>
                              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                {perm.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3.5 sm:p-4 px-4 sm:px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-none">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Encrypted credentials • Zero secrets</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Administrator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
