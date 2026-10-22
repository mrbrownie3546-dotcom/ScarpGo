import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { phoneKeyFor, normalizePhoneDigits } from '../../lib/trackingPhone';
import { ShieldBan, Trash2, Plus } from 'lucide-react';

// Spam protection: yaha block kiye gaye numbers se nayi pickup booking
// Firestore rules turant reject karti hain (phone ka sirf SHA-256 key store
// hota hai - poora number kahin nahi dikhta, sirf aakhri 4 digits).
interface BlockedEntry {
  key: string;
  last4: string;
  blocked_at: string;
  reason?: string;
}

export const BlockedNumbersTab: React.FC = () => {
  const [entries, setEntries] = useState<BlockedEntry[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, 'blocked_phones'));
      const list: BlockedEntry[] = snap.docs.map((d) => ({
        key: d.id,
        last4: String(d.data().last4 || '????'),
        blocked_at: String(d.data().blocked_at || ''),
        reason: d.data().reason ? String(d.data().reason) : undefined,
      }));
      list.sort((a, b) => (a.blocked_at < b.blocked_at ? 1 : -1));
      setEntries(list);
    } catch (e: any) {
      setError(e?.message || 'Could not load blocked numbers.');
    }
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const blockNumber = async () => {
    const digits = normalizePhoneDigits(phoneInput);
    if (digits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const key = await phoneKeyFor(digits);
      await setDoc(doc(db, 'blocked_phones', key), {
        blocked_at: new Date().toISOString(),
        last4: digits.slice(-4),
        ...(reasonInput.trim() ? { reason: reasonInput.trim().slice(0, 120) } : {}),
      });
      setPhoneInput('');
      setReasonInput('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not block this number.');
    }
    setBusy(false);
  };

  const unblock = async (key: string) => {
    setBusy(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'blocked_phones', key));
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not unblock.');
    }
    setBusy(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldBan className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Blocked Numbers</h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              Pickup bookings from these numbers are rejected instantly. Also: one number can book only once every 10 minutes (automatic).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">Block a number</p>
        <input
          type="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder="10-digit mobile number"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <input
          type="text"
          value={reasonInput}
          onChange={(e) => setReasonInput(e.target.value)}
          placeholder="Reason (optional, e.g. fake bookings)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        <button
          onClick={blockNumber}
          disabled={busy || normalizePhoneDigits(phoneInput).length < 10}
          className="w-full bg-gradient-to-r from-[#16a34a] to-[#047857] disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          {busy ? 'Working...' : 'Block this number'}
        </button>
        <p className="text-[10.5px] text-slate-400 font-semibold leading-snug">
          Only the last 4 digits are shown here. The full number is never stored in the block list.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
          Blocked ({entries.length})
        </p>
        {!loaded ? (
          <p className="text-sm text-slate-400 font-semibold">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500 font-semibold">No blocked numbers.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((e) => (
              <div key={e.key} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800">••••••{e.last4}</p>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">
                    {e.blocked_at ? new Date(e.blocked_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    {e.reason ? ` · ${e.reason}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => unblock(e.key)}
                  disabled={busy}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
