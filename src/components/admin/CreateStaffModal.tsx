import React, { useState } from 'react';
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
  const [staffTitle, setStaffTitle] = useState('Pickup Verification Staff');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Pickup Mini Truck');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AccountStatus>('active');
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>([
    ...PRESET_PICKUP_STAFF_PERMISSIONS,
  ]);
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

  const handleSubmit = (e: React.FormEvent) => {
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
    if (!effectiveTitle) {
      setErrorMsg('Please specify a staff title');
      return;
    }

    // Enforce delegation check
    for (const perm of selectedPermissions) {
      if (!isPermissionAllowedForCurrentAdmin(perm)) {
        setErrorMsg(`Delegation Violation: You cannot grant '${perm}' because your admin account does not hold this permission.`);
        return;
      }
    }

    const res = createStaffMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      staff_title: effectiveTitle,
      description: description.trim() || undefined,
      permissions: selectedPermissions,
      status,
      vehicle_number: vehicleNumber.trim() || undefined,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-6 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Onboard Staff Member</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono">
                  LEVEL 3: STAFF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reporting directly under: <strong className="text-slate-200">{currentAdmin.name}</strong> ({currentAdmin.custom_title || currentAdmin.adminRole})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delegation Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-xs font-bold text-blue-900">
                Rule of Administrative Delegation Active:
              </strong>
              <span className="text-[11px] text-blue-800">
                Staff can only be granted operational tasks that are a subset of your admin capabilities.
                Level 3 staff cannot create accounts, change rates, or alter business settings.
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              1. Field Staff Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aman Khan, Sameer Rao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="aman.staff@scrapgo.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (Operational)</label>
                <input
                  type="tel"
                  placeholder="+91 98111 20001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="active">Active (Online & Ready for Bookings)</option>
                  <option value="inactive">Inactive (Standby)</option>
                </select>
              </div>
            </div>

            {/* Staff Designation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Staff Operational Title / Role Designation</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={staffTitle}
                  onChange={(e) => setStaffTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  {STAFF_DESIGNATIONS.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                {staffTitle === 'Custom Staff' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom staff designation..."
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-blue-400 rounded-xl font-bold text-slate-900"
                  />
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. HR 10 AB 4921"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Pickup Mini Truck">Pickup Mini Truck (Mahindra Bolero Maxi)</option>
                  <option value="Mini Van">Mini Van (Tata Ace Gold)</option>
                  <option value="3-Wheeler Loader">3-Wheeler Electric Loader (Piaggio Ape)</option>
                  <option value="Medium Truck">Medium Commercial Truck (Eicher Pro)</option>
                  <option value="None / Office Desk">None / Office Desk Staff</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Field Device Access Password</span>
              </label>

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
              <span className="text-[10px] text-slate-500">
                Staff member will use this password on the ScrapGo Driver / Staff Portal.
              </span>
            </div>
          </div>

          {/* Operational Permissions */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  2. Operational Duties & Permissions
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assigned: <strong className="text-blue-600">{selectedPermissions.length}</strong> tasks
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('pickup')}
                  className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px]"
                >
                  Pickup Field Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('payout')}
                  className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px]"
                >
                  Payout Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('support')}
                  className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[10px]"
                >
                  Customer Support
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('clear')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-[10px]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Checkboxes grouped for staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_MODULE_GROUPS.filter((g) =>
                ['pickups', 'scrap', 'payouts', 'users', 'notifications'].includes(g.moduleId)
              ).flatMap((g) =>
                g.permissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.key);
                  const isAllowed = isPermissionAllowedForCurrentAdmin(perm.key);

                  return (
                    <div
                      key={perm.key}
                      onClick={() => isAllowed && togglePermission(perm.key)}
                      className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 select-none ${
                        !isAllowed
                          ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isChecked
                          ? 'bg-blue-50/80 border-blue-300 text-slate-900 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer'
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </span>
                      <div className="flex-1">
                        <span className="font-bold block text-[11px]">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                          {perm.description}
                        </span>
                        {!isAllowed && (
                          <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">
                            Not granted to your admin account
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned to {currentAdmin.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xs transition-all flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Onboard Staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
