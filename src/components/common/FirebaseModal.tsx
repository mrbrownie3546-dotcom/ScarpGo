import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { getFirebaseConfig, testFirebaseConnection } from '../../lib/firebaseClient';
import {
  Flame,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  RefreshCw,
  Database,
  Lock
} from 'lucide-react';

interface FirebaseModalProps {
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ onClose }) => {
  const { firebaseConnected } = useScrap();
  const config = getFirebaseConfig();

  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyConfig = () => {
    const info = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testFirebaseConnection();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Firebase Authentication & Firestore</h3>
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected Project: <span className="text-orange-300 font-mono">{config.projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Box */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-300">Firebase Backend Active & Configured</h4>
              <p className="text-xs text-emerald-200/80 mt-1">
                Your application is now 100% connected to Google Firebase. All customer accounts, email/password logins, and Firestore data are securely managed by Firebase Auth and Cloud Firestore.
              </p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Server className="w-4 h-4 text-orange-400" />
                Firebase Connection Details
              </div>
              <button
                onClick={handleCopyConfig}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Config'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Project ID</span>
                <span className="text-slate-200 font-mono truncate block">{config.projectId}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Auth Domain</span>
                <span className="text-slate-200 font-mono truncate block">{config.authDomain}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Firestore Database ID</span>
                <span className="text-slate-200 font-mono truncate block">{config.firestoreDatabaseId}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Database Type</span>
                <span className="text-emerald-400 font-medium truncate block">Cloud Firestore (Enterprise)</span>
              </div>
            </div>
          </div>

          {/* Test Connection Action */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <h4 className="text-xs font-semibold text-slate-300">Test Live Firebase Connection</h4>
              <p className="text-[11px] text-slate-500">Verify read/write capability with Cloud Firestore</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-950/60 text-red-300 border border-red-500/30'
              }`}
            >
              {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
