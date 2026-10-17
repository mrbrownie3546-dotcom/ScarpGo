import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { AdminUser, StaffMember, GranularPermission, AccountStatus } from '../../types/scrapgo';
import {
  PERMISSION_MODULE_GROUPS,
  ADMIN_DESIGNATIONS,
  STAFF_DESIGNATIONS,
} from '../../data/permissionsConfig';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  Sliders,
  Check,
} from 'lucide-react';

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: AdminUser | StaffMember | null;
  onSuccess: (message: string) => void;
}

export const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}) => {
  const { updateAdminAccount, updateStaffMember, currentAdmin } = useScrap();

  if (!isOpen || !targetUser) return null;

  const isStaff = targetUser.role_level === 'STAFF';

  const [title, setTitle] = useState(
    isStaff ? (targetUser as StaffMember).staff_title : (targetUser as AdminUser).custom_title
  );
  const [description, setDescription] = useState(targetUser.description || '');
  const [status, setStatus] = useState<AccountStatus>(targetUser.status || 'active');
  const [canCreateStaff, setCanCreateStaff] = useState(
    !isStaff ? Boolean((targetUser as AdminUser).can_create_staff) : false
  );
  const [canCreateAdmin, setCanCreateAdmin] = useState(
    !isStaff ? Boolean((targetUser as AdminUser).can_create_admin) : false
  );
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>(
    targetUser.permissions || []
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const togglePermission = (perm: GranularPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory operational reason is required for updating permissions (Security Audit Requirement).');
      return;
    }

    if (isStaff) {
      const res = updateStaffMember(
        targetUser.id,
        {
          staff_title: title.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
          status: status,
        },
        reason.trim()
      );
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } else {
      const res = updateAdminAccount(
        targetUser.id,
        {
          custom_title: title.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
          can_create_staff: canCreateStaff,
          can_create_admin: canCreateAdmin,
          status: status,
        },
        reason.trim()
      );
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center border border-slate-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  Edit Role & Permissions: {targetUser.name}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-500 text-slate-950">
                  {targetUser.role_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target ID: <strong className="font-mono text-slate-300">{targetUser.id}</strong> • Acting: {currentAdmin.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-5 py-2.5 text-xs font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 text-xs">✕</button>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Custom Professional Title / Designation
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {!isStaff && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canCreateStaff}
                  onChange={(e) => setCanCreateStaff(e.target.checked)}
                  className="w-4 h-4 text-slate-600 rounded"
                />
                <span className="font-bold text-slate-700">Can Create Staff (Recruitment Authority)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canCreateAdmin}
                  onChange={(e) => setCanCreateAdmin(e.target.checked)}
                  className="w-4 h-4 text-slate-600 rounded"
                />
                <span className="font-bold text-slate-700">Can Create Admins (Delegation)</span>
              </label>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Operational Scope / Responsibilities Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Granular Permissions Checklist */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
              Granular Module Permissions ({selectedPermissions.length} granted)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERMISSION_MODULE_GROUPS.map((group) => {
                return (
                  <div key={group.moduleId} className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                      {group.title}
                    </span>
                    <div className="space-y-1">
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-slate-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.key)}
                              className="w-4 h-4 text-slate-600 rounded mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{perm.label}</span>
                              <span className="text-[10px] text-slate-400 block">{perm.description}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mandatory Reason Field for Audit Log */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <label className="block font-bold text-slate-950">
              Mandatory Operational Reason (Logged in Immutable Security Trail): <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Granted payout verification rights following KYC training completion..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Enforce Permissions</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
