import React, { useState, useEffect } from 'react';
import { Home, IndianRupee, Truck, MessageCircle, User } from 'lucide-react';
import { useScrap } from '../../context/ScrapContext';

interface BottomNavBarProps {
  onOpenBooking: () => void;
  onOpenRates: () => void;
  onOpenChat: () => void;
  onOpenAccount: () => void;
  activeItem?: 'home' | 'rates' | 'book' | 'chat' | 'account';
  isSearchFocused?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onOpenBooking,
  onOpenRates,
  onOpenChat,
  onOpenAccount,
  activeItem = 'home',
  isSearchFocused = false,
}) => {
  const { currentUser, tickets, activePortal, isOverlayActive, t } = useScrap();

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 1. Detect global input/textarea/select focus
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          !(
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            (active as HTMLElement).isContentEditable
          )
        ) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // 2. Detect virtual keyboard and viewport height changes
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const heightRatio = window.visualViewport.height / window.innerHeight;
        setIsKeyboardOpen(heightRatio < 0.85 || window.innerHeight > window.visualViewport.height + 80);
      }
    };

    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', handleViewportChange);
      viewport.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange);
        viewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // ONLY render on customer home page, and hide whenever any modal/drawer is open, input/search is focused, or keyboard is open
  const isHidden =
    activePortal !== 'customer' ||
    isOverlayActive ||
    isSearchFocused ||
    isInputFocused ||
    isKeyboardOpen;

  if (isHidden) {
    return null;
  }

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRatesClick = () => {
    onOpenRates();
    const el = document.getElementById('rates-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openTicketsCount = tickets.filter(
    (t) => t.customer_id === currentUser.id && t.status !== 'closed'
  ).length;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-2 shadow-2xl border border-slate-200/80 flex items-center justify-around ring-1 ring-slate-900/5">
        {/* 1. HOME BUTTON */}
        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center gap-1 group py-1 px-2.5 transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center transition-all group-hover:bg-sky-200">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
            {t('nav_home', 'Home')}
          </span>
        </button>

        {/* 2. RATES BUTTON */}
        <button
          onClick={handleRatesClick}
          className="flex flex-col items-center gap-1 group py-1 px-2.5 transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center transition-all group-hover:bg-amber-200">
            <span className="font-bold text-base">₹</span>
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
            {t('nav_rates', 'Rates')}
          </span>
        </button>

        {/* 3. BOOK BUTTON (Prominent Elevated Center Button) */}
        <button
          onClick={onOpenBooking}
          className="flex flex-col items-center gap-1 -mt-5 group transition-transform active:scale-95"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#15803d] text-white flex items-center justify-center shadow-lg shadow-emerald-800/40 border-2 border-white group-hover:bg-[#126b34] group-hover:scale-105 transition-all">
            <Truck className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <span className="text-[11px] font-black text-emerald-800 tracking-tight">
            {t('nav_book', 'Book')}
          </span>
        </button>

        {/* 4. CHAT BUTTON (AI ScrapBot & Complaints) */}
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center gap-1 group py-1 px-2.5 transition-transform active:scale-95 relative"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all group-hover:bg-emerald-200 relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
            {t('nav_chat', 'Chat')}
          </span>
        </button>

        {/* 5. ACCOUNT BUTTON (Phone OTP Login & Profile) */}
        <button
          onClick={onOpenAccount}
          className="flex flex-col items-center gap-1 group py-1 px-2.5 transition-transform active:scale-95 relative"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center transition-all group-hover:bg-purple-200">
            <User className="w-5 h-5" />
            {openTicketsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {openTicketsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
            {t('nav_account', 'Account')}
          </span>
        </button>
      </div>
    </div>
  );
};
