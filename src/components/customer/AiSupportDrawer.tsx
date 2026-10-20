import React, { useState, useEffect, useRef } from 'react';
import { useScrap } from '../../context/ScrapContext';
import { checkRateLimit, recordAction } from '../../lib/rateLimiter';
import {
  Headphones,
  X,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileWarning,
  Truck,
  PhoneCall,
  MessageCircle,
  User,
  ShieldCheck,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  Bot,
  BarChart3,
  CalendarCheck,
  MessageSquareWarning,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiSupportDrawerProps {
  onClose: () => void;
  initialBookingNumber?: string;
  defaultTab?: 'complaint' | 'history';
}

export const AiSupportDrawer: React.FC<AiSupportDrawerProps> = ({
  onClose,
  initialBookingNumber,
  defaultTab = 'complaint',
}) => {
  const {
    aiBotLookupBooking,
    createTicket,
    categories,
    bookings,
    tickets,
    currentUser,
    setOverlayActive,
    language,
  } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const [activeTab, setActiveTab] = useState<'complaint' | 'history'>(defaultTab);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guided Complaint State Machine within Chat
  // 'idle' | 'awaiting_order_or_phone' | 'awaiting_category' | 'awaiting_description'
  const [complaintStep, setComplaintStep] = useState<
    'idle' | 'awaiting_order_or_phone' | 'awaiting_category' | 'awaiting_description'
  >('idle');

  const [complaintDraft, setComplaintDraft] = useState<{
    orderNumber?: string;
    phone?: string;
    category?: 'driver_delayed' | 'payment_issue' | 'weight_scale_issue' | 'staff_behavior' | 'cancellation' | 'other';
    categoryLabel?: string;
    bookingDetails?: any;
  }>({});

  // Chatbot conversation state matching screenshot
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'bot' | 'system';
      text: string;
      time: string;
      actionType?: 'rates' | 'track' | 'complaint' | 'call' | 'booking';
      showMainOptions?: boolean;
      orderChips?: Array<{ label: string; value: string }>;
      categoryOptions?: Array<{ id: string; label: string }>;
      bookingDetails?: any;
      ticketNumber?: string;
    }>
  >([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Namaste! 👋 Aaj main aapki kis tarah madad kar sakta hoon?\n\nAap apna sawaal type kar sakte hain ya neeche se koi option chun sakte hain.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showMainOptions: true,
    },
  ]);

  const [inputVal, setInputVal] = useState(
    initialBookingNumber ? `Track my booking ${initialBookingNumber}` : ''
  );
  const [isTyping, setIsTyping] = useState(false);

  // Complaint Form tab state
  const [formCategory, setFormCategory] = useState<
    | 'driver_delayed'
    | 'payment_issue'
    | 'weight_scale_issue'
    | 'staff_behavior'
    | 'cancellation'
    | 'other'
  >('driver_delayed');
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<string>('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSuccessTicket, setComplaintSuccessTicket] = useState<string | null>(null);

  // Loading & skeleton states for enhanced perceived responsiveness
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false);
  const [pendingVerify, setPendingVerify] = useState<any>(null);

  // Tab switch handler with smooth skeleton transition for history
  const handleTabSwitch = (tab: 'complaint' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      setIsLoadingHistory(true);
      setTimeout(() => {
        setIsLoadingHistory(false);
      }, 450);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter complaints for current customer
  const myTickets = tickets.filter(
    (t) => t.customer_id === currentUser.id || t.customer_phone === currentUser.phone
  );

  // Only the current customer's own bookings - never show other customers' orders
  const userBookings = bookings.filter(
    (b) =>
      (currentUser.phone && b.customer_phone === currentUser.phone) ||
      (currentUser.id && b.customer_id === currentUser.id)
  );

  // Language helper: pure English or pure Hindi, never mixed
  const L = (en: string, hi: string) => (language === 'hindi' ? hi : en);

  const COMPLAINT_CATEGORIES = [
    { id: 'driver_delayed', icon: '🚚', en: 'Driver Late', hi: 'ड्राइवर देरी से आया' },
    { id: 'payment_issue', icon: '💸', en: 'Payment Not Received', hi: 'पैसा नहीं मिला' },
    { id: 'weight_scale_issue', icon: '⚖️', en: 'Weight Issue', hi: 'वज़न की समस्या' },
    { id: 'staff_behavior', icon: '🙁', en: 'Driver Behavior', hi: 'ड्राइवर का व्यवहार' },
    { id: 'cancellation', icon: '❌', en: 'Cancel / Reschedule', hi: 'रद्द / समय बदलें' },
    { id: 'other', icon: '📝', en: 'Other Problem', hi: 'अन्य समस्या' },
  ];

  // --- STEP 1: TRIGGER COMPLAINT FLOW ---
  const startComplaintFlow = () => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: 'Shikayat / Complaint',
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setComplaintStep('awaiting_order_or_phone');

    // Build order chips for active bookings or user's phone
    const userBookings = bookings.filter((b) => b.customer_phone === currentUser.phone || b.customer_id === currentUser.id);
    const chips: Array<{ label: string; value: string }> = [];

    userBookings.forEach((b) => {
      chips.push({ label: `📦 Order ${b.booking_number}`, value: b.booking_number });
    });

    if (currentUser.phone) {
      chips.push({ label: `📱 Phone: ${currentUser.phone}`, value: currentUser.phone });
    }
    chips.push({ label: `📝 General Complaint (No Order ID)`, value: 'GENERAL' });

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🚨 **Complaint Registration (Step 1 of 3)**\n\nKripya apna **Order Number** (e.g. SG-2026-6930) ya **Mobile Number** enter karein taaki hum aapka order verification kar sakein:',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          orderChips: chips,
        },
      ]);
      setIsTyping(false);
    }, 350);
  };

  // --- STEP 2: HANDLE ORDER OR PHONE SELECTION ---
  const handleOrderOrPhoneSubmit = (selectedInput: string) => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: selectedInput,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let foundBooking: any = null;
      let orderNum = selectedInput.trim().toUpperCase();

      if (selectedInput !== 'GENERAL') {
        foundBooking = aiBotLookupBooking(orderNum);
        if (!foundBooking) {
          foundBooking = bookings.find(
            (b) =>
              b.booking_number.toUpperCase().includes(orderNum) ||
              (b.customer_phone && b.customer_phone.includes(orderNum))
          );
        }
      }

      setComplaintDraft({
        orderNumber: foundBooking ? foundBooking.booking_number : selectedInput !== 'GENERAL' ? selectedInput : undefined,
        bookingDetails: foundBooking,
      });

      setComplaintStep('awaiting_category');

      let botText = '';
      if (foundBooking) {
        botText = `✅ **Database Validation Successful**\n• **Order ID:** ${foundBooking.booking_number}\n• **Verified Phone:** ${foundBooking.customer_phone || currentUser.phone}\n• **Customer Name:** ${foundBooking.customer_name}\n• **Pickup Date:** ${foundBooking.preferred_date}\n• **Status:** ${foundBooking.status.toUpperCase().replace(/_/g, ' ')}\n\n**Step 2 of 3**: Kripya neeche se apni complaint ki category select karein:`;
      } else {
        botText = `**Step 2 of 3**: Kripya neeche se apni complaint ki category select karein:`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          categoryOptions: [
            { id: 'driver_delayed', label: '🚚 Driver Delayed / Late' },
            { id: 'weight_scale_issue', label: '⚖️ Weight / Scale Discrepancy' },
            { id: 'payment_issue', label: '💸 Payment / Money Not Received' },
            { id: 'staff_behavior', label: '👤 Driver Conduct / Behavior' },
            { id: 'cancellation', label: '❌ Cancel / Reschedule Order' },
            { id: 'other', label: '📝 Other Problem' },
          ],
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  // --- STEP 3: HANDLE CATEGORY SELECTION ---
  const handleCategorySelect = (catId: string, catLabel: string) => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: `Category: ${catLabel}`,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setComplaintDraft((prev) => ({
      ...prev,
      category: catId as any,
      categoryLabel: catLabel,
    }));

    setComplaintStep('awaiting_description');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `**Step 3 of 3**: Aapne **"${catLabel}"** select kiya hai.\n\nKripya apni complaint ke baare me detail me yahan likhein (jaise kya dikkat aayi):`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 350);
  };

  // --- MAIN CHAT SEND HANDLER ---
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    // Check Rate Limiting for AI Bot Queries
    const rateCheck = checkRateLimit('AI_CHAT', 'global', language);
    if (!rateCheck.isAllowed) {
      setMessages((prev) => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: 'user',
          text: query,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: 'bot',
          text: `🛡️ **Rate Limit Notice**: Aapne rapid messages bheje hain. Automated bot attacks se defense ke liye ScrapBot queries temporary throttled hain.\n\nKripya **${rateCheck.resetInSeconds} seconds** baad dobara query poochein.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInputVal('');
      return;
    }
    recordAction('AI_CHAT');

    // Handle WhatsApp link click
    if (query.toLowerCase().includes('whatsapp')) {
      window.open('https://wa.me/918287214705', '_blank');
      return;
    }

    // Handle complaint trigger button click
    if (query.toLowerCase().includes('shikayat') || query.toLowerCase().includes('complaint')) {
      startComplaintFlow();
      return;
    }

    // If currently in step 1 of complaint flow
    if (complaintStep === 'awaiting_order_or_phone') {
      setInputVal('');
      handleOrderOrPhoneSubmit(query);
      return;
    }

    // If currently in step 3 of complaint flow (description)
    if (complaintStep === 'awaiting_description') {
      setInputVal('');
      const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg = {
        id: `usr-${Date.now()}`,
        sender: 'user' as const,
        text: query,
        time: userTime,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      setTimeout(() => {
        const ticketSubject = `${complaintDraft.categoryLabel || 'Complaint'}: ${query.slice(0, 35)}...`;
        const ticket = createTicket(
          ticketSubject,
          query,
          complaintDraft.orderNumber,
          {
            ticketType: 'complaint',
            complaintCategory: complaintDraft.category || 'other',
            priority: 'high',
          }
        );

        try {
          confetti({ particleCount: 60, spread: 70 });
        } catch (e) {
          // ignore
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `🎉 **Complaint Successfully Registered!**\n\n• **Ticket Number:** #${ticket.ticket_number}\n• **Status:** Escalated to Admin Operations Command Center\n• **Priority:** HIGH SLA\n• **Resolution Time:** Within 2 Hours\n\nAapki complaint Admin Panel me submit ho gayi hai. Regional Manager aapke mobile number par contact karenge.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ticketNumber: ticket.ticket_number,
            showMainOptions: true,
          },
        ]);

        setComplaintStep('idle');
        setComplaintDraft({});
        setIsTyping(false);
      }, 450);
      return;
    }

    // --- NORMAL QA RESPONSES ---
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: query,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let botResponse = '';
      let actionType: 'rates' | 'track' | 'complaint' | 'call' | 'booking' | undefined = undefined;
      let bookingDetails: any = null;

      // Extract Order ID pattern
      const match = query.match(/SG-\d{4}-\d{3,5}/i);
      const detectedBookingNum = match ? match[0].toUpperCase() : '';

      // Privacy & Security Guardrail Check (Never leak owner/admin personal details, keys, or private info)
      const isPrivacySensitive =
        lower.includes('owner') ||
        lower.includes('malik') ||
        lower.includes('maalik') ||
        lower.includes('admin number') ||
        lower.includes('admin phone') ||
        lower.includes('private number') ||
        lower.includes('personal number') ||
        lower.includes('owner contact') ||
        lower.includes('owner phone') ||
        lower.includes('management number') ||
        lower.includes('personal phone') ||
        lower.includes('secret key') ||
        lower.includes('password') ||
        lower.includes('database') ||
        lower.includes('credential') ||
        lower.includes('ceo') ||
        lower.includes('founder') ||
        lower.includes('director') ||
        lower.includes('private address') ||
        lower.includes('personal email') ||
        lower.includes('server') ||
        lower.includes('api key') ||
        lower.includes('firebase key') ||
        lower.includes('system info');

      if (isPrivacySensitive) {
        botResponse = `🔒 **Security & Privacy Policy Notification:**\n\nSecurity and Privacy policy ke tehat main Owner, Management, ya Admin ki koi bhi personal private contact details (jaise personal phone number, private address, ya system credentials) share nahi kar sakta.\n\nAap kisi bhi query ya madad ke liye yahan **AI Chat Assistant** ya **Register Complaint / Raise Ticket** option ka istemaal kar sakte hain.`;
      } else if (pendingVerify) {
        const digits = query.replace(/\D/g, '');
        const bookingPhone = (pendingVerify.customer_phone || '').replace(/\D/g, '');
        if (digits.length >= 10 && bookingPhone && bookingPhone.endsWith(digits.slice(-10))) {
          actionType = 'track';
          bookingDetails = pendingVerify;
          const f = pendingVerify;
          botResponse = `📦 **Booking Details (${f.booking_number}):**\n\n• **Status:** ${f.status.toUpperCase().replace(/_/g, ' ')}\n• **Customer:** ${f.customer_name}\n• **Pickup Address:** ${f.pickup_address}\n• **Pickup Date:** ${f.preferred_date} (${f.preferred_time_slot})\n• **Pickup Agent:** ${f.staff_name || 'Allocating driver'}\n• **Secret OTP:** ${f.pickup_otp}`;
          setPendingVerify(null);
        } else if (digits.length >= 10) {
          botResponse = `❌ Ye phone number booking **${pendingVerify.booking_number}** se match nahi hua. Kripya wahi 10-digit number bhejein jisse booking hui thi, ya 'cancel' likhein.`;
        } else if (lower.includes('cancel')) {
          setPendingVerify(null);
          botResponse = `Theek hai, verification cancel kar diya. Aur kuch madad chahiye?`;
        } else {
          botResponse = `🔐 Pehle apna **registered 10-digit phone number** bhejein (booking **${pendingVerify.booking_number}** jis number se hui thi), tabhi details dikhaunga.`;
        }
      } else if (detectedBookingNum) {
        const found = aiBotLookupBooking(detectedBookingNum);
        if (found) {
          setPendingVerify(found);
          botResponse = `🔐 **Booking mil gayi (${found.booking_number})!**\n\nSecurity ke liye apna **registered phone number** bhejein jisse ye booking hui thi. Verify hone ke baad status, address aur OTP dikhaya jayega.`;
        } else {
          botResponse = `Aapka order ID "${detectedBookingNum}" nahi mila. Kripya apna exact order number dekhein ya 'Pickup track karein' par tap karein.`;
        }
      } else if (lower.includes('rate') || lower.includes('bhav') || lower.includes('price')) {
        actionType = 'rates';
        const sampleRates = categories
          .slice(0, 8)
          .map((c) => `• **${c.name}**: ₹${c.rate_per_kg}/${c.unit}`)
          .join('\n');
        botResponse = `📊 **Aaj ke Official Scrap Rates (Free Doorstep Pickup):**\n\n${sampleRates}\n\n✨ All weighing is done on ISO-certified digital electronic scales with 0.00 kg tare reset!`;
      } else if (lower.includes('track') || lower.includes('kahan') || lower.includes('status')) {
        const active = bookings.find((b) => b.status === 'on_the_way' || b.status === 'arrived' || b.status === 'assigned');
        if (active) {
          actionType = 'track';
          bookingDetails = active;
          botResponse = `🚚 **Booking ${active.booking_number} Status:**\n\n• **Status:** ${active.status.toUpperCase().replace(/_/g, ' ')}\n• **Driver Name:** ${active.staff_name || 'Vikram Singh'}\n• **Driver Phone:** ${active.staff_phone || '+91 98123 45678'}\n• **Scheduled Time:** ${active.preferred_time_slot}\n\nDriver aapke address ke raste me hai!`;
        } else if (bookings.length > 0) {
          botResponse = `Aapka sabse recent order **${bookings[0].booking_number}** (Status: **${bookings[0].status.toUpperCase()}**) hai.`;
        } else {
          botResponse = `Aapka koi active order nahi mila. Nayi booking karne ke liye 'Nayi booking' par tap karein!`;
        }
      } else if (lower.includes('nayi') || lower.includes('book') || lower.includes('kaise')) {
        actionType = 'booking';
        botResponse = `📅 **Nayi Doorstep Pickup Booking Ka Tarika:**\n\n1. Home screen par **"Book Free Pickup Now"** button par click karein.\n2. Apne scrap items, approximate wazan, aur date select karein.\n3. Driver aapke ghar aayega, digital scale par weight karke turant UPI/Cash pay karega!`;
      } else if (lower.includes('material') || lower.includes('item') || lower.includes('kya')) {
        actionType = 'rates';
        const allCats = categories
          .map((c) => `• **${c.name}**: ₹${c.rate_per_kg}/${c.unit}`)
          .join('\n');
        botResponse = `📦 **ScrapHouse Accepted Materials List:**\n\n${allCats}\n\n✅ Hum Newspaper, Iron, Copper, Brass, Aluminum, AC, Fridge, Plastic, E-waste sabhi accept karte hain!`;
      } else if (lower.includes('scale') || lower.includes('weight') || lower.includes('wazan') || lower.includes('kanta')) {
        botResponse = `⚖️ **Digital Electronic Scale Guarantee:**\n\n• **ISO-Certified Scales**: Sabhi drivers ISO-certified digital scales use karte hain.\n• **0.00 kg Tare Reset**: AAPKE SAAMNE scale 0.00 kg reset kiya jata hai.\n• **Zero Deduction**: Bag ya kachre ke naam par koi deduction nahi hoti!`;
      } else if (lower.includes('area') || lower.includes('city') || lower.includes('pincode') || lower.includes('location')) {
        botResponse = `📍 **ScrapHouse Active Service Areas:**\n\n• Delhi NCR (Noida, Gurgaon, Ghaziabad, Faridabad)\n• Jaipur, Chandigarh, Lucknow & expanding!\n\nApna pincode check karne ke liye home screen par area selector dekhein.`;
      } else if (lower.includes('contact') || lower.includes('helpline') || lower.includes('phone') || lower.includes('call') || lower.includes('number')) {
        actionType = 'call';
        botResponse = `💬 **ScrapHouse Support & Contact Options:**\n\n• **Instant AI Chat Assistant**: Available 24/7 directly in app\n• **Formal Ticket / Complaint**: Use 'File Complaint' tab above\n• **Official Email**: support@scraphouse.in\n• **Working Hours**: Mon-Sun (8:00 AM - 8:00 PM)`;
      } else if (lower.includes('payout') || lower.includes('payment') || lower.includes('paise')) {
        botResponse = `💰 **ScrapHouse Payout Policy:**\n\n• **Zero Pickup Fee**: Pickup bilkul FREE hai!\n• **Instant Payment**: Weight hotey hi instant **UPI (GPay/PhonePe)**, **Cash**, ya **Direct Bank Transfer** milti hai.`;
      } else if (lower.includes('otp')) {
        botResponse = `🔑 **Secret Pickup OTP:**\nAapka 4-digit secret OTP aapke booking details me dikhta hai. Driver jab aapke ghar electronic scale ke saath aakar weight kare, tabhi OTP share karein.`;
      } else {
        botResponse = `Main aapki in cheezon me madad kar sakta hu. Kripya neeche se option chunein ya apna sawaal likhein!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType,
          showMainOptions: true,
          bookingDetails,
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  // Form tab complaint handler
  const handleRegisterFormComplaint = (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaintSubject.trim() || !complaintDescription.trim()) {
      alert(L('Please fill in the complaint subject and details.', 'कृपया शिकायत का विषय और विवरण भरें।'));
      return;
    }

    setIsSubmittingComplaint(true);

    setTimeout(() => {
      const ticket = createTicket(
        complaintSubject,
        complaintDescription,
        selectedBookingNumber || undefined,
        {
          ticketType: 'complaint',
          complaintCategory: formCategory,
          priority: 'high',
        }
      );

      setComplaintSuccessTicket(ticket.ticket_number);
      setIsSubmittingComplaint(false);

      try {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } catch (e) {
        // Ignore
      }

    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Executive Header Banner */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white p-5 relative overflow-hidden shadow-lg">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                <Headphones className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="font-extrabold text-lg tracking-tight text-white leading-snug">
                  ScrapHouse Support
                </h3>
                <p className="text-[11px] text-emerald-50 font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                  <span>Online · Here to help</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white cursor-pointer transition-all border border-white/20"
              title="Close Support"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smooth Glass Segmented Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200/80 bg-white p-1.5 gap-1.5 text-xs font-extrabold">
          <button
            onClick={() => handleTabSwitch('complaint')}
            className={`flex-1 py-2 font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'complaint'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5 text-rose-500" />
            <span>File Complaint</span>
          </button>

          <button
            onClick={() => handleTabSwitch('history')}
            className={`flex-1 py-2 font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tickets ({myTickets.length})</span>
          </button>
        </div>

        {/* FILE OFFICIAL COMPLAINT FORM */}
        {activeTab === 'complaint' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {complaintSuccessTicket ? (
              <div className="bg-emerald-50/90 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-3.5 shadow-lg animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-300/30 rounded-full blur-2xl animate-pulse"></div>
                
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping"></div>
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-300 relative z-10">
                    <CheckCircle2 className="w-9 h-9 text-white animate-bounce" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base tracking-tight">
                    {L('Complaint Registered!', 'शिकायत दर्ज हो गई!')}
                  </h4>
                  <p className="text-[11px] font-semibold text-emerald-800">
                    {L('Sent directly to our operations team', 'सीधे हमारी ऑपरेशन टीम को भेज दी गई')}
                  </p>
                </div>

                <div className="font-mono text-lg font-black text-emerald-900 bg-white px-4 py-1.5 rounded-2xl border border-emerald-300 inline-block shadow-xs animate-in slide-in-from-bottom-2 duration-300">
                  #{complaintSuccessTicket}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {L('Our team will contact you on ', 'हमारी टीम आपसे संपर्क करेगी: ')}
                  <strong>{currentUser.phone || L('your mobile', 'आपका मोबाइल')}</strong>
                  {L(' as soon as possible.', ' (जल्द से जल्द)')}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setComplaintSuccessTicket(null);
                      setComplaintSubject('');
                      setComplaintDescription('');
                      handleTabSwitch('history');
                    }}
                    className="w-full bg-[#0f6233] hover:bg-[#0c5028] text-white font-bold text-xs py-3 rounded-2xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{L('View My Complaints', 'मेरी शिकायतें देखें')}</span>
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setComplaintSuccessTicket(null);
                      setComplaintSubject('');
                      setComplaintDescription('');
                      setSelectedBookingNumber('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer font-medium"
                  >
                    {L('File Another Complaint', 'एक और शिकायत दर्ज करें')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterFormComplaint} className="space-y-5 text-xs bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
                {isSubmittingComplaint && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-2xs rounded-2xl z-20 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="font-bold text-slate-800 text-xs">{L('Submitting your complaint...', 'आपकी शिकायत भेजी जा रही है...')}</p>
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    {L('Register Complaint 📝', 'शिकायत दर्ज करें 📝')}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {L('Your complaint goes directly to our senior team.', 'आपकी शिकायत सीधे हमारी वरिष्ठ टीम को मिलेगी।')}
                  </p>
                </div>

                {/* Complaint Category */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    {L('What went wrong?', 'क्या समस्या है?')}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {COMPLAINT_CATEGORIES.map((cat) => {
                      const isSelected = formCategory === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setFormCategory(cat.id as any)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left font-bold transition-all active:scale-97 ${
                            isSelected
                              ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-600 text-white shadow-lg shadow-green-600/25'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-green-300'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                              isSelected ? 'bg-white/20' : 'bg-green-50'
                            }`}
                          >
                            {cat.icon}
                          </span>
                          <span className="text-[11px] leading-tight">{L(cat.en, cat.hi)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Booking number typed by the customer - no list of orders shown */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    {L('Your booking (optional)', 'आपकी बुकिंग (वैकल्पिक)')}
                  </label>
                  <input
                    type="text"
                    value={selectedBookingNumber}
                    onChange={(e) => setSelectedBookingNumber(e.target.value.toUpperCase())}
                    placeholder={L('Enter your booking number', 'अपना बुकिंग नंबर लिखें')}
                    autoComplete="off"
                    className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    {L('Subject', 'विषय')}
                  </label>
                  <input
                    type="text"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder={L('e.g. Driver did not arrive in the morning slot', 'उदा. ड्राइवर सुबह के समय पर नहीं आया')}
                    required
                    className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    {L('Describe your issue', 'अपनी समस्या बताएं')}
                  </label>
                  <textarea
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder={L('Please share what happened - time, address or any other details...', 'कृपया बताएं क्या हुआ - समय, पता या अन्य जानकारी...')}
                    rows={4}
                    required
                    className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-slate-800 resize-none"
                  ></textarea>
                </div>

                {/* Customer Contact notice */}
                <div className="bg-green-50 border border-green-200 p-3 rounded-2xl text-[11px] text-green-900">
                  <span>{L('Complaint by: ', 'शिकायतकर्ता: ')}</span>
                  <strong>{currentUser.full_name}</strong> ({L('Mobile', 'मोबाइल')}: {currentUser.phone})
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingComplaint}
                  className="w-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmittingComplaint ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{L('Submitting...', 'भेजा जा रहा है...')}</span>
                    </>
                  ) : (
                    <>
                      <FileWarning className="w-4 h-4" />
                      <span>{L('Submit Complaint 🚨', 'शिकायत भेजें 🚨')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: MY TICKETS / COMPLAINTS HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Your Registered Complaints</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Track resolution status and Admin replies in real-time.
              </p>
            </div>

            {/* SKELETON LOADING STATE FOR ORDER / COMPLAINT HISTORY */}
            {isLoadingHistory ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="h-4 bg-slate-200 rounded-md w-24"></div>
                      <div className="h-4 bg-slate-200 rounded-full w-20"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-3 bg-slate-150 rounded-md w-full"></div>
                    <div className="h-3 bg-slate-150 rounded-md w-2/3"></div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                      <div className="h-2.5 bg-slate-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 shadow-2xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-800">No active complaints on file.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Everything running smoothly! Need help with anything else? Chat with ScrapHouse Support.
                </p>
              </div>
            ) : (
              myTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-slate-900">
                      #{tkt.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        tkt.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : tkt.status === 'escalated_to_admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {tkt.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900">{tkt.subject}</h5>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{tkt.description}</p>

                  {tkt.booking_number && (
                    <div className="text-[10px] text-slate-500">
                      Booking Ref: <strong>{tkt.booking_number}</strong>
                    </div>
                  )}

                  {tkt.admin_reply && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-950 text-[11px] mt-2">
                      <strong className="text-blue-800">Admin Response: </strong>
                      {tkt.admin_reply}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                    <span>Priority: {tkt.priority.toUpperCase()}</span>
                    <span>{new Date(tkt.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
