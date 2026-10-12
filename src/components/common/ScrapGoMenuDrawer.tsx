import React, { useState, useEffect } from 'react';
import { useScrap } from '../../context/ScrapContext';
import {
  X,
  LogIn,
  Check,
  Disc,
  Phone,
  Settings,
  ChevronRight,
  Shield,
  FileText,
  MessageCircle,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { AuthModal } from './AuthModal';

interface ScrapGoMenuDrawerProps {
  onClose: () => void;
  onOpenCustomerStaffLogin: () => void;
  onOpenAdminLogin: () => void;
}

export const ScrapGoMenuDrawer: React.FC<ScrapGoMenuDrawerProps> = ({
  onClose,
  onOpenCustomerStaffLogin,
  onOpenAdminLogin,
}) => {
  const { setActivePortal, activePortal, setOverlayActive, language, setLanguage, t } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Scrap<span className="text-[#15803d]">Go</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">ScrapGo Menu</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LANGUAGE Selector matching screenshot */}
        <div className="py-6 border-b border-slate-100">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
            {t('language_label', 'LANGUAGE')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setLanguage('english')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                language === 'english'
                  ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-500 ring-offset-1'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>English</span>
              {language === 'english' && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">✓ Active</span>}
            </button>
            <button
              onClick={() => setLanguage('hindi')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                language === 'hindi'
                  ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-500 ring-offset-1'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>हिन्दी</span>
              {language === 'hindi' && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">✓ सक्रिय</span>}
            </button>
            <button
              onClick={() => setLanguage('hinglish')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                language === 'hinglish'
                  ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-500 ring-offset-1'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Hinglish</span>
              {language === 'hinglish' && <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">✓ Active</span>}
            </button>
          </div>
        </div>

        {/* Menu Items List matching screenshot */}
        <div className="py-6 space-y-3 flex-1">
          {/* 1. Login / Sign up Card (Highlighted with green tint) */}
          <div
            onClick={() => {
              onClose();
              onOpenCustomerStaffLogin();
            }}
            className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-emerald-200/80 flex items-center justify-between cursor-pointer hover:border-emerald-400 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                <LogIn className="w-5 h-5 text-[#15803d]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t('login_signup', 'Staff Login')}</h4>
                <p className="text-xs text-slate-500">{t('login_sub', 'Driver & field team login')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2. Terms & Conditions */}
          <div
            onClick={() => setShowTermsModal(true)}
            className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                <Check className="w-5 h-5 text-[#15803d]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t('terms_conditions', 'Terms & Conditions')}</h4>
                <p className="text-xs text-slate-500">{t('terms_sub', 'Read our service terms')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 3. Privacy Policy */}
          <div
            onClick={() => setShowPrivacyModal(true)}
            className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                <Disc className="w-5 h-5 text-[#15803d]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t('privacy_policy', 'Privacy Policy')}</h4>
                <p className="text-xs text-slate-500">{t('privacy_sub', 'How your information is used')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 4. Contact */}
          <div
            onClick={() => setShowContactModal(true)}
            className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#15803d]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t('contact_us', 'Contact')}</h4>
                <p className="text-xs text-slate-500">{t('contact_sub', 'Call or WhatsApp ScrapGo')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 5. Admin Panel */}
          {activePortal !== 'admin' && (
            <div
              onClick={() => {
                onClose();
                onOpenAdminLogin();
              }}
              className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#15803d]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Admin Panel</h4>
                  <p className="text-xs text-slate-500">Administrator command login</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          ScrapGo Doorstep Scrap Platform • Version 2.4
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Terms & Conditions</h3>
              <button onClick={() => setShowTermsModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p><strong>1. Certified Electronic Scales:</strong> All scrap items are weighed on ISO-certified digital weighing scales with 0.00 kg tare calibration performed in the presence of the customer.</p>
              <p><strong>2. Zero Illegal Deductions:</strong> SCRAPGO strictly prohibits illegal deductions for dirt or moisture on dry metals, iron, and clean cardboard.</p>
              <p><strong>3. Instant Payout:</strong> Payout is calculated immediately and disbursed via Instant UPI (GPay/PhonePe), Cash on spot, or Direct Bank Transfer upon staff weighing.</p>
              <p><strong>4. Verification OTP:</strong> Customer must share their secret 4-digit OTP only upon the arrival of the verified driver with the weighing scale.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full bg-[#15803d] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Privacy Policy</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p><strong>Information Collection:</strong> We collect your mobile number, address, and scrap details solely for scheduling and completing doorstep scrap pickup.</p>
              <p><strong>Payment Details:</strong> UPI IDs and bank account details are securely encrypted and handled via PCI-DSS compliant payout gateways for disbursements.</p>
              <p><strong>Location Data:</strong> Live GPS is utilized only during an active pickup run to provide accurate driver arrival time (ETA).</p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-[#15803d] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Contact ScrapGo</h3>
              <button onClick={() => setShowContactModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <a
                href="tel:+918287214705"
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950 font-bold hover:bg-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm">Helpline Number</span>
                  <span className="text-[11px] text-emerald-700 font-normal">Customer Care Helpline (24/7 Support)</span>
                </div>
              </a>

              <a
                href="https://wa.me/918287214705"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-950 font-bold hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm">WhatsApp ScrapGo</span>
                  <span className="text-[11px] text-green-700 font-normal">Instant chat & scrap photo quotes</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
