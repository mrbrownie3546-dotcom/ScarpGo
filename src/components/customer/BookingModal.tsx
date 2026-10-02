import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  onClose: () => void;
  preselectedCategoryId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ onClose, preselectedCategoryId }) => {
  const { categories, createBooking, currentUser, serviceAreas, setOverlayActive, t, language, getCategoryName } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(
    preselectedCategoryId ? [preselectedCategoryId] : ['cat-iron', 'cat-cardboard']
  );
  const [expectedItems, setExpectedItems] = useState('Old cartons, newspaper bundles, iron grills');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(30);

  const [name, setName] = useState(currentUser.full_name || 'Aman Verma');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98287 21470');
  const [address, setAddress] = useState('Plot #89, Model Town, Sonipat, Haryana');
  const [landmark, setLandmark] = useState('Near Civil Hospital');

  // Tomorrow as default pickup date
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');

  // Payout method
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('upi');
  const [upiId, setUpiId] = useState('aman.verma@okhdfcbank');
  const [accountNumber, setAccountNumber] = useState('50100492817291');
  const [ifscCode, setIfscCode] = useState('HDFC0001042');
  const [accountHolder, setAccountHolder] = useState('Aman Verma');

  // Completed booking result
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  const toggleCategory = (id: string) => {
    if (selectedCatIds.includes(id)) {
      if (selectedCatIds.length > 1) {
        setSelectedCatIds(selectedCatIds.filter((c) => c !== id));
      }
    } else {
      setSelectedCatIds([...selectedCatIds, id]);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddress(`Geo-located: Sector 14, Sonipat, Haryana (Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setAddress('Sector 15, Near Subhash Park, Sonipat, Haryana - 131001');
        }
      );
    } else {
      setAddress('Sector 15, Near Subhash Park, Sonipat, Haryana - 131001');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('Please fill in your Name, Phone Number, and Address.');
      return;
    }

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
      payout_method: payoutMethod,
      upi_id: payoutMethod === 'upi' ? upiId : undefined,
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
  };

  const shareOnWhatsApp = () => {
    if (!createdBooking) return;
    const msg = `Hi SCRAPGO! I scheduled scrap pickup.%0AOrder ID: ${createdBooking.booking_number}%0AName: ${createdBooking.customer_name}%0AAddress: ${createdBooking.pickup_address}%0ADate: ${createdBooking.preferred_date} (${createdBooking.preferred_time_slot})%0AEst. Weight: ${createdBooking.estimated_weight_kg} kg`;
    window.open(`https://wa.me/918287214705?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">{t('book_modal_title', 'Schedule Free Doorstep Pickup')}</h2>
              <p className="text-xs text-slate-400">{t('book_modal_sub', 'Zero pickup fee • Certified electronic scale • Instant payout')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {createdBooking ? (
            /* Confirmation Screen */
            <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {t('booking_success_title', 'Pickup Scheduled Successfully! 🎉')}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Booking #{createdBooking.booking_number}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  {t('booking_success_sub', 'Our verified driver will arrive with certified scale on the chosen date and slot.')}
                </p>
              </div>

              {/* CRITICAL OTP DISPLAY FOR CUSTOMER */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 max-w-sm mx-auto shadow-xl border border-slate-800">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider block">
                  {t('pickup_otp_label', 'Your Secret Pickup OTP:')}
                </span>
                <span className="font-mono text-4xl font-black text-emerald-400 tracking-widest my-2 block">
                  {createdBooking.pickup_otp}
                </span>
                <p className="text-[11px] text-slate-300">
                  {t('pickup_otp_note', 'Share this 4-digit code with driver ONLY after scrap weighing is done.')}
                </p>
              </div>

              {/* Summary Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-left max-w-md mx-auto space-y-1.5 text-slate-700">
                <div><strong>Address: </strong>{createdBooking.pickup_address}</div>
                <div><strong>Contact: </strong>{createdBooking.customer_name} ({createdBooking.customer_phone})</div>
                <div><strong>Slot: </strong>{createdBooking.preferred_date} ({createdBooking.preferred_time_slot})</div>
                <div><strong>Payout Preference: </strong>
                  <span className="font-semibold uppercase text-emerald-700">
                    {createdBooking.payout_method} {createdBooking.upi_id ? `(${createdBooking.upi_id})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto pt-2">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('share_whatsapp_btn', 'Share Details on WhatsApp')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t('done_btn', 'Done & Return Home')}
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  {t('select_scrap_items', 'Select Scrap Materials to Sell:')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCatIds.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">{getCategoryName(cat)}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <span className="text-emerald-700 font-bold mt-1">
                          ₹{cat.rate_per_kg}/{cat.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items description & Estimated Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t('expected_items_label', 'Scrap description / items list:')}
                  </label>
                  <input
                    type="text"
                    value={expectedItems}
                    onChange={(e) => setExpectedItems(e.target.value)}
                    placeholder={
                      language === 'hindi'
                        ? 'उदा. 5 डिब्बे, पुरानी साइकिल, अखबार'
                        : language === 'hinglish'
                        ? 'jaise 5 boxes, purani cycle, akhbar'
                        : 'e.g. 5 boxes, old bicycle, newspapers'
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {t('approx_weight', 'Approx Total Weight (kg):')} <span className="text-emerald-700">{estimatedWeight} kg</span>
                  </label>
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

              {/* Customer Contact & Address */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('pickup_address_label', 'Pickup Address:')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('customer_name_label', 'Your Name:')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aman Verma"
                      required
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
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {t('pickup_address_label', 'Pickup Address:')}
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{t('use_current_location', '📍 Use Current GPS Location')}</span>
                    </button>
                  </div>
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

              {/* Date & Time Slot */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('date_label', 'Pickup Date:')} &amp; {t('time_slot_label', 'Time Slot:')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      required
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

              {/* Payout method preference */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    {t('payout_method_label', 'How do you want to receive payment?')}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hindi'
                      ? 'आपको स्क्रैपगो को कोई पैसा नहीं देना है। स्क्रैपगो आपके कबाड़ का पूरा पैसा आपको देगा!'
                      : language === 'hinglish'
                      ? 'Aapko ScrapGo ko kuch nahi dena. ScrapGo aapke scrap ke poore paise aapko dega!'
                      : 'You do NOT pay SCRAPGO. SCRAPGO pays you the full calculated value!'}
                  </p>
                </div>

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
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('upi_id_label', 'Your UPI ID (VPA):')}
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or name@okhdfcbank"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
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
                        required
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('confirm_booking_btn', 'Confirm & Schedule Pickup')}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  {language === 'hindi'
                    ? 'कोई छुपा शुल्क नहीं • कभी भी रद्द करें • 100% मुफ़्त डोरस्टेप पिकअप'
                    : language === 'hinglish'
                    ? 'Zero hidden charges • Kabhi bhi cancel karein • 100% Free Doorstep Pickup'
                    : 'No hidden charges • Cancel anytime • 100% Free Doorstep Pickup'}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
