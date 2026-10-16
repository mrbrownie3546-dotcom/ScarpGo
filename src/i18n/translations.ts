export type Language = 'english' | 'hindi';

export interface Translations {
  [key: string]: {
    english: string;
    hindi: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Security & Auth Errors
  invalid_credentials_error: {
    english: '🔐 Authentication Error: The Email Address or Password you entered is incorrect. Both fields must match our verified records.',
    hindi: '🔐 सुरक्षा त्रुटि: आपके द्वारा दर्ज किया गया ईमेल पता और पासवर्ड दोनों अमान्य हैं। कृपया अपने विवरण की जांच करें।',
  },
  invalid_email_format: {
    english: '⚠️ Invalid Email Format: Please enter a valid email address (e.g. driver@scraphouse.in).',
    hindi: '⚠️ अमान्य ईमेल प्रारूप: कृपया एक वैध ईमेल पता दर्ज करें (उदा. driver@scraphouse.in)।',
  },
  password_too_short: {
    english: '⚠️ Security Requirement: Password must be at least 6 characters long.',
    hindi: '⚠️ सुरक्षा आवश्यकता: पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
  },
  lockout_active_error: {
    english: '🔒 Security Lockout Active: 3 consecutive failed attempts. Account temporarily locked for 30 seconds.',
    hindi: '🔒 सुरक्षा लॉकआउट सक्रिय: 3 लगातार गलत प्रयास। खाता 30 सेकंड के लिए अस्थायी रूप से लॉक है।',
  },

  // Brand & Meta
  tagline: {
    english: 'BUY • SELL • RECYCLE',
    hindi: 'खरीदें • बेचें • रीसायकल',
  },
  free_pickup: {
    english: 'Free Doorstep Pickup',
    hindi: 'मुफ़्त डोरस्टेप पिकअप',
  },
  certified_weighing: {
    english: 'Certified Digital Weighing',
    hindi: 'प्रमाणित डिजिटल तौल',
  },
  instant_payout: {
    english: 'Instant UPI / Cash Payout',
    hindi: 'तुरंत UPI / नकद भुगतान',
  },
  active_portal: {
    english: 'Active Portal:',
    hindi: 'सक्रिय पोर्टल:',
  },
  customer_portal: {
    english: 'Customer',
    hindi: 'ग्राहक',
  },
  driver_app: {
    english: 'Driver App',
    hindi: 'ड्राइवर ऐप',
  },
  admin_portal: {
    english: 'Admin',
    hindi: 'एडमिन',
  },
  book_btn: {
    english: 'Book Pickup',
    hindi: 'पिकअप बुक करें',
  },
  menu_btn: {
    english: 'Menu',
    hindi: 'मेनू',
  },
  back_to_customer: {
    english: 'Back to Customer Site',
    hindi: 'ग्राहक वेबसाइट पर वापस',
  },
  switch_language: {
    english: 'Language',
    hindi: 'भाषा बदलें',
  },

  // Drawer
  drawer_title: {
    english: 'ScrapHouse Menu',
    hindi: 'स्क्रैपगो मेनू',
  },
  language_label: {
    english: 'CHOOSE LANGUAGE',
    hindi: 'भाषा चुनें (LANGUAGE)',
  },
  login_signup: {
    english: 'Staff Login',
    hindi: 'स्टाफ लॉगिन',
  },
  login_sub: {
    english: 'Staff & Admin only',
    hindi: 'केवल स्टाफ और एडमिन के लिए',
  },
  terms_conditions: {
    english: 'Terms & Conditions',
    hindi: 'नियम एवं शर्तें',
  },
  terms_sub: {
    english: 'Read our service terms',
    hindi: 'हमारी सेवा शर्तें पढ़ें',
  },
  privacy_policy: {
    english: 'Privacy Policy',
    hindi: 'गोपनीयता नीति',
  },
  privacy_sub: {
    english: 'How your information is protected',
    hindi: 'आपकी जानकारी कैसे सुरक्षित है',
  },
  contact_us: {
    english: 'Contact & Helpline',
    hindi: 'संपर्क एवं हेल्पलाइन',
  },
  contact_sub: {
    english: 'Sonipat & Haryana support team',
    hindi: 'सोनीपत एवं हरियाणा सहायता टीम',
  },
  logout: {
    english: 'Sign Out',
    hindi: 'लॉग आउट',
  },

  // Hero Section
  hero_region_pill: {
    english: 'HARYANA & SONIPAT • FREE DOORSTEP PICKUP',
    hindi: 'हरियाणा एवं सोनीपत • मुफ़्त डोरस्टेप पिकअप',
  },
  hero_title_main: {
    english: 'Sell Scrap Online with Free Doorstep Pickup',
    hindi: 'घर बैठे कबाड़ बेचें - मुफ़्त पिकअप और तुरंत पैसे',
  },
  hero_subtitle: {
    english: 'Best mandi rates in Haryana. Certified digital scale, verified kabadiwala, and instant Cash or UPI transfer at your doorstep.',
    hindi: 'हरियाणा में सबसे बेहतरीन मंडी रेट। प्रमाणित डिजिटल कांटा, सत्यापित कबाड़ीवाला और घर पर तुरंत नकद/UPI भुगतान।',
  },
  pill_best_rates: {
    english: 'Best Mandi Rates',
    hindi: 'सर्वोत्तम मंडी रेट',
  },
  pill_free_pickup: {
    english: '100% Free Pickup',
    hindi: '100% मुफ़्त पिकअप',
  },
  pill_instant_payment: {
    english: 'Instant Payment',
    hindi: 'तुरंत भुगतान',
  },
  hero_cta_book: {
    english: 'Book Free Pickup',
    hindi: 'मुफ़्त पिकअप बुक करें',
  },
  hero_cta_rates: {
    english: "Today's Scrap Rates",
    hindi: 'आज के कबाड़ रेट देखें',
  },
  hero_whatsapp_btn: {
    english: 'Order via WhatsApp',
    hindi: 'व्हाट्सएप पर ऑर्डर करें',
  },

  // Service Area Banner
  service_serving_title: {
    english: 'Serving All Across Haryana & Sonipat',
    hindi: 'हरियाणा एवं सोनीपत भर में सेवारत',
  },
  service_serving_sub: {
    english: 'Free doorstep scrap pickup across Sonipat city & all surrounding sectors with verified drivers.',
    hindi: 'सोनीपत शहर एवं आसपास के सभी सेक्टर्स में सत्यापित ड्राइवरों के साथ घर से मुफ़्त कबाड़ पिकअप।',
  },

  // Active Orders Section
  active_orders_title: {
    english: 'Active Pickup In Progress',
    hindi: 'सक्रिय कबाड़ पिकअप प्रगति पर है',
  },
  active_orders_sub: {
    english: 'Track live driver arrival, scale weighing & OTP verification',
    hindi: 'ड्राइवर का आगमन, कांटे से तौल और ओटीपी सत्यापन लाइव देखें',
  },
  booking_no: {
    english: 'Booking #',
    hindi: 'बुकिंग #',
  },
  pickup_driver: {
    english: 'Driver:',
    hindi: 'ड्राइवर:',
  },
  track_live_btn: {
    english: 'Track Driver Live',
    hindi: 'ड्राइवर लाइव ट्रैक करें',
  },
  report_problem_btn: {
    english: '⚠️ Problem / Complaint?',
    hindi: '⚠️ कोई समस्या / शिकायत?',
  },

  // Mandi Rates Section
  rates_badge: {
    english: 'Transparent Pricing',
    hindi: 'पारदर्शी रेट',
  },
  live_rates_title: {
    english: 'Live Scrap Rates Today',
    hindi: 'आज के लाइव कबाड़ मंडी रेट',
  },
  live_rates_sub: {
    english: 'Rates updated daily according to certified mandi recycling indices. No deductions for moisture or dirt!',
    hindi: 'प्रमाणित रीसाइक्लिंग मंडी के अनुसार रोज़ाना अपडेटेड रेट। नमी या गंदगी के नाम पर कोई मनमानी कटौती नहीं!',
  },
  search_placeholder: {
    english: 'Search scrap items (e.g. iron, copper, newspaper, split ac)...',
    hindi: 'सामान खोजें (जैसे लोहा, तांबा, अखबार, एसी)...',
  },
  tab_all: {
    english: 'All Items',
    hindi: 'सभी सामान',
  },
  tab_metal: {
    english: 'Metals (Iron/Copper/Brass)',
    hindi: 'धातु (लोहा/तांबा/पीतल)',
  },
  tab_paper: {
    english: 'Paper & Cardboard',
    hindi: 'कागज़ एवं गत्ता (रद्दी)',
  },
  tab_plastic: {
    english: 'Plastics & PET',
    hindi: 'प्लास्टिक एवं बोतलें',
  },
  tab_ewaste: {
    english: 'E-Waste & Mobiles',
    hindi: 'ई-कचरा व पुराने मोबाइल',
  },
  tab_appliance: {
    english: 'AC & Old Appliances',
    hindi: 'एसी एवं पुराने घरेलू उपकरण',
  },
  current_rate: {
    english: 'Current Rate',
    hindi: 'वर्तमान रेट',
  },
  min_order: {
    english: 'Min:',
    hindi: 'न्यूनतम:',
  },
  sell_this: {
    english: 'Sell',
    hindi: 'बेचें',
  },

  // Interactive Value Calculator
  calc_badge: {
    english: 'Instant Calculator',
    hindi: 'त्वरित कैलकुलेटर',
  },
  calc_title: {
    english: 'How Much Cash Will You Get for Your Scrap?',
    hindi: 'आपको अपने कबाड़ के कितने पैसे मिलेंगे?',
  },
  calc_sub: {
    english: 'Estimate your doorstep scrap payout before scheduling. Our staff weighs everything transparently in front of your eyes on calibrated electronic scales.',
    hindi: 'पिकअप शेड्यूल करने से पहले अपने कबाड़ की अनुमानित राशि जांचें। हमारा स्टाफ आपकी आंखों के सामने प्रमाणित डिजिटल कांटे पर तौलता है।',
  },
  calc_est_label: {
    english: 'Estimated Instant Payout to You:',
    hindi: 'आपको मिलने वाला अनुमानित भुगतान:',
  },
  calc_payout_note: {
    english: 'Paid immediately via UPI / Cash upon collection.',
    hindi: 'पिकअप के समय तुरंत UPI या नकद द्वारा भुगतान।',
  },
  calc_book_btn: {
    english: 'Book Pickup for this Scrap',
    hindi: 'इस कबाड़ का पिकअप बुक करें',
  },
  calc_adjust_label: {
    english: 'Adjust Scrap Quantities:',
    hindi: 'कबाड़ की मात्रा (किलो) सेट करें:',
  },

  // How ScrapHouse Works (4 Steps)
  how_badge: {
    english: 'Simple 4-Step Process',
    hindi: 'आसान 4-चरणीय प्रक्रिया',
  },
  how_title: {
    english: 'How Doorstep Scrap Pickup Works',
    hindi: 'डोरस्टेप कबाड़ पिकअप कैसे काम करता है',
  },
  how_sub: {
    english: 'Zero hassle. Verified drivers. Real-time GPS and guaranteed honest weighing.',
    hindi: 'बिना किसी परेशानी के। सत्यापित ड्राइवर, लाइव जीपीएस और 100% ईमानदार डिजिटल तौल।',
  },
  step_1_title: {
    english: '1. Schedule Online',
    hindi: '1. ऑनलाइन बुक करें',
  },
  step_1_desc: {
    english: 'Select your scrap items, enter address and pick a convenient date & time slot.',
    hindi: 'कबाड़ का सामान चुनें, अपना पता दर्ज करें और अपनी सुविधा अनुसार तारीख व समय चुनें।',
  },
  step_2_title: {
    english: '2. Driver Arrives with OTP',
    hindi: '2. ड्राइवर पहुंचेगा (ओटीपी सुरक्षा)',
  },
  step_2_desc: {
    english: 'Track your driver via live GPS. Share your secret 4-digit OTP to authenticate arrival.',
    hindi: 'लाइव जीपीएस से ड्राइवर ट्रैक करें। आने पर सुरक्षित 4-अंकीय ओटीपी शेयर करके तौल शुरू कराएं।',
  },
  step_3_title: {
    english: '3. Certified Digital Scale',
    hindi: '3. प्रमाणित डिजिटल कांटा',
  },
  step_3_desc: {
    english: 'Driver weighs all scrap items in front of you. Exact bill calculated instantly on the app.',
    hindi: 'ड्राइवर आपकी आंखों के सामने पारदर्शी तौल करेगा। ऐप पर तुरंत बिल बन जाता है।',
  },
  step_4_title: {
    english: '4. Instant Payout Received',
    hindi: '4. तुरंत हाथो-हाथ पैसे पाएं',
  },
  step_4_desc: {
    english: 'Receive full payment immediately via Instant UPI, Cash, or Direct Bank Transfer!',
    hindi: 'तुरंत UPI, नकद या बैंक खाते में पूरा भुगतान तुरंत प्राप्त करें!',
  },

  // Bottom Nav
  nav_home: {
    english: 'Home',
    hindi: 'होम',
  },
  nav_rates: {
    english: 'Rates',
    hindi: 'रेट',
  },
  nav_book: {
    english: 'Book',
    hindi: 'बुक करें',
  },
  nav_chat: {
    english: 'Support',
    hindi: 'सहायता',
  },
  nav_account: {
    english: 'Account',
    hindi: 'खाता',
  },

  // Booking Modal
  book_modal_title: {
    english: 'Schedule Free Doorstep Pickup',
    hindi: 'मुफ़्त डोरस्टेप पिकअप शेड्यूल करें',
  },
  book_modal_sub: {
    english: 'Zero pickup fee • Certified electronic scale • Instant payout',
    hindi: 'शून्य पिकअप शुल्क • प्रमाणित इलेक्ट्रॉनिक कांटा • तुरंत भुगतान',
  },
  book_step_1_tab: {
    english: '1. Scrap & Address',
    hindi: '1. कबाड़ एवं पता',
  },
  book_step_2_tab: {
    english: '2. Payout Details',
    hindi: '2. भुगतान विवरण',
  },
  select_scrap_items: {
    english: 'Select Scrap Materials to Sell:',
    hindi: 'बेचने के लिए कबाड़ सामान चुनें:',
  },
  expected_items_label: {
    english: 'Scrap description / items list:',
    hindi: 'सामान का विवरण / सूची:',
  },
  approx_weight: {
    english: 'Approx Total Weight (kg):',
    hindi: 'अनुमानित कुल वज़न (किलो):',
  },
  pickup_address_label: {
    english: 'Pickup Address:',
    hindi: 'पिकअप का पता:',
  },
  address_placeholder: {
    english: 'House/Flat No, Street, Colony, Sonipat, Haryana...',
    hindi: 'मकान/फ्लैट नं, गली, कॉलोनी, सोनीपत, हरियाणा...',
  },
  use_current_location: {
    english: '📍 Use Current GPS Location',
    hindi: '📍 वर्तमान जीपीएस लोकेशन भरें',
  },
  landmark_label: {
    english: 'Nearby Landmark (Optional):',
    hindi: 'नजदीकी लैंडमार्क (वैकल्पिक):',
  },
  date_label: {
    english: 'Pickup Date:',
    hindi: 'पिकअप की तारीख:',
  },
  time_slot_label: {
    english: 'Time Slot:',
    hindi: 'समय स्लॉट:',
  },
  customer_name_label: {
    english: 'Your Name:',
    hindi: 'आपका नाम:',
  },
  customer_phone_label: {
    english: 'Phone Number (for OTP):',
    hindi: 'मोबाइल नंबर (ओटीपी के लिए):',
  },
  next_step_btn: {
    english: 'Next: Payout Details →',
    hindi: 'अगला: भुगतान विवरण →',
  },
  back_step_btn: {
    english: '← Back',
    hindi: '← वापस',
  },
  payout_method_label: {
    english: 'How do you want to receive payment?',
    hindi: 'आप भुगतान किस माध्यम से लेना चाहते हैं?',
  },
  payout_upi: {
    english: 'Instant UPI (Google Pay, PhonePe, Paytm)',
    hindi: 'तुरंत UPI (Google Pay, PhonePe, Paytm)',
  },
  payout_cash: {
    english: 'Cash in Hand (Doorstep)',
    hindi: 'हाथ में नकद (डोरस्टेप)',
  },
  payout_bank: {
    english: 'Direct Bank NEFT/IMPS',
    hindi: 'सीधे बैंक खाते में ट्रांसफर',
  },
  upi_id_label: {
    english: 'Your UPI ID (VPA):',
    hindi: 'आपकी UPI आईडी (VPA):',
  },
  bank_acc_label: {
    english: 'Bank Account Number:',
    hindi: 'बैंक खाता संख्या:',
  },
  ifsc_label: {
    english: 'IFSC Code:',
    hindi: 'आईएफएससी (IFSC) कोड:',
  },
  acc_holder_label: {
    english: 'Account Holder Name:',
    hindi: 'खाताधारक का नाम:',
  },
  confirm_booking_btn: {
    english: 'Confirm & Schedule Pickup',
    hindi: 'पिकअप कन्फर्म और बुक करें',
  },
  booking_success_title: {
    english: 'Pickup Scheduled!',
    hindi: 'पिकअप बुक हो गया!',
  },
  booking_success_sub: {
    english: 'Our verified driver will arrive with certified scale on the chosen date and slot.',
    hindi: 'हमारा सत्यापित एजेंट आपके चुने हुए स्लॉट पर प्रमाणित डिजिटल कांटे के साथ पहुंचेगा।',
  },
  pickup_otp_label: {
    english: 'Your Secret Pickup OTP',
    hindi: 'आपका गोपनीय पिकअप OTP',
  },
  pickup_otp_note: {
    english: 'Share this 4-digit code with driver ONLY after scrap weighing is done.',
    hindi: 'यह 4-अंकों का कोड ड्राइवर को केवल कबाड़ तौल पूरा होने के बाद ही दें।',
  },
  share_whatsapp_btn: {
    english: 'Share Details on WhatsApp',
    hindi: 'व्हाट्सएप पर विवरण शेयर करें',
  },
  done_btn: {
    english: 'Done & Return Home',
    hindi: 'पूर्ण एवं होम पर जाएं',
  },

  // Live Tracking Modal
  tracking_title: {
    english: 'Live Doorstep Pickup Tracking',
    hindi: 'लाइव डोरस्टेप पिकअप ट्रैकिंग',
  },
  assigned_agent: {
    english: 'Assigned ScrapHouse Agent',
    hindi: 'नियुक्त स्क्रैपगो एजेंट',
  },
  verified_driver: {
    english: 'Verified Driver',
    hindi: 'सत्यापित ड्राइवर',
  },
  vehicle_info: {
    english: 'Vehicle:',
    hindi: 'वाहन:',
  },
  driver_phone: {
    english: 'Call Driver:',
    hindi: 'ड्राइवर को कॉल करें:',
  },
  otp_box_title: {
    english: 'Customer Verification OTP',
    hindi: 'ग्राहक सत्यापन ओटीपी',
  },
  otp_box_desc: {
    english: 'Share this 4-digit OTP with your driver only after scrap weighing inspection.',
    hindi: 'यह 4-अंकों का ओटीपी ड्राइवर को केवल कबाड़ तौल पूरा होने के बाद ही बताएं।',
  },
  status_pending: {
    english: 'Pickup Requested',
    hindi: 'पिकअप रिक्वेस्ट मिल गई',
  },
  status_assigned: {
    english: 'Driver Assigned & Scheduled',
    hindi: 'ड्राइवर निर्धारित कर दिया गया है',
  },
  status_on_the_way: {
    english: 'Driver is ON THE WAY',
    hindi: 'ड्राइवर रास्ते में है',
  },
  status_arrived: {
    english: 'Driver has ARRIVED at Doorstep',
    hindi: 'ड्राइवर आपके पते पर पहुंच गया है',
  },
  status_weighing: {
    english: 'Digital Weighing in Progress',
    hindi: 'डिजिटल तौल जारी है',
  },
  status_completed: {
    english: 'Pickup Completed & Paid',
    hindi: 'पिकअप पूर्ण एवं भुगतान संपन्न',
  },
  status_cancelled: {
    english: 'Pickup Cancelled',
    hindi: 'पिकअप रद्द',
  },

  // Support & Complaints Drawer
  support_title: {
    english: 'ScrapBot AI Support & Help',
    hindi: 'स्क्रैपबॉट सहायक एवं शिकायत निवारण',
  },
  chat_tab: {
    english: 'AI Chat Assistant',
    hindi: 'एआई चैट सहायक',
  },
  complaint_tab: {
    english: 'File Complaint',
    hindi: 'शिकायत दर्ज करें',
  },
  ticket_history_tab: {
    english: 'Ticket History',
    hindi: 'टिकट इतिहास',
  },
  type_message: {
    english: 'Type your message or ask about scrap rates...',
    hindi: 'अपना संदेश लिखें या कबाड़ रेट पूछें...',
  },
  complaint_category_label: {
    english: 'Complaint Category:',
    hindi: 'शिकायत की श्रेणी:',
  },
  complaint_subject_label: {
    english: 'Complaint Subject:',
    hindi: 'शिकायत का विषय:',
  },
  complaint_desc_label: {
    english: 'Detailed Issue Description:',
    hindi: 'समस्या का विस्तृत विवरण:',
  },
  submit_complaint_btn: {
    english: 'Submit Official Grievance',
    hindi: 'शिकायत सबमिट करें',
  },

  // Auth Modal
  auth_title_customer: {
    english: 'Staff Login',
    hindi: 'स्टाफ लॉगिन',
  },
  auth_sub_customer: {
    english: 'Fast OTP verification via mobile number',
    hindi: 'मोबाइल नंबर से त्वरित ओटीपी सत्यापन',
  },
  enter_mobile: {
    english: 'Enter 10-digit Mobile Number:',
    hindi: '10-अंकों का मोबाइल नंबर दर्ज करें:',
  },
  send_otp_btn: {
    english: 'Send OTP Code',
    hindi: 'ओटीपी भेजें',
  },
  enter_otp: {
    english: 'Enter 6-digit OTP Code:',
    hindi: '6-अंकों का ओटीपी दर्ज करें:',
  },
  verify_login_btn: {
    english: 'Verify & Sign In',
    hindi: 'सत्यापित करें और लॉगिन करें',
  },
  resend_otp: {
    english: 'Resend OTP',
    hindi: 'ओटीपी पुनः भेजें',
  },
  quick_demo_login: {
    english: 'Or Quick Switch Demo User:',
    hindi: 'या डेमो यूजर तुरंत चुनें:',
  },

  // Footer
  footer_tagline: {
    english: "Haryana's #1 digital scrap collection platform with certified digital weighing and instant payouts.",
    hindi: 'हरियाणा का #1 डिजिटल कबाड़ संग्रह प्लेटफॉर्म - प्रमाणित डिजिटल तौल और तुरंत भुगतान के साथ।',
  },
  invalid_credentials_with_attempts: {
    english: '🔐 Security Alert: Incorrect credentials. Attempts left before 30s lockout: ',
    hindi: '🔐 सुरक्षा चेतावनी: गलत विवरण। 30 सेकंड लॉक से पहले शेष प्रयास: ',
  },
  register_missing_fields: {
    english: 'Please enter your Name, Address and Password.',
    hindi: 'कृपया अपना नाम, पता और पासवर्ड दर्ज करें।',
  },
  track_modal_title: {
    english: 'Track Your Pickup 📦',
    hindi: 'अपना पिकअप ट्रैक करें 📦',
  },
  track_modal_subtitle: {
    english: 'See live status with your Booking ID + phone number',
    hindi: 'बुकिंग ID और फ़ोन नंबर से लाइव स्टेटस देखें',
  },
  track_booking_id_label: {
    english: 'Booking ID',
    hindi: 'बुकिंग ID',
  },
  track_phone_label: {
    english: 'Phone Number',
    hindi: 'फ़ोन नंबर',
  },
  track_not_found: {
    english: 'Booking not found. Please check your Booking ID and phone number, then try again.',
    hindi: 'बुकिंग नहीं मिली। कृपया अपनी बुकिंग ID और फ़ोन नंबर जांचें, फिर दोबारा कोशिश करें।',
  },
  track_check_btn: {
    english: 'Check My Status 🔍',
    hindi: 'मेरा स्टेटस देखें 🔍',
  },
  track_checking: {
    english: 'Checking...',
    hindi: 'जांच हो रही है...',
  },
  track_info_note: {
    english: 'You received your Booking ID in the WhatsApp confirmation message. Enter the same details you gave while booking.',
    hindi: 'बुकिंग ID आपको WhatsApp कन्फर्मेशन मैसेज में मिली थी। वही विवरण डालें जो बुकिंग के समय दिए थे।',
  },
  track_need_help: {
    english: 'Need help? Chat with us on WhatsApp 💬',
    hindi: 'मदद चाहिए? WhatsApp पर हमसे चैट करें 💬',
  },
  footer_rights: {
    english: 'All rights reserved. Made for Haryana & Sonipat.',
    hindi: 'सर्वाधिकार सुरक्षित। हरियाणा एवं सोनीपत के लिए निर्मित।',
  },
};

// Material Categories Translations Map (by category ID)
export const CATEGORY_TRANSLATIONS: {
  [id: string]: {
    name: { english: string; hindi: string };
    desc: { english: string; hindi: string };
  };
} = {
  'cat-copper': {
    name: {
      english: 'Copper (तांबा)',
      hindi: 'तांबा (कॉपर)',
    },
    desc: {
      english: 'Electrical wires, coils, copper pipes, utensils & motor cables.',
      hindi: 'बिजली के तार, कॉपर पाइप, बर्तन एवं मोटर की तांबे की वाइंडिंग।',
    },
  },
  'cat-brass': {
    name: {
      english: 'Brass / Peetal (पीतल)',
      hindi: 'पीतल (ब्रास)',
    },
    desc: {
      english: 'Brass taps, pooja utensils, fittings, ornaments and machinery scrap.',
      hindi: 'पीतल के नल, पूजा के बर्तन, फिटिंग, सजावटी सामान एवं पुर्जे।',
    },
  },
  'cat-aluminium': {
    name: {
      english: 'Aluminium (एल्युमिनियम)',
      hindi: 'एल्युमिनियम',
    },
    desc: {
      english: 'Window frames, cans, kitchen utensils, cables and auto scrap.',
      hindi: 'खिड़की की चौखट, केन, रसोई के बर्तन, केबल्स एवं ऑटो कबाड़।',
    },
  },
  'cat-iron': {
    name: {
      english: 'Iron / Loha (लोहा)',
      hindi: 'लोहा (आयरन)',
    },
    desc: {
      english: 'TMT bars, grills, sheets, vehicle parts, heavy cast iron & pipes.',
      hindi: 'सरिया, लोहे की ग्रिल, चादरें, भारी ढलवा लोहा एवं लोहे के पाइप।',
    },
  },
  'cat-newspaper': {
    name: {
      english: 'Newspaper (अखबार / रद्दी)',
      hindi: 'अखबार (रद्दी कागज़)',
    },
    desc: {
      english: 'Daily Hindi/English newspapers, clean sheets and paper bundles.',
      hindi: 'दैनिक अखबार, रद्दी पेपर के बंडल एवं पुराने समाचार पत्र।',
    },
  },
  'cat-cardboard': {
    name: {
      english: 'Cardboard / Cartons (गत्ता)',
      hindi: 'गत्ता एवं कार्टन',
    },
    desc: {
      english: 'Corrugated boxes, packaging cartons, delivery boxes, brown board.',
      hindi: 'पैकिंग के कार्टन, ब्राउन गत्ता, डिलीवरी बॉक्स एवं पैकिंग शीट।',
    },
  },
  'cat-plastic': {
    name: {
      english: 'Hard Plastic (प्लास्टिक)',
      hindi: 'मजबूत प्लास्टिक (बाल्टी/कुर्सी)',
    },
    desc: {
      english: 'Broken plastic chairs, buckets, mugs, crates, drums and pipes.',
      hindi: 'टूटी प्लास्टिक की कुर्सियां, बाल्टियां, टब, ड्रम एवं पीवीसी पाइप।',
    },
  },
  'cat-bottles': {
    name: {
      english: 'PET Bottles (बोतलें)',
      hindi: 'पीईटी प्लास्टिक की बोतलें',
    },
    desc: {
      english: 'Cold drink bottles, water bottles, transparent packaging plastics.',
      hindi: 'कोल्ड ड्रिंक व पानी की प्लास्टिक की खाली बोतलें।',
    },
  },
  'cat-ewaste': {
    name: {
      english: 'E-Waste & Mobiles (ई-कचरा)',
      hindi: 'ई-कचरा व पुराने मोबाइल',
    },
    desc: {
      english: 'Dead laptops, mobile phones, CPUs, computer circuit boards (PCB).',
      hindi: 'खराब लैपटॉप, मोबाइल, सीपीयू, कंप्यूटर मदरबोर्ड व सर्किट प्लेटें।',
    },
  },
  'cat-split-ac': {
    name: {
      english: 'Split AC 1.5 Ton (कॉपर कॉइल)',
      hindi: 'स्प्लिट एसी 1.5 टन (कॉपर)',
    },
    desc: {
      english: 'Indoor & outdoor units with intact copper coils and compressor.',
      hindi: 'इंडोर और आउटडोर यूनिट, कॉपर कॉइल एवं कंप्रेसर सहित।',
    },
  },
  'cat-window-ac': {
    name: {
      english: 'Window AC (विंडो एसी)',
      hindi: 'विंडो एसी (पुराना)',
    },
    desc: {
      english: 'Complete window AC unit with copper condenser and motor.',
      hindi: 'पुराना विंडो एसी, कॉपर कंडेनसर एवं मोटर सहित।',
    },
  },
  'cat-fridge': {
    name: {
      english: 'Refrigerator / Fridge (फ्रिज)',
      hindi: 'फ्रिज (रेफ्रिजरेटर)',
    },
    desc: {
      english: 'Single / double door refrigerators with compressor and motor.',
      hindi: 'सिंगल व डबल डोर खराब या पुराना फ्रिज कंप्रेसर सहित।',
    },
  },
  'cat-washing-machine': {
    name: {
      english: 'Washing Machine (वाशिंग मशीन)',
      hindi: 'वाशिंग मशीन (कबाड़)',
    },
    desc: {
      english: 'Semi / fully automatic old scrap washing machine.',
      hindi: 'सेमी या फुल्ली ऑटोमैटिक पुरानी वाशिंग मशीन।',
    },
  },
  'cat-lead-battery': {
    name: {
      english: 'Inverter Lead Battery (बैटरी)',
      hindi: 'इनवर्टर व गाड़ी की लेड बैटरी',
    },
    desc: {
      english: 'Heavy vehicle and home inverter lead-acid batteries with plates.',
      hindi: 'घर के इनवर्टर व गाड़ियों की पुरानी लेड एसिड बैटरी।',
    },
  },
  'cat-steel': {
    name: {
      english: 'Stainless Steel (स्टील के बर्तन)',
      hindi: 'स्टेनलेस स्टील (बर्तन व फिटिंग)',
    },
    desc: {
      english: 'Steel kitchen utensils, sinks, pipes, railings and industrial sheets.',
      hindi: 'रसोई के स्टील के बर्तन, सिंक, पाइप एवं स्टील की रेलिंग।',
    },
  },
};

// Helper function to get text translation
export const getTranslation = (key: string, lang: Language, fallback?: string): string => {
  if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
    return TRANSLATIONS[key][lang];
  }
  return fallback || key;
};

// Helper function to get translated category name
export const getCategoryName = (cat: { id: string; name: string }, lang: Language): string => {
  const custom = CATEGORY_TRANSLATIONS[cat.id];
  if (custom && custom.name) {
    if (lang === 'hindi' && custom.name.hindi) return custom.name.hindi;
    if (lang === 'english' && custom.name.english) return custom.name.english;
  }
  return cat.name;
};

// Helper function to get translated category description
export const getCategoryDesc = (cat: { id: string; description: string }, lang: Language): string => {
  const custom = CATEGORY_TRANSLATIONS[cat.id];
  if (custom && custom.desc) {
    if (lang === 'hindi' && custom.desc.hindi) return custom.desc.hindi;
    if (lang === 'english' && custom.desc.english) return custom.desc.english;
  }
  return cat.description;
};

// Helper function to get translated status label
export const getStatusLabel = (status: string, lang: Language): string => {
  const key = `status_${status}`;
  return getTranslation(key, lang, status.replace(/_/g, ' ').toUpperCase());
};

// Helper function to get translated payout method
export const getPayoutMethodLabel = (method: string, lang: Language): string => {
  if (method === 'upi') return getTranslation('payout_upi', lang, 'Instant UPI');
  if (method === 'cash') return getTranslation('payout_cash', lang, 'Cash in Hand');
  if (method === 'bank_transfer') return getTranslation('payout_bank', lang, 'Bank Transfer');
  return method;
};
