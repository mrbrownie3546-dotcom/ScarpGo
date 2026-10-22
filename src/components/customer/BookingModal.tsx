import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScrap } from '../../context/ScrapContext';
import { PayoutMethod, ScrapCategory } from '../../types/scrapgo';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Check,
  AlertCircle,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Share2,
  Upload,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { saveMyBooking } from '../../lib/myBookings';
import { newTrackToken, trackUrlForToken } from '../../lib/trackLinks';
import scrapgoLogo from '../../assets/scrapgo-logo.jpg';

interface BookingModalProps {
  onClose: () => void;
  preselectedCategoryId?: string;
  preselectedCatIds?: string[];
  initialExpectedItems?: string;
  initialEstimatedWeight?: number;
}

const StepLabel = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">{n}</span>
    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{children}</span>
  </div>
);

export const BookingModal: React.FC<BookingModalProps> = ({
  onClose,
  preselectedCategoryId,
  preselectedCatIds,
  initialExpectedItems,
  initialEstimatedWeight,
}) => {
  const { categories, createBooking, currentUser, serviceAreas, setOverlayActive, t, language, getCategoryName, systemSettings } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const [step, setStep] = useState<1 | 2>(1);

  // Voice Recognition (Web Speech API) States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const startVoiceRecognition = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API not supported in this browser. Please type manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setExpectedItems(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setSpeechError(`Voice input error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setSpeechError('Could not start speech recognition.');
    }
  };

  // Form states - Start empty or with initial estimate prefill
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(
    preselectedCatIds && preselectedCatIds.length > 0
      ? preselectedCatIds
      : preselectedCategoryId
      ? [preselectedCategoryId]
      : []
  );
  const [expectedItems, setExpectedItems] = useState(initialExpectedItems || '');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(initialEstimatedWeight || 5);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  const [pickupDate, setPickupDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  // Payout method
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | ''>('');
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState<boolean>(true);

  // Completed booking result
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [createdTrackUrl, setCreatedTrackUrl] = useState('');
  const [copiedTrackLink, setCopiedTrackLink] = useState(false);

  // Single select for scrap category
  const toggleCategory = (id: string) => {
    setSelectedCatIds([id]);
  };

  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (selectedCatIds.length === 0) {
      setBookingError('Please select at least one scrap item to sell.');
      return;
    }
    if (!pickupDate) {
      setBookingError('Please choose a pickup date.');
      return;
    }
    if (!timeSlot) {
      setBookingError('Please choose a time slot.');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setBookingError('Please fill in your Name, Phone Number, and Address.');
      return;
    }
    if (!payoutMethod) {
      setBookingError('Please choose how you want to receive payment - UPI, Cash, or Bank IMPS.');
      return;
    }
    if (payoutMethod === 'upi' && !upiId.trim() && !upiQrUrl) {
      setBookingError('Please enter your UPI ID or upload your payment QR screenshot.');
      return;
    }
    if (payoutMethod === 'bank_transfer' && (!accountNumber.trim() || !ifscCode.trim() || !accountHolder.trim())) {
      setBookingError('Please fill in your bank account number, IFSC code, and account holder name.');
      return;
    }

    try {
      const booking = createBooking({
        customer_name: name,
        customer_phone: phone,
        pickup_address: address,
        pickup_landmark: landmark,
        latitude: 28.9931,
        longitude: 77.0151,
        preferred_date: pickupDate,
        preferred_time_slot: timeSlot,
        category_ids: selectedCatIds,
        expected_scrap_items: expectedItems,
        estimated_weight_kg: estimatedWeight,
        notify_whatsapp: notifyWhatsApp,
        payout_method: payoutMethod,
        upi_id: payoutMethod === 'upi' ? upiId : undefined,
        upi_qr_url: payoutMethod === 'upi' ? upiQrUrl : undefined,
        bank_details:
          payoutMethod === 'bank_transfer'
            ? {
                account_number: accountNumber,
                ifsc_code: ifscCode,
                account_holder: accountHolder,
              }
            : undefined,
      });

      setCreatedBooking(booking);

      // Track link: is device pe auto-show + WhatsApp message me deep link.
      // Unguessable token -> track_links doc (safe fields only). Rules publish
      // se pehle write fail ho to bhi booking flow rukta nahi (.catch).
      const trackToken = newTrackToken();
      const trackUrl = trackUrlForToken(trackToken);
      try {
        setDoc(doc(db, 'track_links', trackToken), {
          booking_number: booking.booking_number,
          created_at: new Date().toISOString(),
        }).catch((linkErr: any) => console.warn('Track link save notice:', linkErr?.message || linkErr));
        saveMyBooking({ id: booking.booking_number, phone: booking.customer_phone, token: trackToken });
        setCreatedTrackUrl(trackUrl);
      } catch (linkErr) {
        console.warn('Track link save notice:', linkErr);
      }

      if (notifyWhatsApp) {
        const adminDigits = systemSettings.whatsapp_number.replace(/\D/g, '');
        const itemsList = selectedCatIds
          .map((id) => {
            const c = categories.find((x) => x.id === id);
            return c ? getCategoryName(c) : id;
          })
          .join(', ');
        const payoutText =
          booking.payout_method === 'upi'
            ? `UPI: ${booking.upi_id || '-'}`
            : booking.payout_method === 'bank_transfer'
              ? `Bank A/C: ${booking.bank_details?.account_number || '-'}, IFSC: ${booking.bank_details?.ifsc_code || '-'}, Name: ${booking.bank_details?.account_holder || '-'}`
              : 'Cash';
        const messageText = `*New ScrapHouse Pickup Request* 🚚
----------------------------------
📦 *Booking ID:* #${booking.booking_number}
👤 *Name:* ${booking.customer_name}
📱 *Phone:* ${booking.customer_phone}
📅 *Date & Slot:* ${booking.preferred_date} (${booking.preferred_time_slot})
📍 *Address:* ${booking.pickup_address}${booking.pickup_landmark ? ` (${booking.pickup_landmark})` : ''}
🧺 *Items:* ${itemsList}
⚖️ *Est. Weight:* ${booking.estimated_weight_kg || 20} kg
💵 *Payout:* ${payoutText}
🔑 *Doorstep OTP:* ${booking.pickup_otp}
🔗 *Track Status:* ${trackUrl}`;
        try {
          window.open(`https://wa.me/${adminDigits}?text=${encodeURIComponent(messageText)}`, '_blank');
        } catch (err) {
          console.error('Error opening WhatsApp:', err);
        }
      }

      // Trigger celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#22c55e', '#3b82f6', '#f59e0b'],
        });
      } catch (e) {
        // Ignore
      }
    } catch (err: any) {
      setBookingError(err.message || 'Error scheduling pickup booking.');
    }
  };

  const shareOnWhatsApp = () => {
    if (!createdBooking) return;
    const adminDigits = systemSettings.whatsapp_number.replace(/\D/g, '');

    const messageText = `Namaste ScrapHouse! Meri pickup request ka status batao. 🙏
----------------------------------
📦 *Booking ID:* #${createdBooking.booking_number}
👤 *Name:* ${createdBooking.customer_name}
📱 *Phone:* ${createdBooking.customer_phone}
📅 *Slot:* ${createdBooking.preferred_date} (${createdBooking.preferred_time_slot})`;

    window.open(`https://wa.me/${adminDigits}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f7fb] dark:bg-slate-900 sm:bg-slate-950/75 sm:backdrop-blur-md flex items-center justify-center sm:p-4 overflow-hidden">
      <div className="bg-[#f4f7fb] dark:bg-slate-900 shadow-[12px_12px_35px_rgba(166,180,200,0.4),-12px_-12px_35px_rgba(255,255,255,0.95)] dark:shadow-[12px_12px_35px_rgba(0,0,0,0.7),-12px_-12px_35px_rgba(30,41,59,0.5)] border border-white/90 dark:border-slate-800 w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden sm:my-auto rounded-none sm:rounded-[32px] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#047857] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/70 shadow-md shrink-0">
              <img src={scrapgoLogo} alt="ScrapHouse logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {createdBooking ? 'ScrapHouse' : t('book_modal_title', 'Book Free Doorstep Pickup')}
              </h2>
              <p className="text-xs font-semibold text-emerald-100">
                {createdBooking
                  ? (language === 'hindi' ? 'मुफ़्त डोरस्टेप पिकअप' : 'Free doorstep pickup')
                  : t('book_modal_sub', 'Zero pickup fee • Certified digital scale • Instant payout')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {createdBooking ? (
            /* Confirmation Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-center py-2 space-y-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-[84px] h-[84px] rounded-full bg-[#16a34a] flex items-center justify-center mx-auto shadow-[0_0_0_10px_#dcfce7,0_0_0_20px_#f0fdf4] dark:shadow-[0_0_0_10px_rgba(22,163,74,0.25),0_0_0_20px_rgba(22,163,74,0.12)]"
              >
                <Check className="w-11 h-11 text-white" strokeWidth={3.2} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h3 className="text-[21px] font-black text-slate-900 dark:text-white">
                  {t('booking_success_title', 'Pickup Scheduled!')}
                </h3>
                <div className="mt-2.5 inline-block bg-[#15803d] text-white font-bold text-sm tracking-wide px-4 py-1.5 rounded-full">
                  #{createdBooking.booking_number}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 max-w-sm mx-auto leading-relaxed">
                  {t('booking_success_sub', 'Our verified driver will arrive with certified scale on the chosen date and slot.')}
                </p>
              </motion.div>

              {createdBooking.notify_whatsapp && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-[1.5px] border-emerald-200 dark:border-emerald-800 rounded-2xl px-3.5 py-3 text-left max-w-md mx-auto"
                >
                  <span className="w-[30px] h-[30px] rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm shrink-0">💬</span>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold leading-relaxed">
                    {language === 'hindi' ? <><strong>WhatsApp पर रिक्वेस्ट भेज दी गई है</strong> - चैट में बस Send दबाएं। स्लॉट कन्फर्मेशन वहीं से मिलेगा।</> : <><strong>Request sent on WhatsApp</strong> - just press Send in the chat. Slot confirmation will come from there.</>}
                  </p>
                </motion.div>
              )}

              {createdTrackUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.32 }}
                  className="bg-slate-50 dark:bg-slate-800/80 border-[1.5px] border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-3 max-w-md mx-auto text-left"
                >
                  <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {language === 'hindi' ? 'ट्रैक स्टेटस लिंक' : 'Track Status Link'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="flex-1 min-w-0 text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">{createdTrackUrl}</p>
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(createdTrackUrl);
                          setCopiedTrackLink(true);
                          setTimeout(() => setCopiedTrackLink(false), 2000);
                        } catch (e) { /* clipboard blocked */ }
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedTrackLink ? (language === 'hindi' ? 'कॉपी हो गया ✓' : 'Copied ✓') : (language === 'hindi' ? 'कॉपी करें' : 'Copy')}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5 leading-snug">
                    {language === 'hindi'
                      ? 'इस लिंक से किसी भी डिवाइस पर बिना ID/फ़ोन डाले स्टेटस दिखेगा। यह लिंक अपने पास रखें।'
                      : 'Opens live status on any device - no ID or phone needed. Keep this link private.'}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.35 }}
                className="bg-gradient-to-br from-[#15803d] to-[#047857] rounded-2xl py-5 px-4 max-w-sm mx-auto text-center shadow-lg"
              >
                <span className="text-[11px] uppercase text-emerald-200 font-bold tracking-[2px] block">
                  {t('pickup_otp_label', 'Your Secret Pickup OTP')}
                </span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.08, 1] }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="font-mono text-[40px] font-black text-white tracking-[14px] my-2 block"
                >
                  {createdBooking.pickup_otp}
                </motion.span>
                <p className="text-[11.5px] text-emerald-100 leading-relaxed">
                  {t('pickup_otp_note', 'Share this 4-digit code with driver ONLY after scrap weighing is done.')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-slate-50 dark:bg-slate-800/80 border-[1.5px] border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-1 max-w-md mx-auto text-left"
              >
                {[
                  { icon: '📍', k: language === 'hindi' ? 'पता' : 'Address', v: createdBooking.pickup_address },
                  { icon: '👤', k: language === 'hindi' ? 'संपर्क' : 'Contact', v: `${createdBooking.customer_name} · ${createdBooking.customer_phone}` },
                  { icon: '🕒', k: language === 'hindi' ? 'स्लॉट' : 'Slot', v: `${createdBooking.preferred_date} · ${createdBooking.preferred_time_slot}` },
                  { icon: '💰', k: language === 'hindi' ? 'पेमेंट' : 'Payout', v: `${createdBooking.payout_method?.toUpperCase()}${createdBooking.upi_id ? ` · ${createdBooking.upi_id}` : ''}` },
                ].map((row, i, arr) => (
                  <div key={i} className={`flex items-center gap-2.5 py-2.5 ${i < arr.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                    <span className="w-[30px] h-[30px] rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-sm shrink-0">{row.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">{row.k}</div>
                      <div className="text-[13px] text-slate-800 dark:text-slate-200 font-semibold truncate">{row.v}</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="max-w-md mx-auto pt-1"
              >
                <button
                  onClick={shareOnWhatsApp}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('share_whatsapp_btn', 'Share Details on WhatsApp')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full mt-1 py-2.5 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {t('done_btn', 'Done & Return Home')}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category selector */}
              <div>
                <StepLabel n="1">{t('select_scrap_items', 'Kya bechna hai? Select Scrap Items:')}</StepLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCatIds.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-2xl text-xs cursor-pointer transition-all flex flex-col justify-between active:scale-95 select-none ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#15803d] to-[#047857] text-white border border-emerald-400 shadow-[5px_5px_15px_rgba(16,185,129,0.38),-3px_-3px_10px_rgba(255,255,255,0.8)] font-black'
                            : 'bg-[#f4f7fb] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-white/90 dark:border-slate-700 shadow-[4px_4px_10px_rgba(166,180,200,0.28),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:scale-[1.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold truncate">{getCategoryName(cat)}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                        </div>
                        <span className={`font-black mt-1.5 text-xs ${isSelected ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          ₹{cat.rate_per_kg}/{cat.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items description & Estimated Weight */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      {t('expected_items_label', 'Scrap description / items list:')}
                    </label>

                    {/* Web Speech API Voice Button */}
                    <button
                      type="button"
                      onClick={startVoiceRecognition}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                      title="Describe scrap materials using your voice"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3 h-3 animate-spin" />
                          <span>Listening... Speak Now</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-emerald-600" />
                          <span>🎤 Speak Items</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={expectedItems}
                    onChange={(e) => setExpectedItems(e.target.value)}
                    placeholder={
                      language === 'hindi'
                        ? 'उदा. 5 डिब्बे, पुरानी साइकिल, अखबार (माइक दबाकर बोलें)'
                        : 'e.g. 5 boxes, old bicycle, newspapers (or click Speak)'
                    }
                    className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isListening ? 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-200' : 'border-slate-300'
                    }`}
                    required
                  />

                  {speechError && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">
                      ⚠️ {speechError}
                    </p>
                  )}

                  {isListening && (
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 animate-pulse flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>Recording voice... Speak items like "Old copper wire, 10 kg paper"</span>
                    </p>
                  )}
                </div>
                <div>
                  <StepLabel n="2">{t('approx_weight', 'Kitna approx? Total Weight:')} <span className="text-emerald-600">{estimatedWeight} kg</span></StepLabel>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={estimatedWeight}
                    onChange={(e) => setEstimatedWeight(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>5 kg</span>
                    <span>50 kg</span>
                    <span>100+ kg</span>
                  </div>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <StepLabel n="3">{t('datetime_label', 'Kab aaye? Pickup Date & Time:')}</StepLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('date_label', 'Pickup Date:')}
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('time_slot_label', 'Time Slot:')}
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="" disabled>
                        {language === 'hindi' ? 'स्लॉट चुनें' : 'Select time slot'}
                      </option>
                      <option value="09:00 AM - 12:00 PM">
                        09:00 AM - 12:00 PM ({language === 'hindi' ? 'सुबह' : 'Morning'})
                      </option>
                      <option value="12:00 PM - 03:00 PM">
                        12:00 PM - 03:00 PM ({language === 'hindi' ? 'दोपहर' : 'Afternoon'})
                      </option>
                      <option value="03:00 PM - 06:00 PM">
                        03:00 PM - 06:00 PM ({language === 'hindi' ? 'शाम' : 'Evening'})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Contact & Address */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <StepLabel n="4">{t('customer_details_label', 'Aapki Details:')}</StepLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('customer_name_label', 'Your Name:')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aman Verma"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('customer_phone_label', 'Phone Number (for OTP):')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t('pickup_address_label', 'Pickup Address:')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('address_placeholder', 'House/Flat No, Street, Colony, Sonipat, Haryana...')}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t('landmark_label', 'Nearby Landmark (Optional):')}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={
                      language === 'hindi'
                        ? 'उदा. सामुदायिक भवन के सामने, मदर डेयरी के पास'
                        : 'e.g. Opposite Community Hall, Near Mother Dairy'
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payout method preference */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <StepLabel n="5">{t('payout_method_label', 'Paise kaise chahiye?')}</StepLabel>

                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setPayoutMethod('upi')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      payoutMethod === 'upi'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs font-bold block">
                      {language === 'hindi' ? 'तुरंत UPI' : 'Instant UPI'}
                    </span>
                    <span className="text-[10px] text-slate-500">GPay / PhonePe</span>
                  </div>

                  <div
                    onClick={() => setPayoutMethod('cash')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      payoutMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs font-bold block">
                      {language === 'hindi' ? 'हाथ में नकद' : 'Cash on Spot'}
                    </span>
                    <span className="text-[10px] text-slate-500">Doorstep Cash</span>
                  </div>

                  <div
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      payoutMethod === 'bank_transfer'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs font-bold block">
                      {language === 'hindi' ? 'बैंक ट्रांसफर' : 'Bank IMPS'}
                    </span>
                    <span className="text-[10px] text-slate-500">Direct Account</span>
                  </div>
                </div>

                {payoutMethod === 'upi' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {t('upi_id_label', 'Your UPI ID (VPA):')}
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi or name@okhdfcbank"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* QR Code / Screenshot Attachment Option */}
                    <div>
                      {upiQrUrl ? (
                        <div className="relative border border-emerald-300 bg-emerald-50/70 rounded-xl p-2.5 flex items-center gap-3 shadow-xs">
                          <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                            <img src={upiQrUrl} alt="Attached QR Code" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-900 truncate flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>QR Code Screenshot Attached</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Visible to Admin & Driver for Instant Payout scan</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUpiQrUrl('')}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
                            title="Remove attached QR"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors bg-emerald-50/50 hover:bg-emerald-50 group">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-800 block">
                              📷 Upload QR Code Screenshot
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              PhonePe / GPay / Paytm QR - tap karke gallery se lagao
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) {
                                    setUpiQrUrl(evt.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {payoutMethod === 'bank_transfer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        {t('bank_acc_label', 'Bank Account Number:')}
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="50100492817291"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        {t('ifsc_label', 'IFSC Code:')}
                      </label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="HDFC0001042"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg uppercase"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                {bookingError && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-[11px] font-semibold leading-relaxed">
                    🛡️ {bookingError}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#15803d] via-[#059669] to-[#047857] hover:from-[#126b34] hover:to-[#035e45] text-white font-black text-sm shadow-[6px_6px_20px_rgba(21,128,61,0.38),-4px_-4px_12px_rgba(255,255,255,0.9)] hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>{t('confirm_booking_btn', 'Send on WhatsApp 💬')}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  {language === 'hindi'
                    ? 'डिटेल्स सीधे हमारी टीम को WhatsApp पर जाएंगी - बस Send दबाना है'
                    : 'Details go straight to our team on WhatsApp - just press Send'}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

