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

  const [name, setName] = useState(currentUser?.role === 'customer' ? (currentUser.full_name || '') : '');
  const [phone, setPhone] = useState(currentUser?.role === 'customer' ? (currentUser.phone || '') : '');
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
        const messageText = `*New ScrapGo Pickup Request* 🚚
----------------------------------
📦 *Booking ID:* #${booking.booking_number}
👤 *Name:* ${booking.customer_name}
📱 *Phone:* ${booking.customer_phone}
📅 *Date & Slot:* ${booking.preferred_date} (${booking.preferred_time_slot})
📍 *Address:* ${booking.pickup_address}${booking.pickup_landmark ? ` (${booking.pickup_landmark})` : ''}
🧺 *Items:* ${itemsList}
⚖️ *Est. Weight:* ${booking.estimated_weight_kg || 20} kg
💵 *Payout:* ${payoutText}
🔑 *Doorstep OTP:* ${booking.pickup_otp}`;
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

    const messageText = `Namaste ScrapGo! Meri pickup request ka status batao. 🙏
----------------------------------
📦 *Booking ID:* #${createdBooking.booking_number}
👤 *Name:* ${createdBooking.customer_name}
📱 *Phone:* ${createdBooking.customer_phone}
📅 *Slot:* ${createdBooking.preferred_date} (${createdBooking.preferred_time_slot})`;

    window.open(`https://wa.me/${adminDigits}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#f4f7fb] dark:bg-slate-900 rounded-[32px] shadow-[12px_12px_35px_rgba(166,180,200,0.4),-12px_-12px_35px_rgba(255,255,255,0.95)] dark:shadow-[12px_12px_35px_rgba(0,0,0,0.7),-12px_-12px_35px_rgba(30,41,59,0.5)] border border-white/90 dark:border-slate-800 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#047857] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/70 shadow-md shrink-0">
              <img src={scrapgoLogo} alt="ScrapGo logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {t('book_modal_title', 'Book Free Doorstep Pickup')}
              </h2>
              <p className="text-xs font-semibold text-emerald-100">
                {t('book_modal_sub', 'Zero pickup fee • Certified digital scale • Instant payout')}
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {createdBooking ? (
            /* Confirmation Screen with Framer Motion Animations */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-center py-4 space-y-5"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {t('booking_success_title', 'Pickup Scheduled Successfully! 🎉')}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  Booking #{createdBooking.booking_number}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                  {t('booking_success_sub', 'Our verified driver will arrive with certified scale on the chosen date and slot.')}
                </p>
              </motion.div>

              {/* AUTOMATED WHATSAPP NOTIFICATION BADGE */}
              {createdBooking.notify_whatsapp && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5">
                        <span className="text-base">💬</span> Request Sent on WhatsApp
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded uppercase">
                      TEAM KO GAYA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                    Your pickup request with full details has opened in WhatsApp to our team - bas <strong>Send</strong> dabao. Slot confirmation wahi se milegi.
                  </p>
                </motion.div>
              )}

              {/* CRITICAL OTP DISPLAY FOR CUSTOMER */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.35 }}
                className="bg-slate-900 text-white rounded-2xl p-5 max-w-sm mx-auto shadow-xl border border-slate-800 relative overflow-hidden"
              >
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider block">
                  {t('pickup_otp_label', 'Your Secret Pickup OTP:')}
                </span>
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.08, 1] }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="font-mono text-4xl font-black text-emerald-400 tracking-widest my-2 block"
                >
                  {createdBooking.pickup_otp}
                </motion.span>
                <p className="text-[11px] text-slate-300">
                  {t('pickup_otp_note', 'Share this 4-digit code with driver ONLY after scrap weighing is done.')}
                </p>
              </motion.div>

              {/* Summary Pill */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-left max-w-md mx-auto space-y-1.5 text-slate-700 dark:text-slate-300"
              >
                <div><strong>Address: </strong>{createdBooking.pickup_address}</div>
                <div><strong>Contact: </strong>{createdBooking.customer_name} ({createdBooking.customer_phone})</div>
                <div><strong>Slot: </strong>{createdBooking.preferred_date} ({createdBooking.preferred_time_slot})</div>
                <div><strong>Payout Preference: </strong>
                  <span className="font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                    {createdBooking.payout_method} {createdBooking.upi_id ? `(${createdBooking.upi_id})` : ''}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto pt-2"
              >
                <button
                  onClick={shareOnWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('share_whatsapp_btn', 'Track Status on WhatsApp 💬')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t('done_btn', 'Done & Return Home')}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {bookingError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 flex items-center gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                    🛡️
                  </div>
                  <div className="text-xs font-semibold leading-relaxed">
                    {bookingError}
                  </div>
                </div>
              )}

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
                        : language === 'hinglish'
                        ? 'jaise 5 boxes, purani cycle, akhbar (ya Speak button dabayein)'
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
                        {language === 'hinglish' ? 'Slot choose karo' : language === 'hindi' ? 'स्लॉट चुनें' : 'Select time slot'}
                      </option>
                      <option value="09:00 AM - 12:00 PM">
                        09:00 AM - 12:00 PM ({language === 'hindi' ? 'सुबह' : language === 'hinglish' ? 'Morning' : 'Morning'})
                      </option>
                      <option value="12:00 PM - 03:00 PM">
                        12:00 PM - 03:00 PM ({language === 'hindi' ? 'दोपहर' : language === 'hinglish' ? 'Afternoon' : 'Afternoon'})
                      </option>
                      <option value="03:00 PM - 06:00 PM">
                        03:00 PM - 06:00 PM ({language === 'hindi' ? 'शाम' : language === 'hinglish' ? 'Evening' : 'Evening'})
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
                      placeholder="+91 98287 21470"
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
                        : language === 'hinglish'
                        ? 'jaise Community Hall ke samne, Mother Dairy ke pass'
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
                        {t('upi_id_label', 'Your UPI ID (ya neeche QR upload karo):')}
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
                    : language === 'hinglish'
                    ? 'Details seedha hamari team ko WhatsApp pe jayengi - bas Send dabana hai'
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
