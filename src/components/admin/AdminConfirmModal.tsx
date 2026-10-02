import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  actionText?: string;
  targetTitle?: string;
  currentValue?: string | number;
  newValue?: string | number;
  difference?: string;
  warning?: string;
  level?: 2 | 3; // 2 = Confirmation Required, 3 = High-Risk Action
  requireReason?: boolean;
  actingAdminName?: string;
  actingAdminRole?: string;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionText = 'Confirm Action',
  targetTitle,
  currentValue,
  newValue,
  difference,
  warning,
  level = 2,
  requireReason = false,
  actingAdminName,
  actingAdminRole,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('A valid operational reason is required for this action.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
    setReason('');
  };

  const currentTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white ${
          level === 3 ? 'bg-rose-950 border-b border-rose-800' : 'bg-slate-900 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {level === 3 ? (
              <div className="w-8 h-8 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">{title}</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  level === 3 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  {level === 3 ? 'LEVEL 3 • HIGH-RISK' : 'LEVEL 2 • CONFIRMATION'}
                </span>
              </div>
              {targetTitle && (
                <p className="text-xs text-slate-300 mt-0.5">Target: <strong>{targetTitle}</strong></p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Acting Admin Identity & Timestamp Strip */}
          <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
            <div>
              <span>Acting Admin: </span>
              <strong className="text-slate-900">{actingAdminName || 'Authorized Admin'}</strong>
              {actingAdminRole && (
                <span className="ml-1.5 font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                  {actingAdminRole}
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              {currentTimestamp}
            </div>
          </div>

          {warning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Important Security Notice:</span>
                <span>{warning}</span>
              </div>
            </div>
          )}

          {/* Value Changes Overview */}
          {(currentValue !== undefined || newValue !== undefined) && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Modification Summary:
              </span>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                {currentValue !== undefined && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Current Value:</span>
                    <span className="font-bold text-slate-900 text-sm break-all">{String(currentValue)}</span>
                  </div>
                )}
                {newValue !== undefined && (
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/30">
                    <span className="text-[10px] text-emerald-700 font-bold block">Proposed New Value:</span>
                    <span className="font-bold text-emerald-800 text-sm break-all">{String(newValue)}</span>
                  </div>
                )}
              </div>
              {difference && (
                <div className="text-right text-[11px] font-bold text-emerald-700 pt-1">
                  Change: {difference}
                </div>
              )}
            </div>
          )}

          {/* Reason input field */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {requireReason ? 'Reason for Action (Mandatory for Audit Trail):' : 'Reason / Reference Note (Optional):'}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={requireReason ? 'e.g. Reweighed AC units on verified scale, client requested cancellation...' : 'Enter administrative note...'}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && <p className="text-rose-600 text-[11px] mt-1 font-semibold">{error}</p>}
          </div>

          {level === 3 && (
            <p className="text-[11px] text-slate-500 italic">
              ℹ️ High-risk actions will be logged in the immutable security audit trail. If Dual Approval is enabled, this change will be submitted to the Approval Center for review by a second Main Admin.
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-sm ${
                level === 3
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
