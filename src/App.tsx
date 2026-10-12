/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { ScrapProvider, useScrap } from './context/ScrapContext';
import { Header } from './components/common/Header';
import { CustomerHome } from './components/customer/CustomerHome';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/common/AuthModal';
import { AntiBotBanOverlay } from './components/common/AntiBotBanOverlay';
import { ShieldAlert, Truck, Lock, ArrowLeft, LogIn } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred while rendering.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainPortalView: React.FC = () => {
  const { activePortal, setActivePortal, currentUser } = useScrap();

  // Phone back button: pehle back pe top pe scroll karo, site se bahar mat jaane do
  useEffect(() => {
    window.history.pushState({ scrapgoRoot: true }, '');
    const onPopState = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState({ scrapgoRoot: true }, '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'staff' | 'admin'>('staff');

  const isStaffAuthenticated = currentUser.role === 'staff' || currentUser.role === 'admin';
  const isAdminAuthenticated = currentUser.role === 'admin';

  return (
    <div className="min-h-screen w-full max-w-[100vw] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {activePortal === 'customer' && <CustomerHome />}

        {activePortal === 'staff' && (
          isStaffAuthenticated ? (
            <StaffDashboard />
          ) : (
            <div className="min-h-[75vh] w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Staff Portal Access Restricted
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Access to staff.scrapgo.in (Driver Pickup Console) requires authenticated Staff credentials. Please log in as a Staff Driver to continue.
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setAuthRole('staff');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login as Staff Driver</span>
                  </button>
                  <button
                    onClick={() => setActivePortal('customer')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Customer Portal</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {activePortal === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard />
          ) : (
            <div className="min-h-[75vh] w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Admin Portal Access Restricted
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Access to admin.scrapgo.in (Super Admin Dashboard) requires Administrator credentials. Please log in with Super Admin privileges.
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setAuthRole('admin');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login as Super Admin</span>
                  </button>
                  <button
                    onClick={() => setActivePortal('customer')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Customer Portal</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          initialRole={authRole}
          allowedRoles={[authRole]}
          onClose={() => setShowAuthModal(false)}
        />
      )}
      <AntiBotBanOverlay />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ScrapProvider>
        <MainPortalView />
      </ScrapProvider>
    </ErrorBoundary>
  );
}

