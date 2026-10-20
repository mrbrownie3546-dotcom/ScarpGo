import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserRole } from '../../types/scrapgo';
import {
  X,
  Lock,
  Mail,
  ShieldAlert,
  Truck,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialRole?: UserRole;
  allowedRoles?: UserRole[];
}

/**
 * Staff / Admin login modal.
 * Customer login ka koi system nahi hai - customer bina login ke booking
 * karta hai (details WhatsApp par jaati hain) aur Booking ID + phone se
 * status track karta hai. Sirf staff aur admin yahan se login hote hain.
 * Passwords hashed (PBKDF2) hain; plain text kahin save nahi hota.
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  initialRole = 'staff',
  allowedRoles = ['staff'],
}) => {
  const { adminLogin, staffLogin, requestLoginReset, t } = useScrap();

  const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    isAdminOnly ? 'admin' : initialRole === 'admin' ? 'staff' : initialRole
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAdmin = selectedRole === 'admin';

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg('Pehle upar apna email likho, phir "Forgot password" dabao.');
      return;
    }
    setLoading(true);
    const res = await requestLoginReset(email);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      setErrorMsg(isAdmin ? 'Kripya Admin Email aur Password bharein.' : 'Kripya Staff Email aur Password bharein.');
      return;
    }
    if (inputPassword.length < 6) {
      setErrorMsg(t('password_too_short', '⚠️ Security Requirement: Password must be at least 6 characters long.'));
      return;
    }

    setLoading(true);
    try {
      const res = isAdmin
        ? await adminLogin(inputEmail, inputPassword)
        : await staffLogin(inputEmail, inputPassword);

      if (res.success) {
        setSuccessMsg(res.message || 'Login successful!');
        setTimeout(() => onClose(), 400);
      } else {
        setErrorMsg(res.message || '🔐 Security Alert: Email & Password do not match.');
      }
    } catch (err: any) {
      setErrorMsg('Login Error. Kripya dobara try karein.');
    } finally {
      setLoading(false);
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
                isAdmin
                  ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                  : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
              }`}
            >
              {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isAdmin ? 'Admin Command Portal' : 'Staff Driver Login'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin ? 'Strictly for System Administrators' : 'Email & Password Login'}
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
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-700 dark:text-rose-300 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="font-extrabold text-rose-950 dark:text-white">Security Alert</div>
                  <p className="font-semibold leading-relaxed text-rose-900 dark:text-rose-200">{errorMsg}</p>
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

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAdmin ? 'Admin Email' : 'Staff Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={isAdmin ? 'Enter admin email' : 'Enter staff email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none ${
                    isAdmin ? 'focus:border-blue-500' : 'focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none ${
                    isAdmin ? 'focus:border-blue-500' : 'focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60 ${
                isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isAdmin ? 'Login as Admin' : 'Login as Staff Driver'}</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors disabled:opacity-50"
              >
                Forgot password? Reset link email pe pao (free)
              </button>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                3 galat attempts par 30s ka security lock lagta hai.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
