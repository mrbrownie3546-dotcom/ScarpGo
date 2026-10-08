import React, { useState } from 'react';
import { Booking } from '../../types/scrapgo';
import { useScrap } from '../../context/ScrapContext';
import { KeyRound, X, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface OtpVerificationModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  booking,
  onClose,
  onSuccess,
}) => {
  const { staffVerifyOtp } = useScrap();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = digits.join('');
    if (entered.length < 4) {
      setErrorMsg('Please enter the full 4-digit OTP provided by customer.');
      return;
    }

    const res = staffVerifyOtp(booking.id, entered);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900">Verify Customer OTP</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ask customer <strong>{booking.customer_name}</strong> for the 4-digit code shown on their SCRAPGO app screen.
        </p>

        {/* Demo Helper Hint with Quick Fill */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 my-3 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>Customer Code:</span>
            <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-950">
              {booking.pickup_otp || '1234'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const code = booking.pickup_otp || '1234';
              setDigits(code.split(''));
              setErrorMsg(null);
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            ⚡ Quick Fill
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-center gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center font-mono text-2xl font-black rounded-xl border-2 border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify & Unlock Digital Scale</span>
          </button>
        </form>
      </div>
    </div>
  );
};
