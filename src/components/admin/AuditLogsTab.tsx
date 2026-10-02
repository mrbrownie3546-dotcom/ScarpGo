import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { AuditLog } from '../../types/scrapgo';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Lock,
  Clock,
  ArrowRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  const { auditLogs } = useScrap();

  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesResult = selectedResult === 'all' || log.result === selectedResult;
    const matchesSearch =
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target_id && log.target_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesModule && matchesResult && matchesSearch;
  });

  const totalLogs = auditLogs.length;
  const blockedAttempts = auditLogs.filter((l) => l.result === 'blocked').length;
  const approvalsCount = auditLogs.filter((l) => l.module === 'approval_center').length;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black tracking-tight">Security & Operational Audit Trail</h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
              Immutable • Append-Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every administrative modification, financial status change, scrap rate update, and unauthorized permission violation
            is cryptographically logged. Records cannot be updated, edited, or deleted.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-800/80 border border-slate-700 p-2.5 px-3 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Events</span>
            <span className="text-xl font-black text-white">{totalLogs}</span>
          </div>
          <div className="bg-slate-800/80 border border-rose-900/50 p-2.5 px-3 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Blocked Access</span>
            <span className="text-xl font-black text-rose-400">{blockedAttempts}</span>
          </div>
          <div className="bg-slate-800/80 border border-indigo-900/50 p-2.5 px-3 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">Approval Center</span>
            <span className="text-xl font-black text-indigo-300">{approvalsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, target, reason..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Module Selector */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
          >
            <option value="all">All Modules</option>
            <option value="payouts">Payouts & Finance</option>
            <option value="pickups">Pickups & Logistics</option>
            <option value="rates">Scrap Rates</option>
            <option value="admins">Admin Accounts</option>
            <option value="users">Customer Users</option>
            <option value="settings">System Settings</option>
            <option value="content">Website Content</option>
            <option value="approval_center">Approval Center</option>
          </select>

          {/* Result Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'success', 'blocked', 'pending_approval'] as const).map((res) => (
              <button
                key={res}
                onClick={() => setSelectedResult(res)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors ${
                  selectedResult === res
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {res === 'pending_approval' ? 'Pending' : res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Log ID / Timestamp</th>
                <th className="p-3.5">Actor Identity & Role</th>
                <th className="p-3.5">Action & Module</th>
                <th className="p-3.5">Target Record</th>
                <th className="p-3.5">Value Change / Reason</th>
                <th className="p-3.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No audit events match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      log.result === 'blocked' ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Log ID & Timestamp */}
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900 block">{log.id}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{log.actor_name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                          log.actor_role === 'MAIN_ADMIN'
                            ? 'bg-amber-100 text-amber-900'
                            : log.actor_role === 'PICKUP_ADMIN'
                            ? 'bg-blue-100 text-blue-800'
                            : log.actor_role === 'PAYOUT_ADMIN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.actor_role === 'CONTENT_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.actor_role}
                      </span>
                    </td>

                    {/* Action & Module */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        {log.module}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="p-3.5">
                      {log.target_id ? (
                        <span className="font-mono font-semibold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.target_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">System-Wide</span>
                      )}
                    </td>

                    {/* Value Changes / Reason */}
                    <td className="p-3.5 max-w-xs">
                      {(log.old_value !== undefined || log.new_value !== undefined) && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                          <span className="line-through text-slate-400">{String(log.old_value)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-bold text-emerald-700">{String(log.new_value)}</span>
                        </div>
                      )}
                      {log.reason && (
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={log.reason}>
                          "{log.reason}"
                        </span>
                      )}
                    </td>

                    {/* Result */}
                    <td className="p-3.5 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1 ${
                          log.result === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.result === 'blocked'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : log.result === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.result === 'blocked' && <ShieldAlert className="w-3 h-3 text-rose-600 animate-pulse" />}
                        {log.result === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{log.result.replace('_', ' ')}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
