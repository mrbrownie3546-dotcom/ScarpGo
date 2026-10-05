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

  // Helper to check if an element is a form input or editable field
  const isInputElement = (el: Element | null): boolean => {
    if (!el) return false;
    const tagName = el.tagName;
    return (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT' ||
      (el as HTMLElement).isContentEditable
    );
  };

  // 1. Detect global input/textarea/select focus & blur events
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (isInputElement(target)) {
        setIsInputFocused(true);
      }
    };

    const handleBlur = () => {
      // Delay check slightly to handle focus switching between inputs
      setTimeout(() => {
        const active = document.activeElement;
        if (!isInputElement(active)) {
          setIsInputFocused(false);
        }
      }, 60);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  // 2. Detect virtual mobile keyboard via window.visualViewport & window resize events
  useEffect(() => {
    const checkKeyboardVisibility = () => {
      // Check activeElement first
      const active = document.activeElement;
      if (isInputElement(active)) {
        setIsKeyboardOpen(true);
        return;
      }

      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDifference = windowHeight - viewportHeight;
        const heightRatio = viewportHeight / windowHeight;

        // Virtual mobile keyboard typically reduces visualViewport height by >= 15% or 80px
        const keyboardActive = heightRatio < 0.85 || heightDifference > 80;
        setIsKeyboardOpen(keyboardActive);
      } else {
        setIsKeyboardOpen(false);
      }
    };

    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', checkKeyboardVisibility);
      viewport.addEventListener('scroll', checkKeyboardVisibility);
    }
    window.addEventListener('resize', checkKeyboardVisibility);
    window.addEventListener('orientationchange', checkKeyboardVisibility);

    // Run initial check
    checkKeyboardVisibility();

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', checkKeyboardVisibility);
        viewport.removeEventListener('scroll', checkKeyboardVisibility);
      }
      window.removeEventListener('resize', checkKeyboardVisibility);
      window.removeEventListener('orientationchange', checkKeyboardVisibility);
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
      <div className="bg-[#f4f7fb]/95 backdrop-blur-md rounded-[28px] p-2 shadow-[8px_8px_25px_rgba(166,180,200,0.35),-8px_-8px_25px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-around ring-1 ring-slate-900/5">
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
