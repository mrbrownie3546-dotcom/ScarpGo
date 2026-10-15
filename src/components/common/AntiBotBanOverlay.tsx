import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, RefreshCw, KeyRound, Lock, ServerOff } from 'lucide-react';
import { checkIpBan, unbanIpOrDevice, getUserIp, getDeviceKey } from '../../lib/rateLimiter';
import { verifyMasterPassword } from '../../lib/authCrypto';

export const AntiBotBanOverlay: React.FC = () => {
  const [banInfo, setBanInfo] = useState<{ isBanned: boolean; ip: string; deviceId: string; reason?: string }>(
    () => checkIpBan()
  );
  const [adminUnbanKey, setAdminUnbanKey] = useState('');
  const [unbanError, setAdminUnbanError] = useState<string | null>(null);
  const [unbanSuccess, setAdminUnbanSuccess] = useState<string | null>(null);
  const [showAdminPassInput, setShowAdminUnbanInput] = useState(false);

  useEffect(() => {
    const check = () => {
      setBanInfo(checkIpBan());
    };
    check();
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!banInfo.isBanned) return null;

  const handleAdminUnban = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUnbanError(null);
    setAdminUnbanSuccess(null);

    // Master admin password verified against its salted PBKDF2 hash - the
    // password itself is not present anywhere in this code.
    if (await verifyMasterPassword(adminUnbanKey.trim())) {
      unbanIpOrDevice(banInfo.ip);
      unbanIpOrDevice(banInfo.deviceId);
      setAdminUnbanSuccess('✅ IP / Device Unbanned successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setAdminUnbanError('❌ Invalid Master Security Password. Contact Super Admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-9999 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 text-center relative overflow-hidden">
        {/* Glowing Top Alert Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-inner mt-2">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Anti-Bot Shield Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-rose-400">
            ACCESS DENIED: IP Address Banned
          </h2>
          <p className="text-slate-300 text-xs mt-2 leading-relaxed max-w-md mx-auto">
            Automated bot attack or repeated brute-force password entries detected from your IP / Device.
            To protect ScrapHouse platform security, access has been restricted.
          </p>
        </div>

        {/* IP & Device Details Box */}
        <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-800/80">
            <span>Client IP Address:</span>
            <span className="text-rose-400 font-bold">{banInfo.ip || getUserIp()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-800/80">
            <span>Device Fingerprint:</span>
            <span className="text-amber-300 font-bold truncate max-w-[180px]">{banInfo.deviceId || getDeviceKey()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Ban Cause / Reason:</span>
            <span className="text-slate-300 font-semibold text-[11px]">{banInfo.reason || 'Excessive failed password attempts'}</span>
          </div>
        </div>

        {/* Unban Option */}
        <div className="pt-2 border-t border-slate-800">
          {!showAdminPassInput ? (
            <button
              onClick={() => setShowAdminUnbanInput(true)}
              className="text-xs font-bold text-slate-400 hover:text-emerald-400 underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Override / Emergency Unban Key</span>
            </button>
          ) : (
            <form onSubmit={handleAdminUnban} className="space-y-3 max-w-sm mx-auto text-xs">
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminUnbanKey}
                  onChange={(e) => setAdminUnbanKey(e.target.value)}
                  placeholder="Enter Master Admin Password"
                  className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {unbanError && <p className="text-rose-400 text-[11px] font-bold">{unbanError}</p>}
              {unbanSuccess && <p className="text-emerald-400 text-[11px] font-bold">{unbanSuccess}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition-all shadow-md"
                >
                  Unban My IP Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminUnbanInput(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
