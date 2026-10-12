import React from 'react';
import { Home, Truck, MessageCircle, User } from 'lucide-react';
import { useScrap } from '../../context/ScrapContext';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';

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
  const isKeyboardVisible = useKeyboardStatus();

  // ONLY render on customer home page, and hide whenever any modal/drawer is open or keyboard is open on screen
  const isHidden =
    activePortal !== 'customer' ||
    isOverlayActive ||
    isSearchFocused ||
    isKeyboardVisible;

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
          className="flex flex-col items-center gap-1 -mt-6 group transition-transform active:scale-95 relative"
        >
          <div className="w-15 h-15 rounded-2xl bg-gradient-to-tr from-[#15803d] via-[#16a34a] to-[#047857] text-white flex items-center justify-center shadow-[0_12px_25px_rgba(21,128,61,0.5)] border-2 border-white ring-4 ring-emerald-500/30 group-hover:scale-110 transition-all">
            <Truck className="w-7 h-7 text-white animate-pulse-subtle" />
          </div>
          <span className="text-[11px] font-black text-emerald-800 tracking-tight uppercase">
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
            {t('nav_account', 'Track Status')}
          </span>
        </button>
      </div>
    </div>
  );
};
