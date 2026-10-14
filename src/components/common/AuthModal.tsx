import React, { useState, useEffect, useCallback } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserRole, UserProfile } from '../../types/scrapgo';
import {
  getLoginSecurityState,
  recordFailedPasswordAttempt,
  recordSuccessfulLogin,
} from '../../lib/rateLimiter';
import {
  X,
  Phone,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Truck,
  Recycle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Lock,
  MapPin,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  onClose: () => void;
  initialRole?: UserRole;
  allowedRoles?: UserRole[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  initialRole = 'customer',
  allowedRoles = ['staff'],
}) => {
  const {
    adminLogin,
    staffMembers,
    setCurrentUser,
    setActivePortal,
    authLoading,
    setOverlayActive,
    sendPhoneOtp,
    verifyPhoneOtp,
    registerCustomerAccountWithPhone,
    customerPhoneLogin,
    sendForgotPasswordPhoneOtp,
    verifyForgotPasswordPhoneOtp,
    resetCustomerPasswordWithPhone,
  } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    isAdminOnly ? 'admin' : initialRole === 'admin' ? 'customer' : initialRole
  );

  // Customer Auth Flow States
  const [customerAuthMode, setCustomerAuthMode] = useState<'login' | 'register' | 'forgotPassword'>('login');
  
  // Registration Steps: 'phone' -> 'otp' -> 'details'
  const [registerStep, setRegisterStep] = useState<'phone' | 'otp' | 'details'>('phone');
  
  // Forgot Password Steps: 'phone' -> 'otp' -> 'newPassword'
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'newPassword'>('phone');

  // Form Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // OTP Code Digits
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forgot Password Input States
  const [newPassword, setNewPassword] = useState('');

  // UI Error & Success State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Security Rate Limiting & Lockout Protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const MAX_ATTEMPTS = 3;

  const { t } = useScrap();

  const roleKey = selectedRole || (isAdminOnly ? 'admin' : 'customer');

  const syncSecurityState = useCallback(() => {
    const sec = getLoginSecurityState(roleKey);
    setFailedAttempts(sec.failedAttempts);
    setLockoutSeconds(sec.lockoutSeconds);
    setIsBanned(sec.isBanned);
  }, [roleKey]);

  useEffect(() => {
    syncSecurityState();
    const timer = setInterval(() => {
      syncSecurityState();
    }, 1000);
    return () => clearInterval(timer);
  }, [syncSecurityState]);

  const resetAllFormStates = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setAddress('');
    setPhone('');
    setNewPassword('');
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
    setSuccessMsg(null);
    setRegisterStep('phone');
    setForgotStep('phone');
  };

  const handleSelectRole = (r: UserRole) => {
    setSelectedRole(r);
    setCustomerAuthMode('login');
    resetAllFormStates();
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    if (val && index < 5) {
      const next = document.getElementById(`customer-otp-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  // ==========================================
  // 1. CUSTOMER LOGIN (PHONE & PASSWORD)
  // ==========================================
  const handleCustomerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const custKey = `cust_${phone.trim() || 'global'}`;
    const sec = getLoginSecurityState(custKey);

    if (sec.isBanned || isBanned) {
      setErrorMsg('🚫 ACCESS DENIED: Anti-Bot System Active. Excessive brute-force attempts detected. IP Address Banned.');
      return;
    }

    if (sec.isLocked || lockoutSeconds > 0) {
      setErrorMsg(t('lockout_active_error', `🔒 Security Lockout Active: 3 lga taar galat password! Account ${sec.lockoutSeconds || lockoutSeconds}s ke liye locked hai. Refresh/back par bhi timer active rahega.`));
      return;
    }

    if (!phone.trim() || !password.trim()) {
      setErrorMsg('Kripya apna Phone Number aur Password enter karein.');
      return;
    }

    setLoading(true);
    const res = await customerPhoneLogin(phone, password);
    setLoading(false);

    if (res.success && res.user) {
      recordSuccessfulLogin(custKey);
      setFailedAttempts(0);
      setLockoutSeconds(0);
      try {
        confetti({ particleCount: 60, spread: 60 });
      } catch (e) {
        // Ignore
      }
      onClose();
    } else {
      const nextSec = recordFailedPasswordAttempt(custKey);
      setFailedAttempts(nextSec.failedAttempts);
      setLockoutSeconds(nextSec.lockoutSeconds);
      setIsBanned(nextSec.isBanned);

      if (nextSec.isBanned) {
        setErrorMsg('🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.');
      } else if (nextSec.isLocked) {
        setErrorMsg(`🔒 Security Alert (Locked 30s): 3 lga taar galat password enter karne par account 30 seconds ke liye lock kar diya gaya hai.`);
      } else {
        const remaining = Math.max(0, 3 - nextSec.failedAttempts);
        setErrorMsg(res.message || `🔐 Security Alert: Entered Credentials do not match. Remaining attempts: ${remaining}/3 before 30s lockout.`);
      }
    }
  };

  // ==========================================
  // 2. CUSTOMER REGISTRATION (PHONE OTP -> DETAILS)
  // ==========================================
  const handleRegisterSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Kripya valid 10-digit Mobile Phone Number enter karein.');
      return;
    }

    const res = await sendPhoneOtp(phone);
    if (res.success) {
      setRegisterStep('otp');
      if (res.demoOtp) setDemoOtpHint(res.demoOtp);
      setSuccessMsg(`OTP sent to ${phone}. Check SMS / verification code.`);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length < 6) {
      setErrorMsg('Kripya 6-digit OTP code enter karein.');
      return;
    }

    const res = await verifyPhoneOtp(phone, enteredOtp);
    if (res.success) {
      setRegisterStep('details');
      setSuccessMsg('Phone number verified! Fill in your details and set password below.');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !address.trim() || !password.trim()) {
      setErrorMsg('Kripya Naam, Address aur Password enter karein.');
      return;
    }

    const res = await registerCustomerAccountWithPhone({
      phone,
      password,
      full_name: fullName,
      address,
      email,
    });

    if (res.success && res.user) {
      try {
        confetti({ particleCount: 70, spread: 70 });
      } catch (e) {
        // Ignore
      }
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  // ==========================================
  // 3. CUSTOMER FORGOT PASSWORD (PHONE OTP -> NEW PASS)
  // ==========================================
  const handleForgotSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Kripya apna registered Mobile Number enter karein.');
      return;
    }

    const res = await sendForgotPasswordPhoneOtp(phone);
    if (res.success) {
      setForgotStep('otp');
      if (res.demoOtp) setDemoOtpHint(res.demoOtp);
      setSuccessMsg(`Password reset OTP sent to ${phone}.`);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleForgotVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length < 6) {
      setErrorMsg('Kripya 6-digit OTP code enter karein.');
      return;
    }

    const res = await verifyForgotPasswordPhoneOtp(phone, enteredOtp);
    if (res.success) {
      setForgotStep('newPassword');
      setSuccessMsg('OTP Verified! Enter your new password below.');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleForgotResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword.trim() || newPassword.length < 4) {
      setErrorMsg('Kripya kam se kam 4 characters ka naya password banayein.');
      return;
    }

    const res = await resetCustomerPasswordWithPhone(phone, newPassword);
    if (res.success) {
      setCustomerAuthMode('login');
      setPassword(newPassword);
      setSuccessMsg('Password Reset Successful! Naye password se Login karein.');
    } else {
      setErrorMsg(res.message);
    }
  };

  // ==========================================
  // 4. STAFF LOGIN HANDLER
  // ==========================================
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputEmail = email.trim().toLowerCase();
    const staffKey = `staff_${inputEmail || 'global'}`;
    const sec = getLoginSecurityState(staffKey);

    if (sec.isBanned || isBanned) {
      setErrorMsg('🚫 ACCESS DENIED: Anti-Bot System Active. Excessive brute-force attempts detected. IP Address Banned.');
      return;
    }

    if (sec.isLocked || lockoutSeconds > 0) {
      setErrorMsg(t('lockout_active_error', `🔒 Security Lockout Active: 3 lga taar galat password! Account ${sec.lockoutSeconds || lockoutSeconds}s ke liye locked hai. Refresh/back par bhi timer active rahega.`));
      return;
    }

    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      setErrorMsg('Kripya Staff Email aur Password bharein.');
      return;
    }

    if (inputPassword.length < 4) {
      setErrorMsg(t('password_too_short', '⚠️ Security Rule: Password must be at least 4 characters long.'));
      return;
    }

    setLoading(true);
    try {
      const staff = staffMembers.find((s) => s.email.toLowerCase() === inputEmail);

      if (staff && staff.initial_password && staff.initial_password === inputPassword) {
        const staffProfile: UserProfile = {
          id: staff ? staff.id : 'usr-staff-' + Date.now(),
          phone: staff ? staff.phone : '+91 98765 43210',
          full_name: staff ? staff.name : 'Vikram Singh (Staff)',
          email: inputEmail,
          role: 'staff',
          created_at: new Date().toISOString(),
          avatar_url: staff?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          vehicle_number: staff?.vehicle_number || 'HR 10 AB 4921 (Mahindra Bolero)',
        };

        recordSuccessfulLogin(staffKey);
        setFailedAttempts(0);
        setLockoutSeconds(0);
        try { confetti({ particleCount: 50, spread: 50 }); } catch (e) {}
        setCurrentUser(staffProfile);
        setActivePortal('staff');
        onClose();
      } else {
        const nextSec = recordFailedPasswordAttempt(staffKey);
        setFailedAttempts(nextSec.failedAttempts);
        setLockoutSeconds(nextSec.lockoutSeconds);
        setIsBanned(nextSec.isBanned);

        if (nextSec.isBanned) {
          setErrorMsg('🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.');
        } else if (nextSec.isLocked) {
          setErrorMsg(`🔒 Security Alert (Locked 30s): 3 lga taar galat password enter karne par account 30 seconds ke liye lock kar diya gaya hai.`);
        } else {
          const remaining = Math.max(0, 3 - nextSec.failedAttempts);
          setErrorMsg(`🔐 Security Alert: Entered Staff Email & Password do not match. Remaining attempts: ${remaining}/3 before 30s lockout.`);
        }
      }
    } catch (err: any) {
      setErrorMsg('Staff Login Error. Kripya Admin se sampark karein.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. ADMIN LOGIN HANDLER
  // ==========================================
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputEmail = email.trim().toLowerCase();
    const adminKey = `admin_${inputEmail || 'super'}`;
    const sec = getLoginSecurityState(adminKey);

    if (sec.isBanned || isBanned) {
      setErrorMsg('🚫 ACCESS DENIED: Anti-Bot System Active. Excessive brute-force attempts detected. IP Address Banned.');
      return;
    }

    if (sec.isLocked || lockoutSeconds > 0) {
      setErrorMsg(t('lockout_active_error', `🔒 Security Lockout Active: 3 lga taar galat password! Account ${sec.lockoutSeconds || lockoutSeconds}s ke liye locked hai. Refresh/back par bhi timer active rahega.`));
      return;
    }

    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      setErrorMsg('Kripya Admin Email aur Password bharein.');
      return;
    }

    if (inputPassword.length < 4) {
      setErrorMsg(t('password_too_short', '⚠️ Security Rule: Password must be at least 4 characters long.'));
      return;
    }

    setLoading(true);
    const res = await adminLogin(inputEmail, inputPassword);
    setLoading(false);

    if (res.success) {
      recordSuccessfulLogin(adminKey);
      setFailedAttempts(0);
      setLockoutSeconds(0);
      try { confetti({ particleCount: 70, spread: 70 }); } catch (e) {}
      onClose();
    } else {
      const nextSec = recordFailedPasswordAttempt(adminKey);
      setFailedAttempts(nextSec.failedAttempts);
      setLockoutSeconds(nextSec.lockoutSeconds);
      setIsBanned(nextSec.isBanned);

      if (nextSec.isBanned) {
        setErrorMsg('🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.');
      } else if (nextSec.isLocked) {
        setErrorMsg(`🔒 Security Alert (Locked 30s): 3 lga taar galat password enter karne par account 30 seconds ke liye lock kar diya gaya hai.`);
      } else {
        const remaining = Math.max(0, 3 - nextSec.failedAttempts);
        setErrorMsg(res.message || `🔐 Security Alert: Entered Admin Email & Password do not match. Remaining attempts: ${remaining}/3 before 30s lockout.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isAdminOnly
                  ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                  : selectedRole === 'staff'
                    ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                    : 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
              }`}
            >
              {isAdminOnly ? (
                <ShieldAlert className="w-5 h-5" />
              ) : selectedRole === 'staff' ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Recycle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isAdminOnly
                  ? 'Admin Command Portal'
                  : selectedRole === 'staff'
                  ? 'Staff Driver Login'
                  : customerAuthMode === 'register'
                  ? 'Create Customer Account'
                  : customerAuthMode === 'forgotPassword'
                  ? 'Forgot Password Recovery'
                  : 'Customer Portal Login'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdminOnly
                  ? 'Strictly for System Administrators'
                  : selectedRole === 'staff'
                  ? 'Email & Password Login'
                  : customerAuthMode === 'register'
                  ? 'Phone OTP Verification -> Account Setup'
                  : customerAuthMode === 'forgotPassword'
                  ? 'Phone OTP -> Set New Password'
                  : 'Phone Number & Password Sign In'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Role Switcher (Customer vs Staff) */}
          {!isAdminOnly && allowedRoles.includes('customer') && allowedRoles.includes('staff') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Login Role Choose Karein:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectRole('customer')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Recycle className="w-4 h-4" />
                  <span>Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('staff')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRole === 'staff'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Staff</span>
                </button>
              </div>
            </div>
          )}

          {/* Glassmorphic Security Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-md animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden space-y-1">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-700 dark:text-rose-300 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="font-extrabold text-rose-950 dark:text-white flex items-center justify-between gap-2">
                    <span>Security Alert</span>
                    {failedAttempts > 0 && lockoutSeconds === 0 && (
                      <span className="text-[10px] font-mono bg-rose-200/90 dark:bg-rose-900 text-rose-950 dark:text-rose-100 px-2 py-0.5 rounded-full font-black">
                        Attempts: {MAX_ATTEMPTS - failedAttempts}/{MAX_ATTEMPTS}
                      </span>
                    )}
                    {lockoutSeconds > 0 && (
                      <span className="text-[10px] font-mono bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                        Locked ({lockoutSeconds}s)
                      </span>
                    )}
                  </div>
                  <p className="font-semibold leading-relaxed text-rose-900 dark:text-rose-200">
                    {errorMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* 1. CUSTOMER PORTAL AUTHENTICATION FLOW              */}
          {/* ==================================================== */}
          {!isAdminOnly && selectedRole === 'customer' && (
            <div className="space-y-4">
              {/* Customer Flow Mode Switcher Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customerAuthMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('register');
                    setRegisterStep('phone');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customerAuthMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* A. CUSTOMER LOGIN MODE (PHONE & PASSWORD) */}
              {customerAuthMode === 'login' && (
                <form onSubmit={handleCustomerLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="Enter 10-digit mobile number (+91)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 dark:text-slate-200">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerAuthMode('forgotPassword');
                          setForgotStep('phone');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-emerald-600 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors cursor-pointer"
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading || authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Login to Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* B. CUSTOMER REGISTER MODE (PHONE OTP -> DETAILS) */}
              {customerAuthMode === 'register' && (
                <div>
                  {registerStep === 'phone' && (
                    <form onSubmit={handleRegisterSendPhoneOtp} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Mobile Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            placeholder="Enter 10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Mobile OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Mobile Verification OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {registerStep === 'otp' && (
                    <form onSubmit={handleRegisterVerifyPhoneOtp} className="space-y-4 text-xs">
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Enter 6-Digit Phone OTP</h4>
                        <p className="text-slate-500 text-[11px]">
                          Verification code sent to <strong>{phone}</strong>
                        </p>
                      </div>

                      <div className="flex justify-center gap-2 py-1">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`customer-otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            className="w-9 h-11 text-center font-mono text-lg font-black rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <button
                          type="button"
                          onClick={() => setRegisterStep('phone')}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          ← Change Phone
                        </button>
                        <button
                          type="button"
                          onClick={handleRegisterSendPhoneOtp}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <span>Verify OTP &amp; Proceed</span>
                        )}
                      </button>
                    </form>
                  )}

                  {registerStep === 'details' && (
                    <form onSubmit={handleRegisterFinalSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Full Name (Naam)
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Enter full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Address (Scrap Pickup Address)
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Enter complete doorstep address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Email Address (Optional)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            placeholder="Enter email (optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Set Account Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Create password for future logins"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors cursor-pointer"
                            title={showPassword ? "Hide Password" : "Show Password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <span>Complete Account Setup &amp; Login</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* C. CUSTOMER FORGOT PASSWORD MODE */}
              {customerAuthMode === 'forgotPassword' && (
                <div>
                  {forgotStep === 'phone' && (
                    <form onSubmit={handleForgotSendPhoneOtp} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Registered Mobile Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            placeholder="Enter your registered mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <button
                          type="button"
                          onClick={() => setCustomerAuthMode('login')}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          ← Back to Sign In
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Reset OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Password Reset OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {forgotStep === 'otp' && (
                    <form onSubmit={handleForgotVerifyPhoneOtp} className="space-y-4 text-xs">
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto mb-1">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Enter Forgot Password OTP</h4>
                        <p className="text-slate-500 text-[11px]">
                          Reset OTP code sent to <strong>{phone}</strong>
                        </p>
                      </div>

                      <div className="flex justify-center gap-2 py-1">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`customer-otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            className="w-9 h-11 text-center font-mono text-lg font-black rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <button
                          type="button"
                          onClick={() => setForgotStep('phone')}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          ← Change Phone Number
                        </button>
                        <button
                          type="button"
                          onClick={handleForgotSendPhoneOtp}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Resend Reset OTP
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <span>Verify Reset OTP</span>
                        )}
                      </button>
                    </form>
                  )}

                  {forgotStep === 'newPassword' && (
                    <form onSubmit={handleForgotResetPasswordSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Naya Password (Set New Password)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors cursor-pointer"
                            title={showNewPassword ? "Hide Password" : "Show Password"}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <span>Update Password &amp; Login</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. STAFF LOGIN: EMAIL & PASSWORD                     */}
          {/* ==================================================== */}
          {!isAdminOnly && selectedRole === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter staff email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Staff Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter staff password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors cursor-pointer"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in Staff...</span>
                  </>
                ) : (
                  <>
                    <span>Login as Field Staff</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==================================================== */}
          {/* 3. ADMIN LOGIN: STRICTLY TOP 3-LINE MENU ONLY        */}
          {/* ==================================================== */}
          {isAdminOnly && (
            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 transition-colors cursor-pointer"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Admin Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Admin Command Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
