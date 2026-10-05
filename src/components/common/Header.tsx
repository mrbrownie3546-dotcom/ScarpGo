import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { UserRole } from '../../types/scrapgo';
import {
  Truck,
  Menu,
  Leaf,
} from 'lucide-react';
import { FirebaseModal } from './FirebaseModal';
import { AuthModal } from './AuthModal';
import { ScrapGoMenuDrawer } from './ScrapGoMenuDrawer';

export const Header: React.FC = () => {
  const {
    activePortal,
    setActivePortal,
    t,
  } = useScrap();

  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('customer');
  const [authAllowedRoles, setAuthAllowedRoles] = useState<UserRole[]>(['customer', 'staff']);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (activePortal === 'admin') {
    return null;
  }

  return (
    <>
      {/* Main Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Portal Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActivePortal('customer')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-full border-2 border-emerald-600/30 bg-emerald-50/50 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6 fill-emerald-600/20 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Scrap<span className="text-[#15803d]">Go</span>
                </div>
                <div className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                  {t('tagline', 'BUY • SELL • RECYCLE')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Navigation Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {activePortal === 'customer' ? (
              <>
                <button
                  onClick={() => {
                    const el = document.getElementById('pickup-modal-trigger');
                    if (el) el.click();
                  }}
                  className="bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#047857] hover:from-[#126b34] hover:to-[#035e45] text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-[0_6px_16px_rgba(21,128,61,0.38)] hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-emerald-400/40 active:scale-95 ring-2 ring-emerald-500/20"
                >
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                  <span>{t('book_btn', 'Book Pickup ⚡')}</span>
                </button>

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePortal('customer')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {t('back_to_customer', 'Back to Customer Site')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ScrapGo Drawer Menu */}
      {showMobileMenu && (
        <ScrapGoMenuDrawer
          onClose={() => setShowMobileMenu(false)}
          onOpenCustomerStaffLogin={() => {
            setAuthAllowedRoles(['customer', 'staff']);
            setAuthInitialRole('customer');
            setShowAuthModal(true);
          }}
          onOpenAdminLogin={() => {
            setAuthAllowedRoles(['admin']);
            setAuthInitialRole('admin');
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Firebase Status & Connection Modal */}
      {showSupabaseModal && (
        <FirebaseModal onClose={() => setShowSupabaseModal(false)} />
      )}

      {/* Phone OTP Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          initialRole={authInitialRole}
          allowedRoles={authAllowedRoles}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};

export default Header;
