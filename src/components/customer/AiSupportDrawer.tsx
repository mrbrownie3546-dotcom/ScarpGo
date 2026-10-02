import React, { useState, useEffect } from 'react';
import { useScrap } from '../../context/ScrapContext';
import {
  Bot,
  X,
  Send,
  Sparkles,
  LifeBuoy,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  FileWarning,
  Coins,
  Truck,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiSupportDrawerProps {
  onClose: () => void;
  initialBookingNumber?: string;
  defaultTab?: 'chat' | 'complaint' | 'history';
}

export const AiSupportDrawer: React.FC<AiSupportDrawerProps> = ({
  onClose,
  initialBookingNumber,
  defaultTab = 'chat',
}) => {
  const { aiBotLookupBooking, createTicket, categories, bookings, tickets, currentUser, setOverlayActive } = useScrap();

  useEffect(() => {
    setOverlayActive(true);
    return () => setOverlayActive(false);
  }, [setOverlayActive]);

  const [activeTab, setActiveTab] = useState<'chat' | 'complaint' | 'history'>(defaultTab);

  // Chatbot conversation state
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'bot' | 'system';
      text: string;
      time: string;
      actionType?: 'rates' | 'track' | 'complaint';
      suggestedComplaints?: boolean;
    }>
  >([
    {
      sender: 'bot',
      text: 'Namaste! 🙏 I am ScrapBot, your 24/7 SCRAPGO Assistant.\n\nI can help you resolve common issues, check live scrap rates, track your pickup agent, or register an official complaint with our regional manager.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState(
    initialBookingNumber ? `Track my booking ${initialBookingNumber}` : ''
  );
  const [isTyping, setIsTyping] = useState(false);

  // Complaint Form state
  const [complaintCategory, setComplaintCategory] = useState<
    | 'driver_delayed'
    | 'payment_issue'
    | 'weight_scale_issue'
    | 'staff_behavior'
    | 'cancellation'
    | 'other'
  >('driver_delayed');
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<string>(
    initialBookingNumber || (bookings[0]?.booking_number ?? '')
  );
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSuccessTicket, setComplaintSuccessTicket] = useState<string | null>(null);

  // Filter complaints by current customer
  const myTickets = tickets.filter(
    (t) => t.customer_id === currentUser.id || t.customer_phone === currentUser.phone
  );

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: query, time: userTime };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let botResponse = '';
      let actionType: 'rates' | 'track' | 'complaint' | undefined = undefined;
      let showComplaintButton = false;

      // Extract booking pattern if present (SG-2026-...)
      const match = query.match(/SG-\d{4}-\d{3,5}/i);
      const detectedBookingNum = match ? match[0].toUpperCase() : '';

      if (detectedBookingNum) {
        const found = aiBotLookupBooking(detectedBookingNum);
        if (found) {
          actionType = 'track';
          botResponse = `📦 **Booking Found: ${found.booking_number}**\n\n• **Status:** ${found.status.toUpperCase().replace('_', ' ')}\n• **Customer:** ${found.customer_name}\n• **Pickup Address:** ${found.pickup_address}\n• **Assigned Agent:** ${found.staff_name || 'Allocating driver from dispatch queue'}\n• **Scheduled Date:** ${found.preferred_date} (${found.preferred_time_slot})\n• **Secret OTP for Driver:** ${found.pickup_otp}\n• **Payout Preference:** ${found.payout_method.toUpperCase()} (${found.payout_status.replace('_', ' ')})`;
        } else {
          botResponse = `I searched for booking "${detectedBookingNum}", but could not find a matching active order. Would you like to file a complaint or connect with our admin team?`;
          showComplaintButton = true;
        }
      } else if (
        lower.includes('complaint') ||
        lower.includes('shikayat') ||
        lower.includes('problem') ||
        lower.includes('issue') ||
        lower.includes('fraud') ||
        lower.includes('cheat')
      ) {
        botResponse = `I am very sorry for any trouble caused! You can register a formal complaint right here. Our Regional Operations Manager receives it directly with priority SLA resolution within 2 hours. Click the button below to fill the complaint form.`;
        showComplaintButton = true;
      } else if (
        lower.includes('driver') ||
        lower.includes('late') ||
        lower.includes('kahan') ||
        lower.includes('kab aayega') ||
        lower.includes('delay')
      ) {
        const active = bookings.find((b) => b.status === 'on_the_way' || b.status === 'arrived');
        if (active) {
          botResponse = `🚚 For booking ${active.booking_number}, Driver **${active.staff_name || 'Vikram Singh'}** is currently **${active.status.toUpperCase().replace('_', ' ')}**.\n\nCurrent distance is **${active.staff_distance_km ?? 2.5} km** (ETA: ~${active.staff_eta_minutes ?? 10} minutes).\n\nIf the driver is delayed beyond your slot, click below to file an urgent complaint.`;
          showComplaintButton = true;
        } else {
          botResponse = `Our drivers arrive within your selected 3-hour time slot. If your pickup time has passed and no driver has arrived, please file an urgent complaint and dispatch will reassign a priority van!`;
          showComplaintButton = true;
        }
      } else if (
        lower.includes('payout') ||
        lower.includes('payment') ||
        lower.includes('paise') ||
        lower.includes('upi') ||
        lower.includes('money')
      ) {
        botResponse = `💰 **SCRAPGO Payout Policy:**\n\n• You never pay SCRAPGO; SCRAPGO pays you!\n• Payout is issued immediately upon digital weighing via **Instant UPI (GPay/PhonePe)**, **Cash on spot**, or **Direct Bank Account (IMPS)**.\n• Every pickup bill is verified by Admin to prevent fraud. If your pickup was completed and payment is delayed, click below to file a payment complaint.`;
        showComplaintButton = true;
      } else if (
        lower.includes('rate') ||
        lower.includes('bhav') ||
        lower.includes('price') ||
        lower.includes('loha') ||
        lower.includes('copper') ||
        lower.includes('paper')
      ) {
        actionType = 'rates';
        const sampleRates = categories
          .slice(0, 6)
          .map((c) => `• ${c.name}: ₹${c.rate_per_kg}/${c.unit}`)
          .join('\n');
        botResponse = `📊 **Today's Official Scrap Rates (Free Doorstep Pickup):**\n\n${sampleRates}\n\nAll weighing is done transparently on certified digital electronic scales with 0% deduction.`;
      } else if (lower.includes('otp')) {
        botResponse = `🔑 **Secret Pickup OTP:**\nYour 4-digit secret OTP protects your scrap from unauthorized collection. Give this code to the pickup agent **only when he arrives at your address with the digital weighing scale**!`;
      } else if (lower.includes('weight') || lower.includes('scale') || lower.includes('wazan')) {
        botResponse = `⚖️ **Digital Scale Guarantee:**\nUnlike traditional street scrap buyers who use manipulated spring balances, all SCRAPGO agents carry ISO-certified electronic digital scales. Tare weight is set to 0.00 kg in your presence!`;
      } else if (lower.includes('cancel') || lower.includes('reschedule')) {
        botResponse = `You can cancel or reschedule your pickup anytime for free! Just mention your Booking ID or file a request in the complaint/support tab.`;
        showComplaintButton = true;
      } else {
        botResponse = `I can help you with:\n1. 🔍 **Track your pickup** (type your booking number)\n2. 💰 **Live scrap rates** (ask about Iron, Copper, Newspapers, etc.)\n3. 🚨 **Register a complaint** (driver delayed, payment issues, scale dispute)\n4. 🔑 **How OTP and digital weighing work**\n\nWhat would you like assistance with?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType,
          suggestedComplaints: showComplaintButton,
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleRegisterComplaint = (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaintSubject.trim() || !complaintDescription.trim()) {
      alert('Please fill in the complaint subject and details.');
      return;
    }

    const ticket = createTicket(
      complaintSubject,
      complaintDescription,
      selectedBookingNumber || undefined,
      {
        ticketType: 'complaint',
        complaintCategory,
        priority: 'high',
      }
    );

    setComplaintSuccessTicket(ticket.ticket_number);

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {
      // Ignore
    }

    // Also add to chat messages
    setMessages((prev) => [
      ...prev,
      {
        sender: 'system',
        text: `🚨 Complaint Registered Successfully (#${ticket.ticket_number})!\n\nSubject: "${complaintSubject}"\nStatus: Escalated to Admin Operations Queue.\nExpected Resolution: Within 2 Hours.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Chatbot Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm">ScrapBot Support & Complaints</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400">24/7 Instant Help • Escalation to Human Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Chatbot */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 font-bold rounded-t-lg transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('complaint')}
            className={`flex-1 py-2 font-bold rounded-t-lg transition-colors border-b-2 flex items-center justify-center gap-1.5 relative ${
              activeTab === 'complaint'
                ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5 text-rose-500" />
            <span>File Complaint</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 font-bold rounded-t-lg transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Tickets ({myTickets.length})</span>
          </button>
        </div>

        {/* TAB 1: AI ASSISTANT CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Action Chips */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              {bookings.length > 0 && (
                <button
                  onClick={() => handleSend(`Check my booking ${bookings[0].booking_number}`)}
                  className="bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-full whitespace-nowrap text-slate-700 font-semibold shrink-0 shadow-2xs"
                >
                  🔍 Track {bookings[0].booking_number}
                </button>
              )}
              <button
                onClick={() => handleSend('What is the scrap rate for Copper and Iron today?')}
                className="bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-full whitespace-nowrap text-slate-700 font-semibold shrink-0 shadow-2xs"
              >
                💰 Today&apos;s Rates
              </button>
              <button
                onClick={() => handleSend('My pickup driver is delayed, where is he?')}
                className="bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-full whitespace-nowrap text-slate-700 font-semibold shrink-0 shadow-2xs"
              >
                ⏰ Driver Delay
              </button>
              <button
                onClick={() => handleSend('When will I receive my scrap money via UPI?')}
                className="bg-white border border-slate-200 hover:border-emerald-500 px-2.5 py-1 rounded-full whitespace-nowrap text-slate-700 font-semibold shrink-0 shadow-2xs"
              >
                💸 Payment Issue
              </button>
            </div>

            {/* Conversation Stream */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.sender === 'user'
                      ? 'items-end'
                      : m.sender === 'system'
                      ? 'items-center'
                      : 'items-start'
                  }`}
                >
                  {m.sender === 'system' ? (
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-3.5 py-2.5 rounded-xl text-left w-full shadow-xs whitespace-pre-line font-medium">
                      {m.text}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs whitespace-pre-line'
                      }`}
                    >
                      {m.text}

                      {/* Complaint Trigger Button inside bot reply */}
                      {m.suggestedComplaints && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setActiveTab('complaint');
                              setComplaintSubject('Issue raised via AI Chat: ' + inputVal);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <FileWarning className="w-3.5 h-3.5 text-rose-600" />
                            <span>File an Official Complaint &rarr;</span>
                          </button>
                        </div>
                      )}

                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-white border border-slate-200 px-3 py-2 rounded-xl w-28">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[10px] text-slate-500 ml-1">Typing...</span>
                </div>
              )}
            </div>

            {/* Bottom Quick Help Trigger */}
            <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Unresolved problem?</span>
              <button
                onClick={() => setActiveTab('complaint')}
                className="text-rose-600 font-bold hover:underline flex items-center gap-1 text-xs"
              >
                <FileWarning className="w-3.5 h-3.5" />
                <span>Register Complaint (शिकायत दर्ज करें)</span>
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask a question or describe your problem..."
                  className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: FILE OFFICIAL COMPLAINT */}
        {activeTab === 'complaint' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {complaintSuccessTicket ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Complaint Successfully Registered!
                </h4>
                <div className="font-mono text-lg font-black text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200 inline-block">
                  {complaintSuccessTicket}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your grievance has been assigned high priority in the <strong>Admin Command Center</strong> queue. Our Regional Dispatch Manager will review and contact you on{' '}
                  <strong>{currentUser.phone}</strong> within 2 hours.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setComplaintSuccessTicket(null);
                      setComplaintSubject('');
                      setComplaintDescription('');
                      setActiveTab('history');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
                  >
                    View in My Complaints List
                  </button>
                  <button
                    onClick={() => {
                      setComplaintSuccessTicket(null);
                      setActiveTab('chat');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Back to AI Chatbot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterComplaint} className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Register Customer Complaint (शिकायत दर्ज करें)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct escalation to Senior Operations Manager with guaranteed response.
                  </p>
                </div>

                {/* Complaint Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Issue Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'driver_delayed', label: '🚚 Driver Delayed / Late' },
                      { id: 'payment_issue', label: '💸 Payout / Money Not Received' },
                      { id: 'weight_scale_issue', label: '⚖️ Weight / Scale Discrepancy' },
                      { id: 'staff_behavior', label: '👤 Driver Conduct / Behavior' },
                      { id: 'cancellation', label: '❌ Cancel / Reschedule Order' },
                      { id: 'other', label: '📝 Other Issue' },
                    ].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setComplaintCategory(cat.id as any);
                          if (!complaintSubject) {
                            setComplaintSubject(cat.label.slice(3));
                          }
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer text-[11px] font-semibold transition-all ${
                          complaintCategory === cat.id
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {cat.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Link to Booking */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Related Booking (Optional):
                  </label>
                  <select
                    value={selectedBookingNumber}
                    onChange={(e) => setSelectedBookingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- None / General Complaint --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.booking_number}>
                        {b.booking_number} ({b.customer_name} - {b.preferred_date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Complaint Subject:</label>
                  <input
                    type="text"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="e.g. Driver Vikram has not arrived for morning slot"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Describe Your Issue:</label>
                  <textarea
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Please provide details of what happened. Include exact time, address, or details..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>

                {/* Customer Contact notice */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-600">
                  <span>Registered by: </span>
                  <strong>{currentUser.full_name}</strong> (Mobile: {currentUser.phone})
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <FileWarning className="w-4 h-4" />
                  <span>Submit Formal Complaint & Notify Admin</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: MY TICKETS / COMPLAINTS HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Your Registered Complaints</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Track resolution status and Admin replies in real-time.
              </p>
            </div>

            {myTickets.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-800">No active complaints on file.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Everything running smoothly! Need help with anything else? Chat with ScrapBot.
                </p>
              </div>
            ) : (
              myTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-slate-900">
                      {tkt.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        tkt.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tkt.status === 'escalated_to_admin'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tkt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900">{tkt.subject}</h5>
                  <p className="text-slate-600 line-clamp-2">{tkt.description}</p>

                  {tkt.booking_number && (
                    <div className="text-[10px] text-slate-400">
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
