import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Phone,
  MessageSquare,
  AlertTriangle,
  Power,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AdminConfirmModal } from './AdminConfirmModal';

export const SystemSettingsTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, currentAdmin, canPerform } = useScrap();

  const canManageSettings = canPerform('manage_settings', 'settings').allowed;

  // Local state for editable fields
  const [businessName, setBusinessName] = useState(systemSettings.business_name);
  const [whatsappNumber, setWhatsappNumber] = useState(systemSettings.whatsapp_number);
  const [helplineNumber, setHelplineNumber] = useState(systemSettings.helpline_number);
  const [supportEmail, setSupportEmail] = useState(systemSettings.support_email);
  const [minDualApprovalAmount, setMinDualApprovalAmount] = useState(
    systemSettings.min_payout_amount_requiring_dual_approval
  );

  // Modals for Level 2 confirmation
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [dualApprovalModalOpen, setDualApprovalModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveContactDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      setFeedback({ type: 'error', message: 'Permission Denied: Only MAIN_ADMIN can update system settings.' });
      return;
    }

    const res = updateSystemSettings(
      {
        business_name: businessName,
        whatsapp_number: whatsappNumber,
        helpline_number: helplineNumber,
        support_email: supportEmail,
        min_payout_amount_requiring_dual_approval: Number(minDualApprovalAmount),
      },
      'Updated business contact numbers and dual-approval thresholds'
    );

    if (res.success) {
      setFeedback({ type: 'success', message: 'Business settings updated successfully.' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleConfirmMaintenanceToggle = (reason: string) => {
    const newMode = !systemSettings.maintenance_mode;
    const res = updateSystemSettings(
      { maintenance_mode: newMode },
      reason || (newMode ? 'Enabled maintenance mode' : 'Disabled maintenance mode')
    );
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Maintenance mode ${newMode ? 'ACTIVATED' : 'DEACTIVATED'} successfully.`,
      });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setMaintenanceModalOpen(false);
  };

  const handleConfirmDualApprovalToggle = (reason: string) => {
    const newPolicy = !systemSettings.require_dual_approval_for_high_risk;
    const res = updateSystemSettings(
      { require_dual_approval_for_high_risk: newPolicy },
      reason || (newPolicy ? 'Enforced dual-admin approval policy' : 'Disabled dual-admin approval policy')
    );
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Dual approval for high-risk actions is now ${newPolicy ? 'STRICTLY ENFORCED' : 'OPTIONAL'}.`,
      });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setDualApprovalModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">System & Governance Settings</h2>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Main Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure app operational policies, high-risk approval triggers, and official contact details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
          <span className="text-slate-500 font-medium">Access Status:</span>
          <span className={`font-extrabold px-2.5 py-1 rounded-xl text-[11px] ${
            canManageSettings ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {canManageSettings ? 'AUTHORIZED' : 'RESTRICTED'}
          </span>
        </div>
      </div>

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

      {/* Critical Policy Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy 1: Dual Approval for High-Risk Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Dual-Admin Approval Rule</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  systemSettings.require_dual_approval_for_high_risk
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {systemSettings.require_dual_approval_for_high_risk ? 'ENFORCED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When enabled, high-risk financial payouts (≥ ₹{systemSettings.min_payout_amount_requiring_dual_approval}) and rate modifications require secondary Main Admin approval in the Approval Center before execution.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Threshold: ₹{systemSettings.min_payout_amount_requiring_dual_approval}+
            </span>
            <button
              type="button"
              disabled={!canManageSettings}
              onClick={() => setDualApprovalModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                !canManageSettings
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : systemSettings.require_dual_approval_for_high_risk
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {systemSettings.require_dual_approval_for_high_risk ? 'Disable Safeguard' : 'Enable Safeguard'}
            </button>
          </div>
        </div>

        {/* Policy 2: Maintenance Mode */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Power className="w-4 h-4 text-amber-600" />
                <span>System Maintenance Downtime</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  systemSettings.maintenance_mode
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {systemSettings.maintenance_mode ? 'DOWNTIME ACTIVE' : 'SYSTEM LIVE'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Temporarily pause customer pickup bookings and notify app visitors that server optimization or physical warehouse audits are in progress.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Status: {systemSettings.maintenance_mode ? 'Offline' : 'Online'}
            </span>
            <button
              type="button"
              disabled={!canManageSettings}
              onClick={() => setMaintenanceModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                !canManageSettings
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : systemSettings.maintenance_mode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {systemSettings.maintenance_mode ? 'Deactivate Maintenance' : 'Activate Maintenance'}
            </button>
          </div>
        </div>
      </div>

      {/* Business Details & WhatsApp Settings Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Business Identity & Official Contact Numbers</h3>
        <p className="text-xs text-slate-500 mb-4">
          Changes here update WhatsApp automated links, customer invoice headers, and dispatch notifications.
        </p>

        <form onSubmit={handleSaveContactDetails} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Brand Name</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official WhatsApp Master Number</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 82872 14705"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Helpline Number</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={helplineNumber}
                onChange={(e) => setHelplineNumber(e.target.value)}
                placeholder="+91 82872 14705"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Email Address</label>
              <input
                type="email"
                disabled={!canManageSettings}
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@scrapgo.in"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Minimum Payout Requiring Dual Approval (₹)
              </label>
              <input
                type="number"
                disabled={!canManageSettings}
                value={minDualApprovalAmount}
                onChange={(e) => setMinDualApprovalAmount(Number(e.target.value))}
                min="500"
                step="500"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Any payout amount modification exceeding this threshold requires second admin authorization.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={!canManageSettings}
              className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-xs ${
                !canManageSettings
                  ? 'opacity-40 cursor-not-allowed bg-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Save System Settings
            </button>
          </div>
        </form>
      </div>

      {/* Maintenance Confirmation Modal (Level 2 Action) */}
      <AdminConfirmModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        onConfirm={handleConfirmMaintenanceToggle}
        level={2}
        requireReason={true}
        title={systemSettings.maintenance_mode ? 'Resume ScrapHouse Operations' : 'Activate Maintenance Downtime'}
        actionText={systemSettings.maintenance_mode ? 'Deactivate Maintenance' : 'Activate Downtime'}
        targetTitle="System-Wide Service Status"
        currentValue={systemSettings.maintenance_mode ? 'Maintenance Active' : 'Normal Operations'}
        newValue={systemSettings.maintenance_mode ? 'Normal Operations' : 'Maintenance Active'}
        actingAdminName={currentAdmin.name}
        actingAdminRole={currentAdmin.adminRole}
        warning={
          systemSettings.maintenance_mode
            ? 'Customer booking scheduling and driver dispatch will be reopened immediately.'
            : 'Enabling maintenance mode pauses new pickup bookings on the website and mobile views.'
        }
      />

      {/* Dual Approval Confirmation Modal (Level 2 Action) */}
      <AdminConfirmModal
        isOpen={dualApprovalModalOpen}
        onClose={() => setDualApprovalModalOpen(false)}
        onConfirm={handleConfirmDualApprovalToggle}
        level={2}
        requireReason={true}
        title="Toggle Dual-Admin Approval Safeguard"
        actionText={
          systemSettings.require_dual_approval_for_high_risk
            ? 'Disable Dual Approval'
            : 'Enforce Dual Approval'
        }
        targetTitle="High-Risk Action Governance Policy"
        currentValue={systemSettings.require_dual_approval_for_high_risk ? 'Enforced' : 'Disabled'}
        newValue={systemSettings.require_dual_approval_for_high_risk ? 'Disabled' : 'Enforced'}
        actingAdminName={currentAdmin.name}
        actingAdminRole={currentAdmin.adminRole}
        warning="Dual approval prevents single-admin modifications of large financial payouts, scrap master rates, and role changes without secondary authorization."
      />
    </div>
  );
};
