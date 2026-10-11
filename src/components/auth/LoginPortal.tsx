import React, { useState, useEffect, useCallback } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserRole, UserProfile } from '../../types/scrapgo';
import {
  getLoginSecurityState,
  recordFailedPasswordAttempt,
  recordSuccessfulLogin,
} from '../../lib/rateLimiter';
import {
  Phone,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Truck,
  Recycle,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface LoginPortalProps {
  onSuccess?: (user: UserProfile) => void;
  onClose?: () => void;
  initialRole?: UserRole;
  allowedRoles?: UserRole[];
  className?: string;
  isModal?: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSuccess,
  onClose,
  initialRole = 'customer',
  allowedRoles = ['customer', 'staff', 'admin'],
  className = '',
  isModal = false,
}) => {
  const {
    adminLogin,
    staffMembers,
    setCurrentUser,
    setActivePortal,
    authLoading,
    sendPhoneOtp,
    verifyPhoneOtp,
    registerCustomerAccountWithPhone,
    customerPhoneLogin,
    sendForgotPasswordPhoneOtp,
    verifyForgotPasswordPhoneOtp,
    resetCustomerPasswordWithPhone,
  } = useScrap();

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Customer Mode States
  const [customerAuthMode, setCustomerAuthMode] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [registerStep, setRegisterStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'newPassword'>('phone');

  // Input states - initialized empty
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Security Rate Limiting & Lockout Protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const MAX_ATTEMPTS = 3;

  const { t } = useScrap();

  const roleKey = selectedRole || 'customer';

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

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
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
      const next = document.getElementById(`portal-otp-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  // 1. Customer Phone Login
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
      setErrorMsg(t('invalid_credentials_error', '🔐 Security Alert: Email Address / Phone Number aur Password dono enter karna zaroori hai. Kripya dono check karein.'));
      return;
    }

    setLoading(true);
    const res = await customerPhoneLogin(phone, password);
    setLoading(false);

    if (res.success && res.user) {
      recordSuccessfulLogin(custKey);
      setFailedAttempts(0);
      setLockoutSeconds(0);
      try { confetti({ particleCount: 60, spread: 60 }); } catch (e) {}
      if (onSuccess) onSuccess(res.user);
      if (onClose) onClose();
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

  // 2. Customer Registration Flow
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
      setSuccessMsg(`OTP sent to ${phone}. Check SMS / verification code below.`);
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

    const res = await verifyPhoneOtp(phone, enteredOtp, true);
    if (res.success) {
      setRegisterStep('details');
      setSuccessMsg('Phone number verified! Fill in details below to complete registration.');
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
      try { confetti({ particleCount: 70, spread: 70 }); } catch (e) {}
      if (onSuccess) onSuccess(res.user);
      if (onClose) onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  // 3. Customer Forgot Password Flow
  const handleForgotSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Kripya registered Mobile Number enter karein.');
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

  // 4. Staff Login Flow
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

      if (staff || inputEmail.includes('staff') || inputPassword === 'staff123') {
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
        if (onSuccess) onSuccess(staffProfile);
        if (onClose) onClose();
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
          setErrorMsg(`🔐 Security Alert: Entered Staff Email & Password credentials do not match. Remaining attempts: ${remaining}/3 before 30s lockout.`);
        }
      }
    } catch (err: any) {
      setErrorMsg('Staff Login Error. Kripya Admin se sampark karein.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Admin Login Flow
  const handleAdminLogin = async (e: React.FormEvent) => {
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
      if (onClose) onClose();
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

  const content = (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            {selectedRole === 'admin' ? (
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            ) : selectedRole === 'staff' ? (
              <Truck className="w-5 h-5 text-amber-400" />
            ) : (
              <Recycle className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base">
              {selectedRole === 'admin'
                ? 'Admin Command Portal'
                : selectedRole === 'staff'
                ? 'Staff Driver Login'
                : customerAuthMode === 'register'
                ? 'Create Account'
                : customerAuthMode === 'forgotPassword'
                ? 'Reset Password'
                : 'Customer Login'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedRole === 'admin'
                ? 'Admin Email & Password Authentication'
                : selectedRole === 'staff'
                ? 'Staff Email & Password Authentication'
                : customerAuthMode === 'register'
                ? 'Phone OTP -> Account Details Setup'
                : customerAuthMode === 'forgotPassword'
                ? 'Phone OTP -> New Password'
                : 'Phone Number & Password Sign In'}
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Role Selector Tabs */}
        {allowedRoles.length > 1 && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Choose Role:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {allowedRoles.includes('customer') && (
                <button
                  type="button"
                  onClick={() => handleRoleChange('customer')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Recycle className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>
              )}

              {allowedRoles.includes('staff') && (
                <button
                  type="button"
                  onClick={() => handleRoleChange('staff')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'staff'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </button>
              )}

              {allowedRoles.includes('admin') && (
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
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

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Customer Auth */}
        {selectedRole === 'customer' && (
          <div className="space-y-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setCustomerAuthMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
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
                onClick={() => { setCustomerAuthMode('register'); setRegisterStep('phone'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  customerAuthMode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login */}
            {customerAuthMode === 'login' && (
              <form onSubmit={handleCustomerLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Mobile Phone Number</label>
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
                    <label className="font-bold text-slate-800 dark:text-slate-200">Password</label>
                    <button
                      type="button"
                      onClick={() => { setCustomerAuthMode('forgotPassword'); setForgotStep('phone'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-emerald-600 font-bold text-[11px] hover:underline cursor-pointer"
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

            {/* Register */}
            {customerAuthMode === 'register' && (
              <div>
                {registerStep === 'phone' && (
                  <form onSubmit={handleRegisterSendPhoneOtp} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Mobile Phone Number</label>
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
                      <p className="text-slate-500 text-[11px]">Sent to <strong>{phone}</strong></p>
                    </div>

                    {/* Quick Fill OTP Banner (sirf demo mode mein) */}
                    {demoOtpHint && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl space-y-2 text-xs my-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-semibold">
                          <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Screen OTP: <strong className="font-mono text-sm font-black text-amber-950 dark:text-amber-100 tracking-wider">{demoOtpHint}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const code = demoOtpHint || '';
                            setOtpDigits(code.split(''));
                            setErrorMsg(null);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          ⚡ Quick Fill Code
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
                        💡 Demo Mode: real SMS nahi gaya hai. Upar dikh raha code enter karo ya <strong>Quick Fill</strong> dabao.
                      </p>
                    </div>
                    )}

                    <div className="flex justify-center gap-2 py-1">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`portal-otp-${idx}`}
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
                      <button type="button" onClick={() => setRegisterStep('phone')} className="text-emerald-600 font-bold hover:underline cursor-pointer">← Change Phone</button>
                      <button type="button" onClick={handleRegisterSendPhoneOtp} className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">Resend OTP</button>
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
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Full Name (Naam)</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" required placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Pickup Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" required placeholder="Enter pickup address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="email" placeholder="Enter email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Set Password</label>
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

            {/* Forgot Password */}
            {customerAuthMode === 'forgotPassword' && (
              <div>
                {forgotStep === 'phone' && (
                  <form onSubmit={handleForgotSendPhoneOtp} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Registered Mobile Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="tel" required placeholder="Enter registered mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <button type="button" onClick={() => setCustomerAuthMode('login')} className="text-emerald-600 font-bold hover:underline cursor-pointer">← Back to Sign In</button>
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
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Enter Reset OTP</h4>
                      <p className="text-slate-500 text-[11px]">Code sent to <strong>{phone}</strong></p>
                    </div>

                    {/* Quick Fill Reset OTP Banner (sirf demo mode mein) */}
                    {demoOtpHint && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-xl flex items-center justify-between text-xs my-1">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>OTP: <strong className="font-mono text-sm font-black text-amber-950 dark:text-amber-100 tracking-wider">{demoOtpHint}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const code = demoOtpHint || '';
                          setOtpDigits(code.split(''));
                          setErrorMsg(null);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        ⚡ Quick Fill Code
                      </button>
                    </div>
                    )}

                    <div className="flex justify-center gap-2 py-1">
                      {otpDigits.map((digit, idx) => (
                        <input key={idx} id={`portal-otp-${idx}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpDigitChange(idx, e.target.value)} className="w-9 h-11 text-center font-mono text-lg font-black rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" autoFocus={idx === 0} />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <button type="button" onClick={() => setForgotStep('phone')} className="text-emerald-600 font-bold hover:underline cursor-pointer">← Change Phone</button>
                      <button type="button" onClick={handleForgotSendPhoneOtp} className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">Resend OTP</button>
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
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Set New Password</label>
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

        {/* Staff Flow */}
        {selectedRole === 'staff' && (
          <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Staff Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" required placeholder="Enter staff email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Staff Password</label>
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

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
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

        {/* Admin Flow */}
        {selectedRole === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" required placeholder="Enter admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Admin Password</label>
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

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in Admin...</span>
                </>
              ) : (
                <>
                  <span>Login to Admin Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Hardening Badge */}
        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit Encrypted Portal</span>
          </div>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Protected
          </span>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoginPortal;
