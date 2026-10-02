import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { StaffMember, GranularPermission, AccountStatus } from '../../types/scrapgo';
import {
  PERMISSION_MODULE_GROUPS,
  PRESET_PICKUP_STAFF_PERMISSIONS,
  PRESET_PAYOUT_STAFF_PERMISSIONS,
  PRESET_SUPPORT_STAFF_PERMISSIONS,
  STAFF_DESIGNATIONS,
} from '../../data/permissionsConfig';
import {
  Truck,
  Edit2,
  X,
  Key,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface EditStaffModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({
  isOpen,
  staff,
  onClose,
  onSuccess,
}) => {
  const { updateStaffMember, currentAdmin, adminList, resetStaffPassword } = useScrap();

  const [name, setName] = useState(staff?.name || '');
  const [staffTitle, setStaffTitle] = useState(staff?.staff_title || 'Pickup Verification Staff');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState(staff?.vehicle_number || '');
  const [vehicleType, setVehicleType] = useState(staff?.vehicle_type || 'Pickup Mini Truck');
  const [description, setDescription] = useState(staff?.description || '');
  const [status, setStatus] = useState<AccountStatus>(staff?.status || 'active');
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>(
    staff?.permissions || []
  );
  const [selectedManagerId, setSelectedManagerId] = useState(staff?.managed_by || currentAdmin.id);
  const [reason, setReason] = useState('Staff operational duty updates');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tempPassResult, setTempPassResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (staff) {
      setName(staff.name);
      setStaffTitle(
        STAFF_DESIGNATIONS.includes(staff.staff_title) ? staff.staff_title : 'Custom Staff'
      );
      setCustomTitleInput(
        STAFF_DESIGNATIONS.includes(staff.staff_title) ? '' : staff.staff_title
      );
      setVehicleNumber(staff.vehicle_number || '');
      setVehicleType(staff.vehicle_type || 'Pickup Mini Truck');
      setDescription(staff.description || '');
      setStatus(staff.status);
      setSelectedPermissions(staff.permissions || []);
      setSelectedManagerId(staff.managed_by || currentAdmin.id);
      setTempPassResult(null);
    }
  }, [staff, currentAdmin.id]);

  if (!isOpen || !staff) return null;

  const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';

  // Rule of Delegation check
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
    const filteredPreset = preset.filter(isPermissionAllowedForCurrentAdmin);
    setSelectedPermissions(filteredPreset);
  };

  const togglePermission = (permKey: GranularPermission) => {
    if (!isPermissionAllowedForCurrentAdmin(permKey)) return;

    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleResetPassword = () => {
    const res = resetStaffPassword(staff.id);
    if (res.success && res.tempPass) {
      setTempPassResult(res.tempPass);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveTitle = staffTitle === 'Custom Staff' ? customTitleInput.trim() : staffTitle;
    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }
    if (!effectiveTitle) {
      setErrorMsg('Please specify a staff title');
      return;
    }

    // Reassignment
    const targetManager = adminList.find((a) => a.id === selectedManagerId);

    const res = updateStaffMember(
      staff.id,
      {
        name: name.trim(),
        staff_title: effectiveTitle,
        description: description.trim() || undefined,
        permissions: selectedPermissions,
        status,
        vehicle_number: vehicleNumber.trim() || undefined,
        vehicle_type: vehicleType.trim() || undefined,
        managed_by: selectedManagerId,
        managed_by_name: targetManager?.name || staff.managed_by_name,
      },
      reason.trim() || 'Staff profile and role update'
    );

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
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-blue-500/40 shrink-0">
              <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Edit Staff Member</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono">
                  LEVEL 3: STAFF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {staff.email} • Reporting under {staff.managed_by_name}
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

          {tempPassResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Field Device Password Generated!</span>
              </div>
              <div className="font-mono text-sm font-black bg-white px-3 py-1.5 rounded-lg border border-emerald-200 inline-block text-emerald-800">
                {tempPassResult}
              </div>
              <p className="text-[11px] text-emerald-800">
                Share this password with field driver {staff.name} for the Driver Weighing App.
              </p>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              1. Profile & Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="active">Active (Online & Ready for Bookings)</option>
                  <option value="inactive">Inactive (Standby)</option>
                  <option value="suspended">Suspended (Blocked)</option>
                </select>
              </div>
            </div>

            {/* Reassign Managing Admin (Main Admin Feature) */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reporting Manager (Managing Admin)</span>
                </label>
                {isMainAdmin ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Main Admin Reassignment
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold">Supervised by you</span>
                )}
              </div>

              <select
                disabled={!isMainAdmin}
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl font-bold ${
                  isMainAdmin
                    ? 'bg-white border-amber-300 text-amber-950'
                    : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                }`}
              >
                {adminList
                  .filter((a) => a.can_create_staff || a.role_level === 'MAIN_ADMIN')
                  .map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} — {adm.custom_title} ({adm.role_level})
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-amber-800">
                Created by: <strong>{staff.created_by_name}</strong> on{' '}
                {new Date(staff.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Staff Designation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Staff Operational Title</span>
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
                    placeholder="Custom designation..."
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

            {/* Credentials Action */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block text-xs">Field Device Password</strong>
                <span className="text-[11px] text-slate-500">
                  Generate new setup password for collection driver phone.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-slate-600" />
                <span>Issue Temp Password</span>
              </button>
            </div>
          </div>

          {/* Section 2: Permissions */}
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

            {/* Checkboxes */}
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

          {/* Section 3: Audit Reason */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700">
              Audit Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Route re-routing, vehicle maintenance replacement, additional duties..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Audited modification</span>
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
              <Edit2 className="w-4 h-4" />
              <span>Save Staff Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
