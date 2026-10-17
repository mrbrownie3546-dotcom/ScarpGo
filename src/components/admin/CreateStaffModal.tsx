import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useScrap } from '../../context/ScrapContext';
import { GranularPermission, AccountStatus } from '../../types/scrapgo';
import {
  PERMISSION_MODULE_GROUPS,
  PRESET_PICKUP_STAFF_PERMISSIONS,
  PRESET_PAYOUT_STAFF_PERMISSIONS,
  PRESET_SUPPORT_STAFF_PERMISSIONS,
  STAFF_DESIGNATIONS,
} from '../../data/permissionsConfig';
import {
  Truck,
  UserPlus,
  X,
  Key,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createStaffMember, currentAdmin } = useScrap();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffTitle, setStaffTitle] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';

  // RULE OF DELEGATION: Staff permissions can only be a subset of the Admin's own permissions!
  const isPermissionAllowedForCurrentAdmin = (perm: GranularPermission) => {
    if (isMainAdmin) return true;
    return Boolean(currentAdmin.permissions && currentAdmin.permissions.includes(perm));
  };

  const handleApplyPreset = (presetName: string) => {
    let preset: GranularPermission[] = [];
    switch (presetName) {
      case 'pickup':
        preset = PRESET_PICKUP_STAFF_PERMISSIONS;
        setStaffTitle('Pickup Verification Staff');
        break;
      case 'driver':
        preset = PRESET_PICKUP_STAFF_PERMISSIONS;
        setStaffTitle('Field Logistics Driver');
        break;
      case 'payout':
        preset = PRESET_PAYOUT_STAFF_PERMISSIONS;
        setStaffTitle('Payout Verification Staff');
        break;
      case 'support':
        preset = PRESET_SUPPORT_STAFF_PERMISSIONS;
        setStaffTitle('Customer Support Staff');
        break;
      case 'clear':
        setSelectedPermissions([]);
        return;
    }

    // Filter preset by admin's own permissions (Delegation rule)
    const filteredPreset = preset.filter(isPermissionAllowedForCurrentAdmin);
    setSelectedPermissions(filteredPreset);
  };

  const togglePermission = (permKey: GranularPermission) => {
    if (!isPermissionAllowedForCurrentAdmin(permKey)) return;

    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveTitle = staffTitle === 'Custom Staff' ? customTitleInput.trim() : staffTitle;
    if (!name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Valid email address is required');
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

    // Enforce delegation check
    for (const perm of selectedPermissions) {
      if (!isPermissionAllowedForCurrentAdmin(perm)) {
        setErrorMsg(`Delegation Violation: You cannot grant '${perm}' because your admin account does not hold this permission.`);
        return;
      }
    }

    const res = await createStaffMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      staff_title: effectiveTitle,
      description: description.trim() || undefined,
      permissions: selectedPermissions,
      status,
      vehicle_number: vehicleNumber.trim().toUpperCase() || undefined,
      vehicle_type: vehicleType.trim() || undefined,
      initial_password: password,
    });

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const staffGroups = PERMISSION_MODULE_GROUPS.filter((g) =>
    ['pickups', 'scrap', 'payouts', 'users', 'notifications'].includes(g.moduleId)
  );
  const inputCls =
    'w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        <div className="p-4 px-5 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <span className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900">Add Staff</h3>
            <p className="text-xs text-slate-500 truncate">Reports to {currentAdmin.name}</p>
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
                  placeholder="Set staff password"
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
                <select value={staffTitle} onChange={(e) => setStaffTitle(e.target.value)} className={inputCls}>
                  <option value="">Select role</option>
                  {STAFF_DESIGNATIONS.map((title) => (
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
            {staffTitle === 'Custom Staff' && (
              <input type="text" placeholder="Enter role name" value={customTitleInput} onChange={(e) => setCustomTitleInput(e.target.value)} className={inputCls} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Vehicle No.</label>
                <input type="text" placeholder="Vehicle number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vehicle Type</label>
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputCls}>
                  <option value="">Select type</option>
                  <option value="Pickup Mini Truck">Mini Truck</option>
                  <option value="Mini Van">Mini Van</option>
                  <option value="3-Wheeler Loader">3-Wheeler Loader</option>
                  <option value="Medium Truck">Medium Truck</option>
                  <option value="None / Office Desk">Office Desk</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-green-700">Permissions</h4>
            <p className="text-xs text-slate-500 mt-0.5 mb-2.5">{selectedPermissions.length} selected. Tap a group to choose.</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                ['pickup', 'Pickup Staff'],
                ['payout', 'Payout Staff'],
                ['support', 'Support'],
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
              {staffGroups.map((g) => {
                const keys = g.permissions.map((p) => p.key);
                const count = keys.filter((k) => selectedPermissions.includes(k)).length;
                const isOpen = openGroup === g.moduleId;
                return (
                  <div key={g.moduleId} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : g.moduleId)}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left cursor-pointer"
                    >
                      <span className="font-bold text-sm text-slate-900">{g.title}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
                        {count} / {keys.length}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 p-2 space-y-1.5">
                        {g.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          const isAllowed = isPermissionAllowedForCurrentAdmin(perm.key);
                          return (
                            <div
                              key={perm.key}
                              onClick={() => isAllowed && togglePermission(perm.key)}
                              className={`p-2.5 rounded-lg border flex items-start gap-2.5 select-none ${
                                !isAllowed
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : isChecked
                                  ? 'bg-green-50 border-green-300 cursor-pointer'
                                  : 'bg-white border-slate-200 cursor-pointer'
                              }`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-green-700 border-green-700' : 'border-slate-300 bg-white'}`}>
                                {isChecked && <Check className="w-3 h-3 text-white" />}
                              </span>
                              <div className="flex-1">
                                <span className="font-bold block text-xs text-slate-900">{perm.label}</span>
                                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{perm.description}</span>
                                {!isAllowed && (
                                  <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">Not granted to your admin account</span>
                                )}
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
            Add Staff
          </button>
        </div>
      </div>
    </div>
  );
};
