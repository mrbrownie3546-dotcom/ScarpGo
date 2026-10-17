import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
  const [customTitle, setCustomTitle] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(false);
  const [canCreateStaff, setCanCreateStaff] = useState(false);
  const [canCreateAdmin, setCanCreateAdmin] = useState(false);
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>([]);

  const [openGroup, setOpenGroup] = useState<string | null>(null);
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
    if (!password.trim()) {
      setErrorMsg('Password is required');
      return;
    }
    if (!effectiveTitle) {
      setErrorMsg('Please select a role');
      return;
    }
    if (!status) {
      setErrorMsg('Please select a status');
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
      force_password_reset: forcePasswordReset,
    });

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };


  const inputCls =
    'w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1.5';

  const Toggle = ({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => set(!on)}
      className="w-full flex items-center justify-between gap-3 px-3.5 py-3 border border-slate-200 rounded-xl text-left cursor-pointer"
    >
      <span className="font-bold text-sm text-slate-900">{label}</span>
      <span className={`shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-green-700' : 'bg-slate-300'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        <div className="p-4 px-5 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <span className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900">Add Admin</h3>
            <p className="text-xs text-slate-500 truncate">Appointed by {currentAdmin.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 text-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Set admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Role *</label>
                <select value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className={inputCls}>
                  <option value="">Select role</option>
                  {ADMIN_DESIGNATIONS.map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus | '')} className={inputCls}>
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {customTitle === 'Custom Title' && (
              <input type="text" placeholder="Enter role name" value={customTitleInput} onChange={(e) => setCustomTitleInput(e.target.value)} className={inputCls} />
            )}
            <div>
              <label className={labelCls}>Description</label>
              <input type="text" placeholder="Enter role description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-green-700 mb-2">Extra Authority</h4>
            <div className="space-y-2">
              <Toggle label="Can create staff" on={canCreateStaff} set={setCanCreateStaff} />
              <Toggle label="Can create sub-admins" on={canCreateAdmin} set={setCanCreateAdmin} />
              <Toggle label="Ask password change on first login" on={forcePasswordReset} set={setForcePasswordReset} />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-green-700">Permissions</h4>
            <p className="text-xs text-slate-500 mt-0.5 mb-2.5">
              {selectedPermissions.length} of {ALL_PERMISSIONS.length} selected. Tap a group to choose.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                ['pickup', 'Pickup Ops'],
                ['payout', 'Payouts'],
                ['content', 'Content'],
                ['view_only', 'View-Only'],
                ['all', 'Full Access'],
                ['clear', 'Clear'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleApplyPreset(k)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {PERMISSION_MODULE_GROUPS.map((g) => {
                const keys = g.permissions.map((p) => p.key);
                const count = keys.filter((k) => selectedPermissions.includes(k)).length;
                const isOpen = openGroup === g.moduleId;
                return (
                  <div key={g.moduleId} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : g.moduleId)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left cursor-pointer"
                    >
                      <span className="font-bold text-sm text-slate-900">{g.title}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
                        {count} / {keys.length}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 p-2 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(g.moduleId)}
                          className="text-xs font-bold text-green-700 px-1 py-1 cursor-pointer"
                        >
                          {count === keys.length ? 'Clear group' : 'Select all in group'}
                        </button>
                        {g.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
                              className={`p-2.5 rounded-lg border flex items-start gap-2.5 select-none cursor-pointer ${
                                isChecked ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'
                              }`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-green-700 border-green-700' : 'border-slate-300 bg-white'}`}>
                                {isChecked && <Check className="w-3 h-3 text-white" />}
                              </span>
                              <div className="flex-1">
                                <span className="font-bold block text-xs text-slate-900">{perm.label}</span>
                                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{perm.description}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="bg-slate-50 p-4 px-5 border-t border-slate-200 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-[2] py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-extrabold whitespace-nowrap cursor-pointer"
          >
            Add Admin
          </button>
        </div>
      </div>
    </div>
  );
};
