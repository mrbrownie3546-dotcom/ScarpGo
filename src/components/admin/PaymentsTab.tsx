import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { Banknote, Search, QrCode, CheckCircle2, MessageCircle } from 'lucide-react';

export const PaymentsTab: React.FC = () => {
  const { payouts, approvePayout, getPayoutMethodLabel, bookings } = useScrap();
  const [tab, setTab] = useState<'pending' | 'paid'>('pending');
  const [term, setTerm] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [refFor, setRefFor] = useState<string | null>(null);
  const [ref, setRef] = useState('');

  const isPaid = (s: string) => s === 'successful';
  const pendingList = payouts.filter((p) => !isPaid(p.status) && p.status !== 'failed');
  const paidList = payouts.filter((p) => isPaid(p.status));
  const list = (tab === 'pending' ? pendingList : paidList).filter((p) => {
    const q = term.trim().toLowerCase();
    if (!q) return true;
    return (
      p.booking_number.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q)
    );
  });
  const sum = (a: { amount: number }[]) => a.reduce((s, p) => s + p.amount, 0);

  const wa = (p: (typeof payouts)[number]) => {
    const b = bookings.find((x) => x.id === p.booking_id);
    const phone = (b?.customer_phone || '').replace(/\D/g, '');
    if (!phone) return;
    const full = phone.length === 10 ? '91' + phone : phone;
    const msg = `Hello ${p.customer_name}, your payment of Rs ${p.amount} for booking ${p.booking_number} has been sent.`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600" />
          <p className="text-2xl font-black text-emerald-700">₹{sum(pendingList).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">To pay ({pendingList.length})</p>
        </div>
        <div className="relative bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600" />
          <p className="text-2xl font-black text-emerald-700">₹{sum(paidList).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Paid ({paidList.length})</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['pending', 'paid'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
              tab === t ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {t === 'pending' ? 'Pending' : 'Paid'}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search booking ID or name"
          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-emerald-600"
        />
      </div>

      {list.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
          No {tab === 'pending' ? 'pending' : 'paid'} requests
        </div>
      )}

      {list.map((p) => (
        <div key={p.id} className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 truncate">{p.customer_name}</p>
              <p className="text-xs text-slate-500 font-semibold">{p.booking_number}</p>
            </div>
            <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${isPaid(p.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {isPaid(p.status) ? 'Paid' : 'Awaiting payment'}
            </span>
          </div>
          <p className="text-xl font-black text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</p>
          <div className="text-xs text-slate-600 space-y-0.5">
            <p><span className="text-slate-400">Method:</span> {getPayoutMethodLabel(p.payout_method)}</p>
            {p.payout_destination && <p className="break-all"><span className="text-slate-400">Pay to:</span> {p.payout_destination}</p>}
            {p.transaction_reference && <p><span className="text-slate-400">Ref:</span> {p.transaction_reference}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            {p.upi_qr_url && (
              <button onClick={() => setQr(p.upi_qr_url!)} className="flex-1 flex items-center justify-center gap-1.5 border-2 border-emerald-700 text-emerald-700 rounded-xl py-2.5 text-xs font-bold cursor-pointer">
                <QrCode className="w-4 h-4" /> View QR
              </button>
            )}
            <button onClick={() => wa(p)} className="flex-1 flex items-center justify-center gap-1.5 border-2 border-emerald-700 text-emerald-700 rounded-xl py-2.5 text-xs font-bold cursor-pointer">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>
          {!isPaid(p.status) && (
            refFor === p.id ? (
              <div className="space-y-2 pt-1">
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Transaction reference (optional)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
                <div className="flex gap-2">
                  <button onClick={() => { approvePayout(p.id, ref.trim() || undefined); setRefFor(null); setRef(''); }} className="flex-1 bg-emerald-700 text-white rounded-xl py-3 text-sm font-extrabold cursor-pointer flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Confirm paid
                  </button>
                  <button onClick={() => { setRefFor(null); setRef(''); }} className="px-4 border-2 border-slate-300 text-slate-600 rounded-xl text-sm font-bold cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setRefFor(p.id)} className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-extrabold cursor-pointer flex items-center justify-center gap-1.5">
                <Banknote className="w-4 h-4" /> Mark as Paid
              </button>
            )
          )}
        </div>
      ))}

      {qr && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" onClick={() => setQr(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={qr} alt="Payment QR" className="w-full rounded-xl" />
            <button onClick={() => setQr(null)} className="mt-3 w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-extrabold cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
