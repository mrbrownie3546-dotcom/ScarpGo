export type Language = 'english' | 'hindi' | 'hinglish';

export interface Translations {
  [key: string]: {
    english: string;
    hindi: string;
    hinglish: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Security & Auth Errors
  invalid_credentials_error: {
    english: '🔐 Authentication Error: The Email Address or Password you entered is incorrect. Both fields must match our verified records.',
    hindi: '🔐 सुरक्षा त्रुटि: आपके द्वारा दर्ज किया गया ईमेल पता और पासवर्ड दोनों अमान्य हैं। कृपया अपने विवरण की जांच करें।',
    hinglish: '🔐 Security Alert: Aapka Email Address aur Password dono galat hain. Kripya sahi credentials check karke dobara daalein.',
  },
  invalid_email_format: {
    english: '⚠️ Invalid Email Format: Please enter a valid email address (e.g. driver@scrapgo.in).',
    hindi: '⚠️ अमान्य ईमेल प्रारूप: कृपया एक वैध ईमेल पता दर्ज करें (उदा. driver@scrapgo.in)।',
    hinglish: '⚠️ Invalid Email: Kripya sahi format me Email ID daalein (jaise driver@scrapgo.in).',
  },
  password_too_short: {
    english: '⚠️ Security Requirement: Password must be at least 4 characters long.',
    hindi: '⚠️ सुरक्षा आवश्यकता: पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।',
    hinglish: '⚠️ Security Rule: Password kam se kam 4 characters ka hona zaroori hai.',
  },
  lockout_active_error: {
    english: '🔒 Security Lockout Active: 3 consecutive failed attempts. Account temporarily locked for 30 seconds.',
    hindi: '🔒 सुरक्षा लॉकआउट सक्रिय: 3 लगातार गलत प्रयास। खाता 30 सेकंड के लिए अस्थायी रूप से लॉक है।',
    hinglish: '🔒 Security Lockout Active: 3 lga taar galat password! Account 30 seconds ke liye locked hai. Refresh/back par bhi timer active rahega.',
  },

  // Brand & Meta
  tagline: {
    english: 'BUY • SELL • RECYCLE',
    hindi: 'खरीदें • बेचें • रीसायकल',
    hinglish: 'BUY • SELL • RECYCLE',
  },
  free_pickup: {
    english: 'Free Doorstep Pickup',
    hindi: 'मुफ़्त डोरस्टेप पिकअप',
    hinglish: 'Free Doorstep Pickup',
  },
  certified_weighing: {
    english: 'Certified Digital Weighing',
    hindi: 'प्रमाणित डिजिटल तौल',
    hinglish: 'Certified Digital Kaanta',
  },
  instant_payout: {
    english: 'Instant UPI / Cash Payout',
    hindi: 'तुरंत UPI / नकद भुगतान',
    hinglish: 'Turant UPI / Cash Payout',
  },
  active_portal: {
    english: 'Active Portal:',
    hindi: 'सक्रिय पोर्टल:',
    hinglish: 'Active Portal:',
  },
  customer_portal: {
    english: 'Customer',
    hindi: 'ग्राहक',
    hinglish: 'Customer',
  },
  driver_app: {
    english: 'Driver App',
    hindi: 'ड्राइवर ऐप',
    hinglish: 'Driver App',
  },
  admin_portal: {
    english: 'Admin',
    hindi: 'एडमिन',
    hinglish: 'Admin',
  },
  book_btn: {
    english: 'Book Pickup',
    hindi: 'पिकअप बुक करें',
    hinglish: 'Pickup Book Karein',
  },
  menu_btn: {
    english: 'Menu',
    hindi: 'मेनू',
    hinglish: 'Menu',
  },
  back_to_customer: {
    english: 'Back to Customer Site',
    hindi: 'ग्राहक वेबसाइट पर वापस',
    hinglish: 'Customer Site Par Wapas',
  },
  switch_language: {
    english: 'Language',
    hindi: 'भाषा बदलें',
    hinglish: 'Language Badlein',
  },

  // Drawer
  drawer_title: {
    english: 'ScrapGo Menu',
    hindi: 'स्क्रैपगो मेनू',
    hinglish: 'ScrapGo Menu',
  },
  language_label: {
    english: 'CHOOSE LANGUAGE',
    hindi: 'भाषा चुनें (LANGUAGE)',
    hinglish: 'APNI BHASHA CHUNEIN',
  },
  login_signup: {
    english: 'Login / Sign up',
    hindi: 'लॉगिन / साइन अप',
    hinglish: 'Login / Sign up',
  },
  login_sub: {
    english: 'Customer & Staff account',
    hindi: 'ग्राहक एवं स्टाफ खाता',
    hinglish: 'Customer aur Staff account',
  },
  terms_conditions: {
    english: 'Terms & Conditions',
    hindi: 'नियम एवं शर्तें',
    hinglish: 'Terms & Conditions',
  },
  terms_sub: {
    english: 'Read our service terms',
    hindi: 'हमारी सेवा शर्तें पढ़ें',
    hinglish: 'Hamari service terms padhein',
  },
  privacy_policy: {
    english: 'Privacy Policy',
    hindi: 'गोपनीयता नीति',
    hinglish: 'Privacy Policy',
  },
  privacy_sub: {
    english: 'How your information is protected',
    hindi: 'आपकी जानकारी कैसे सुरक्षित है',
    hinglish: 'Aapka data kaise safe rehta hai',
  },
  contact_us: {
    english: 'Contact & Helpline',
    hindi: 'संपर्क एवं हेल्पलाइन',
    hinglish: 'Contact & Helpline',
  },
  contact_sub: {
    english: 'Sonipat & Haryana support team',
    hindi: 'सोनीपत एवं हरियाणा सहायता टीम',
    hinglish: 'Sonipat aur Haryana support team',
  },
  logout: {
    english: 'Sign Out',
    hindi: 'लॉग आउट',
    hinglish: 'Sign Out Karein',
  },

  // Hero Section
  hero_region_pill: {
    english: 'HARYANA & SONIPAT • FREE DOORSTEP PICKUP',
    hindi: 'हरियाणा एवं सोनीपत • मुफ़्त डोरस्टेप पिकअप',
    hinglish: 'HARYANA & SONIPAT • FREE GHAR SE PICKUP',
  },
  hero_title_main: {
    english: 'Sell Scrap Online with Free Doorstep Pickup',
    hindi: 'घर बैठे कबाड़ बेचें - मुफ़्त पिकअप और तुरंत पैसे',
    hinglish: 'Ghar Baithe Kabad Becho - Free Pickup & Turant Cash',
  },
  hero_subtitle: {
    english: 'Best mandi rates in Haryana. Certified digital scale, verified kabadiwala, and instant Cash or UPI transfer at your doorstep.',
    hindi: 'हरियाणा में सबसे बेहतरीन मंडी रेट। प्रमाणित डिजिटल कांटा, सत्यापित कबाड़ीवाला और घर पर तुरंत नकद/UPI भुगतान।',
    hinglish: 'Haryana me sabse best scrap rates. Verified digital weighing scale aur turant Cash ya UPI payment ghar par.',
  },
  pill_best_rates: {
    english: 'Best Mandi Rates',
    hindi: 'सर्वोत्तम मंडी रेट',
    hinglish: 'Sabse Best Mandi Rates',
  },
  pill_free_pickup: {
    english: '100% Free Pickup',
    hindi: '100% मुफ़्त पिकअप',
    hinglish: '100% Free Doorstep Pickup',
  },
  pill_instant_payment: {
    english: 'Instant Payment',
    hindi: 'तुरंत भुगतान',
    hinglish: 'Turant Payment',
  },
  hero_cta_book: {
    english: 'Book Free Pickup',
    hindi: 'मुफ़्त पिकअप बुक करें',
    hinglish: 'Free Pickup Book Karein',
  },
  hero_cta_rates: {
    english: "Today's Scrap Rates",
    hindi: 'आज के कबाड़ रेट देखें',
    hinglish: 'Aaj Ke Scrap Rate Dekho',
  },
  hero_whatsapp_btn: {
    english: 'Order via WhatsApp',
    hindi: 'व्हाट्सएप पर ऑर्डर करें',
    hinglish: 'WhatsApp Par Order Karein',
  },

  // Service Area Banner
  service_serving_title: {
    english: 'Serving All Across Haryana & Sonipat',
    hindi: 'हरियाणा एवं सोनीपत भर में सेवारत',
    hinglish: 'Serving All Across Haryana & Sonipat',
  },
  service_serving_sub: {
    english: 'Free doorstep scrap pickup across Sonipat city & all surrounding sectors with verified drivers.',
    hindi: 'सोनीपत शहर एवं आसपास के सभी सेक्टर्स में सत्यापित ड्राइवरों के साथ घर से मुफ़्त कबाड़ पिकअप।',
    hinglish: 'Sonipat city aur aaspas ke sabhi sectors me verified drivers ke sath free scrap pickup.',
  },

  // Active Orders Section
  active_orders_title: {
    english: 'Active Pickup In Progress',
    hindi: 'सक्रिय कबाड़ पिकअप प्रगति पर है',
    hinglish: 'Active Scrap Pickup In Progress',
  },
  active_orders_sub: {
    english: 'Track live driver arrival, scale weighing & OTP verification',
    hindi: 'ड्राइवर का आगमन, कांटे से तौल और ओटीपी सत्यापन लाइव देखें',
    hinglish: 'Driver arrival, digital weighing aur OTP verification live dekho',
  },
  booking_no: {
    english: 'Booking #',
    hindi: 'बुकिंग #',
    hinglish: 'Booking #',
  },
  pickup_driver: {
    english: 'Driver:',
    hindi: 'ड्राइवर:',
    hinglish: 'Driver:',
  },
  track_live_btn: {
    english: 'Track Driver Live',
    hindi: 'ड्राइवर लाइव ट्रैक करें',
    hinglish: 'Driver Live Track Karein',
  },
  report_problem_btn: {
    english: '⚠️ Problem / Complaint?',
    hindi: '⚠️ कोई समस्या / शिकायत?',
    hinglish: '⚠️ Problem / Complaint?',
  },

  // Mandi Rates Section
  rates_badge: {
    english: 'Transparent Pricing',
    hindi: 'पारदर्शी रेट',
    hinglish: 'Transparent Mandi Rates',
  },
  live_rates_title: {
    english: 'Live Scrap Rates Today',
    hindi: 'आज के लाइव कबाड़ मंडी रेट',
    hinglish: 'Aaj Ke Live Scrap Rates',
  },
  live_rates_sub: {
    english: 'Rates updated daily according to certified mandi recycling indices. No deductions for moisture or dirt!',
    hindi: 'प्रमाणित रीसाइक्लिंग मंडी के अनुसार रोज़ाना अपडेटेड रेट। नमी या गंदगी के नाम पर कोई मनमानी कटौती नहीं!',
    hinglish: 'Daily updated certified mandi scrap rates. Moisture ya kachre ke naam par zero deduction!',
  },
  search_placeholder: {
    english: 'Search scrap items (e.g. iron, copper, newspaper, split ac)...',
    hindi: 'सामान खोजें (जैसे लोहा, तांबा, अखबार, एसी)...',
    hinglish: 'Item search karein (jaise loha, copper, akhbar, ac)...',
  },
  tab_all: {
    english: 'All Items',
    hindi: 'सभी सामान',
    hinglish: 'All Items',
  },
  tab_metal: {
    english: 'Metals (Iron/Copper/Brass)',
    hindi: 'धातु (लोहा/तांबा/पीतल)',
    hinglish: 'Metals (Loha/Copper/Brass)',
  },
  tab_paper: {
    english: 'Paper & Cardboard',
    hindi: 'कागज़ एवं गत्ता (रद्दी)',
    hinglish: 'Paper & Gatta (Raddi)',
  },
  tab_plastic: {
    english: 'Plastics & PET',
    hindi: 'प्लास्टिक एवं बोतलें',
    hinglish: 'Plastic & Bottles',
  },
  tab_ewaste: {
    english: 'E-Waste & Mobiles',
    hindi: 'ई-कचरा व पुराने मोबाइल',
    hinglish: 'E-Waste & Old Phones',
  },
  tab_appliance: {
    english: 'AC & Old Appliances',
    hindi: 'एसी एवं पुराने घरेलू उपकरण',
    hinglish: 'AC & Old Appliances',
  },
  current_rate: {
    english: 'Current Rate',
    hindi: 'वर्तमान रेट',
    hinglish: 'Current Rate',
  },
  min_order: {
    english: 'Min:',
    hindi: 'न्यूनतम:',
    hinglish: 'Min:',
  },
  sell_this: {
    english: 'Sell',
    hindi: 'बेचें',
    hinglish: 'Bechein',
  },

  // Interactive Value Calculator
  calc_badge: {
    english: 'Instant Calculator',
    hindi: 'त्वरित कैलकुलेटर',
    hinglish: 'Instant Calculator',
  },
  calc_title: {
    english: 'How Much Cash Will You Get for Your Scrap?',
    hindi: 'आपको अपने कबाड़ के कितने पैसे मिलेंगे?',
    hinglish: 'Aapko Apne Kabad Ke Kitne Paise Milenge?',
  },
  calc_sub: {
    english: 'Estimate your doorstep scrap payout before scheduling. Our staff weighs everything transparently in front of your eyes on calibrated electronic scales.',
    hindi: 'पिकअप शेड्यूल करने से पहले अपने कबाड़ की अनुमानित राशि जांचें। हमारा स्टाफ आपकी आंखों के सामने प्रमाणित डिजिटल कांटे पर तौलता है।',
    hinglish: 'Pickup schedule karne se pehle apna scrap payout estimate karein. Hamara staff aapke samne certified digital kaante par tolega.',
  },
  calc_est_label: {
    english: 'Estimated Instant Payout to You:',
    hindi: 'आपको मिलने वाला अनुमानित भुगतान:',
    hinglish: 'Aapko Milne Wala Estimated Payout:',
  },
  calc_payout_note: {
    english: 'Paid immediately via UPI / Cash upon collection.',
    hindi: 'पिकअप के समय तुरंत UPI या नकद द्वारा भुगतान।',
    hinglish: 'Pickup ke time turant UPI ya Cash payment.',
  },
  calc_book_btn: {
    english: 'Book Pickup for this Scrap',
    hindi: 'इस कबाड़ का पिकअप बुक करें',
    hinglish: 'Is Kabad Ka Pickup Book Karein',
  },
  calc_adjust_label: {
    english: 'Adjust Scrap Quantities:',
    hindi: 'कबाड़ की मात्रा (किलो) सेट करें:',
    hinglish: 'Scrap Quantity (kg) adjust karein:',
  },

  // How ScrapGo Works (4 Steps)
  how_badge: {
    english: 'Simple 4-Step Process',
    hindi: 'आसान 4-चरणीय प्रक्रिया',
    hinglish: 'Aasan 4 Steps Process',
  },
  how_title: {
    english: 'How Doorstep Scrap Pickup Works',
    hindi: 'डोरस्टेप कबाड़ पिकअप कैसे काम करता है',
    hinglish: 'Doorstep Scrap Pickup Kaise Kaam Karta Hai',
  },
  how_sub: {
    english: 'Zero hassle. Verified drivers. Real-time GPS and guaranteed honest weighing.',
    hindi: 'बिना किसी परेशानी के। सत्यापित ड्राइवर, लाइव जीपीएस और 100% ईमानदार डिजिटल तौल।',
    hinglish: 'Bina kisi jhanjhat ke. Verified drivers, live GPS aur 100% honest digital weighing.',
  },
  step_1_title: {
    english: '1. Schedule Online',
    hindi: '1. ऑनलाइन बुक करें',
    hinglish: '1. Online Schedule Karein',
  },
  step_1_desc: {
    english: 'Select your scrap items, enter address and pick a convenient date & time slot.',
    hindi: 'कबाड़ का सामान चुनें, अपना पता दर्ज करें और अपनी सुविधा अनुसार तारीख व समय चुनें।',
    hinglish: 'Apna kabad item chunein, address daalein aur convenient date-time slot chunein.',
  },
  step_2_title: {
    english: '2. Driver Arrives with OTP',
    hindi: '2. ड्राइवर पहुंचेगा (ओटीपी सुरक्षा)',
    hinglish: '2. Driver Arrives with OTP',
  },
  step_2_desc: {
    english: 'Track your driver via live GPS. Share your secret 4-digit OTP to authenticate arrival.',
    hindi: 'लाइव जीपीएस से ड्राइवर ट्रैक करें। आने पर सुरक्षित 4-अंकीय ओटीपी शेयर करके तौल शुरू कराएं।',
    hinglish: 'Live GPS se driver track karein. Secret 4-digit OTP share karke arrival confirm karein.',
  },
  step_3_title: {
    english: '3. Certified Digital Scale',
    hindi: '3. प्रमाणित डिजिटल कांटा',
    hinglish: '3. Certified Digital Kaanta',
  },
  step_3_desc: {
    english: 'Driver weighs all scrap items in front of you. Exact bill calculated instantly on the app.',
    hindi: 'ड्राइवर आपकी आंखों के सामने पारदर्शी तौल करेगा। ऐप पर तुरंत बिल बन जाता है।',
    hinglish: 'Driver aapke samne sabhi scrap items tolega. App me turant bill calculate ho jata hai.',
  },
  step_4_title: {
    english: '4. Instant Payout Received',
    hindi: '4. तुरंत हाथो-हाथ पैसे पाएं',
    hinglish: '4. Turant Hatho-Hath Payout',
  },
  step_4_desc: {
    english: 'Receive full payment immediately via Instant UPI, Cash, or Direct Bank Transfer!',
    hindi: 'तुरंत UPI, नकद या बैंक खाते में पूरा भुगतान तुरंत प्राप्त करें!',
    hinglish: 'Turant UPI (GPay/PhonePe/Paytm), Cash ya Bank Transfer se poora payment paayein!',
  },

  // Bottom Nav
  nav_home: {
    english: 'Home',
    hindi: 'होम',
    hinglish: 'Home',
  },
  nav_rates: {
    english: 'Rates',
    hindi: 'रेट',
    hinglish: 'Rates',
  },
  nav_book: {
    english: 'Book',
    hindi: 'बुक करें',
    hinglish: 'Book',
  },
  nav_chat: {
    english: 'Chat',
    hindi: 'चैट',
    hinglish: 'Help',
  },
  nav_account: {
    english: 'Account',
    hindi: 'खाता',
    hinglish: 'Account',
  },

  // Booking Modal
  book_modal_title: {
    english: 'Schedule Free Doorstep Pickup',
    hindi: 'मुफ़्त डोरस्टेप पिकअप शेड्यूल करें',
    hinglish: 'Free Doorstep Pickup Schedule Karein',
  },
  book_modal_sub: {
    english: 'Zero pickup fee • Certified electronic scale • Instant payout',
    hindi: 'शून्य पिकअप शुल्क • प्रमाणित इलेक्ट्रॉनिक कांटा • तुरंत भुगतान',
    hinglish: 'Zero pickup fee • Certified digital scale • Turant payout',
  },
  book_step_1_tab: {
    english: '1. Scrap & Address',
    hindi: '1. कबाड़ एवं पता',
    hinglish: '1. Scrap & Address',
  },
  book_step_2_tab: {
    english: '2. Payout Details',
    hindi: '2. भुगतान विवरण',
    hinglish: '2. Payout Details',
  },
  select_scrap_items: {
    english: 'Select Scrap Materials to Sell:',
    hindi: 'बेचने के लिए कबाड़ सामान चुनें:',
    hinglish: 'Bechne ke liye scrap items chunein:',
  },
  expected_items_label: {
    english: 'Scrap description / items list:',
    hindi: 'सामान का विवरण / सूची:',
    hinglish: 'Scrap description / items list:',
  },
  approx_weight: {
    english: 'Approx Total Weight (kg):',
    hindi: 'अनुमानित कुल वज़न (किलो):',
    hinglish: 'Andazan Total Wazan (kg):',
  },
  pickup_address_label: {
    english: 'Pickup Address:',
    hindi: 'पिकअप का पता:',
    hinglish: 'Pickup Address:',
  },
  address_placeholder: {
    english: 'House/Flat No, Street, Colony, Sonipat, Haryana...',
    hindi: 'मकान/फ्लैट नं, गली, कॉलोनी, सोनीपत, हरियाणा...',
    hinglish: 'Makan/Flat No, Gali, Colony, Sonipat, Haryana...',
  },
  use_current_location: {
    english: '📍 Use Current GPS Location',
    hindi: '📍 वर्तमान जीपीएस लोकेशन भरें',
    hinglish: '📍 Current GPS Location use karein',
  },
  landmark_label: {
    english: 'Nearby Landmark (Optional):',
    hindi: 'नजदीकी लैंडमार्क (वैकल्पिक):',
    hinglish: 'Nearby Landmark (Optional):',
  },
  date_label: {
    english: 'Pickup Date:',
    hindi: 'पिकअप की तारीख:',
    hinglish: 'Pickup Date:',
  },
  time_slot_label: {
    english: 'Time Slot:',
    hindi: 'समय स्लॉट:',
    hinglish: 'Time Slot:',
  },
  customer_name_label: {
    english: 'Your Name:',
    hindi: 'आपका नाम:',
    hinglish: 'Aapka Naam:',
  },
  customer_phone_label: {
    english: 'Phone Number (for OTP):',
    hindi: 'मोबाइल नंबर (ओटीपी के लिए):',
    hinglish: 'Phone Number (OTP ke liye):',
  },
  next_step_btn: {
    english: 'Next: Payout Details →',
    hindi: 'अगला: भुगतान विवरण →',
    hinglish: 'Next: Payout Details →',
  },
  back_step_btn: {
    english: '← Back',
    hindi: '← वापस',
    hinglish: '← Wapas',
  },
  payout_method_label: {
    english: 'How do you want to receive payment?',
    hindi: 'आप भुगतान किस माध्यम से लेना चाहते हैं?',
    hinglish: 'Aap payment kaise lena chahte hain?',
  },
  payout_upi: {
    english: 'Instant UPI (Google Pay, PhonePe, Paytm)',
    hindi: 'तुरंत UPI (Google Pay, PhonePe, Paytm)',
    hinglish: 'Instant UPI (Google Pay, PhonePe, Paytm)',
  },
  payout_cash: {
    english: 'Cash in Hand (Doorstep)',
    hindi: 'हाथ में नकद (डोरस्टेप)',
    hinglish: 'Doorstep Cash in Hand',
  },
  payout_bank: {
    english: 'Direct Bank NEFT/IMPS',
    hindi: 'सीधे बैंक खाते में ट्रांसफर',
    hinglish: 'Direct Bank Transfer',
  },
  upi_id_label: {
    english: 'Your UPI ID (VPA):',
    hindi: 'आपकी UPI आईडी (VPA):',
    hinglish: 'Aapki UPI ID (VPA):',
  },
  bank_acc_label: {
    english: 'Bank Account Number:',
    hindi: 'बैंक खाता संख्या:',
    hinglish: 'Bank Account Number:',
  },
  ifsc_label: {
    english: 'IFSC Code:',
    hindi: 'आईएफएससी (IFSC) कोड:',
    hinglish: 'IFSC Code:',
  },
  acc_holder_label: {
    english: 'Account Holder Name:',
    hindi: 'खाताधारक का नाम:',
    hinglish: 'Account Holder Name:',
  },
  confirm_booking_btn: {
    english: 'Confirm & Schedule Pickup',
    hindi: 'पिकअप कन्फर्म और बुक करें',
    hinglish: 'Confirm & Schedule Pickup',
  },
  booking_success_title: {
    english: 'Pickup Scheduled Successfully! 🎉',
    hindi: 'पिकअप सफलतापूर्वक बुक हो गया! 🎉',
    hinglish: 'Pickup Successfully Book Ho Gaya! 🎉',
  },
  booking_success_sub: {
    english: 'Our verified driver will arrive with certified scale on the chosen date and slot.',
    hindi: 'हमारा सत्यापित एजेंट आपके चुने हुए स्लॉट पर प्रमाणित डिजिटल कांटे के साथ पहुंचेगा।',
    hinglish: 'Hamara verified agent chosen slot par certified digital scale ke sath pahuchega.',
  },
  pickup_otp_label: {
    english: 'Your Secret Pickup OTP:',
    hindi: 'आपका गोपनीय पिकअप ओटीपी:',
    hinglish: 'Aapka Secret Pickup OTP:',
  },
  pickup_otp_note: {
    english: 'Share this 4-digit code with driver ONLY after scrap weighing is done.',
    hindi: 'यह 4-अंकों का कोड ड्राइवर को केवल कबाड़ तौल पूरा होने के बाद ही दें।',
    hinglish: 'Ye 4-digit OTP driver ko scrap tole jaane ke baad hi share karein.',
  },
  share_whatsapp_btn: {
    english: 'Share Details on WhatsApp',
    hindi: 'व्हाट्सएप पर विवरण शेयर करें',
    hinglish: 'WhatsApp Par Details Share Karein',
  },
  done_btn: {
    english: 'Done & Return Home',
    hindi: 'पूर्ण एवं होम पर जाएं',
    hinglish: 'Done & Return Home',
  },

  // Live Tracking Modal
  tracking_title: {
    english: 'Live Doorstep Pickup Tracking',
    hindi: 'लाइव डोरस्टेप पिकअप ट्रैकिंग',
    hinglish: 'Live Doorstep Pickup Tracking',
  },
  assigned_agent: {
    english: 'Assigned ScrapGo Agent',
    hindi: 'नियुक्त स्क्रैपगो एजेंट',
    hinglish: 'Assigned ScrapGo Agent',
  },
  verified_driver: {
    english: 'Verified Driver',
    hindi: 'सत्यापित ड्राइवर',
    hinglish: 'Verified Driver',
  },
  vehicle_info: {
    english: 'Vehicle:',
    hindi: 'वाहन:',
    hinglish: 'Gaadi:',
  },
  driver_phone: {
    english: 'Call Driver:',
    hindi: 'ड्राइवर को कॉल करें:',
    hinglish: 'Driver ko Call Karein:',
  },
  otp_box_title: {
    english: 'Customer Verification OTP',
    hindi: 'ग्राहक सत्यापन ओटीपी',
    hinglish: 'Customer Verification OTP',
  },
  otp_box_desc: {
    english: 'Share this 4-digit OTP with your driver only after scrap weighing inspection.',
    hindi: 'यह 4-अंकों का ओटीपी ड्राइवर को केवल कबाड़ तौल पूरा होने के बाद ही बताएं।',
    hinglish: 'Ye 4-digit OTP driver ko weighing poori hone ke baad hi share karein.',
  },
  status_pending: {
    english: 'Pickup Requested (Allocating Agent)',
    hindi: 'पिकअप अनुरोध प्राप्त (एजेंट आवंटित हो रहा है)',
    hinglish: 'Pickup Requested (Allocating Agent)',
  },
  status_assigned: {
    english: 'Driver Assigned & Scheduled',
    hindi: 'ड्राइवर निर्धारित कर दिया गया है',
    hinglish: 'Driver Assigned & Scheduled',
  },
  status_on_the_way: {
    english: 'Driver is ON THE WAY',
    hindi: 'ड्राइवर रास्ते में है',
    hinglish: 'Driver Raste Me Hai (On The Way)',
  },
  status_arrived: {
    english: 'Driver has ARRIVED at Doorstep',
    hindi: 'ड्राइवर आपके पते पर पहुंच गया है',
    hinglish: 'Driver Ghar Par Pahunch Gaya Hai',
  },
  status_weighing: {
    english: 'Digital Weighing in Progress',
    hindi: 'डिजिटल तौल जारी है',
    hinglish: 'Digital Weighing Chal Rahi Hai',
  },
  status_completed: {
    english: 'Pickup Completed & Paid',
    hindi: 'पिकअप पूर्ण एवं भुगतान संपन्न',
    hinglish: 'Pickup Completed & Paid',
  },
  status_cancelled: {
    english: 'Pickup Cancelled',
    hindi: 'पिकअप रद्द',
    hinglish: 'Pickup Cancelled',
  },

  // Support & Complaints Drawer
  support_title: {
    english: 'ScrapBot AI Support & Help',
    hindi: 'स्क्रैपबॉट सहायक एवं शिकायत निवारण',
    hinglish: 'ScrapBot AI Support & Help',
  },
  chat_tab: {
    english: 'AI Chat Assistant',
    hindi: 'एआई चैट सहायक',
    hinglish: 'AI Chat Assistant',
  },
  complaint_tab: {
    english: 'File Complaint',
    hindi: 'शिकायत दर्ज करें',
    hinglish: 'Complaint Register Karein',
  },
  ticket_history_tab: {
    english: 'Ticket History',
    hindi: 'टिकट इतिहास',
    hinglish: 'Ticket History',
  },
  type_message: {
    english: 'Type your message or ask about scrap rates...',
    hindi: 'अपना संदेश लिखें या कबाड़ रेट पूछें...',
    hinglish: 'Apna message likhein ya rate poochein...',
  },
  complaint_category_label: {
    english: 'Complaint Category:',
    hindi: 'शिकायत की श्रेणी:',
    hinglish: 'Complaint Category:',
  },
  complaint_subject_label: {
    english: 'Complaint Subject:',
    hindi: 'शिकायत का विषय:',
    hinglish: 'Complaint Subject:',
  },
  complaint_desc_label: {
    english: 'Detailed Issue Description:',
    hindi: 'समस्या का विस्तृत विवरण:',
    hinglish: 'Problem ki poori details:',
  },
  submit_complaint_btn: {
    english: 'Submit Official Grievance',
    hindi: 'शिकायत सबमिट करें',
    hinglish: 'Complaint Submit Karein',
  },

  // Auth Modal
  auth_title_customer: {
    english: 'Customer & Staff Login',
    hindi: 'ग्राहक एवं स्टाफ लॉगिन',
    hinglish: 'Customer & Staff Login',
  },
  auth_sub_customer: {
    english: 'Fast OTP verification via mobile number',
    hindi: 'मोबाइल नंबर से त्वरित ओटीपी सत्यापन',
    hinglish: 'Mobile number se fast OTP verification',
  },
  enter_mobile: {
    english: 'Enter 10-digit Mobile Number:',
    hindi: '10-अंकों का मोबाइल नंबर दर्ज करें:',
    hinglish: '10-digit Mobile Number daalein:',
  },
  send_otp_btn: {
    english: 'Send OTP Code',
    hindi: 'ओटीपी भेजें',
    hinglish: 'OTP Bhejo',
  },
  enter_otp: {
    english: 'Enter 6-digit OTP Code:',
    hindi: '6-अंकों का ओटीपी दर्ज करें:',
    hinglish: '6-digit OTP code daalein:',
  },
  verify_login_btn: {
    english: 'Verify & Sign In',
    hindi: 'सत्यापित करें और लॉगिन करें',
    hinglish: 'Verify & Login Karein',
  },
  resend_otp: {
    english: 'Resend OTP',
    hindi: 'ओटीपी पुनः भेजें',
    hinglish: 'OTP Dobara Bhejo',
  },
  quick_demo_login: {
    english: 'Or Quick Switch Demo User:',
    hindi: 'या डेमो यूजर तुरंत चुनें:',
    hinglish: 'Ya Demo User Switch Karein:',
  },

  // Footer
  footer_tagline: {
    english: "Haryana's #1 digital scrap collection platform with certified digital weighing and instant payouts.",
    hindi: 'हरियाणा का #1 डिजिटल कबाड़ संग्रह प्लेटफॉर्म - प्रमाणित डिजिटल तौल और तुरंत भुगतान के साथ।',
    hinglish: "Haryana ka #1 digital scrap pickup platform - certified digital weighing aur turant payout ke sath.",
  },
  footer_rights: {
    english: 'All rights reserved. Made for Haryana & Sonipat.',
    hindi: 'सर्वाधिकार सुरक्षित। हरियाणा एवं सोनीपत के लिए निर्मित।',
    hinglish: 'All rights reserved. Haryana & Sonipat ke liye banaya gaya.',
  },
};

// Material Categories Translations Map (by category ID)
export const CATEGORY_TRANSLATIONS: {
  [id: string]: {
    name: { english: string; hindi: string; hinglish: string };
    desc: { english: string; hindi: string; hinglish: string };
  };
} = {
  'cat-copper': {
    name: {
      english: 'Copper (तांबा)',
      hindi: 'तांबा (कॉपर)',
      hinglish: 'Copper (Tamba)',
    },
    desc: {
      english: 'Electrical wires, coils, copper pipes, utensils & motor cables.',
      hindi: 'बिजली के तार, कॉपर पाइप, बर्तन एवं मोटर की तांबे की वाइंडिंग।',
      hinglish: 'Bijli ke taar, copper pipes, bartan aur motor winding wires.',
    },
  },
  'cat-brass': {
    name: {
      english: 'Brass / Peetal (पीतल)',
      hindi: 'पीतल (ब्रास)',
      hinglish: 'Brass / Peetal',
    },
    desc: {
      english: 'Brass taps, pooja utensils, fittings, ornaments and machinery scrap.',
      hindi: 'पीतल के नल, पूजा के बर्तन, फिटिंग, सजावटी सामान एवं पुर्जे।',
      hinglish: 'Peetal ke nal, pooja ke bartan, fittings aur machinery scrap.',
    },
  },
  'cat-aluminium': {
    name: {
      english: 'Aluminium (एल्युमिनियम)',
      hindi: 'एल्युमिनियम',
      hinglish: 'Aluminium',
    },
    desc: {
      english: 'Window frames, cans, kitchen utensils, cables and auto scrap.',
      hindi: 'खिड़की की चौखट, केन, रसोई के बर्तन, केबल्स एवं ऑटो कबाड़।',
      hinglish: 'Khidki ke frames, bartan, cans aur automobile aluminium scrap.',
    },
  },
  'cat-iron': {
    name: {
      english: 'Iron / Loha (लोहा)',
      hindi: 'लोहा (आयरन)',
      hinglish: 'Iron / Loha',
    },
    desc: {
      english: 'TMT bars, grills, sheets, vehicle parts, heavy cast iron & pipes.',
      hindi: 'सरिया, लोहे की ग्रिल, चादरें, भारी ढलवा लोहा एवं लोहे के पाइप।',
      hinglish: 'Sariya, lohe ki grills, sheets, heavy cast iron aur pipes.',
    },
  },
  'cat-newspaper': {
    name: {
      english: 'Newspaper (अखबार / रद्दी)',
      hindi: 'अखबार (रद्दी कागज़)',
      hinglish: 'Akhbar (Newspaper Raddi)',
    },
    desc: {
      english: 'Daily Hindi/English newspapers, clean sheets and paper bundles.',
      hindi: 'दैनिक अखबार, रद्दी पेपर के बंडल एवं पुराने समाचार पत्र।',
      hinglish: 'Daily Hindi/English akhbar aur saaf newspaper bundles.',
    },
  },
  'cat-cardboard': {
    name: {
      english: 'Cardboard / Cartons (गत्ता)',
      hindi: 'गत्ता एवं कार्टन',
      hinglish: 'Gatta & Cartons',
    },
    desc: {
      english: 'Corrugated boxes, packaging cartons, delivery boxes, brown board.',
      hindi: 'पैकिंग के कार्टन, ब्राउन गत्ता, डिलीवरी बॉक्स एवं पैकिंग शीट।',
      hinglish: 'Packaging cartons, delivery boxes aur gatta bundles.',
    },
  },
  'cat-plastic': {
    name: {
      english: 'Hard Plastic (प्लास्टिक)',
      hindi: 'मजबूत प्लास्टिक (बाल्टी/कुर्सी)',
      hinglish: 'Hard Plastic (Balti/Kursi)',
    },
    desc: {
      english: 'Broken plastic chairs, buckets, mugs, crates, drums and pipes.',
      hindi: 'टूटी प्लास्टिक की कुर्सियां, बाल्टियां, टब, ड्रम एवं पीवीसी पाइप।',
      hinglish: 'Tooti plastic chairs, balti, tubs, drums aur plastic scrap.',
    },
  },
  'cat-bottles': {
    name: {
      english: 'PET Bottles (बोतलें)',
      hindi: 'पीईटी प्लास्टिक की बोतलें',
      hinglish: 'Plastic Bottles (PET)',
    },
    desc: {
      english: 'Cold drink bottles, water bottles, transparent packaging plastics.',
      hindi: 'कोल्ड ड्रिंक व पानी की प्लास्टिक की खाली बोतलें।',
      hinglish: 'Cold drink aur pani ki khali plastic bottles.',
    },
  },
  'cat-ewaste': {
    name: {
      english: 'E-Waste & Mobiles (ई-कचरा)',
      hindi: 'ई-कचरा व पुराने मोबाइल',
      hinglish: 'E-Waste & Old Mobiles',
    },
    desc: {
      english: 'Dead laptops, mobile phones, CPUs, computer circuit boards (PCB).',
      hindi: 'खराब लैपटॉप, मोबाइल, सीपीयू, कंप्यूटर मदरबोर्ड व सर्किट प्लेटें।',
      hinglish: 'Kharab laptop, purane mobile, CPU, computer motherboards aur circuit plates.',
    },
  },
  'cat-split-ac': {
    name: {
      english: 'Split AC 1.5 Ton (कॉपर कॉइल)',
      hindi: 'स्प्लिट एसी 1.5 टन (कॉपर)',
      hinglish: 'Split AC 1.5 Ton (Copper Coil)',
    },
    desc: {
      english: 'Indoor & outdoor units with intact copper coils and compressor.',
      hindi: 'इंडोर और आउटडोर यूनिट, कॉपर कॉइल एवं कंप्रेसर सहित।',
      hinglish: 'Indoor & outdoor units copper coil aur compressor ke sath.',
    },
  },
  'cat-window-ac': {
    name: {
      english: 'Window AC (विंडो एसी)',
      hindi: 'विंडो एसी (पुराना)',
      hinglish: 'Window AC (Purana)',
    },
    desc: {
      english: 'Complete window AC unit with copper condenser and motor.',
      hindi: 'पुराना विंडो एसी, कॉपर कंडेनसर एवं मोटर सहित।',
      hinglish: 'Poora window AC unit copper condenser aur motor ke sath.',
    },
  },
  'cat-fridge': {
    name: {
      english: 'Refrigerator / Fridge (फ्रिज)',
      hindi: 'फ्रिज (रेफ्रिजरेटर)',
      hinglish: 'Purana Fridge (Refrigerator)',
    },
    desc: {
      english: 'Single / double door refrigerators with compressor and motor.',
      hindi: 'सिंगल व डबल डोर खराब या पुराना फ्रिज कंप्रेसर सहित।',
      hinglish: 'Single ya double door purana fridge compressor ke sath.',
    },
  },
  'cat-washing-machine': {
    name: {
      english: 'Washing Machine (वाशिंग मशीन)',
      hindi: 'वाशिंग मशीन (कबाड़)',
      hinglish: 'Washing Machine Scrap',
    },
    desc: {
      english: 'Semi / fully automatic old scrap washing machine.',
      hindi: 'सेमी या फुल्ली ऑटोमैटिक पुरानी वाशिंग मशीन।',
      hinglish: 'Semi ya fully automatic purani washing machine.',
    },
  },
  'cat-lead-battery': {
    name: {
      english: 'Inverter Lead Battery (बैटरी)',
      hindi: 'इनवर्टर व गाड़ी की लेड बैटरी',
      hinglish: 'Inverter & Car Lead Battery',
    },
    desc: {
      english: 'Heavy vehicle and home inverter lead-acid batteries with plates.',
      hindi: 'घर के इनवर्टर व गाड़ियों की पुरानी लेड एसिड बैटरी।',
      hinglish: 'Ghar ke inverter aur gaadiyon ki purani lead battery.',
    },
  },
  'cat-steel': {
    name: {
      english: 'Stainless Steel (स्टील के बर्तन)',
      hindi: 'स्टेनलेस स्टील (बर्तन व फिटिंग)',
      hinglish: 'Stainless Steel (Bartan)',
    },
    desc: {
      english: 'Steel kitchen utensils, sinks, pipes, railings and industrial sheets.',
      hindi: 'रसोई के स्टील के बर्तन, सिंक, पाइप एवं स्टील की रेलिंग।',
      hinglish: 'Steel ke kitchen bartan, sink, pipes aur railing scrap.',
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
    if (lang === 'hinglish' && custom.name.hinglish) return custom.name.hinglish;
    if (lang === 'english' && custom.name.english) return custom.name.english;
  }
  return cat.name;
};

// Helper function to get translated category description
export const getCategoryDesc = (cat: { id: string; description: string }, lang: Language): string => {
  const custom = CATEGORY_TRANSLATIONS[cat.id];
  if (custom && custom.desc) {
    if (lang === 'hindi' && custom.desc.hindi) return custom.desc.hindi;
    if (lang === 'hinglish' && custom.desc.hinglish) return custom.desc.hinglish;
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
