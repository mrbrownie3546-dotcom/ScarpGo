import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { checkRateLimit, recordAction, resetRateLimit, getLoginSecurityState, recordFailedPasswordAttempt, recordSuccessfulLogin } from '../lib/rateLimiter';
import { hashPassword as secureHashPassword, verifyPassword, verifyMasterPassword } from '../lib/authCrypto';
import { phoneHashForBooking } from '../lib/trackingPhone';
import { auth as firebaseAuth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, collection, addDoc, getDocs } from 'firebase/firestore';
import { createAuthUserWithoutSignOut } from '../lib/firebaseProvisioning';
import {
  Booking,
  BookingStatus,
  PayoutMethod,
  PayoutRecord,
  PayoutStatus,
  ScrapCategory,
  ScrapItemWeight,
  ServiceArea,
  SupportTicket,
  UserProfile,
  UserRole,
  AppNotification,
  AdminRole,
  AdminUser,
  StaffMember,
  GranularPermission,
  AccountStatus,
  RoleLevel,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalActionType,
  AuditLog,
  SystemSettings,
  WebsiteContentItem,
  ScrapItemMaterial,
} from '../types/scrapgo';
import {
  INITIAL_BOOKINGS,
  INITIAL_CATEGORIES,
  INITIAL_SERVICE_AREAS,
  INITIAL_TICKETS,
  SAMPLE_STAFF,
  INITIAL_ADMIN_USERS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_SCRAP_ITEMS,
  INITIAL_WEBSITE_CONTENT,
} from '../data/initialData';
import {
  Language,
  getTranslation,
  getCategoryName,
  getCategoryDesc,
  getStatusLabel,
  getPayoutMethodLabel,
} from '../i18n/translations';

interface ScrapContextType {
  // Navigation & Portal
  activePortal: 'customer' | 'staff' | 'admin';
  setActivePortal: (portal: 'customer' | 'staff' | 'admin') => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Language & Internationalization (English / Hindi / Hinglish)
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  getCategoryName: (cat: { id: string; name: string }) => string;
  getCategoryDesc: (cat: { id: string; description: string }) => string;
  getStatusLabel: (status: string) => string;
  getPayoutMethodLabel: (method: string) => string;

  // Current logged in user (switches depending on portal or manual switch)
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  staffList: UserProfile[];
  selectedStaffAgent: UserProfile;
  setSelectedStaffAgent: (staff: UserProfile) => void;

  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  staffLogin: (loginIdOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  firebaseRole: 'admin' | 'staff' | null;
  refreshSharedData: () => Promise<void>;
  requestLoginReset: (email: string) => Promise<{ success: boolean; message: string }>;

  // Categories & Rates
  categories: ScrapCategory[];
  addCategory: (cat: Omit<ScrapCategory, 'id'>) => void;
  updateCategoryRate: (id: string, newRate: number) => void;
  updateCategoryDetails: (id: string, updates: Partial<Omit<ScrapCategory, 'id'>>) => { success: boolean; message: string };
  toggleCategoryStatus: (id: string) => void;
  deleteCategory: (id: string) => { success: boolean; message: string };
  deleteScrapItem: (itemId: string) => { success: boolean; message: string };

  // Service Areas
  serviceAreas: ServiceArea[];
  addServiceArea: (area: Omit<ServiceArea, 'id'>) => void;
  toggleServiceArea: (id: string) => void;

  // Bookings
  bookings: Booking[];
  createBooking: (bookingData: {
    customer_name: string;
    customer_phone: string;
    pickup_address: string;
    pickup_landmark?: string;
    latitude?: number;
    longitude?: number;
    preferred_date: string;
    preferred_time_slot: string;
    category_ids: string[];
    expected_scrap_items: string;
    estimated_weight_kg?: number;
    notify_whatsapp?: boolean;
    payout_method: PayoutMethod;
    upi_id?: string;
    upi_qr_url?: string;
    bank_details?: {
      account_number: string;
      ifsc_code: string;
      account_holder: string;
    };
  }) => Booking;

  // Staff workflow actions
  assignStaffToBooking: (bookingId: string, staffId: string) => void;
  staffAcceptBooking: (bookingId: string) => void;
  staffStartJourney: (bookingId: string) => void;
  staffMarkArrived: (bookingId: string) => void;
  staffCancelBooking: (bookingId: string, reason?: string) => void;
  cancelBookingCustomer: (bookingId: string, reason?: string) => { success: boolean; message: string };
  staffVerifyOtp: (bookingId: string, enteredOtp: string) => { success: boolean; message: string };
  staffCompleteWeighing: (
    bookingId: string,
    items: ScrapItemWeight[],
    finalWeight: number,
    finalAmount: number,
    scalePhotoUrl?: string,
    notes?: string
  ) => void;
  submitPickupRating: (
    bookingId: string,
    rating: number,
    reviewComment: string
  ) => { success: boolean; message: string };

  // Payout actions (Admin)
  payouts: PayoutRecord[];
  approvePayout: (payoutId: string, transactionRef?: string) => void;
  rejectPayout: (payoutId: string, reason: string) => void;

  // Support & AI Bot
  tickets: SupportTicket[];
  createTicket: (
    subject: string,
    description: string,
    bookingNumber?: string,
    options?: {
      ticketType?: 'inquiry' | 'complaint';
      complaintCategory?:
        | 'driver_delayed'
        | 'payment_issue'
        | 'weight_scale_issue'
        | 'staff_behavior'
        | 'cancellation'
        | 'other';
      priority?: 'low' | 'medium' | 'high';
    }
  ) => SupportTicket;
  aiBotLookupBooking: (bookingNumber: string) => Booking | undefined;
  replyToTicket: (ticketId: string, replyText: string) => void;
  closeTicket: (ticketId: string) => void;
  reopenTicket: (ticketId: string) => void;
  syncTicketReplyFromMirror: (
    ticketNumber: string,
    mirror: { status?: string; admin_reply?: string; updated_at?: string }
  ) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Firebase & Database state
  firebaseConnected: boolean;
  refreshFirebaseStatus: () => void;
  resetToSampleData: () => void;

  // Global overlay tracking (modals / drawers)
  isOverlayActive: boolean;
  setOverlayActive: (active: boolean) => void;

  // Admin Role Hierarchy & Boundaries
  currentAdmin: AdminUser;
  setCurrentAdmin: (admin: AdminUser) => void;
  adminList: AdminUser[];
  staffMembers: StaffMember[];
  createAdminAccount: (data: {
    name: string;
    email: string;
    phone?: string;
    custom_title: string;
    description?: string;
    permissions: GranularPermission[];
    can_create_staff: boolean;
    can_create_admin: boolean;
    status?: AccountStatus;
    initial_password?: string;
    force_password_reset?: boolean;
  }) => Promise<{ success: boolean; message: string; admin?: AdminUser }>;
  updateAdminAccount: (
    adminId: string,
    updates: {
      name?: string;
      custom_title?: string;
      description?: string;
      permissions?: GranularPermission[];
      can_create_staff?: boolean;
      can_create_admin?: boolean;
      status?: AccountStatus;
    },
    reason?: string
  ) => { success: boolean; message: string };
  createStaffMember: (data: {
    name: string;
    email: string;
    phone?: string;
    staff_title: string;
    description?: string;
    permissions: GranularPermission[];
    status?: AccountStatus;
    vehicle_number?: string;
    vehicle_type?: string;
    initial_password?: string;
  }) => Promise<{ success: boolean; message: string; staff?: StaffMember }>;
  updateStaffMember: (
    staffId: string,
    updates: {
      name?: string;
      staff_title?: string;
      description?: string;
      permissions?: GranularPermission[];
      status?: AccountStatus;
      vehicle_number?: string;
      vehicle_type?: string;
      managed_by?: string;
      managed_by_name?: string;
    },
    reason?: string
  ) => { success: boolean; message: string };
  resetAdminPassword: (adminId: string) => { success: boolean; message: string; tempPass?: string };
  resetStaffPassword: (staffId: string) => { success: boolean; message: string; tempPass?: string };
  hasPermission: (permission: GranularPermission) => boolean;
  canCreateStaff: boolean;
  canCreateAdmin: boolean;
  updateAdminRole: (
    targetAdminId: string,
    newRole: AdminRole,
    reason: string
  ) => { success: boolean; message: string; requiresApproval?: boolean };
  toggleAdminStatus: (targetAdminId: string, reason: string) => { success: boolean; message: string };
  canPerform: (action: string, module: string) => { allowed: boolean; reason?: string };

  // Dual Approval System (Approval Center)
  approvalRequests: ApprovalRequest[];
  createApprovalRequest: (
    req: Omit<ApprovalRequest, 'id' | 'created_at' | 'status'>
  ) => ApprovalRequest;
  approveRequest: (requestId: string) => { success: boolean; message: string };
  rejectRequest: (requestId: string, reason: string) => { success: boolean; message: string };

  // Immutable Security & Operational Audit Logs
  auditLogs: AuditLog[];
  logAuditEvent: (event: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // System Settings & Maintenance Mode
  systemSettings: SystemSettings;
  updateSystemSettings: (
    settings: Partial<SystemSettings>,
    reason?: string
  ) => { success: boolean; message: string };

  // Website Content Management
  websiteContent: WebsiteContentItem[];
  updateWebsiteContent: (id: string, updates: Partial<WebsiteContentItem>) => void;

  // Scrap Items / Materials Management
  scrapItems: ScrapItemMaterial[];
  addScrapItem: (item: Omit<ScrapItemMaterial, 'id' | 'updated_at'>) => void;
  updateScrapItemRate: (
    itemId: string,
    newRate: number,
    reason: string
  ) => { success: boolean; message: string; requiresApproval?: boolean };
  toggleScrapItemStatus: (itemId: string) => void;

  // User Management & Block/Unblock
  allUsers: UserProfile[];
  toggleUserBlock: (userId: string, reason: string) => { success: boolean; message: string };

  // Extended Payout Operations & Paid Record Protection
  updatePayoutAmount: (
    payoutId: string,
    newAmount: number,
    reason: string
  ) => { success: boolean; message: string; requiresApproval?: boolean };
  updatePayoutStatusRecord: (
    payoutId: string,
    status: PayoutStatus,
    reference?: string,
    reason?: string
  ) => { success: boolean; message: string; requiresApproval?: boolean };
  updateBookingOperationalStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    reason?: string
  ) => { success: boolean; message: string };
}

const ScrapContext = createContext<ScrapContextType | undefined>(undefined);

const CURRENT_CUSTOMER_USER: UserProfile = {
  id: 'cust-guest',
  phone: '',
  full_name: 'Guest Customer',
  email: '',
  role: 'customer',
  avatar_url: '',
  created_at: new Date().toISOString(),
};

const STORAGE_KEYS = {
  PORTAL: 'scrapgo_active_portal',
  AUTH_USER: 'scrapgo_auth_user_v2',
  CATEGORIES: 'scrapgo_categories_v2',
  AREAS: 'scrapgo_service_areas_v3',
  BOOKINGS: 'scrapgo_bookings_v2',
  PAYOUTS: 'scrapgo_payouts_v2',
  TICKETS: 'scrapgo_tickets_v2',
  NOTIFICATIONS: 'scrapgo_notifications_v2',
  LANGUAGE: 'scrapgo_language_pref',
};

export const ScrapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('scrapgo_language_pref');
        if (saved === 'hindi' || saved === 'hinglish') return 'hindi';
        if (saved === 'english') return 'english';
      } catch (e) {
        // fallback
      }
    }
    return 'english';
  });

  const [theme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    // Dark mode disabled - site hamesha light mode me rahegi
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      } catch (e) {
        // ignore
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'hindi' ? 'hi' : 'en';
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'hindi' ? 'hi' : 'en';
    }
  }, [language]);
  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, language, fallback);
  };

  const getCategoryNameHelper = (cat: { id: string; name: string }): string => {
    return getCategoryName(cat, language);
  };

  const getCategoryDescHelper = (cat: { id: string; description: string }): string => {
    return getCategoryDesc(cat, language);
  };

  const getStatusLabelHelper = (status: string): string => {
    return getStatusLabel(status, language);
  };

  const getPayoutMethodLabelHelper = (method: string): string => {
    return getPayoutMethodLabel(method, language);
  };
  const [activePortal, setActivePortalState] = useState<'customer' | 'staff' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check URL query param e.g. ?portal=admin or ?portal=staff
      const params = new URLSearchParams(window.location.search);
      const queryPortal = params.get('portal');
      if (queryPortal === 'admin' || queryPortal === 'staff' || queryPortal === 'customer') {
        return queryPortal;
      }

      // 2. Check subdomain e.g. admin.scraphouse.in or staff.scraphouse.in
      const host = window.location.hostname.toLowerCase();
      if (host.startsWith('admin.')) return 'admin';
      if (host.startsWith('staff.')) return 'staff';
    }

    // 3. Fallback to saved selection in localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.PORTAL);
    return (saved as any) || 'customer';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.full_name && parsed.full_name.includes('Dilshad')) {
          parsed.full_name = 'Vikram Rathore';
        }
        return parsed;
      } catch (e) {
        /* fallback */
      }
    }
    return CURRENT_CUSTOMER_USER;
  });
  const [staffList] = useState<UserProfile[]>(SAMPLE_STAFF);
  const [selectedStaffAgent, setSelectedStaffAgent] = useState<UserProfile>(SAMPLE_STAFF[0]);

  const [isOverlayActive, setOverlayActive] = useState(false);
  // Firebase Auth session ka role (admin/staff) - cross-device sync isi se chalta hai
  const [firebaseRole, setFirebaseRole] = useState<'admin' | 'staff' | null>(null);

  // Categories
  const [categories, setCategories] = useState<ScrapCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_CATEGORIES;
  });

  // Service Areas
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AREAS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SERVICE_AREAS;
  });

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_BOOKINGS;
  });

  // Public tracking mirror: booking ki sirf SAFE fields (status, payout - koi
  // address/OTP/UPI nahi) public 'tracking' collection me mirror hoti hain,
  // taaki guest customer bina login ke Booking ID + phone se status dekh sake.
  // Phone plain KABHI nahi jata - sirf SHA-256 hash (phone + booking number).
  // Merge nahi karte, poora overwrite: purane docs ka customer_phone field
  // isi se khud-ba-khud saaf ho jata hai (staff/admin device pe).
  const trackingMirrorRef = useRef<Record<string, string>>({});
  useEffect(() => {
    bookings.forEach((b) => {
      if (!b.booking_number || !b.customer_phone) return;
      const signature = `${b.status}|${b.payout_status || ''}|${b.staff_name || ''}|${b.final_amount ?? ''}|${b.final_weight_kg ?? ''}|${b.estimated_weight_kg ?? ''}|${b.updated_at || ''}`;
      if (trackingMirrorRef.current[b.booking_number] === signature) return;
      trackingMirrorRef.current[b.booking_number] = signature;
      phoneHashForBooking(b.customer_phone, b.booking_number)
        .then((phoneHash) =>
          setDoc(doc(db, 'tracking', b.booking_number), {
            booking_number: b.booking_number,
            phone_hash: phoneHash,
            status: b.status,
            payout_status: b.payout_status || 'pending_approval',
            staff_name: b.staff_name || '',
            staff_vehicle: b.staff_vehicle || '',
            expected_scrap_items: b.expected_scrap_items || '',
            category_ids: b.category_ids || [],
            estimated_weight_kg: b.estimated_weight_kg ?? null,
            final_weight_kg: b.final_weight_kg ?? null,
            final_amount: b.final_amount ?? null,
            items_collected: b.items_collected ?? null,
            payout_method: b.payout_method || '',
            updated_at: new Date().toISOString(),
          })
        )
        .catch(() => {});
    });
  }, [bookings]);

  // Full booking sync: jab admin/staff Firebase se logged-in ho, har badli
  // hui booking ka poora data 'bookings' collection me wapas jata hai,
  // taaki baaki phones ke admin/staff ko bhi latest status dikhe.
  const bookingSyncRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!firebaseRole) return;
    bookings.forEach((b: any) => {
      if (!b.firebase_id) return;
      const { firebase_id, ...rest } = b;
      const signature = JSON.stringify(rest);
      if (bookingSyncRef.current[firebase_id] === signature) return;
      bookingSyncRef.current[firebase_id] = signature;
      const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      setDoc(doc(db, 'bookings', firebase_id), clean, { merge: true }).catch(() => {});
    });
  }, [bookings, firebaseRole]);

  // Payouts
  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_TICKETS;
  });

  // Public ticket-reply mirror: complaint ka sirf status + admin reply public
  // 'ticket_replies' collection me mirror hota hai (doc id = ticket number,
  // phone ka SHA-256 hash). Isse customer APNE DOOSRE PHONE pe bhi admin ka
  // reply padh sakta hai. Koi subject/description/naam/phone nahi jata.
  // Guest ka create sirf khaali reply ke saath hota hai (rules enforce karte
  // hain) - reply likhna/overwrite karna sirf logged-in staff/admin.
  const ticketReplyMirrorRef = useRef<Record<string, string>>({});
  useEffect(() => {
    tickets.forEach((t) => {
      if (!t.ticket_number || !t.customer_phone) return;
      const viewStatus =
        t.status === 'closed' || t.status === 'ai_resolved'
          ? 'resolved'
          : t.status === 'replied'
          ? 'replied'
          : 'open';
      const signature = `${viewStatus}|${t.admin_reply || ''}`;
      if (ticketReplyMirrorRef.current[t.ticket_number] === signature) return;
      ticketReplyMirrorRef.current[t.ticket_number] = signature;
      phoneHashForBooking(t.customer_phone, t.ticket_number)
        .then((phoneHash) =>
          setDoc(doc(db, 'ticket_replies', t.ticket_number), {
            ticket_number: t.ticket_number,
            phone_hash: phoneHash,
            status: viewStatus,
            admin_reply: t.admin_reply || '',
            updated_at: new Date().toISOString(),
          })
        )
        .catch(() => {});
    });
  }, [tickets]);


  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // ==========================================
  // 👑 ADMIN ROLE BOUNDARIES & APPROVAL SYSTEM
  // ==========================================
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(() => {
    const saved = localStorage.getItem('scrapgo_current_admin_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ADMIN_USERS[0]; // Default: Vikram Rathore (MAIN_ADMIN)
  });

  const [adminList, setAdminList] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('scrapgo_admin_list_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ADMIN_USERS;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('scrapgo_staff_members_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_STAFF_MEMBERS;
  });

  useEffect(() => {
    localStorage.setItem('scrapgo_admin_list_v3', JSON.stringify(adminList));
  }, [adminList]);

  useEffect(() => {
    localStorage.setItem('scrapgo_staff_members_v3', JSON.stringify(staffMembers));
  }, [staffMembers]);

  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => {
    const saved = localStorage.getItem('scrapgo_approval_requests_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_APPROVAL_REQUESTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('scrapgo_audit_logs_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('scrapgo_system_settings_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SYSTEM_SETTINGS;
  });

  const [websiteContent, setWebsiteContent] = useState<WebsiteContentItem[]>(() => {
    const saved = localStorage.getItem('scrapgo_website_content_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_WEBSITE_CONTENT;
  });

  const [scrapItems, setScrapItems] = useState<ScrapItemMaterial[]>(() => {
    const saved = localStorage.getItem('scrapgo_scrap_items_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SCRAP_ITEMS;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('scrapgo_all_users_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // One-time cleanup effect to clear past test data from localStorage for deployment
  useEffect(() => {
    const cleaned = localStorage.getItem('scrapgo_prod_deploy_cleaned_v3');
    if (!cleaned) {
      setBookings([]);
      setPayouts([]);
      setTickets([]);
      setNotifications([]);
      setAllUsers([]);
      setApprovalRequests([]);
      setAuditLogs([]);
        setAdminList(INITIAL_ADMIN_USERS);
      setStaffMembers(INITIAL_STAFF_MEMBERS);
      setCurrentAdmin(INITIAL_ADMIN_USERS[0]);
      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
      localStorage.removeItem(STORAGE_KEYS.PAYOUTS);
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem('scrapgo_all_users_v2');
      localStorage.removeItem('scrapgo_customer_accounts_v1');
      localStorage.removeItem('scrapgo_admin_list_v3');
      localStorage.removeItem('scrapgo_staff_members_v3');
      localStorage.removeItem('scrapgo_current_admin_v2');
      localStorage.setItem('scrapgo_prod_deploy_cleaned_v3', 'true');
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(serviceAreas));
  }, [serviceAreas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
  }, [payouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('scrapgo_current_admin_v2', JSON.stringify(currentAdmin));
  }, [currentAdmin]);

  useEffect(() => {
    localStorage.setItem('scrapgo_approval_requests_v2', JSON.stringify(approvalRequests));
  }, [approvalRequests]);

  useEffect(() => {
    localStorage.setItem('scrapgo_audit_logs_v2', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('scrapgo_system_settings_v2', JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem('scrapgo_website_content_v2', JSON.stringify(websiteContent));
  }, [websiteContent]);

  useEffect(() => {
    localStorage.setItem('scrapgo_scrap_items_v2', JSON.stringify(scrapItems));
  }, [scrapItems]);


  // Initialize Firebase Auth Listener and Firestore Connection Validation
  useEffect(() => {
    async function validateFirebaseConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        // Catch network / offline / unavailable errors gracefully without unhandled exceptions
        console.warn('Firebase Firestore connection status:', error?.message || 'operating in offline / cache mode');
      }
    }
    validateFirebaseConnection();

    // Firebase session restore: page reload pe agar admin/staff ka Firebase
    // session zinda hai to unka role + profile wapas load karo (har device).
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setFirebaseRole(null);
        return;
      }
      try {
        const roleSnap = await getDoc(doc(db, 'appUsers', user.uid));
        const role = roleSnap.exists() ? (roleSnap.data() as any).role : null;
        if (role !== 'admin' && role !== 'staff') {
          setFirebaseRole(null);
          return;
        }
        setFirebaseRole(role);
        await restoreSharedSession(user.uid, user.email || '', role);
      } catch (err) {
        console.warn('Firebase session restore notice:', (err as any)?.message || err);
      }
    });

    return () => unsubscribe();
  }, []);

  // Shared session restore helper (login ke baad bhi yahi use hota hai)
  const restoreSharedSession = async (uid: string, email: string, role: 'admin' | 'staff') => {
    if (role === 'admin') {
      let adminObj: AdminUser | null = null;
      try {
        const profSnap = await getDoc(doc(db, 'adminProfiles', uid));
        if (profSnap.exists()) {
          adminObj = { ...(profSnap.data() as any), firebase_uid: uid } as AdminUser;
        }
      } catch (e) { /* ignore */ }
      if (!adminObj) {
        // Bootstrap admin ka pehla login - MAIN_ADMIN profile auto-create
        adminObj = {
          ...INITIAL_ADMIN_USERS[0],
          id: uid,
          firebase_uid: uid,
          email: email.toLowerCase(),
        } as AdminUser;
        try {
          await setDoc(doc(db, 'adminProfiles', uid), JSON.parse(JSON.stringify(adminObj)));
        } catch (e) { /* ignore */ }
      }
      setCurrentAdmin(adminObj);
      setAdminList((prev) => {
        const idx = prev.findIndex((a) => a.email.toLowerCase() === email.toLowerCase() || a.firebase_uid === uid);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = adminObj as AdminUser;
          return copy;
        }
        return [adminObj as AdminUser, ...prev];
      });
      setCurrentUser((prev) =>
        prev.role === 'admin' && prev.id === (adminObj as AdminUser).id
          ? prev
          : {
              id: (adminObj as AdminUser).id,
              phone: (adminObj as AdminUser).phone || '',
              full_name: (adminObj as AdminUser).name,
              email: email.toLowerCase(),
              role: 'admin',
              adminRole: (adminObj as AdminUser).adminRole,
              created_at: (adminObj as AdminUser).created_at || new Date().toISOString(),
            }
      );
      setActivePortal('admin');
    } else {
      let staffObj: StaffMember | null = null;
      try {
        const profSnap = await getDoc(doc(db, 'staffProfiles', uid));
        if (profSnap.exists()) {
          staffObj = { ...(profSnap.data() as any), firebase_uid: uid } as StaffMember;
        }
      } catch (e) { /* ignore */ }
      if (staffObj && (staffObj.status === 'inactive' || staffObj.is_active === false)) {
        try { await firebaseSignOut(firebaseAuth); } catch (e) { /* ignore */ }
        setFirebaseRole(null);
        return;
      }
      if (staffObj) {
        setStaffMembers((prev) => {
          const idx = prev.findIndex((st) => st.email.toLowerCase() === email.toLowerCase() || st.firebase_uid === uid);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = staffObj as StaffMember;
            return copy;
          }
          return [staffObj as StaffMember, ...prev];
        });
      }
      const profile: UserProfile = {
        id: staffObj ? staffObj.id : uid,
        phone: staffObj?.phone || '',
        full_name: staffObj?.name || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'staff',
        created_at: staffObj?.created_at || new Date().toISOString(),
        vehicle_number: staffObj?.vehicle_number || '',
      };
      setCurrentUser((prev) => (prev.role === 'staff' && prev.id === profile.id ? prev : profile));
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));
      setActivePortal('staff');
    }
    refreshSharedData().catch(() => {});
  };

  const setActivePortal = (portal: 'customer' | 'staff' | 'admin') => {
    setActivePortalState(portal);
    localStorage.setItem(STORAGE_KEYS.PORTAL, portal);
  };

  // Firebase config app ke saath bundled hai; connection load par validate hota hai.
  const refreshFirebaseStatus = () => {
    getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
  };

  const resetToSampleData = () => {
    setCategories(INITIAL_CATEGORIES);
    setServiceAreas(INITIAL_SERVICE_AREAS);
    setBookings([]);
    setPayouts([]);
    setTickets([]);
    setNotifications([]);
    setAllUsers([]);
    setAdminList(INITIAL_ADMIN_USERS);
    setStaffMembers(INITIAL_STAFF_MEMBERS);
    setCurrentAdmin(INITIAL_ADMIN_USERS[0]);
    setApprovalRequests([]);
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.AREAS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.PAYOUTS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem('scrapgo_all_users_v2');
    localStorage.removeItem('scrapgo_customer_accounts_v1');
    localStorage.removeItem('scrapgo_admin_list_v3');
    localStorage.removeItem('scrapgo_staff_members_v3');
    localStorage.removeItem('scrapgo_approval_requests_v2');
    localStorage.removeItem('scrapgo_audit_logs_v2');
  };

  // Password ko hash karta hai (plain text save nahi hota)
  const hashPassword = secureHashPassword;

  const logoutUser = async (): Promise<void> => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (e) { /* ignore */ }
    setFirebaseRole(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setCurrentUser(CURRENT_CUSTOMER_USER);
    setActivePortal('customer');
    addNotification('Logged Out', 'You have been signed out.', 'system', 'all');
  };

  // Firestore se shared data lao (bookings + staff/admin profiles).
  // Sirf Firebase se logged-in admin/staff ke liye (rules bhi yahi allow karti hain).
  const refreshSharedData = async (): Promise<void> => {
    if (!firebaseAuth.currentUser) return;

    try {
      const snap = await getDocs(collection(db, 'bookings'));
      const remote = snap.docs.map((d) => ({ ...(d.data() as any), firebase_id: d.id })) as Booking[];
      if (remote.length > 0) {
        setBookings((prev) => {
          const merged = [...prev];
          remote.forEach((rb) => {
            const idx = merged.findIndex((b) => b.booking_number === rb.booking_number);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...rb };
            else merged.unshift(rb);
          });
          return merged;
        });
      }
    } catch (e) {
      console.warn('Shared bookings fetch notice:', (e as any)?.message || e);
    }

    try {
      const tSnap = await getDocs(collection(db, 'tickets'));
      const remoteTickets = tSnap.docs.map((d) => ({ ...(d.data() as any), firebase_id: d.id })) as SupportTicket[];
      if (remoteTickets.length > 0) {
        setTickets((prev) => {
          const merged = [...prev];
          remoteTickets.forEach((rt) => {
            const idx = merged.findIndex((t) => t.ticket_number === rt.ticket_number);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...rt };
            else merged.unshift(rt);
          });
          return merged;
        });
      }
    } catch (e) {
      // Staff role tickets nahi padh sakta (admin-only) - fail normal hai
      console.warn('Tickets fetch notice:', (e as any)?.message || e);
    }

    try {
      const staffSnap = await getDocs(collection(db, 'staffProfiles'));
      const remoteStaff = staffSnap.docs.map((d) => ({ ...(d.data() as any), firebase_uid: d.id })) as StaffMember[];
      if (remoteStaff.length > 0) {
        setStaffMembers((prev) => {
          const merged = [...prev];
          remoteStaff.forEach((rs) => {
            const idx = merged.findIndex(
              (st) => st.firebase_uid === rs.firebase_uid || st.email.toLowerCase() === (rs.email || '').toLowerCase()
            );
            if (idx >= 0) merged[idx] = { ...merged[idx], ...rs };
            else merged.unshift(rs);
          });
          return merged;
        });
      }
    } catch (e) {
      // Staff role sirf apna profile padh sakta hai - list fetch fail normal hai
      console.warn('Staff profiles fetch notice:', (e as any)?.message || e);
    }

    try {
      const admSnap = await getDocs(collection(db, 'adminProfiles'));
      const remoteAdmins = admSnap.docs.map((d) => ({ ...(d.data() as any), firebase_uid: d.id })) as AdminUser[];
      if (remoteAdmins.length > 0) {
        setAdminList((prev) => {
          const merged = [...prev];
          remoteAdmins.forEach((ra) => {
            const idx = merged.findIndex(
              (a) => a.firebase_uid === ra.firebase_uid || a.email.toLowerCase() === (ra.email || '').toLowerCase()
            );
            if (idx >= 0) merged[idx] = { ...merged[idx], ...ra };
            else merged.unshift(ra);
          });
          return merged;
        });
      }
    } catch (e) {
      console.warn('Admin profiles fetch notice:', (e as any)?.message || e);
    }
  };

  // Staff/admin "forgot password" - Firebase ka free email reset link
  const requestLoginReset = async (emailInput: string): Promise<{ success: boolean; message: string }> => {
    const clean = emailInput.trim().toLowerCase();
    if (!clean) return { success: false, message: 'Pehle upar apna email likho.' };
    try {
      await sendPasswordResetEmail(firebaseAuth, clean);
      return { success: true, message: `Password reset email ${clean} pe bhej di gayi hai. Inbox ya spam folder check karo.` };
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/user-not-found') {
        return { success: false, message: 'Is email ka koi account nahi mila. Spelling check karo ya admin se poochho.' };
      }
      return { success: false, message: 'Reset email nahi bhej paye. Thodi der baad try karo.' };
    }
  };

  const adminLogin = async (emailInput: string, passwordInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    const adminKey = `admin_${cleanEmail || 'super'}`;

    const sec = getLoginSecurityState(adminKey);
    if (sec.isBanned) {
      return {
        success: false,
        message: '🚫 ACCESS DENIED: Anti-Bot System Active. Excessive brute-force attempts detected. IP Address Banned.',
      };
    }
    if (sec.isLocked) {
      return {
        success: false,
        message: t('lockout_active_error'),
      };
    }

    // 1) Firebase Auth login (har phone/device pe kaam karta hai)
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, cleanPass);
      const roleSnap = await getDoc(doc(db, 'appUsers', cred.user.uid));
      const fbRole = roleSnap.exists() ? (roleSnap.data() as any).role : null;
      if (fbRole === 'admin') {
        setFirebaseRole('admin');
        recordSuccessfulLogin(adminKey);
        await restoreSharedSession(cred.user.uid, cleanEmail, 'admin');
        return { success: true, message: 'Admin login successful - Firebase connected (har device sync)' };
      }
      await firebaseSignOut(firebaseAuth);
      return {
        success: false,
        message: 'Ye email admin ke roop me registered nahi hai. Staff ho to Staff Login use karo.',
      };
    } catch (fbErr: any) {
      // Firebase config/setup pending ya network issue ho to neeche purana
      // local fallback chalega (sirf isi device ke liye).
      console.warn('Firebase admin login notice:', fbErr?.code || fbErr?.message || fbErr);
    }

    // 2) Local fallback (single device) - purana hashed master/admin list
    // Check Main Super Admin credentials
    const isSuperAdminEmail =
      cleanEmail === 'scrapgo.services@gmail.com' || cleanEmail === 'scrapgo.servies@gmail.com';

    if (isSuperAdminEmail && (await verifyMasterPassword(cleanPass))) {
      recordSuccessfulLogin(adminKey);
      const superAdmin =
        adminList.find(
          (a) =>
            a.email.toLowerCase() === 'scrapgo.services@gmail.com' ||
            a.email.toLowerCase() === 'scrapgo.servies@gmail.com'
        ) || INITIAL_ADMIN_USERS[0];

      const profile: UserProfile = {
        id: superAdmin.id,
        phone: superAdmin.phone,
        full_name: superAdmin.name,
        email: 'scrapgo.services@gmail.com',
        role: 'admin',
        adminRole: 'SUPER_ADMIN',
        created_at: superAdmin.created_at,
        avatar_url: superAdmin.avatar_url,
      };
      setActivePortal('admin');
      setCurrentAdmin({ ...superAdmin, email: 'scrapgo.services@gmail.com' });
      setCurrentUser(profile);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));

      logAuditEvent({
        action_id: `ACT-${Date.now()}`,
        actor_id: superAdmin.id,
        actor_name: superAdmin.name,
        actor_role: 'SUPER_ADMIN',
        action: 'Main Super Admin Authenticated',
        module: 'auth',
        reason: 'Super Admin Credentials Authentication Successful',
        result: 'success',
      });

      return { success: true, message: 'Super Admin login successful' };
    }

    // Check registered admin accounts
    const matchAdmin = adminList.find((a) => a.email.toLowerCase() === cleanEmail);
    let adminVerified = false;
    if (matchAdmin) {
      if (matchAdmin.password_hash) {
        adminVerified = await verifyPassword(cleanPass, matchAdmin.password_hash);
      }
    }
    if (matchAdmin && adminVerified) {
      if (matchAdmin.status === 'inactive' || matchAdmin.is_active === false) {
        return { success: false, message: 'Account is deactivated. Contact Super Admin.' };
      }

      recordSuccessfulLogin(adminKey);
      const profile: UserProfile = {
        id: matchAdmin.id,
        phone: matchAdmin.phone,
        full_name: matchAdmin.name,
        email: matchAdmin.email,
        role: 'admin',
        adminRole: matchAdmin.adminRole,
        created_at: matchAdmin.created_at,
        avatar_url: matchAdmin.avatar_url,
      };

      setAdminList((prev) =>
        prev.map((a) => (a.id === matchAdmin.id ? { ...a, last_login: new Date().toISOString() } : a))
      );

      setActivePortal('admin');
      setCurrentAdmin(matchAdmin);
      setCurrentUser(profile);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));

      return { success: true, message: `Admin login successful (${matchAdmin.name})` };
    }

    const nextSec = recordFailedPasswordAttempt(adminKey);
    if (nextSec.isBanned) {
      return {
        success: false,
        message: '🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.',
      };
    }
    if (nextSec.isLocked) {
      return {
        success: false,
        message: t('lockout_active_error'),
      };
    }
    const remaining = Math.max(0, 3 - nextSec.failedAttempts);
    return {
      success: false,
      message: t('invalid_credentials_with_attempts') + `${remaining}/3`,
    };
  };

  const staffLogin = async (loginIdInput: string, passwordInput: string) => {
    const cleanInput = loginIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const rateCheck = checkRateLimit('LOGIN', cleanInput, language);
    if (!rateCheck.isAllowed) {
      return {
        success: false,
        message: rateCheck.errorMessage || '🛑 Staff Login Throttled: Too many failed login attempts.',
      };
    }
    recordAction('LOGIN', cleanInput);

    const staffKey = `staff:${cleanInput}`;
    const sec = getLoginSecurityState(staffKey);
    if (sec.isBanned) {
      return {
        success: false,
        message: '🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.',
      };
    }
    if (sec.isLocked) {
      return {
        success: false,
        message: t('lockout_active_error'),
      };
    }

    // 1) Firebase Auth login (har phone/device pe kaam karta hai)
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanInput, cleanPass);
      const roleSnap = await getDoc(doc(db, 'appUsers', cred.user.uid));
      const fbRole = roleSnap.exists() ? (roleSnap.data() as any).role : null;
      if (fbRole === 'staff') {
        setFirebaseRole('staff');
        recordSuccessfulLogin(staffKey);
        await restoreSharedSession(cred.user.uid, cleanInput, 'staff');
        return { success: true, message: 'Staff login successful - Firebase connected (har device sync)' };
      }
      await firebaseSignOut(firebaseAuth);
      return {
        success: false,
        message: 'Ye email staff ke roop me registered nahi hai. Admin se apna account banwao.',
      };
    } catch (fbErr: any) {
      // Firebase setup pending/network issue ho to purana local fallback.
      console.warn('Firebase staff login notice:', fbErr?.code || fbErr?.message || fbErr);
    }

    // 2) Local fallback (single device) - purana hashed staff login
    // Sirf email se match (ya purana demo alias staffuser1)
    const lookupEmail = cleanInput === 'staffuser1' ? 'staffuser1@scraphouse.in' : cleanInput;
    const matchStaff = staffMembers.find((s) => s.email.toLowerCase() === lookupEmail);

    let verified = false;
    if (matchStaff) {
      if (matchStaff.password_hash) {
        verified = await verifyPassword(cleanPass, matchStaff.password_hash);
      }
    }

    if (matchStaff && verified) {
      const staffObj = matchStaff;

      if (staffObj.status === 'inactive' || staffObj.is_active === false) {
        return { success: false, message: 'Account is deactivated. Contact Super Admin.' };
      }

      recordSuccessfulLogin(staffKey);

      const staffProfile: UserProfile = {
        id: staffObj.id,
        phone: staffObj.phone,
        full_name: staffObj.name,
        email: staffObj.email,
        role: 'staff',
        created_at: new Date().toISOString(),
        avatar_url: staffObj.avatar_url || '',
        vehicle_number: staffObj.vehicle_number || '',
      };

      // Update staff last active
      setStaffMembers((prev) =>
        prev.map((s) => (s.id === staffProfile.id ? { ...s, last_active: new Date().toISOString() } : s))
      );

      setActivePortal('staff');
      setCurrentUser(staffProfile);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(staffProfile));

      return { success: true, message: `Staff login successful (${staffProfile.full_name})` };
    }

    const nextSec = recordFailedPasswordAttempt(staffKey);
    if (nextSec.isBanned) {
      return {
        success: false,
        message: '🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.',
      };
    }
    if (nextSec.isLocked) {
      return {
        success: false,
        message: t('lockout_active_error'),
      };
    }
    const remaining = Math.max(0, 3 - nextSec.failedAttempts);
    return {
      success: false,
      message: `🔐 Security Alert: Staff Email ya Password galat hai. Remaining attempts: ${remaining}/3 before 30s lockout.`,
    };
  };

  // Helper to add notification
  const addNotification = (
    title: string,
    message: string,
    type: 'booking' | 'staff' | 'payout' | 'support' | 'system',
    target_role: UserRole | 'all' = 'all',
    booking_id?: string
  ) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 5),
      title,
      message,
      type,
      target_role,
      booking_id,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
  };

  // Live GPS simulation for bookings that are "on_the_way"
  useEffect(() => {
    const interval = setInterval(() => {
      setBookings((prevBookings) =>
        prevBookings.map((b) => {
          if (b.status !== 'on_the_way' || !b.staff_lat || !b.staff_lng) return b;

          // Step slightly closer to destination
          const targetLat = b.latitude;
          const targetLng = b.longitude;
          const latDiff = targetLat - b.staff_lat;
          const lngDiff = targetLng - b.staff_lng;

          // 5% movement per tick towards customer
          const nextLat = b.staff_lat + latDiff * 0.08;
          const nextLng = b.staff_lng + lngDiff * 0.08;

          // Approximate remaining distance
          const remainingKm = Math.max(
            0.1,
            Math.sqrt(Math.pow((targetLat - nextLat) * 111, 2) + Math.pow((targetLng - nextLng) * 111, 2))
          );
          const remainingMinutes = Math.max(1, Math.round(remainingKm * 3.5));

          return {
            ...b,
            staff_lat: nextLat,
            staff_lng: nextLng,
            staff_distance_km: Number(remainingKm.toFixed(1)),
            staff_eta_minutes: remainingMinutes,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Category management
  const addCategory = (cat: Omit<ScrapCategory, 'id'>) => {
    const newCat: ScrapCategory = {
      ...cat,
      id: 'cat-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCategories((prev) => [newCat, ...prev]);
    addNotification('Category Added', `New category "${cat.name}" added at ₹${cat.rate_per_kg}/${cat.unit}`, 'system', 'admin');
  };

  const updateCategoryRate = (id: string, newRate: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rate_per_kg: newRate } : c))
    );
    setScrapItems((prev) =>
      prev.map((i) => (i.category_id === id || i.id === id ? { ...i, current_rate: newRate, updated_at: new Date().toISOString() } : i))
    );
    const cat = categories.find((c) => c.id === id);
    addNotification('Rate Updated', `Rate for ${cat?.name || 'Scrap'} updated to ₹${newRate}/${cat?.unit || 'kg'}`, 'system', 'all');
  };

  const toggleCategoryStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  const updateCategoryDetails = (
    id: string,
    updates: Partial<Omit<ScrapCategory, 'id'>>
  ): { success: boolean; message: string } => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (updates.rate_per_kg) {
      setScrapItems((prev) =>
        prev.map((i) =>
          i.category_id === id || i.id === id
            ? { ...i, current_rate: updates.rate_per_kg!, name: updates.name || i.name, updated_at: new Date().toISOString() }
            : i
        )
      );
    }
    const cat = categories.find((c) => c.id === id);
    const catName = updates.name || cat?.name || 'Scrap Category';
    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole || 'SUPER_ADMIN',
      action: 'Updated Category Details',
      module: 'categories',
      target_id: id,
      reason: `Updated category ${catName}`,
      result: 'success',
    });
    return { success: true, message: `Category "${catName}" updated successfully.` };
  };

  const deleteCategory = (id: string): { success: boolean; message: string } => {
    const catToDelete = categories.find((c) => c.id === id);
    const catName = catToDelete?.name || 'Scrap Category';

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setScrapItems((prev) => prev.filter((i) => i.category_id !== id && i.id !== id));

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole || 'SUPER_ADMIN',
      action: 'Deleted Scrap Category',
      module: 'categories',
      target_id: id,
      reason: `Deleted scrap category "${catName}"`,
      result: 'success',
    });

    addNotification(
      'Category Deleted',
      `Category "${catName}" was removed from the scrap rate master.`,
      'system',
      'admin'
    );

    return { success: true, message: `Scrap category "${catName}" deleted successfully.` };
  };

  const deleteScrapItem = (itemId: string): { success: boolean; message: string } => {
    const itemToDelete = scrapItems.find((i) => i.id === itemId);
    const itemName = itemToDelete?.name || 'Scrap Material';

    setScrapItems((prev) => prev.filter((i) => i.id !== itemId));
    setCategories((prev) => prev.filter((c) => c.id !== itemId));

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole || 'SUPER_ADMIN',
      action: 'Deleted Scrap Item',
      module: 'categories',
      target_id: itemId,
      reason: `Deleted scrap item "${itemName}"`,
      result: 'success',
    });

    addNotification(
      'Scrap Item Deleted',
      `Scrap item "${itemName}" was removed.`,
      'system',
      'admin'
    );

    return { success: true, message: `Scrap item "${itemName}" deleted successfully.` };
  };

  // Service Areas
  const addServiceArea = (area: Omit<ServiceArea, 'id'>) => {
    const newArea: ServiceArea = {
      ...area,
      id: 'sa-' + Date.now(),
    };
    setServiceAreas((prev) => [...prev, newArea]);
  };

  const toggleServiceArea = (id: string) => {
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
  };

  // Create new booking
  const createBooking = (bookingData: {
    customer_name: string;
    customer_phone: string;
    pickup_address: string;
    pickup_landmark?: string;
    latitude?: number;
    longitude?: number;
    preferred_date: string;
    preferred_time_slot: string;
    category_ids: string[];
    expected_scrap_items: string;
    estimated_weight_kg?: number;
    notify_whatsapp?: boolean;
    payout_method: PayoutMethod;
    upi_id?: string;
    upi_qr_url?: string;
    bank_details?: {
      account_number: string;
      ifsc_code: string;
      account_holder: string;
    };
  }): Booking => {
    // Throttling for booking creation
    const rateCheck = checkRateLimit('BOOKING', bookingData.customer_phone, language);
    if (!rateCheck.isAllowed) {
      throw new Error(rateCheck.errorMessage || '🛑 Pickup Booking Rate Limit Exceeded. Please wait before creating another request.');
    }
    recordAction('BOOKING', bookingData.customer_phone);
    // Generate 4-digit unique OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    // Lamba random booking code: SH-XXXXXXXX (8 chars, bina 0/O/1/I -
    // padhne me aasan, guess karna mushkil: ~1 trillion combinations).
    // Purane SH-XXXXX / SG-2026-... IDs Track Status me waise hi chalte hain.
    const ID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let bookingNumber = '';
    do {
      const buf = new Uint32Array(8);
      crypto.getRandomValues(buf);
      let suffix = '';
      for (let i = 0; i < 8; i++) suffix += ID_CHARS[buf[i] % ID_CHARS.length];
      bookingNumber = `SH-${suffix}`;
    } while (bookings.some((b) => b.booking_number === bookingNumber));

    const newBooking: Booking = {
      id: 'book-' + Date.now(),
      booking_number: bookingNumber,
      customer_id: currentUser.id,
      customer_name: bookingData.customer_name,
      customer_phone: bookingData.customer_phone,
      staff_id: null,
      staff_name: null,
      pickup_address: bookingData.pickup_address,
      pickup_landmark: bookingData.pickup_landmark,
      latitude: bookingData.latitude || 28.9931,
      longitude: bookingData.longitude || 77.0151,
      preferred_date: bookingData.preferred_date,
      preferred_time_slot: bookingData.preferred_time_slot,
      category_ids: bookingData.category_ids,
      expected_scrap_items: bookingData.expected_scrap_items,
      estimated_weight_kg: bookingData.estimated_weight_kg || 20,
      notify_whatsapp: bookingData.notify_whatsapp ?? true,
      status: 'pending',
      pickup_otp: generatedOtp,
      otp_verified: false,
      payout_method: bookingData.payout_method,
      upi_id: bookingData.upi_id,
      upi_qr_url: bookingData.upi_qr_url,
      bank_details: bookingData.bank_details,
      payout_status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Firebase mein bhi save karo (taaki doosre device pe bhi dikhe)
    // Firestore undefined fields reject karta hai (jaise bank_details jab UPI
    // select ho) - isliye undefined fields hata kar bhejo.
    const bookingForFirebase = Object.fromEntries(
      Object.entries(newBooking).filter(([, v]) => v !== undefined)
    );
    try {
      addDoc(collection(db, 'bookings'), bookingForFirebase)
        .then((ref) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === newBooking.id ? { ...b, firebase_id: ref.id } : b))
          );
        })
        .catch((fbErr: any) =>
          console.warn('Firebase booking save notice:', fbErr?.message || fbErr)
        );
    } catch (fbErr: any) {
      console.warn('Firebase booking save notice:', fbErr?.message || fbErr);
    }

    addNotification(
      'New Pickup Request 📦',
      `Booking ${bookingNumber} received from ${bookingData.customer_name}. Awaiting staff assignment.`,
      'booking',
      'admin',
      newBooking.id
    );

    return newBooking;
  };

  // Admin assigns staff
  const assignStaffToBooking = (bookingId: string, staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) return;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          staff_id: staff.id,
          staff_name: staff.full_name,
          staff_phone: staff.phone,
          staff_vehicle: staff.vehicle_number,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        };
      })
    );

    addNotification(
      'Staff Assigned 👷',
      `${staff.full_name} has been assigned to booking.`,
      'booking',
      'all',
      bookingId
    );
  };

  // Staff accepts
  const staffAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, updated_at: new Date().toISOString() } : b
      )
    );
  };

  // Staff starts journey (On The Way)
  const staffStartJourney = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        // Staff vehicle initial coordinates (approx 3km away from customer)
        const initialStaffLat = b.latitude - 0.015;
        const initialStaffLng = b.longitude - 0.012;
        return {
          ...b,
          status: 'on_the_way',
          staff_lat: initialStaffLat,
          staff_lng: initialStaffLng,
          staff_eta_minutes: 15,
          staff_distance_km: 3.2,
          updated_at: new Date().toISOString(),
        };
      })
    );

    const b = bookings.find((item) => item.id === bookingId);
    addNotification(
      'Driver On The Way 🚚',
      `${b?.staff_name || 'Driver'} is en route to ${b?.pickup_address || 'customer location'}.`,
      'staff',
      'all',
      bookingId
    );
  };

  // Staff marks arrived
  const staffMarkArrived = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'arrived',
          staff_lat: b.latitude,
          staff_lng: b.longitude,
          staff_distance_km: 0,
          staff_eta_minutes: 0,
          updated_at: new Date().toISOString(),
        };
      })
    );

    const b = bookings.find((item) => item.id === bookingId);
    addNotification(
      'Driver Arrived 📍',
      `${b?.staff_name || 'Pickup agent'} has arrived at your doorstep. Please share OTP ${b?.pickup_otp || '****'} with the agent.`,
      'staff',
      'customer',
      bookingId
    );
  };

  // Staff cancels/rejects booking
  const staffCancelBooking = (bookingId: string, reason?: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        };
      })
    );

    const b = bookings.find((item) => item.id === bookingId);
    addNotification(
      'Pickup Cancelled ❌',
      `Pickup #${b?.booking_number} was cancelled/rejected by driver. Reason: ${reason || 'Not specified'}`,
      'booking',
      'all',
      bookingId
    );
  };

  // Customer cancels booking
  const cancelBookingCustomer = (bookingId: string, reason?: string): { success: boolean; message: string } => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    if (booking.status === 'completed') {
      return { success: false, message: 'Cannot cancel a completed booking.' };
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'cancelled', updated_at: new Date().toISOString() }
          : b
      )
    );

    addNotification(
      'Pickup Request Cancelled ❌',
      `Booking #${booking.booking_number} was cancelled by customer. Reason: ${reason || 'Customer request'}`,
      'booking',
      'all',
      bookingId
    );

    return { success: true, message: `Booking #${booking.booking_number} cancelled successfully.` };
  };

  // Staff verifies customer OTP
  const staffVerifyOtp = (bookingId: string, enteredOtp: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };

    if (booking.pickup_otp !== enteredOtp.trim()) {
      return { success: false, message: 'Invalid OTP! Please check OTP displayed on customer phone.' };
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, otp_verified: true, status: 'weighing', updated_at: new Date().toISOString() }
          : b
      )
    );

    addNotification(
      'OTP Verified ✅',
      `OTP verified for booking ${booking.booking_number}. Proceeding to digital weighing scale.`,
      'booking',
      'all',
      bookingId
    );

    return { success: true, message: 'OTP verified successfully! Now measure scrap on digital scale.' };
  };

  // Staff completes weighing and submits final bill
  const staffCompleteWeighing = (
    bookingId: string,
    items: ScrapItemWeight[],
    finalWeight: number,
    finalAmount: number,
    scalePhotoUrl?: string,
    notes?: string
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Update booking
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: 'completed',
          items_collected: items,
          final_weight_kg: finalWeight,
          final_amount: finalAmount,
          scale_photo_url: scalePhotoUrl,
          staff_notes: notes,
          payout_status: 'pending_approval',
          updated_at: new Date().toISOString(),
        };
      })
    );

    // Create payout record awaiting Admin approval
    const newPayout: PayoutRecord = {
      id: 'pay-' + Date.now(),
      booking_id: booking.id,
      booking_number: booking.booking_number,
      customer_id: booking.customer_id,
      customer_name: booking.customer_name,
      amount: finalAmount,
      payout_method: booking.payout_method,
      payout_destination:
        booking.payout_method === 'upi'
          ? (booking.upi_id || 'UPI')
          : booking.payout_method === 'bank_transfer'
          ? `${booking.bank_details?.account_holder || ''} - A/C ${booking.bank_details?.account_number || ''}`
          : 'Cash on Spot',
      status: 'pending_approval',
      created_at: new Date().toISOString(),
    };

    setPayouts((prev) => [newPayout, ...prev]);

    addNotification(
      'Pickup Completed - Payout Pending Approval 💰',
      `Pickup ${booking.booking_number} completed: ${finalWeight} kg scrap collected (Total ₹${finalAmount}). Admin approval required.`,
      'payout',
      'admin',
      bookingId
    );
  };

  const submitPickupRating = (
    bookingId: string,
    rating: number,
    reviewComment: string
  ): { success: boolean; message: string } => {
    const userIdentifier = currentUser?.phone || currentUser?.id || 'guest';
    const rateCheck = checkRateLimit('REVIEW', userIdentifier, language);
    if (!rateCheck.isAllowed) {
      return {
        success: false,
        message: rateCheck.errorMessage || '🛑 Review Throttled: Too many review submissions recently.',
      };
    }
    recordAction('REVIEW', userIdentifier);

    let found = false;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          found = true;
          return {
            ...b,
            rating,
            review_comment: reviewComment,
            rated_at: new Date().toISOString(),
          };
        }
        return b;
      })
    );

    if (!found) {
      return { success: false, message: 'Pickup booking request not found.' };
    }

    addNotification(
      'Pickup Review Submitted ⭐',
      `Rating ${rating}/5 submitted for Pickup #${bookingId}. Thank you for your feedback!`,
      'system',
      'all'
    );

    return { success: true, message: 'Thank you! Your pickup review has been recorded.' };
  };

  // Admin approves payout
  const approvePayout = (payoutId: string, transactionRef?: string) => {
    const ref = transactionRef || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);

    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== payoutId) return p;
        return {
          ...p,
          status: 'successful',
          transaction_reference: ref,
          processed_by_admin: 'Admin Office',
          processed_at: new Date().toISOString(),
        };
      })
    );

    // Update related booking payout_status to successful
    const targetPayout = payouts.find((p) => p.id === payoutId);
    if (targetPayout) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === targetPayout.booking_id
            ? { ...b, payout_status: 'successful', payout_reference: ref }
            : b
        )
      );

      addNotification(
        'Payout Approved & Transferred! 💸',
        `Payment of ₹${targetPayout.amount} for ${targetPayout.booking_number} approved and dispatched via ${targetPayout.payout_method.toUpperCase()} (Ref: ${ref}).`,
        'payout',
        'all',
        targetPayout.booking_id
      );
    }
  };

  const rejectPayout = (payoutId: string, reason: string) => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? { ...p, status: 'failed', transaction_reference: `Rejected: ${reason}` }
          : p
      )
    );
    addNotification('Payout Rejected ⚠️', `Payout ${payoutId} was rejected: ${reason}`, 'payout', 'admin');
  };

  // AI Support Bot & Tickets
  const aiBotLookupBooking = (bookingNumber: string) => {
    const cleanNumber = bookingNumber.trim().toUpperCase();
    return bookings.find((b) => b.booking_number.toUpperCase() === cleanNumber || b.booking_number.endsWith(cleanNumber));
  };

  const createTicket = (
    subject: string,
    description: string,
    bookingNumber?: string,
    options?: {
      ticketType?: 'inquiry' | 'complaint';
      complaintCategory?:
        | 'driver_delayed'
        | 'payment_issue'
        | 'weight_scale_issue'
        | 'staff_behavior'
        | 'cancellation'
        | 'other';
      priority?: 'low' | 'medium' | 'high';
    }
  ) => {
    // Throttling for ticket / complaint registration
    const rateCheck = checkRateLimit('COMPLAINT', currentUser?.phone || 'guest', language);
    if (!rateCheck.isAllowed) {
      throw new Error(rateCheck.errorMessage || '🛑 Complaint Ticket Throttled: Too many tickets submitted recently.');
    }
    recordAction('COMPLAINT', currentUser?.phone || 'guest');
    const targetBooking = bookingNumber ? aiBotLookupBooking(bookingNumber) : undefined;
    const isComplaint = options?.ticketType === 'complaint';
    const prefix = isComplaint ? 'CMP-2026' : 'TKT-2026';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `${prefix}-${randNum}`;

    const newTicket: SupportTicket = {
      id: 'tkt-' + Date.now(),
      ticket_number: ticketNumber,
      ticket_type: options?.ticketType || 'inquiry',
      complaint_category: options?.complaintCategory,
      customer_id: currentUser.id,
      customer_name: currentUser.full_name,
      customer_phone: currentUser.phone,
      booking_id: targetBooking?.id,
      booking_number: targetBooking?.booking_number || bookingNumber,
      subject,
      description,
      status: 'escalated_to_admin',
      priority: options?.priority || (isComplaint ? 'high' : 'medium'),
      ai_conversation: [
        { sender: 'user', text: description, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        {
          sender: 'ai',
          text: isComplaint
            ? `🚨 Official Complaint Registered (${ticketNumber}). Our Dispatch & Escalation Manager has received your grievance and will contact you as soon as possible.`
            : `I have logged this ticket (${ticketNumber}) with our Admin Support Queue. A customer officer is reviewing your request.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      created_at: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);

    // Firebase mein bhi save karo (taaki admin ko kisi bhi device pe dikhe).
    // Firestore undefined fields reject karta hai - isliye undefined hata kar bhejo.
    const ticketForFirebase = Object.fromEntries(
      Object.entries(newTicket).filter(([, v]) => v !== undefined)
    );
    try {
      addDoc(collection(db, 'tickets'), ticketForFirebase)
        .then((ref) => {
          setTickets((prev) =>
            prev.map((t) => (t.id === newTicket.id ? { ...t, firebase_id: ref.id } : t))
          );
        })
        .catch((fbErr: any) => {
          console.warn('Ticket Firebase save notice:', fbErr?.message || fbErr);
        });
    } catch (fbErr: any) {
      console.warn('Ticket Firebase save notice:', (fbErr as any)?.message || fbErr);
    }

    addNotification(
      isComplaint ? '🚨 Urgent Complaint Registered!' : 'New Support Ticket 🎫',
      `${newTicket.ticket_number}: ${subject} (${currentUser.full_name} - ${currentUser.phone})`,
      'support',
      'admin',
      targetBooking?.id
    );

    return newTicket;
  };

  const replyToTicket = (ticketId: string, replyText: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const convo = t.ai_conversation || [];
        return {
          ...t,
          admin_reply: replyText,
          // Reply bhejte hi status 'replied' - admin ko pata chale jawab ja chuka
          status: 'replied',
          ai_conversation: [
            ...convo,
            { sender: 'admin', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ],
        };
      })
    );
  };

  const closeTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'closed', resolved_at: new Date().toISOString() }
          : t
      )
    );
  };

  // Resolved complaint ko wapas kholna ho to (reply already hai to 'replied')
  const reopenTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: t.admin_reply ? 'replied' : 'open', resolved_at: undefined }
          : t
      )
    );
  };

  // Public mirror (ticket_replies) se aaya admin reply apne local ticket me
  // merge karta hai - doosre device pe bhi reply dikhe.
  const syncTicketReplyFromMirror = (
    ticketNumber: string,
    mirror: { status?: string; admin_reply?: string; updated_at?: string }
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticket_number !== ticketNumber) return t;
        const nextStatus: SupportTicket['status'] =
          mirror.status === 'resolved' ? 'closed' : mirror.status === 'replied' ? 'replied' : t.status;
        return {
          ...t,
          status: nextStatus,
          admin_reply: mirror.admin_reply || t.admin_reply,
          resolved_at:
            mirror.status === 'resolved'
              ? t.resolved_at || mirror.updated_at || new Date().toISOString()
              : t.resolved_at,
        };
      })
    );
  };

  // Notification helpers
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ==========================================
  // 🛡️ SECURITY AUDIT LOGGING (IMMUTABLE)
  // ==========================================
  const logAuditEvent = (event: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // ==========================================
  // 🔐 ROLE BOUNDARY AUTHORIZATION CHECK
  // ==========================================
  const hasPermission = (permission: GranularPermission): boolean => {
    if (!currentAdmin.is_active || currentAdmin.status === 'suspended') return false;
    if (currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN') return true;
    return Boolean(currentAdmin.permissions && currentAdmin.permissions.includes(permission));
  };

  const canCreateStaff = Boolean(
    currentAdmin.is_active &&
    currentAdmin.status !== 'suspended' &&
    (currentAdmin.role_level === 'MAIN_ADMIN' ||
      currentAdmin.adminRole === 'MAIN_ADMIN' ||
      currentAdmin.can_create_staff ||
      (currentAdmin.permissions && currentAdmin.permissions.includes('create_staff')))
  );

  const canCreateAdmin = Boolean(
    currentAdmin.is_active &&
    currentAdmin.status !== 'suspended' &&
    (currentAdmin.role_level === 'MAIN_ADMIN' ||
      currentAdmin.adminRole === 'MAIN_ADMIN' ||
      currentAdmin.can_create_admin ||
      (currentAdmin.permissions && currentAdmin.permissions.includes('create_admin')))
  );

  const canPerform = (action: string, module: string): { allowed: boolean; reason?: string } => {
    if (!currentAdmin.is_active || currentAdmin.status === 'suspended') {
      return { allowed: false, reason: 'This admin account has been deactivated or suspended.' };
    }
    const role = currentAdmin.adminRole;

    if (
      currentAdmin.role_level === 'MAIN_ADMIN' ||
      role === 'MAIN_ADMIN' ||
      currentAdmin.role_level === 'SUPER_ADMIN' ||
      role === 'SUPER_ADMIN'
    ) {
      return { allowed: true };
    }

    // Check granular permission list if direct match exists
    if (currentAdmin.permissions && currentAdmin.permissions.includes(action as GranularPermission)) {
      return { allowed: true };
    }

    if (role === 'VIEW_ONLY_ADMIN') {
      if (action.startsWith('view_') || action === 'read') return { allowed: true };
      return {
        allowed: false,
        reason: 'VIEW-ONLY ADMIN has read-only access. You cannot perform modifications, deletions or approvals.',
      };
    }

    if (role === 'PICKUP_ADMIN') {
      if (module === 'pickups') return { allowed: true };
      if (module === 'users' && action === 'view_users') return { allowed: true };
      if (module === 'tickets') return { allowed: true };
      if (module === 'staff' && canCreateStaff) return { allowed: true };
      return {
        allowed: false,
        reason: `PICKUP ADMIN cannot access ${module}. Permissions are strictly limited to pickup logistics operations.`,
      };
    }

    if (role === 'PAYOUT_ADMIN') {
      if (module === 'payouts') return { allowed: true };
      if (module === 'pickups' && action.startsWith('view_')) return { allowed: true };
      if (module === 'tickets') return { allowed: true };
      if (module === 'staff' && canCreateStaff) return { allowed: true };
      return {
        allowed: false,
        reason: `PAYOUT ADMIN cannot access ${module}. Permissions are strictly limited to financial payout verification.`,
      };
    }

    if (role === 'CONTENT_ADMIN') {
      if (module === 'content') return { allowed: true };
      if (module === 'categories' && (action.startsWith('view_') || action.includes('description'))) return { allowed: true };
      return {
        allowed: false,
        reason: `CONTENT ADMIN cannot access ${module}. Permissions are strictly limited to website content, FAQs and banners.`,
      };
    }

    return { allowed: false, reason: `Unauthorized action: missing permission '${action}' for module '${module}'.` };
  };

  // ==========================================
  // ⚖️ DUAL APPROVAL SYSTEM (APPROVAL CENTER)
  // ==========================================
  const createApprovalRequest = (
    req: Omit<ApprovalRequest, 'id' | 'created_at' | 'status'>
  ): ApprovalRequest => {
    const newReq: ApprovalRequest = {
      ...req,
      id: `APR-2026-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    setApprovalRequests((prev) => [newReq, ...prev]);

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: `Created Approval Request: ${req.action_type}`,
      module: req.module as any,
      target_id: req.target_record_id,
      old_value: req.current_value,
      new_value: req.proposed_value,
      reason: req.reason,
      approval_request_id: newReq.id,
      result: 'pending_approval',
    });

    addNotification(
      '🛡️ Second Admin Approval Required!',
      `${newReq.id} submitted by ${currentAdmin.name} for ${req.target_title}. Requires review in Approval Center.`,
      'system',
      'admin'
    );

    return newReq;
  };

  const approveRequest = (requestId: string): { success: boolean; message: string } => {
    if (currentAdmin.adminRole !== 'MAIN_ADMIN') {
      logAuditEvent({
        actor_id: currentAdmin.id,
        actor_name: currentAdmin.name,
        actor_role: currentAdmin.adminRole,
        action: 'Unauthorized Approval Attempt',
        module: 'approval_center',
        target_id: requestId,
        reason: 'Only MAIN_ADMIN can authorize requests in Approval Center',
        result: 'blocked',
      });
      return { success: false, message: 'Insufficient permissions. Only Main Admin can authorize approvals.' };
    }

    const req = approvalRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Approval request not found.' };

    // STRICT SELF-APPROVAL PREVENTION
    if (currentAdmin.id === req.acting_admin_id) {
      logAuditEvent({
        actor_id: currentAdmin.id,
        actor_name: currentAdmin.name,
        actor_role: currentAdmin.adminRole,
        action: 'Self-Approval Blocked',
        module: 'approval_center',
        target_id: requestId,
        reason: 'Violation of self-approval rule: Admin cannot approve their own high-risk request',
        result: 'blocked',
      });
      return {
        success: false,
        message: 'Self-Approval Prohibited: You cannot approve your own change request. A different Main Admin must review and approve.',
      };
    }

    // Apply the authorized change
    if (req.action_type === 'PAYOUT_AMOUNT_CHANGE') {
      setPayouts((prev) =>
        prev.map((p) => (p.booking_id === req.target_record_id ? { ...p, amount: Number(req.proposed_value) } : p))
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === req.target_record_id ? { ...b, final_amount: Number(req.proposed_value) } : b))
      );
    } else if (req.action_type === 'RATE_MASTER_CHANGE') {
      setCategories((prev) =>
        prev.map((c) => (c.id === req.target_record_id ? { ...c, rate_per_kg: Number(req.proposed_value) } : c))
      );
      setScrapItems((prev) =>
        prev.map((item) => (item.category_id === req.target_record_id ? { ...item, current_rate: Number(req.proposed_value) } : item))
      );
    } else if (req.action_type === 'ADMIN_ROLE_CHANGE') {
      setAdminList((prev) =>
        prev.map((a) => (a.id === req.target_record_id ? { ...a, adminRole: req.proposed_value as AdminRole } : a))
      );
    } else if (req.action_type === 'ADMIN_DEACTIVATE') {
      setAdminList((prev) =>
        prev.map((a) => (a.id === req.target_record_id ? { ...a, is_active: false } : a))
      );
    } else if (req.action_type === 'MAINTENANCE_MODE_TOGGLE') {
      setSystemSettings((prev) => ({ ...prev, maintenance_mode: Boolean(req.proposed_value) }));
    }

    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              approver_admin_id: currentAdmin.id,
              approver_admin_name: currentAdmin.name,
              approved_at: new Date().toISOString(),
            }
          : r
      )
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: `Approved Request ${req.id}`,
      module: 'approval_center',
      target_id: req.target_record_id,
      old_value: req.current_value,
      new_value: req.proposed_value,
      approval_request_id: req.id,
      approver_id: currentAdmin.id,
      reason: `Dual Approval verified by ${currentAdmin.name}`,
      result: 'success',
    });

    return { success: true, message: `Request ${req.id} successfully approved and executed.` };
  };

  const rejectRequest = (requestId: string, reason: string): { success: boolean; message: string } => {
    if (currentAdmin.adminRole !== 'MAIN_ADMIN') {
      return { success: false, message: 'Only Main Admin can reject requests.' };
    }
    const req = approvalRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              approver_admin_id: currentAdmin.id,
              approver_admin_name: currentAdmin.name,
              rejection_reason: reason,
              approved_at: new Date().toISOString(),
            }
          : r
      )
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: `Rejected Request ${req.id}`,
      module: 'approval_center',
      target_id: req.target_record_id,
      reason: reason,
      approval_request_id: req.id,
      approver_id: currentAdmin.id,
      result: 'rejected',
    });

    return { success: true, message: `Request ${req.id} rejected.` };
  };

  // ==========================================
  // 👥 USER MANAGEMENT & BLOCK/UNBLOCK
  // ==========================================
  const toggleUserBlock = (userId: string, reason: string): { success: boolean; message: string } => {
    const auth = canPerform('manage_users', 'users');
    if (!auth.allowed) {
      logAuditEvent({
        actor_id: currentAdmin.id,
        actor_name: currentAdmin.name,
        actor_role: currentAdmin.adminRole,
        action: 'Blocked: Unauthorized User Block Attempt',
        module: 'users',
        target_id: userId,
        reason: auth.reason,
        result: 'blocked',
      });
      return { success: false, message: auth.reason || 'Insufficient permissions.' };
    }

    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'User not found.' };

    const newBlockedState = !(targetUser as any).is_blocked;
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_blocked: newBlockedState } : u))
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: newBlockedState ? 'Blocked User' : 'Unblocked User',
      module: 'users',
      target_id: userId,
      old_value: !newBlockedState ? 'active' : 'blocked',
      new_value: newBlockedState ? 'blocked' : 'active',
      reason: reason || 'Admin moderation action',
      result: 'success',
    });

    return {
      success: true,
      message: `User ${targetUser.full_name} is now ${newBlockedState ? 'BLOCKED' : 'ACTIVE'}.`,
    };
  };

  // ==========================================
  // 👨💼 ADMIN MANAGEMENT & PROTECTION
  // ==========================================
  const updateAdminRole = (
    targetAdminId: string,
    newRole: AdminRole,
    reason: string
  ): { success: boolean; message: string; requiresApproval?: boolean } => {
    const auth = canPerform('manage_admins', 'admins');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    // Prevent self-escalation
    if (currentAdmin.id === targetAdminId && currentAdmin.adminRole !== newRole) {
      return { success: false, message: 'Self-escalation prohibited: You cannot modify your own administrative role.' };
    }

    const target = adminList.find((a) => a.id === targetAdminId);
    if (!target) return { success: false, message: 'Admin not found.' };

    if (systemSettings.require_dual_approval_for_high_risk && (newRole === 'MAIN_ADMIN' || target.adminRole === 'MAIN_ADMIN')) {
      createApprovalRequest({
        action_type: 'ADMIN_ROLE_CHANGE',
        module: 'admins',
        target_record_id: targetAdminId,
        target_title: `${target.name} Role Change`,
        acting_admin_id: currentAdmin.id,
        acting_admin_name: currentAdmin.name,
        acting_admin_role: currentAdmin.adminRole,
        current_value: target.adminRole,
        proposed_value: newRole,
        difference: `${target.adminRole} ➔ ${newRole}`,
        reason: reason || 'Administrative role restructuring',
      });
      return {
        success: true,
        message: 'High-risk role change submitted to Approval Center for second admin authorization.',
        requiresApproval: true,
      };
    }

    setAdminList((prev) =>
      prev.map((a) => (a.id === targetAdminId ? { ...a, adminRole: newRole } : a))
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Updated Admin Role',
      module: 'admins',
      target_id: targetAdminId,
      old_value: target.adminRole,
      new_value: newRole,
      reason: reason || 'Direct authorized role change',
      result: 'success',
    });

    return { success: true, message: `Role for ${target.name} updated to ${newRole}.` };
  };

  const toggleAdminStatus = (targetAdminId: string, reason: string): { success: boolean; message: string } => {
    const auth = canPerform('manage_admins', 'admins');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    const target = adminList.find((a) => a.id === targetAdminId);
    if (!target) return { success: false, message: 'Admin not found.' };

    // Prevent Last Active Main Admin deactivation
    const activeMainAdmins = adminList.filter((a) => a.adminRole === 'MAIN_ADMIN' && a.is_active);
    if (target.adminRole === 'MAIN_ADMIN' && target.is_active && activeMainAdmins.length <= 1) {
      return { success: false, message: 'Security Block: Cannot deactivate the last remaining active Main Admin.' };
    }

    // Prevent self-deactivation
    if (currentAdmin.id === targetAdminId) {
      return { success: false, message: 'Self-deactivation is disabled for security safety.' };
    }

    const newStatus = !target.is_active;
    setAdminList((prev) =>
      prev.map((a) => (a.id === targetAdminId ? { ...a, is_active: newStatus } : a))
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: newStatus ? 'Activated Admin' : 'Deactivated Admin',
      module: 'admins',
      target_id: targetAdminId,
      reason: reason || 'Admin status modified',
      result: 'success',
    });

    return { success: true, message: `Admin ${target.name} is now ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.` };
  };

  // ==========================================
  // 👥 NEW ADMIN & STAFF HIERARCHY MANAGEMENT
  // ==========================================
  const createAdminAccount = async (data: {
    name: string;
    email: string;
    phone?: string;
    custom_title: string;
    description?: string;
    permissions: GranularPermission[];
    can_create_staff: boolean;
    can_create_admin: boolean;
    status?: AccountStatus;
    initial_password?: string;
    force_password_reset?: boolean;
  }): Promise<{ success: boolean; message: string; admin?: AdminUser }> => {
    if (!canCreateAdmin) {
      logAuditEvent({
        actor_id: currentAdmin.id,
        actor_name: currentAdmin.name,
        actor_role: currentAdmin.adminRole,
        action: 'Blocked: Unauthorized Admin Creation Attempt',
        module: 'admins',
        reason: 'Current admin does not hold Can Create Admin authorization',
        result: 'blocked',
      });
      return {
        success: false,
        message: 'Permission Denied: Only Main Admin (or authorized admins with Can Create Admin) can create new administrators.',
      };
    }

    if (!data.name.trim() || !data.email.trim() || !data.custom_title.trim()) {
      return { success: false, message: 'Please provide full name, email address, and a designated custom title.' };
    }

    // Role escalation protection: An Admin cannot create a Main Admin unless the creator is a Main Admin
    const isMainAdminCreator = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    const targetRoleLevel: RoleLevel = 'ADMIN';

    // Map adminRole for backward compatibility
    let mappedRole: AdminRole = 'VIEW_ONLY_ADMIN';
    const titleLower = data.custom_title.toLowerCase();
    if (titleLower.includes('pickup') || titleLower.includes('logistics') || titleLower.includes('dispatch')) {
      mappedRole = 'PICKUP_ADMIN';
    } else if (titleLower.includes('payout') || titleLower.includes('finance')) {
      mappedRole = 'PAYOUT_ADMIN';
    } else if (titleLower.includes('content') || titleLower.includes('faq')) {
      mappedRole = 'CONTENT_ADMIN';
    } else if (isMainAdminCreator && titleLower.includes('main')) {
      mappedRole = 'MAIN_ADMIN';
    }

    // Firebase mode: naye admin ka asli Firebase account banao (har device login)
    let firebaseUid: string | undefined;
    if (firebaseAuth.currentUser) {
      if (!data.initial_password?.trim()) {
        return { success: false, message: 'Admin password zaroori hai - isi se naya admin login karega.' };
      }
      if (data.initial_password.trim().length < 6) {
        return { success: false, message: 'Password kam se kam 6 characters ka hona chahiye.' };
      }
      const created = await createAuthUserWithoutSignOut(
        data.email.trim().toLowerCase(),
        data.initial_password.trim()
      );
      if (!created.success || !created.uid) {
        return { success: false, message: `Admin ka Firebase account nahi ban paya: ${created.message}` };
      }
      firebaseUid = created.uid;
    }

    const newAdminId = firebaseUid || `adm-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;
    const newAdmin: AdminUser = {
      id: newAdminId,
      firebase_uid: firebaseUid,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      role_level: targetRoleLevel,
      adminRole: mappedRole,
      custom_title: data.custom_title.trim(),
      description: data.description?.trim(),
      status: data.status || 'active',
      is_active: (data.status || 'active') === 'active',
      avatar_url: '',
      permissions: data.permissions || [],
      can_create_staff: Boolean(data.can_create_staff),
      can_create_admin: Boolean(data.can_create_admin && isMainAdminCreator),
      max_creatable_role: 'STAFF',
      created_by: currentAdmin.id,
      created_by_name: currentAdmin.name,
      created_at: new Date().toISOString(),
      permissions_summary: `${data.custom_title} • ${data.permissions.length} granular permissions granted`,
      must_change_password: data.force_password_reset ?? true,
    };

    setAdminList((prev) => [newAdmin, ...prev]);

    if (firebaseUid) {
      const profileDoc: any = JSON.parse(JSON.stringify(newAdmin));
      delete profileDoc.password_hash;
      setDoc(doc(db, 'appUsers', firebaseUid), {
        role: 'admin',
        email: newAdmin.email.toLowerCase(),
        name: newAdmin.name,
        created_at: newAdmin.created_at,
      }).catch(() => {});
      setDoc(doc(db, 'adminProfiles', firebaseUid), profileDoc).catch(() => {});
    }

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Created New Administrator',
      module: 'admins',
      target_id: newAdmin.id,
      target_name: newAdmin.name,
      target_role: newAdmin.adminRole,
      new_title: newAdmin.custom_title,
      new_permissions: newAdmin.permissions,
      reason: `Provisioned by ${currentAdmin.name} with ${newAdmin.permissions.length} permissions. Can Create Staff: ${newAdmin.can_create_staff ? 'YES' : 'NO'}. (Password encrypted and never logged)`,
      result: 'success',
    });

    addNotification(
      'New Admin Account Created 👤',
      `${newAdmin.name} appointed as "${newAdmin.custom_title}".`,
      'system',
      'admin'
    );

    return {
      success: true,
      message: firebaseUid
        ? `Admin "${newAdmin.name}" ban gaya. Ab wo KISI BHI phone se apne email (${newAdmin.email}) aur set kiye hue password se Admin Login kar sakta hai.`
        : `Admin "${newAdmin.name}" (${newAdmin.custom_title}) created successfully (sirf isi device par).`,
      admin: newAdmin,
    };
  };

  const updateAdminAccount = (
    adminId: string,
    updates: {
      name?: string;
      custom_title?: string;
      description?: string;
      permissions?: GranularPermission[];
      can_create_staff?: boolean;
      can_create_admin?: boolean;
      status?: AccountStatus;
    },
    reason?: string
  ): { success: boolean; message: string } => {
    const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    if (!isMainAdmin && !hasPermission('change_admin_permissions')) {
      return { success: false, message: 'Permission Denied: Only Main Admin can modify admin permissions and titles.' };
    }

    // Prevent self-escalation
    if (adminId === currentAdmin.id && updates.permissions && updates.permissions.length > currentAdmin.permissions.length) {
      return { success: false, message: 'Self-Escalation Prohibited: You cannot expand your own permissions.' };
    }

    const target = adminList.find((a) => a.id === adminId);
    if (!target) return { success: false, message: 'Admin account not found.' };

    // Prevent deactivating the last active Main Admin
    if (updates.status && updates.status !== 'active' && target.role_level === 'MAIN_ADMIN') {
      const activeMainAdmins = adminList.filter((a) => a.role_level === 'MAIN_ADMIN' && a.is_active && a.id !== adminId);
      if (activeMainAdmins.length === 0) {
        return { success: false, message: 'Security Block: Cannot deactivate or suspend the last remaining active Main Admin.' };
      }
    }

    const oldTitle = target.custom_title;
    const oldPermissions = target.permissions;

    setAdminList((prev) =>
      prev.map((a) => {
        if (a.id !== adminId) return a;
        const newStatus = updates.status !== undefined ? updates.status : a.status;
        return {
          ...a,
          name: updates.name !== undefined ? updates.name : a.name,
          custom_title: updates.custom_title !== undefined ? updates.custom_title : a.custom_title,
          description: updates.description !== undefined ? updates.description : a.description,
          permissions: updates.permissions !== undefined ? updates.permissions : a.permissions,
          can_create_staff: updates.can_create_staff !== undefined ? updates.can_create_staff : a.can_create_staff,
          can_create_admin: updates.can_create_admin !== undefined ? updates.can_create_admin : a.can_create_admin,
          status: newStatus,
          is_active: newStatus === 'active',
          permissions_summary: `${updates.custom_title || a.custom_title} • ${(updates.permissions || a.permissions).length} permissions`,
        };
      })
    );

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Updated Administrator Profile & Permissions',
      module: 'admins',
      target_id: adminId,
      target_name: target.name,
      target_role: target.adminRole,
      old_title: oldTitle,
      new_title: updates.custom_title || oldTitle,
      old_permissions: oldPermissions,
      new_permissions: updates.permissions || oldPermissions,
      reason: reason || 'Administrative restructuring and permission tuning',
      result: 'success',
    });

    if (target.firebase_uid) {
      const newStatus = updates.status !== undefined ? updates.status : target.status;
      const updatedAdmin: any = {
        ...target,
        name: updates.name !== undefined ? updates.name : target.name,
        custom_title: updates.custom_title !== undefined ? updates.custom_title : target.custom_title,
        description: updates.description !== undefined ? updates.description : target.description,
        permissions: updates.permissions !== undefined ? updates.permissions : target.permissions,
        can_create_staff: updates.can_create_staff !== undefined ? updates.can_create_staff : target.can_create_staff,
        can_create_admin: updates.can_create_admin !== undefined ? updates.can_create_admin : target.can_create_admin,
        status: newStatus,
        is_active: newStatus === 'active',
      };
      delete updatedAdmin.password_hash;
      setDoc(doc(db, 'adminProfiles', target.firebase_uid), JSON.parse(JSON.stringify(updatedAdmin)), { merge: true }).catch(() => {});
    }

    return { success: true, message: `Admin account "${target.name}" updated successfully.` };
  };

  const createStaffMember = async (data: {
    name: string;
    email: string;
    phone?: string;
    staff_title: string;
    description?: string;
    permissions: GranularPermission[];
    status?: AccountStatus;
    vehicle_number?: string;
    vehicle_type?: string;
    initial_password?: string;
  }): Promise<{ success: boolean; message: string; staff?: StaffMember }> => {
    if (!canCreateStaff) {
      logAuditEvent({
        actor_id: currentAdmin.id,
        actor_name: currentAdmin.name,
        actor_role: currentAdmin.adminRole,
        action: 'Blocked: Unauthorized Staff Creation Attempt',
        module: 'staff',
        reason: 'Admin does not hold Can Create Staff permission',
        result: 'blocked',
      });
      return { success: false, message: 'Permission Denied: Your account does not have authorization to create staff.' };
    }

    if (!data.name.trim() || !data.email.trim() || !data.staff_title.trim()) {
      return { success: false, message: 'Please provide staff full name, email, and designated staff title.' };
    }

    // Firebase mode: admin Firebase se logged-in hai to staff ka asli Firebase
    // account banao - staff phir KISI BHI phone se email + password se login karega.
    let firebaseUid: string | undefined;
    if (firebaseAuth.currentUser) {
      if (!data.initial_password?.trim()) {
        return { success: false, message: 'Staff password zaroori hai - isi se staff apne phone pe login karega.' };
      }
      if (data.initial_password.trim().length < 6) {
        return { success: false, message: 'Password kam se kam 6 characters ka hona chahiye.' };
      }
      const created = await createAuthUserWithoutSignOut(
        data.email.trim().toLowerCase(),
        data.initial_password.trim()
      );
      if (!created.success || !created.uid) {
        return { success: false, message: `Staff ka Firebase account nahi ban paya: ${created.message}` };
      }
      firebaseUid = created.uid;
    }
    const newStaffId = firebaseUid || `stf-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;
    const initialHash = !firebaseUid && data.initial_password?.trim()
      ? await hashPassword(data.initial_password.trim())
      : undefined;
    const newStaff: StaffMember = {
      id: newStaffId,
      firebase_uid: firebaseUid,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      role_level: 'STAFF',
      staff_title: data.staff_title.trim(),
      description: data.description?.trim(),
      status: data.status || 'active',
      is_active: (data.status || 'active') === 'active',
      avatar_url: '',
      permissions: data.permissions || [],
      created_by: currentAdmin.id,
      created_by_name: `${currentAdmin.name} (${currentAdmin.custom_title || currentAdmin.adminRole})`,
      managed_by: currentAdmin.id,
      managed_by_name: currentAdmin.name,
      vehicle_number: data.vehicle_number?.trim(),
      vehicle_type: data.vehicle_type?.trim() || (data.vehicle_number ? 'Pickup Van' : undefined),
      rating: 5.0,
      total_pickups_completed: 0,
      is_online: false,
      created_at: new Date().toISOString(),
      must_change_password: true,
      password_hash: initialHash,
    };

    setStaffMembers((prev) => [newStaff, ...prev]);

    if (firebaseUid) {
      const profileDoc: any = JSON.parse(JSON.stringify(newStaff));
      delete profileDoc.password_hash;
      setDoc(doc(db, 'appUsers', firebaseUid), {
        role: 'staff',
        email: newStaff.email.toLowerCase(),
        name: newStaff.name,
        created_at: newStaff.created_at,
      }).catch(() => {});
      setDoc(doc(db, 'staffProfiles', firebaseUid), profileDoc).catch(() => {});
    }

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Created Staff Member',
      module: 'staff',
      target_id: newStaff.id,
      target_name: newStaff.name,
      target_role: 'STAFF',
      new_title: newStaff.staff_title,
      new_permissions: newStaff.permissions,
      reason: `Staff recruited by ${currentAdmin.name} with ${newStaff.permissions.length} operational permissions. (Credentials encrypted)`,
      result: 'success',
    });

    addNotification(
      'New Staff Member Added 🚚',
      `${newStaff.name} appointed as "${newStaff.staff_title}" under ${currentAdmin.name}.`,
      'staff',
      'admin'
    );

    return {
      success: true,
      message: firebaseUid
        ? `Staff "${newStaff.name}" ban gaya. Ab wo KISI BHI phone se apne email (${newStaff.email}) aur set kiye hue password se login kar sakta hai.`
        : `Staff member "${newStaff.name}" (${newStaff.staff_title}) onboarded successfully (sirf isi device par - Firebase login se banane par har device chalega).`,
      staff: newStaff,
    };
  };

  const updateStaffMember = (
    staffId: string,
    updates: {
      name?: string;
      staff_title?: string;
      description?: string;
      permissions?: GranularPermission[];
      status?: AccountStatus;
      vehicle_number?: string;
      vehicle_type?: string;
      managed_by?: string;
      managed_by_name?: string;
    },
    reason?: string
  ): { success: boolean; message: string } => {
    const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    const target = staffMembers.find((s) => s.id === staffId);
    if (!target) return { success: false, message: 'Staff member not found.' };

    const isDirectManager = target.managed_by === currentAdmin.id || target.created_by === currentAdmin.id;
    if (!isMainAdmin && !isDirectManager && !hasPermission('edit_staff')) {
      return { success: false, message: 'Permission Denied: You can only manage staff members reporting under your administration.' };
    }

    const oldTitle = target.staff_title;
    const oldPermissions = target.permissions;

    setStaffMembers((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const newStatus = updates.status !== undefined ? updates.status : s.status;
        return {
          ...s,
          name: updates.name !== undefined ? updates.name : s.name,
          staff_title: updates.staff_title !== undefined ? updates.staff_title : s.staff_title,
          description: updates.description !== undefined ? updates.description : s.description,
          permissions: updates.permissions !== undefined ? updates.permissions : s.permissions,
          status: newStatus,
          is_active: newStatus === 'active',
          vehicle_number: updates.vehicle_number !== undefined ? updates.vehicle_number : s.vehicle_number,
          vehicle_type: updates.vehicle_type !== undefined ? updates.vehicle_type : s.vehicle_type,
          managed_by: updates.managed_by !== undefined ? updates.managed_by : s.managed_by,
          managed_by_name: updates.managed_by_name !== undefined ? updates.managed_by_name : s.managed_by_name,
        };
      })
    );

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: updates.managed_by && updates.managed_by !== target.managed_by ? 'Reassigned Staff Managing Admin' : 'Updated Staff Member Profile & Permissions',
      module: 'staff',
      target_id: staffId,
      target_name: target.name,
      target_role: 'STAFF',
      old_title: oldTitle,
      new_title: updates.staff_title || oldTitle,
      old_permissions: oldPermissions,
      new_permissions: updates.permissions || oldPermissions,
      reason: reason || (updates.managed_by ? `Reassigned to ${updates.managed_by_name}` : 'Staff duties reassignment'),
      result: 'success',
    });

    if (target.firebase_uid) {
      const newStatus = updates.status !== undefined ? updates.status : target.status;
      const updatedStaff: any = {
        ...target,
        name: updates.name !== undefined ? updates.name : target.name,
        staff_title: updates.staff_title !== undefined ? updates.staff_title : target.staff_title,
        description: updates.description !== undefined ? updates.description : target.description,
        permissions: updates.permissions !== undefined ? updates.permissions : target.permissions,
        status: newStatus,
        is_active: newStatus === 'active',
        vehicle_number: updates.vehicle_number !== undefined ? updates.vehicle_number : target.vehicle_number,
        vehicle_type: updates.vehicle_type !== undefined ? updates.vehicle_type : target.vehicle_type,
        managed_by: updates.managed_by !== undefined ? updates.managed_by : target.managed_by,
        managed_by_name: updates.managed_by_name !== undefined ? updates.managed_by_name : target.managed_by_name,
      };
      delete updatedStaff.password_hash;
      setDoc(doc(db, 'staffProfiles', target.firebase_uid), JSON.parse(JSON.stringify(updatedStaff)), { merge: true }).catch(() => {});
    }

    return { success: true, message: `Staff "${target.name}" updated successfully.` };
  };

  const resetAdminPassword = (adminId: string): { success: boolean; message: string; tempPass?: string } => {
    const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    if (!isMainAdmin && !hasPermission('change_admin_permissions')) {
      return { success: false, message: 'Permission Denied: Only Main Admin can reset administrator credentials.' };
    }
    const target = adminList.find((a) => a.id === adminId);
    if (!target) return { success: false, message: 'Admin not found.' };

    if (target.firebase_uid) {
      sendPasswordResetEmail(firebaseAuth, target.email).catch(() => {});
      return {
        success: true,
        message: `Password reset email ${target.email} pe bhej di gayi hai. Us link se wo apna naya password set kar lega.`,
      };
    }

    const tempPass = `SG-Adm#${Math.floor(1000 + Math.random() * 9000)}!`;
    setAdminList((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, must_change_password: true } : a))
    );

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Issued Temporary Password Reset',
      module: 'admins',
      target_id: adminId,
      target_name: target.name,
      reason: `Temporary setup credentials generated for ${target.email}. Force password change on first login enabled.`,
      result: 'success',
    });

    return {
      success: true,
      message: `Setup password generated for ${target.name}. They will be prompted to reset upon initial sign-in.`,
      tempPass,
    };
  };

  const resetStaffPassword = (staffId: string): { success: boolean; message: string; tempPass?: string } => {
    const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    const target = staffMembers.find((s) => s.id === staffId);
    if (!target) return { success: false, message: 'Staff member not found.' };
    const isDirectManager = target.managed_by === currentAdmin.id || target.created_by === currentAdmin.id;
    if (!isMainAdmin && !isDirectManager && !hasPermission('edit_staff')) {
      return { success: false, message: 'Permission Denied: You can only reset credentials for staff under your direct supervision.' };
    }

    if (target.firebase_uid) {
      sendPasswordResetEmail(firebaseAuth, target.email).catch(() => {});
      return {
        success: true,
        message: `Password reset email ${target.email} pe bhej di gayi hai. Us link se staff apna naya password set kar lega.`,
      };
    }

    const tempPass = `SG-Stf#${Math.floor(1000 + Math.random() * 9000)}!`;
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, must_change_password: true } : s))
    );

    logAuditEvent({
      action_id: `ACT-${Date.now()}`,
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Issued Staff Credential Reset',
      module: 'staff',
      target_id: staffId,
      target_name: target.name,
      reason: `Field device setup credentials issued for ${target.email}. Force password change enabled.`,
      result: 'success',
    });

    return {
      success: true,
      message: `Temporary credentials generated for ${target.name}.`,
      tempPass,
    };
  };

  // ==========================================
  // 💰 PAYOUT OPERATIONS & PAID PROTECTION
  // ==========================================
  const updatePayoutAmount = (
    payoutId: string,
    newAmount: number,
    reason: string
  ): { success: boolean; message: string; requiresApproval?: boolean } => {
    const auth = canPerform('manage_payouts', 'payouts');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) return { success: false, message: 'Payout record not found.' };

    // Paid record protection: Once marked Paid, normal admins cannot edit casually
    if (payout.status === 'successful' && currentAdmin.adminRole !== 'MAIN_ADMIN') {
      return { success: false, message: 'Paid Record Protected: Completed payouts can only be adjusted via Main Admin exception.' };
    }

    // Dual approval check if enabled and amount difference is high
    const isHighRisk =
      systemSettings.require_dual_approval_for_high_risk &&
      Math.abs(newAmount - payout.amount) >= 2000;

    if (isHighRisk) {
      createApprovalRequest({
        action_type: 'PAYOUT_AMOUNT_CHANGE',
        module: 'payouts',
        target_record_id: payout.booking_id,
        target_title: `Payout for ${payout.customer_name} (${payout.booking_number})`,
        acting_admin_id: currentAdmin.id,
        acting_admin_name: currentAdmin.name,
        acting_admin_role: currentAdmin.adminRole,
        current_value: payout.amount,
        proposed_value: newAmount,
        difference: `₹${payout.amount} ➔ ₹${newAmount} (${newAmount > payout.amount ? '+' : ''}₹${newAmount - payout.amount})`,
        reason: reason || 'Reweighed items adjustment',
      });
      return {
        success: true,
        message: 'High-risk payout modification submitted to Approval Center for second admin review.',
        requiresApproval: true,
      };
    }

    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, amount: newAmount } : p))
    );
    setBookings((prev) =>
      prev.map((b) => (b.id === payout.booking_id ? { ...b, final_amount: newAmount } : b))
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Updated Payout Amount',
      module: 'payouts',
      target_id: payoutId,
      old_value: payout.amount,
      new_value: newAmount,
      reason: reason || 'Operational adjustment',
      result: 'success',
    });

    return { success: true, message: `Payout amount updated to ₹${newAmount}.` };
  };

  const updatePayoutStatusRecord = (
    payoutId: string,
    status: PayoutStatus,
    reference?: string,
    reason?: string
  ): { success: boolean; message: string; requiresApproval?: boolean } => {
    const auth = canPerform('manage_payouts', 'payouts');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) return { success: false, message: 'Payout not found.' };

    // Paid record protection
    if (payout.status === 'successful' && status !== 'successful' && currentAdmin.adminRole !== 'MAIN_ADMIN') {
      return { success: false, message: 'Paid Record Protected: Cannot revert Paid status without Main Admin exception.' };
    }

    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status,
              transaction_reference: reference || p.transaction_reference,
              processed_by_admin: currentAdmin.name,
              processed_at: new Date().toISOString(),
            }
          : p
      )
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === payout.booking_id
          ? {
              ...b,
              payout_status: status,
              payout_reference: reference || b.payout_reference,
            }
          : b
      )
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: `Changed Payout Status to ${status.toUpperCase()}`,
      module: 'payouts',
      target_id: payoutId,
      old_value: payout.status,
      new_value: status,
      reason: reason || `Reference: ${reference || 'N/A'}`,
      result: 'success',
    });

    return { success: true, message: `Payout marked as ${status.toUpperCase()}.` };
  };

  // ==========================================
  // 🚚 PICKUP OPERATIONAL STATUS
  // ==========================================
  const updateBookingOperationalStatus = (
    bookingId: string,
    newStatus: BookingStatus,
    reason?: string
  ): { success: boolean; message: string } => {
    const auth = canPerform('manage_pickups', 'pickups');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    // Prevent invalid transitions: Completed -> Pending is forbidden unless Main Admin
    if (booking.status === 'completed' && newStatus !== 'completed' && currentAdmin.adminRole !== 'MAIN_ADMIN') {
      return { success: false, message: 'Invalid Transition: Completed pickup cannot be reverted back to pending.' };
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, updated_at: new Date().toISOString() } : b))
    );

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: `Pickup Status Changed to ${newStatus.toUpperCase()}`,
      module: 'pickups',
      target_id: bookingId,
      old_value: booking.status,
      new_value: newStatus,
      reason: reason || 'Operational status progression',
      result: 'success',
    });

    return { success: true, message: `Pickup status updated to ${newStatus.toUpperCase()}.` };
  };

  // ==========================================
  // ♻️ SCRAP ITEMS & MASTER RATES
  // ==========================================
  const addScrapItem = (item: Omit<ScrapItemMaterial, 'id' | 'updated_at'>) => {
    const auth = canPerform('manage_rates', 'rates');
    if (!auth.allowed) return;
    const newItem: ScrapItemMaterial = {
      ...item,
      id: `item-${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    setScrapItems((prev) => [newItem, ...prev]);
    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Created Scrap Item',
      module: 'rates',
      target_id: newItem.id,
      new_value: newItem.name,
      result: 'success',
    });
  };

  const updateScrapItemRate = (
    itemId: string,
    newRate: number,
    reason: string
  ): { success: boolean; message: string; requiresApproval?: boolean } => {
    const auth = canPerform('manage_rates', 'rates');
    if (!auth.allowed && currentAdmin.adminRole !== 'SUPER_ADMIN' && currentAdmin.adminRole !== 'MAIN_ADMIN' && currentAdmin.role_level !== 'SUPER_ADMIN' && currentAdmin.role_level !== 'MAIN_ADMIN') {
      return { success: false, message: auth.reason || 'Insufficient permissions.' };
    }

    // Always update categories array if itemId matches category ID or item ID
    setCategories((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, rate_per_kg: newRate } : c))
    );

    // Always update scrapItems array if itemId matches item ID or category_id
    setScrapItems((prev) =>
      prev.map((i) =>
        i.id === itemId || i.category_id === itemId
          ? { ...i, current_rate: newRate, updated_at: new Date().toISOString() }
          : i
      )
    );

    const cat = categories.find((c) => c.id === itemId);
    const item = scrapItems.find((i) => i.id === itemId || i.category_id === itemId);

    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole || 'SUPER_ADMIN',
      action: 'Updated Scrap Rate',
      module: 'rates',
      target_id: itemId,
      old_value: cat?.rate_per_kg || item?.current_rate || 0,
      new_value: newRate,
      reason: reason || 'Mandi rate adjustment',
      result: 'success',
    });

    addNotification('Rate Updated', `Rate for ${cat?.name || item?.name || 'Scrap'} updated to ₹${newRate}/${cat?.unit || 'kg'}`, 'system', 'all');

    return { success: true, message: `Rate updated to ₹${newRate}` };
  };

  const toggleScrapItemStatus = (itemId: string) => {
    const auth = canPerform('manage_rates', 'rates');
    if (!auth.allowed) return;
    setScrapItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_active: !i.is_active } : i))
    );
  };

  // ==========================================
  // ⚙️ SETTINGS & CONTENT
  // ==========================================
  const updateSystemSettings = (
    settings: Partial<SystemSettings>,
    reason?: string
  ): { success: boolean; message: string } => {
    const auth = canPerform('manage_settings', 'settings');
    if (!auth.allowed) return { success: false, message: auth.reason || 'Insufficient permissions.' };

    setSystemSettings((prev) => ({ ...prev, ...settings }));
    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Updated System Settings',
      module: 'settings',
      reason: reason || 'Admin settings configuration',
      result: 'success',
    });
    return { success: true, message: 'System settings saved successfully.' };
  };

  const updateWebsiteContent = (id: string, updates: Partial<WebsiteContentItem>) => {
    const auth = canPerform('manage_content', 'content');
    if (!auth.allowed) return;

    setWebsiteContent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString(), updated_by: currentAdmin.name } : item))
    );
    logAuditEvent({
      actor_id: currentAdmin.id,
      actor_name: currentAdmin.name,
      actor_role: currentAdmin.adminRole,
      action: 'Updated Website Content',
      module: 'content',
      target_id: id,
      result: 'success',
    });
  };

  return (
    <ScrapContext.Provider
      value={{
        activePortal,
        setActivePortal,
        language,
        setLanguage,
        theme,
        toggleTheme,
        t,
        getCategoryName: getCategoryNameHelper,
        getCategoryDesc: getCategoryDescHelper,
        getStatusLabel: getStatusLabelHelper,
        getPayoutMethodLabel: getPayoutMethodLabelHelper,
        currentUser,
        setCurrentUser,
        staffList,
        selectedStaffAgent,
        setSelectedStaffAgent,
        adminLogin,
        staffLogin,
        logoutUser,
        firebaseRole,
        refreshSharedData,
        requestLoginReset,
        categories,
        addCategory,
        updateCategoryRate,
        updateCategoryDetails,
        toggleCategoryStatus,
        deleteCategory,
        deleteScrapItem,
        serviceAreas,
        addServiceArea,
        toggleServiceArea,
        bookings,
        createBooking,
        assignStaffToBooking,
        staffAcceptBooking,
        staffStartJourney,
        staffMarkArrived,
        staffCancelBooking,
        cancelBookingCustomer,
        staffVerifyOtp,
        staffCompleteWeighing,
        submitPickupRating,
        payouts,
        approvePayout,
        rejectPayout,
        tickets,
        createTicket,
        aiBotLookupBooking,
        replyToTicket,
        closeTicket,
        reopenTicket,
        syncTicketReplyFromMirror,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        firebaseConnected: true,
        refreshFirebaseStatus,
        resetToSampleData,
        isOverlayActive,
        setOverlayActive,
        currentAdmin,
        setCurrentAdmin,
        adminList,
        staffMembers,
        createAdminAccount,
        updateAdminAccount,
        createStaffMember,
        updateStaffMember,
        resetAdminPassword,
        resetStaffPassword,
        hasPermission,
        canCreateStaff,
        canCreateAdmin,
        updateAdminRole,
        toggleAdminStatus,
        canPerform,
        approvalRequests,
        createApprovalRequest,
        approveRequest,
        rejectRequest,
        auditLogs,
        logAuditEvent,
        systemSettings,
        updateSystemSettings,
        websiteContent,
        updateWebsiteContent,
        scrapItems,
        addScrapItem,
        updateScrapItemRate,
        toggleScrapItemStatus,
        allUsers,
        toggleUserBlock,
        updatePayoutAmount,
        updatePayoutStatusRecord,
        updateBookingOperationalStatus,
      }}
    >
      {children}
    </ScrapContext.Provider>
  );
};

export const useScrap = () => {
  const context = useContext(ScrapContext);
  if (!context) {
    throw new Error('useScrap must be used within a ScrapProvider');
  }
  return context;
};


