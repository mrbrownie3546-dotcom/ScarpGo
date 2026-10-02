import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { ApprovalRequest, ApprovalStatus } from '../../types/scrapgo';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Search,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ApprovalCenterTab: React.FC = () => {
  const {
    approvalRequests,
    approveRequest,
    rejectRequest,
    currentAdmin,
    systemSettings,
  } = useScrap();

  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredRequests = approvalRequests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.target_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.acting_admin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = approvalRequests.filter((r) => r.status === 'pending').length;

  const handleApprove = (req: ApprovalRequest) => {
    const res = approveRequest(req.id);
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      try {
        confetti({ particleCount: 70, spread: 60, colors: ['#10b981', '#3b82f6', '#f59e0b'] });
      } catch (e) {
        // ignore
      }
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId || !rejectionReason.trim()) return;

    const res = rejectRequest(rejectingRequestId, rejectionReason.trim());
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
    setRejectingRequestId(null);
    setRejectionReason('');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black tracking-tight">Dual-Admin Approval Center</h2>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">
                Level 3 Governance
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              High-risk financial disbursements, scrap rate adjustments, and role elevations require
              a <strong>Second Admin review</strong>. The admin who submitted the request cannot authorize their own change.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending Reviews</span>
              <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dual Approval</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                systemSettings.require_dual_approval_for_high_risk
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {systemSettings.require_dual_approval_for_high_risk ? 'ENFORCED' : 'OPTIONAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, target, admin, reason..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'pending' ? `Pending (${pendingCount})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Approval Requests Feed */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>No requests matching the selected filter ({statusFilter}).</span>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelfRequest = currentAdmin.id === req.acting_admin_id;
            const canApprove = currentAdmin.adminRole === 'MAIN_ADMIN' && !isSelfRequest && req.status === 'pending';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  req.status === 'pending'
                    ? 'border-indigo-300 shadow-sm ring-2 ring-indigo-500/10'
                    : 'border-slate-200 shadow-xs opacity-90'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                      {req.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {req.action_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Module: <strong className="text-slate-800 uppercase">{req.module}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{req.status}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(req.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Target Title & Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  {/* Col 1: Target and Reason */}
                  <div className="lg:col-span-2 space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Record</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{req.target_title}</h4>
                      <span className="font-mono text-[10px] text-slate-400">ID: {req.target_record_id}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Operational Reason Submitted by Requester:
                      </span>
                      <p className="text-slate-700 italic leading-relaxed">"{req.reason}"</p>
                    </div>

                    {req.rejection_reason && (
                      <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900">
                        <span className="text-[10px] uppercase font-bold text-rose-700 block mb-0.5">
                          Rejection Reason:
                        </span>
                        <p className="italic">"{req.rejection_reason}"</p>
                      </div>
                    )}
                  </div>

                  {/* Col 2: Changes comparison */}
                  <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Value Modification:
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px]">Current:</span>
                          <span className="font-bold font-mono text-slate-800">{String(req.current_value)}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-bold">
                          <span className="text-[10px]">Proposed:</span>
                          <span className="font-mono">{String(req.proposed_value)}</span>
                        </div>
                      </div>
                      {req.difference && (
                        <div className="text-right text-[11px] font-bold text-indigo-700 mt-1.5">
                          Delta: {req.difference}
                        </div>
                      )}
                    </div>

                    {/* Acting Admin Identity */}
                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                      <span>Submitted by: </span>
                      <strong className="text-slate-800">{req.acting_admin_name}</strong>
                      <span className="ml-1 text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {req.acting_admin_role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approver Footer / Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {req.status === 'pending' ? (
                    <>
                      {isSelfRequest ? (
                        <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 w-full">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span className="text-[11px] font-semibold">
                            <strong>Self-Approval Prohibited:</strong> You submitted this change. A second Main Admin (e.g. Vikram or Deepak) must review and approve.
                          </span>
                        </div>
                      ) : currentAdmin.adminRole !== 'MAIN_ADMIN' ? (
                        <div className="text-slate-500 text-[11px] italic">
                          Main Admin authorization required to approve or reject Level 3 governance requests.
                        </div>
                      ) : (
                        <div className="text-indigo-900 text-[11px] font-semibold">
                          Logged in as <strong>{currentAdmin.name}</strong> (Main Admin) — Authorized to review.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {canApprove && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingRequestId(req.id);
                                setRejectionReason('');
                              }}
                              className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Execute Change</span>
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-[11px] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Reviewed by <strong>{req.approver_admin_name || 'Main Admin'}</strong> on{' '}
                        {req.approved_at ? new Date(req.approved_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reject Request ({rejectingRequestId})</h3>
              <button onClick={() => setRejectingRequestId(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Please provide an official justification for rejecting this high-risk modification:
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Discrepancy in scale slip, pending further KYC verification..."
                required
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
