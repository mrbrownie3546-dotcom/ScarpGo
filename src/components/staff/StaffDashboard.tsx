import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { Booking } from '../../types/scrapgo';
import {
  Truck,
  MapPin,
  Phone,
  Navigation,
  KeyRound,
  Scale,
  CheckCircle2,
  Clock,
  Smartphone,
  Maximize2,
  ShieldCheck,
  Coins,
  ChevronRight,
  AlertCircle,
  QrCode,
  XCircle,
  Ban,
  X,
} from 'lucide-react';
import { OtpVerificationModal } from './OtpVerificationModal';
import { DigitalScaleCalculator } from './DigitalScaleCalculator';

export const StaffDashboard: React.FC = () => {
  const {
    selectedStaffAgent,
    bookings,
    staffStartJourney,
    staffMarkArrived,
    staffCancelBooking,
  } = useScrap();

  const [activeTab, setActiveTab] = useState<'assigned' | 'active' | 'completed'>('assigned');
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Modals
  const [otpBooking, setOtpBooking] = useState<Booking | null>(null);
  const [scaleBooking, setScaleBooking] = useState<Booking | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer not available at location');
  const [cancelNotes, setCancelNotes] = useState('');

  // Filter bookings assigned to this staff driver
  const myBookings = bookings.filter((b) => b.staff_id === selectedStaffAgent.id);

  const activeOrEnRoute = myBookings.filter(
    (b) => b.status === 'on_the_way' || b.status === 'arrived' || b.status === 'weighing'
  );
  const pendingAssigned = myBookings.filter((b) => b.status === 'assigned');
  const completedBookings = myBookings.filter((b) => b.status === 'completed');

  // Today's stats
  const totalWeightToday = completedBookings.reduce(
    (sum, b) => sum + (b.final_weight_kg || 0),
    0
  );
  const totalAmountToday = completedBookings.reduce(
    (sum, b) => sum + (b.final_amount || 0),
    0
  );

  const displayList =
    activeTab === 'assigned'
      ? myBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
      : activeTab === 'active'
      ? activeOrEnRoute
      : completedBookings;

  const handleOpenMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const content = (
    <div className="space-y-5">
      {/* Staff Identity & Vehicle Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-lg shrink-0">
              {selectedStaffAgent.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{selectedStaffAgent.full_name}</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  ★ 4.9 Driver
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedStaffAgent.vehicle_number}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>{selectedStaffAgent.phone}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Sonipat & NCR Fleet</span>
              </div>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="grid grid-cols-3 gap-2 text-center sm:border-l sm:border-slate-800 sm:pl-6">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Today&apos;s Runs</span>
              <span className="text-base font-bold text-white">{myBookings.length}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Weight</span>
              <span className="text-base font-bold text-emerald-400">{totalWeightToday} kg</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Value</span>
              <span className="text-base font-bold text-amber-400">₹{totalAmountToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'assigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Assigned Pickups ({pendingAssigned.length + activeOrEnRoute.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'active'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            In Progress ({activeOrEnRoute.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'completed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Completed ({completedBookings.length})
          </button>
        </div>

        {/* Device frame preview button */}
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-medium shadow-2xs"
          title="Toggle Mobile Driver View"
        >
          {isMobileFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5 text-amber-600" />}
          <span>{isMobileFrame ? 'Desktop Mode' : 'Mobile App View'}</span>
        </button>
      </div>

      {/* Bookings Stream */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
            <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-800">No pickups in this section right now.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Check other tabs or ask Admin dispatch to assign new pickups.
            </p>
          </div>
        ) : (
          displayList.map((booking) => {
            const isEnRoute = booking.status === 'on_the_way';
            const isArrived = booking.status === 'arrived';
            const isWeighing = booking.status === 'weighing';
            const isDone = booking.status === 'completed';

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                  isEnRoute || isArrived || isWeighing
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {booking.booking_number}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWeighing
                          ? 'bg-purple-100 text-purple-800'
                          : isArrived
                          ? 'bg-amber-100 text-amber-800'
                          : isEnRoute
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {booking.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Slot: {booking.preferred_date} ({booking.preferred_time_slot})</span>
                  </span>
                </div>

                {/* Dedicated Cancel / Reject button directly under the status section */}
                {!isDone && booking.status !== 'cancelled' && (
                  <div className="mt-2.5 pt-2 flex items-center justify-between bg-rose-50/90 border border-rose-200/80 px-3 py-2 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Need to reject or cancel this pickup?</span>
                    </span>
                    <button
                      onClick={() => setRejectingBooking(booking)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel / Reject</span>
                    </button>
                  </div>
                )}

                {/* Customer and Pickup Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{booking.customer_name}</span>
                      <a
                        href={`tel:${booking.customer_phone}`}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-emerald-200"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{booking.customer_phone}</span>
                      </a>
                    </div>
                    <p className="text-slate-600 flex items-start gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {booking.pickup_address}
                        {booking.pickup_landmark ? ` (Landmark: ${booking.pickup_landmark})` : ''}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected Scrap:</span>
                      <span className="font-semibold text-slate-900">{booking.expected_scrap_items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Weight:</span>
                      <span className="font-semibold text-slate-900">{booking.estimated_weight_kg || 25} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payout Mode:</span>
                      <span className="font-semibold uppercase text-emerald-700">{booking.payout_method}</span>
                    </div>
                    {booking.upi_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">UPI ID:</span>
                        <span className="font-mono font-semibold text-slate-900">{booking.upi_id}</span>
                      </div>
                    )}
                    {booking.upi_qr_url && (
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-1">
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Customer Payment QR Code:</span>
                        </span>
                        <div onClick={() => window.open(booking.upi_qr_url, '_blank')} className="cursor-pointer inline-block group">
                          <img src={booking.upi_qr_url} alt="Scan QR" className="w-24 h-24 object-contain bg-white border-2 border-emerald-500 rounded-xl shadow-xs group-hover:scale-105 transition-transform" />
                          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">🔍 Tap to open QR image</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Distance & ETA indicator if on the way */}
                {isEnRoute && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      <span>En route to customer • Live GPS active</span>
                    </div>
                    <span className="font-bold">
                      {booking.staff_distance_km ? `${booking.staff_distance_km} km` : '2.8 km'} (~{booking.staff_eta_minutes ?? 12} mins)
                    </span>
                  </div>
                )}

                {/* Arrived notification */}
                {isArrived && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-950 text-xs rounded-xl flex items-center justify-between mb-3">
                    <span className="font-semibold">
                      📍 You are at customer&apos;s door! Ask for 4-digit verification OTP.
                    </span>
                    <span className="font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded text-[11px]">
                      Awaiting OTP
                    </span>
                  </div>
                )}

                {/* Completed summary bill */}
                {isDone && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold block">
                        Pickup Finished: {booking.final_weight_kg} kg collected
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Total Bill: ₹{booking.final_amount} • Payout Status:{' '}
                        <strong className="uppercase">{booking.payout_status.replace('_', ' ')}</strong>
                      </span>
                    </div>
                    <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">
                      ₹{booking.final_amount}
                    </span>
                  </div>
                )}

                {/* WORKFLOW ACTION BUTTONS */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* Google Maps Navigate */}
                  {!isDone && (
                    <button
                      onClick={() => handleOpenMaps(booking.pickup_address)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Navigate</span>
                    </button>
                  )}

                  {/* Step 1: Start Journey */}
                  {booking.status === 'assigned' && (
                    <button
                      onClick={() => staffStartJourney(booking.id)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Start Journey (On The Way)</span>
                    </button>
                  )}

                  {/* Step 2: Mark Arrived */}
                  {isEnRoute && (
                    <button
                      onClick={() => staffMarkArrived(booking.id)}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Mark Arrived at Doorstep</span>
                    </button>
                  )}

                  {/* Step 3: Enter OTP */}
                  {isArrived && (
                    <button
                      onClick={() => setOtpBooking(booking)}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enter Customer OTP</span>
                    </button>
                  )}

                  {/* Step 4: Digital Weighing Scale */}
                  {isWeighing && (
                    <button
                      onClick={() => setScaleBooking(booking)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Scale className="w-4 h-4 animate-bounce" />
                      <span>Open Digital Scale & Weigh Items</span>
                    </button>
                  )}

                  {/* Re-open scale or view bill if done */}
                  {isDone && (
                    <button
                      onClick={() => setScaleBooking(booking)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1"
                    >
                      View Scale Bill Breakdown
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Toggle between responsive layout and native mobile frame */}
        {isMobileFrame ? (
          <div className="max-w-sm mx-auto bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-700">
            {/* Phone notch */}
            <div className="w-36 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
            </div>
            {/* Phone screen container */}
            <div className="bg-slate-100 rounded-[30px] p-3 max-h-[820px] overflow-y-auto">
              {content}
            </div>
          </div>
        ) : (
          content
        )}
      </div>

      {/* OTP verification dialog */}
      {otpBooking && (
        <OtpVerificationModal
          booking={otpBooking}
          onClose={() => setOtpBooking(null)}
          onSuccess={() => {
            const current = otpBooking;
            setOtpBooking(null);
            // Open scale right away
            setScaleBooking(current);
          }}
        />
      )}

      {/* Digital Scale dialog */}
      {scaleBooking && (
        <DigitalScaleCalculator
          booking={scaleBooking}
          onClose={() => setScaleBooking(null)}
          onComplete={() => setScaleBooking(null)}
        />
      )}

      {/* Cancel / Reject Confirmation Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">Cancel / Reject Pickup</h3>
              </div>
              <button
                onClick={() => setRejectingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel or reject pickup request{' '}
              <strong className="text-slate-900 font-mono">#{rejectingBooking.booking_number}</strong> for{' '}
              <strong className="text-slate-900">{rejectingBooking.customer_name}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Reason for Cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="Customer not available at location">Customer not available at location</option>
                <option value="Customer refused pickup / Changed mind">Customer refused pickup / Changed mind</option>
                <option value="Inaccurate scrap description / Restricted materials">Inaccurate scrap description / Restricted materials</option>
                <option value="Vehicle breakdown / Traffic delay">Vehicle breakdown / Traffic delay</option>
                <option value="Address unreachable / Incorrect details">Address unreachable / Incorrect details</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes (Optional):</label>
              <textarea
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                placeholder="Provide details for dispatch & admin..."
                rows={2}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Keep Pickup
              </button>
              <button
                onClick={() => {
                  const fullReason = cancelNotes ? `${cancelReason} - ${cancelNotes}` : cancelReason;
                  staffCancelBooking(rejectingBooking.id, fullReason);
                  setRejectingBooking(null);
                  setCancelNotes('');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Cancel / Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
