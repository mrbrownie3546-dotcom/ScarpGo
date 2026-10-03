import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { PayoutRecord } from '../../types/scrapgo';
import { Coins, CreditCard, Banknote, QrCode, Search, Filter, CheckCircle2, XCircle, ExternalLink, Clock } from 'lucide-react';

export const PaymentsTab: React.FC = () => {
  const { payouts, approvePayout, rejectPayout, updatePayoutStatusRecord } = useScrap();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // QR preview modal
  const [selectedQrUrl, setSelectedQrUrl] = useState<string | null>(null);

  // Status edit modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [txRefInput, setTxRefInput] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      p.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.payout_destination || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.payout_method === methodFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalDisbursed = payouts
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payouts
    .filter((p) => p.status === 'pending_approval' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {toast && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toast}
          </span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header & Payment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-400">Successful payouts to customers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending Disbursals</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums block">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-400">Requires admin processing</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Transactions</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums block">
            {payouts.length}
          </span>
          <span className="text-[10px] text-slate-400">Cash, UPI & Bank IMPS records</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search booking #, customer, or UPI ID..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash on Spot</option>
            <option value="upi">UPI / QR Code</option>
            <option value="bank_transfer">Bank IMPS</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="processing">Processing</option>
            <option value="successful">Successful / Paid</option>
            <option value="failed">Failed / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Booking #</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Method & Destination</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">QR Photo</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredPayouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-extrabold text-slate-900 dark:text-white font-mono">
                    {p.booking_number}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {p.customer_name}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      {p.payout_method === 'upi' ? (
                        <QrCode className="w-4 h-4 text-emerald-600" />
                      ) : p.payout_method === 'cash' ? (
                        <Banknote className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="uppercase text-[11px]">{p.payout_method}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.payout_destination || 'Cash Doorstep'}</div>
                  </td>
                  <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'successful'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.status === 'pending_approval' || p.status === 'processing'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {p.upi_qr_url ? (
                      <button
                        onClick={() => setSelectedQrUrl(p.upi_qr_url!)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 transition-all cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View QR</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">None</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    {p.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => {
                            approvePayout(p.id);
                            showToast(`Payout for ${p.booking_number} approved!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            rejectPayout(p.id, 'Admin rejection from payments panel');
                            showToast(`Payout for ${p.booking_number} rejected.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {p.status !== 'successful' && (
                      <button
                        onClick={() => {
                          setSelectedPayout(p);
                          setTxRefInput(p.transaction_reference || `TXN-${Date.now().toString().slice(-6)}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px] hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Screenshot Modal */}
      {selectedQrUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Customer Payment QR Code
            </h3>

            <div className="w-56 h-56 mx-auto rounded-2xl bg-white p-2 border border-slate-200 shadow-md overflow-hidden">
              <img src={selectedQrUrl} alt="Customer Payment QR" className="w-full h-full object-contain rounded-xl" />
            </div>

            <p className="text-xs text-slate-500">Scan with PhonePe / GPay / Paytm scanner to initiate instant disbursement.</p>

            <button
              onClick={() => setSelectedQrUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Mark Transaction as Successful / Paid
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs space-y-1">
              <p><strong>Booking #:</strong> {selectedPayout.booking_number}</p>
              <p><strong>Customer:</strong> {selectedPayout.customer_name}</p>
              <p><strong>Amount:</strong> ₹{selectedPayout.amount}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bank / UPI Transaction Reference #
              </label>
              <input
                type="text"
                value={txRefInput}
                onChange={(e) => setTxRefInput(e.target.value)}
                placeholder="e.g. UTR-2026849201"
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedPayout(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updatePayoutStatusRecord(selectedPayout.id, 'successful', txRefInput);
                  setSelectedPayout(null);
                  showToast(`Payout marked as successful with ref: ${txRefInput}`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
