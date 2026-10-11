import React, { useState, useEffect, useRef } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../lib/firebase';
import { useScrap } from '../../context/ScrapContext';
import {
  Phone,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  KeyRound,
  Lock,
} from 'lucide-react';

export interface PhoneAuthenticationProps {
  onOtpSent?: (phone: string, verificationId?: string, demoOtp?: string) => void;
  onVerified?: (phone: string, userResult?: any) => void;
  onError?: (errorMessage: string) => void;
  className?: string;
  defaultPhone?: string;
  autoFocus?: boolean;
  recaptchaContainerId?: string;
}

export const PhoneAuthentication: React.FC<PhoneAuthenticationProps> = ({
  onOtpSent,
  onVerified,
  onError,
  className = '',
  defaultPhone = '',
  autoFocus = true,
  recaptchaContainerId = 'firebase-recaptcha-container',
}) => {
  const { sendPhoneOtp, verifyPhoneOtp } = useScrap();

  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Cleanup ignore
        }
      }
    };
  }, []);

  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setErrorMsg('reCAPTCHA session expired. Please retry.');
          },
        });
      } catch (e: any) {
        console.warn('Firebase reCAPTCHA setup notice:', e);
      }
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      const err = 'Please enter a valid 10-digit mobile phone number.';
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      let verificationId: string | undefined;
      let demoCode: string | undefined;

      // Attempt Real Firebase Phone Auth reCAPTCHA
      try {
        const verifier = initRecaptcha();
        if (verifier) {
          const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
          setConfirmationResult(result);
          verificationId = result.verificationId;
        }
      } catch (fbError: any) {
        console.warn('Falling back to system OTP provider:', fbError);
      }

      // Fallback or context OTP trigger
      const res = await sendPhoneOtp(cleanPhone);
      if (res.success) {
        if (res.demoOtp) {
          setDemoOtp(res.demoOtp);
          demoCode = res.demoOtp;
        }
        setStep('otp');
        setSuccessMsg(`OTP sent to ${formattedPhone}. Enter the 6-digit code below.`);
        if (onOtpSent) onOtpSent(formattedPhone, verificationId, demoCode);
      } else {
        throw new Error(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to send OTP code. Please try again.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    if (val && index < 5) {
      const nextInput = document.getElementById(`phone-auth-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      const err = 'Please enter all 6 digits of the verification code.';
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      let userResult: any = null;

      // Verify with Firebase Confirmation Result if present
      if (confirmationResult) {
        try {
          userResult = await confirmationResult.confirm(enteredCode);
        } catch (confirmErr) {
          console.warn('Firebase confirmation failed, verifying with system provider:', confirmErr);
        }
      }

      // Verify via ScrapContext handler
      const res = await verifyPhoneOtp(phoneNumber, enteredCode);
      if (res.success) {
        setStep('verified');
        setSuccessMsg('Phone Number Verified Successfully!');
        if (onVerified) onVerified(formattedPhone, userResult || res);
      } else {
        throw new Error(res.message || 'Invalid OTP code entered.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Verification failed. Please check the code and try again.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('phone');
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
    setSuccessMsg(null);
    setDemoOtp(null);
    setConfirmationResult(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Firebase reCAPTCHA Container (Required for Firebase Phone Auth) */}
      <div id={recaptchaContainerId} className="flex justify-center my-1"></div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Phone Number Input */}
      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mobile Phone Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 text-slate-400 font-bold text-xs pointer-events-none">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700 pr-2">
                  +91
                </span>
              </div>
              <input
                type="tel"
                required
                autoFocus={autoFocus}
                placeholder="9876543210"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-20 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              We will send a 6-digit verification code via SMS.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || phoneNumber.length < 10}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Verification Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Send OTP Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: OTP Verification Input */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                +91 {phoneNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Change Number</span>
            </button>
          </div>

          {/* Demo OTP Banner with 1-Click Quick Fill */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Verification Code: <strong className="font-mono text-sm font-black tracking-widest text-amber-950 dark:text-amber-100">{demoOtp || '123456'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = demoOtp || '123456';
                  setOtpDigits(code.split(''));
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                ⚡ Quick Fill
              </button>
            </div>
            <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
              💡 Real SMS delivery requires paid SMS Gateway (Fast2SMS/MSG91). Currently active in Web Demo Mode. Click <strong>Quick Fill</strong> or enter <strong>123456</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex gap-2 justify-center">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`phone-auth-otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      const prev = document.getElementById(`phone-auth-otp-${index - 1}`);
                      if (prev) (prev as HTMLInputElement).focus();
                    }
                  }}
                  className="w-10 h-12 text-center text-lg font-mono font-black bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Verify & Continue</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: Verification Complete State */}
      {step === 'verified' && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Phone Verified (+91 {phoneNumber})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authentication completed successfully.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer pt-1"
          >
            Use a different phone number
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneAuthentication;
