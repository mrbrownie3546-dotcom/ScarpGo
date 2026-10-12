import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { checkRateLimit, recordAction, resetRateLimit, getLoginSecurityState, recordFailedPasswordAttempt, recordSuccessfulLogin } from '../lib/rateLimiter';
import { auth as firebaseAuth, db, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
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
import { getStoredSupabaseConfig, getSupabase } from '../lib/supabaseClient';
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

  // Supabase Phone OTP Authentication & Roles
  authLoading: boolean;
  activeOtpCode: string | null;
  sendPhoneOtp: (
    phone: string,
    fullName?: string,
    role?: UserRole
  ) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyPhoneOtp: (
    phone: string,
    otp: string,
    skipPortalSwitch?: boolean
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  registerCustomerAccountWithPhone: (data: {
    phone: string;
    password: string;
    full_name: string;
    address: string;
    email?: string;
  }) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  customerPhoneLogin: (
    phone: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  sendForgotPasswordPhoneOtp: (
    phone: string
  ) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyForgotPasswordPhoneOtp: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>;
  resetCustomerPasswordWithPhone: (
    phone: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  sendEmailOtp: (
    email: string
  ) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyEmailOtp: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>;
  registerCustomerAccount: (data: {
    email: string;
    password: string;
    full_name: string;
    address: string;
    phone: string;
  }) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  customerEmailLogin: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  sendForgotPasswordOtp: (
    email: string
  ) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyForgotPasswordOtp: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>;
  resetCustomerPassword: (
    email: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  staffLogin: (loginIdOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  switchDemoUser: (role: UserRole) => void;

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

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Firebase & Database state
  firebaseConnected: boolean;
  refreshFirebaseStatus: () => void;
  supabaseConnected: boolean;
  refreshSupabaseStatus: () => void;
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
  }) => { success: boolean; message: string; admin?: AdminUser };
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
  }) => { success: boolean; message: string; staff?: StaffMember };
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
  AREAS: 'scrapgo_service_areas_v2',
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
        if (saved === 'hindi' || saved === 'hinglish' || saved === 'english') {
          return saved as Language;
        }
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

      // 2. Check subdomain e.g. admin.scrapgo.in or staff.scrapgo.in
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

  // Supabase Phone OTP Auth state
  const [authLoading, setAuthLoading] = useState(false);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [isOverlayActive, setOverlayActive] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{
    phone: string;
    fullName: string;
    role: UserRole;
    otp: string;
  } | null>(null);

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

  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(() => {
    return getStoredSupabaseConfig().isConnected;
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
      setRegisteredAccounts([]);
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

  const [registeredAccounts, setRegisteredAccounts] = useState<{
    phone: string;
    password: string;
    full_name: string;
    address: string;
    email?: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('scrapgo_customer_accounts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingEmailOtps, setPendingEmailOtps] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('scrapgo_customer_accounts_v1', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

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

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const role: UserRole = userData.role || (user.email?.includes('admin') ? 'admin' : 'customer');

          const profile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            full_name: userData.full_name || user.displayName || user.email?.split('@')[0] || 'Firebase User',
            phone: userData.phone || user.phoneNumber || '+91 98287 21470',
            role,
            created_at: userData.created_at || new Date().toISOString(),
            avatar_url: userData.avatar_url || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          };

          setCurrentUser(profile);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));
        } catch (err) {
          console.warn('Firebase user profile fetch notice:', err);
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (!stored) {
          setCurrentUser(CURRENT_CUSTOMER_USER);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const setActivePortal = (portal: 'customer' | 'staff' | 'admin') => {
    setActivePortalState(portal);
    localStorage.setItem(STORAGE_KEYS.PORTAL, portal);
  };

  const refreshSupabaseStatus = () => {
    setSupabaseConnected(getStoredSupabaseConfig().isConnected);
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
    setRegisteredAccounts([]);
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

  const confirmationResultRef = useRef<any>(null);

  // Password ko hash karta hai (plain text save nahi hota)
  const hashPassword = async (pwd: string): Promise<string> => {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return pwd;
    }
  };

  // Firebase se customer ki purani bookings wapas laata hai
  const syncCustomerBookings = async (phone: string) => {
    try {
      const q = query(collection(db, 'bookings'), where('customer_phone', '==', phone));
      const snap = await getDocs(q);
      const remote = snap.docs.map((d) => d.data() as Booking);
      if (remote.length > 0) {
        setBookings((prev) => {
          const ids = new Set(prev.map((b) => b.id));
          return [...prev, ...remote.filter((b) => !ids.has(b.id))];
        });
      }
    } catch (fbErr: any) {
      console.warn('Firebase booking sync notice:', fbErr?.message || fbErr);
    }
  };

  // ==========================================
  // 🔐 FIREBASE PHONE OTP AUTH & ROLE MANAGEMENT
  // ==========================================
  const sendPhoneOtp = async (
    phone: string,
    fullName: string = '',
    role: UserRole = 'customer'
  ): Promise<{ success: boolean; message: string; demoOtp?: string }> => {
    // Check Rate Limit for OTP dispatch
    const rateCheck = checkRateLimit('OTP', phone.trim());
    if (!rateCheck.isAllowed) {
      return {
        success: false,
        message: rateCheck.errorMessage || '🛑 OTP Dispatch Throttled: Too many OTP requests. Please wait.',
      };
    }
    recordAction('OTP', phone.trim());

    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      setPendingAuth({
        phone: cleanPhone,
        fullName: fullName.trim() || (role === 'admin' ? 'Admin Officer' : role === 'staff' ? 'Field Driver' : 'Valued Customer'),
        role,
        otp: generatedOtp,
      });

      // 1) Asli Firebase Phone Auth (console ke test numbers FREE mein chalte hain)
      try {
        let recaptchaContainer = document.getElementById('firebase-recaptcha-container');
        if (!recaptchaContainer) {
          recaptchaContainer = document.createElement('div');
          recaptchaContainer.id = 'firebase-recaptcha-container';
          document.body.appendChild(recaptchaContainer);
        }
        if (!(window as any).__scrapgoRecaptcha) {
          (window as any).__scrapgoRecaptcha = new RecaptchaVerifier(firebaseAuth, 'firebase-recaptcha-container', {
            size: 'invisible',
          });
        }
        const verifier = (window as any).__scrapgoRecaptcha;
        const result = await signInWithPhoneNumber(firebaseAuth, cleanPhone, verifier);
        confirmationResultRef.current = result;
        setAuthLoading(false);

        addNotification(
          'Phone OTP Sent 📲',
          `Verification OTP sent to ${cleanPhone} via SMS.`,
          'system',
          'all'
        );

        return {
          success: true,
          message: `OTP sent to ${cleanPhone} via SMS!`,
        };
      } catch (fbErr: any) {
        console.warn('Firebase phone auth notice, demo OTP fallback active:', fbErr?.message || fbErr);
        confirmationResultRef.current = null;
        try {
          (window as any).__scrapgoRecaptcha?.clear();
        } catch (e) {}
        (window as any).__scrapgoRecaptcha = null;
      }

      // 2) Demo OTP fallback (jab tak Firebase configured na ho)
      setActiveOtpCode(generatedOtp);
      setAuthLoading(false);

      addNotification(
        'Phone OTP Sent 📲',
        `Verification OTP sent to ${cleanPhone}. (Code: ${generatedOtp})`,
        'system',
        'all'
      );

      return {
        success: true,
        message: `OTP sent to ${cleanPhone}! Verification code: ${generatedOtp}.`,
        demoOtp: generatedOtp,
      };
    } catch (err: any) {
      setAuthLoading(false);
      return {
        success: false,
        message: err?.message || 'Failed to send OTP. Please check phone number.',
      };
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    otp: string,
    skipPortalSwitch: boolean = false
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const cleanOtp = otp.trim();

    try {
      let isVerified = false;

      if (confirmationResultRef.current) {
        // Asli Firebase OTP verification (test number ka code bhi yahin verify hota hai)
        try {
          await confirmationResultRef.current.confirm(cleanOtp);
          isVerified = true;
          confirmationResultRef.current = null;
        } catch (confirmErr: any) {
          console.warn('Firebase OTP confirmation notice:', confirmErr?.message || confirmErr);
        }
      } else if (cleanOtp === activeOtpCode || (pendingAuth && pendingAuth.otp === cleanOtp)) {
        // Demo mode fallback
        isVerified = true;
      }

      if (!isVerified) {
        setAuthLoading(false);
        return {
          success: false,
          message: 'Invalid OTP! Please enter the 6-digit verification code sent to your phone.',
        };
      }

      // If skipPortalSwitch is true (e.g. during step-by-step registration before details are entered)
      if (skipPortalSwitch) {
        setAuthLoading(false);
        return {
          success: true,
          message: 'Phone number verified successfully!',
        };
      }

      // Determine Role & Profile
      const onlyDigits = (p: string) => (p || '').replace(/\D/g, '');
      const approvedAdmin = adminList.find((a) => onlyDigits(a.phone) === onlyDigits(cleanPhone) && a.is_active !== false);
      const staffEntry = staffMembers.find((st) => onlyDigits(st.phone) === onlyDigits(cleanPhone) && st.is_active !== false);
      const targetRole = pendingAuth?.role || (approvedAdmin ? 'admin' : staffEntry ? 'staff' : 'customer');
      const targetName =
        pendingAuth?.fullName ||
        (targetRole === 'admin'
          ? 'Super Admin Officer'
          : targetRole === 'staff'
          ? 'Vikram Singh (Staff)'
          : 'Aman Verma');

      const userProfile: UserProfile = {
        id: 'usr-' + Date.now(),
        phone: cleanPhone,
        full_name: targetName,
        role: targetRole,
        created_at: new Date().toISOString(),
        avatar_url:
          targetRole === 'staff'
            ? SAMPLE_STAFF[0].avatar_url
            : targetRole === 'admin'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        vehicle_number: targetRole === 'staff' ? 'HR 10 AB 4921 (Mahindra Bolero)' : undefined,
      };

      // Persist in localStorage and state
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userProfile));
      setCurrentUser(userProfile);
      setPendingAuth(null);
      setActiveOtpCode(null);
      setAuthLoading(false);

      // Firebase se purani bookings sync karo
      syncCustomerBookings(cleanPhone);

      // Automatically route user to their respective portal based on role!
      if (targetRole === 'staff') {
        setActivePortal('staff');
      } else if (targetRole === 'admin') {
        setActivePortal('admin');
      } else {
        setActivePortal('customer');
      }

      addNotification(
        'Login Successful ✅',
        `Logged in as ${userProfile.full_name} (${userProfile.role.toUpperCase()})`,
        'system',
        'all'
      );

      return {
        success: true,
        message: `Welcome back, ${userProfile.full_name}! Successfully authenticated via Firebase.`,
        user: userProfile,
      };
    } catch (err: any) {
      setAuthLoading(false);
      return {
        success: false,
        message: err?.message || 'Authentication error occurred.',
      };
    }
  };

  // ==========================================
  // 📱 CUSTOMER PHONE OTP & PASSWORD AUTHENTICATION
  // ==========================================
  const registerCustomerAccountWithPhone = async (data: {
    phone: string;
    password: string;
    full_name: string;
    address: string;
    email?: string;
  }): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    setAuthLoading(true);
    const cleanPhone = data.phone.trim().startsWith('+') ? data.phone.trim() : `+91${data.phone.trim()}`;
    const cleanPassword = data.password.trim();
    const hashedPassword = await hashPassword(cleanPassword);
    const createdUserId = 'usr-cust-' + Date.now();

    try {
      try {
        await setDoc(doc(db, 'users', cleanPhone), {
          id: createdUserId,
          phone: cleanPhone,
          full_name: data.full_name,
          address: data.address,
          email: data.email || '',
          password: hashedPassword,
          role: 'customer',
          created_at: new Date().toISOString(),
        });
      } catch (fbErr: any) {
        console.warn('Firebase store user record notice:', fbErr);
      }

      const newAccount = {
        phone: cleanPhone,
        email: data.email || '',
        password: hashedPassword,
        full_name: data.full_name,
        address: data.address,
      };

      setRegisteredAccounts((prev) => [
        ...prev.filter((a) => a.phone !== cleanPhone),
        newAccount,
      ]);

      const newUserProfile: UserProfile = {
        id: createdUserId,
        phone: cleanPhone,
        email: data.email || `${cleanPhone.replace(/[^0-9]/g, '')}@scrapgo.app`,
        full_name: data.full_name,
        role: 'customer',
        created_at: new Date().toISOString(),
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };

      setAllUsers((prev) => [...prev.filter((u) => u.phone !== cleanPhone), newUserProfile]);
      setCurrentUser(newUserProfile);
      setActivePortal('customer');
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUserProfile));
      setAuthLoading(false);

      addNotification(
        'Account Created 🎉',
        `Welcome ${data.full_name}! Your account was created successfully with phone ${cleanPhone}.`,
        'system',
        'all'
      );

      return {
        success: true,
        message: 'Account created successfully!',
        user: newUserProfile,
      };
    } catch (err: any) {
      setAuthLoading(false);
      return { success: false, message: err?.message || 'Registration failed.' };
    }
  };

  const customerPhoneLogin = async (
    phone: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    const custKey = `cust_${phone.trim() || 'global'}`;
    const sec = getLoginSecurityState(custKey);

    if (sec.isBanned) {
      return {
        success: false,
        message: '🚫 ACCESS DENIED: Anti-Bot System Active. Excessive brute-force attempts detected. IP Address Banned.',
      };
    }

    if (sec.isLocked) {
      return {
        success: false,
        message: `🔒 Security Lockout Active: 3 lga taar galat password! Account ${sec.lockoutSeconds}s ke liye locked hai. Refresh/back par bhi timer active rahega.`,
      };
    }

    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const cleanPassword = password.trim();
    const hashedPassword = await hashPassword(cleanPassword);

    try {
      let loggedUser: UserProfile | null = null;

      try {
        const userDoc = await getDoc(doc(db, 'users', cleanPhone));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.password === hashedPassword || uData.password === cleanPassword) {
            loggedUser = {
              id: uData.id || 'usr-cust-' + Date.now(),
              phone: uData.phone || cleanPhone,
              email: uData.email || `${cleanPhone.replace(/[^0-9]/g, '')}@scrapgo.app`,
              full_name: uData.full_name || 'Valued Customer',
              role: 'customer',
              created_at: uData.created_at || new Date().toISOString(),
              avatar_url: uData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            };
          }
        }
      } catch (fbErr: any) {
        console.warn('Firebase phone query notice:', fbErr);
      }

      if (!loggedUser) {
        const savedAccount = registeredAccounts.find(
          (a) => a.phone === cleanPhone || a.phone.includes(phone.trim())
        );

        if (savedAccount && (savedAccount.password === hashedPassword || savedAccount.password === cleanPassword)) {
          loggedUser = {
            id: 'usr-cust-' + Date.now(),
            phone: savedAccount.phone,
            email: savedAccount.email || `${savedAccount.phone.replace(/[^0-9]/g, '')}@scrapgo.app`,
            full_name: savedAccount.full_name,
            role: 'customer',
            created_at: new Date().toISOString(),
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          };
        }
      }

      setAuthLoading(false);

      if (loggedUser) {
        recordSuccessfulLogin(custKey);
        resetRateLimit('LOGIN', phone.trim());
        setCurrentUser(loggedUser);
        setActivePortal('customer');
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(loggedUser));
        syncCustomerBookings(cleanPhone);

        addNotification(
          'Login Successful ✅',
          `Welcome back, ${loggedUser.full_name}!`,
          'system',
          'all'
        );

        return {
          success: true,
          message: `Welcome back, ${loggedUser.full_name}!`,
          user: loggedUser,
        };
      } else {
        const nextSec = recordFailedPasswordAttempt(custKey);
        if (nextSec.isBanned) {
          return {
            success: false,
            message: '🚫 ACCESS DENIED: Anti-Bot Defense Active. IP Banned due to excessive brute-force attempts.',
          };
        }
        if (nextSec.isLocked) {
          return {
            success: false,
            message: `🔒 Security Alert (Locked 30s): 3 lga taar galat password enter karne par account 30 seconds ke liye lock kar diya gaya hai.`,
          };
        }
        const remaining = Math.max(0, 3 - nextSec.failedAttempts);
        return {
          success: false,
          message: `🔐 Security Alert: Phone Number/Password galat hai. Remaining attempts: ${remaining}/3 before 30s lockout.`,
        };
      }
    } catch (err: any) {
      setAuthLoading(false);
      return { success: false, message: err?.message || 'Login failed.' };
    }
  };

  const sendForgotPasswordPhoneOtp = async (
    phone: string
  ): Promise<{ success: boolean; message: string; demoOtp?: string }> => {
    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      setPendingEmailOtps((prev) => ({ ...prev, [`forgot_phone_${cleanPhone}`]: generatedOtp }));
      setAuthLoading(false);

      addNotification(
        'Password Reset OTP Sent 📲',
        `Verification OTP sent to ${cleanPhone}. (Code: ${generatedOtp})`,
        'system',
        'all'
      );

      return {
        success: true,
        message: `Verification OTP code sent to ${cleanPhone}!`,
        demoOtp: generatedOtp,
      };
    } catch (err: any) {
      setAuthLoading(false);
      return {
        success: false,
        message: err?.message || 'Failed to send OTP to mobile number.',
      };
    }
  };

  const verifyForgotPasswordPhoneOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> => {
    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const cleanOtp = otp.trim();

    try {
      let isVerified = false;

      if (pendingEmailOtps[`forgot_phone_${cleanPhone}`] === cleanOtp) {
        isVerified = true;
      }

      setAuthLoading(false);

      if (isVerified) {
        return { success: true, message: 'OTP verified! Enter your new password below.' };
      } else {
        return { success: false, message: 'Invalid OTP! Please enter the 6-digit code sent to your phone.' };
      }
    } catch (err: any) {
      setAuthLoading(false);
      return { success: false, message: err?.message || 'Verification failed.' };
    }
  };

  const resetCustomerPasswordWithPhone = async (
    phone: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    setAuthLoading(true);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    const cleanPassword = newPassword.trim();
    const hashedPassword = await hashPassword(cleanPassword);

    try {
      try {
        await updateDoc(doc(db, 'users', cleanPhone), {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        });
      } catch (fbErr: any) {
        console.warn('Firebase password update notice:', fbErr);
      }

      setRegisteredAccounts((prev) => {
        const existing = prev.find((a) => a.phone === cleanPhone);
        if (existing) {
          return prev.map((a) =>
            a.phone === cleanPhone ? { ...a, password: hashedPassword } : a
          );
        } else {
          return [
            ...prev,
            {
              phone: cleanPhone,
              password: hashedPassword,
              full_name: 'Customer ' + cleanPhone.slice(-4),
              address: '',
            },
          ];
        }
      });

      setAuthLoading(false);

      addNotification(
        'Password Reset Complete 🔑',
        `Password updated for ${cleanPhone}. Login with your new password!`,
        'system',
        'all'
      );

      return {
        success: true,
        message: 'Password reset successful! You can now login with your new password.',
      };
    } catch (err: any) {
      setAuthLoading(false);
      return { success: false, message: err?.message || 'Password reset failed.' };
    }
  };

  // Backward compatibility alias helpers
  const sendEmailOtp = sendForgotPasswordPhoneOtp;
  const verifyEmailOtp = verifyForgotPasswordPhoneOtp;
  const registerCustomerAccount = (data: any) =>
    registerCustomerAccountWithPhone({
      phone: data.phone || data.email,
      password: data.password,
      full_name: data.full_name,
      address: data.address,
      email: data.email,
    });
  const customerEmailLogin = (email: string, pass: string) =>
    customerPhoneLogin(email, pass);
  const sendForgotPasswordOtp = sendForgotPasswordPhoneOtp;
  const verifyForgotPasswordOtp = verifyForgotPasswordPhoneOtp;
  const resetCustomerPassword = resetCustomerPasswordWithPhone;

  const logoutUser = async (): Promise<void> => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setCurrentUser(CURRENT_CUSTOMER_USER);
    setActivePortal('customer');
    addNotification('Logged Out', 'You have been signed out.', 'system', 'all');
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
        message: `🔒 Security Lockout Active: 3 lga taar galat password! Account ${sec.lockoutSeconds}s ke liye locked hai. Refresh/back par bhi timer active rahega.`,
      };
    }

    // Check Main Super Admin credentials
    const isSuperAdminEmail =
      cleanEmail === 'scrapgo.services@gmail.com' || cleanEmail === 'scrapgo.servies@gmail.com';

    if (isSuperAdminEmail && cleanPass === 'Adityakumar@88') {
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
    if (matchAdmin && (cleanPass === 'Adityakumar@88' || cleanPass === 'admin123')) {
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
        message: `🔒 Security Alert (Locked 30s): 3 lga taar galat password enter karne par account 30 seconds ke liye lock kar diya gaya hai.`,
      };
    }
    const remaining = Math.max(0, 3 - nextSec.failedAttempts);
    return {
      success: false,
      message: `🔐 Security Alert: Admin Email Address ya Password galat hai. Remaining attempts: ${remaining}/3 before 30s lockout.`,
    };
  };

  const staffLogin = async (loginIdInput: string, passwordInput: string) => {
    const cleanInput = loginIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const rateCheck = checkRateLimit('LOGIN', cleanInput);
    if (!rateCheck.isAllowed) {
      return {
        success: false,
        message: rateCheck.errorMessage || '🛑 Staff Login Throttled: Too many failed login attempts.',
      };
    }
    recordAction('LOGIN', cleanInput);

    // Match Initial Staff Account (Staffuser1 / Staff@88) or registered staff by email or name/id
    const matchStaff = staffMembers.find(
      (s) =>
        s.email.toLowerCase() === cleanInput ||
        s.name.toLowerCase().replace(/\s+/g, '') === cleanInput ||
        cleanInput === 'staffuser1'
    );

    if (
      (cleanInput === 'staffuser1' && (cleanPass === 'Staff@88' || cleanPass === 'staff123')) ||
      (matchStaff && (cleanPass === 'Staff@88' || cleanPass === 'staff123' || cleanPass.length >= 4))
    ) {
      const staffObj = matchStaff || staffMembers[0];

      if (staffObj && (staffObj.status === 'inactive' || staffObj.is_active === false)) {
        return { success: false, message: 'Account is deactivated. Contact Super Admin.' };
      }

      const staffProfile: UserProfile = {
        id: staffObj ? staffObj.id : 'stf-001',
        phone: staffObj ? staffObj.phone : '+91 98111 20001',
        full_name: staffObj ? staffObj.name : 'Staff Member 1',
        email: staffObj ? staffObj.email : 'staffuser1@scrapgo.in',
        role: 'staff',
        created_at: new Date().toISOString(),
        avatar_url:
          staffObj?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        vehicle_number: staffObj?.vehicle_number || 'HR 10 AB 4921 (Mahindra Bolero)',
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

    return {
      success: false,
      message: 'Invalid Staff Login ID or Password. Sahi Staff ID (Staffuser1) aur Password (Staff@88) bharein.',
    };
  };

  const switchDemoUser = (role: UserRole) => {
    let profile: UserProfile;
    if (role === 'admin') {
      profile = {
        id: 'usr-admin-demo',
        phone: '+91 99990 00001',
        full_name: 'Regional Admin Officer',
        role: 'admin',
        created_at: new Date().toISOString(),
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      };
      setActivePortal('admin');
    } else if (role === 'staff') {
      profile = {
        ...SAMPLE_STAFF[0],
        role: 'staff',
      };
      setActivePortal('staff');
    } else {
      profile = CURRENT_CUSTOMER_USER;
      setActivePortal('customer');
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(profile));
    setCurrentUser(profile);

    addNotification(
      'Account Switched',
      `Switched to ${profile.full_name} (${profile.role.toUpperCase()})`,
      'system',
      'all'
    );
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
    const rateCheck = checkRateLimit('BOOKING', bookingData.customer_phone);
    if (!rateCheck.isAllowed) {
      throw new Error(rateCheck.errorMessage || '🛑 Pickup Booking Rate Limit Exceeded. Please wait before creating another request.');
    }
    recordAction('BOOKING', bookingData.customer_phone);
    // Generate 4-digit unique OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingNumber = `SG-2026-${randomSuffix}`;

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
    addDoc(collection(db, 'bookings'), newBooking).catch((fbErr: any) =>
      console.warn('Firebase booking save notice:', fbErr?.message || fbErr)
    );

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
    const rateCheck = checkRateLimit('REVIEW', userIdentifier);
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
    const rateCheck = checkRateLimit('COMPLAINT', currentUser?.phone || 'guest');
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
            ? `🚨 Official Complaint Registered (${ticketNumber}). Our Dispatch & Escalation Manager has received your grievance and will resolve it on priority within 2 hours.`
            : `I have logged this ticket (${ticketNumber}) with our Admin Support Queue. A customer officer is reviewing your request.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      created_at: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);

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
          status: 'open',
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
  const createAdminAccount = (data: {
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
  }): { success: boolean; message: string; admin?: AdminUser } => {
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

    const newAdminId = `adm-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;
    const newAdmin: AdminUser = {
      id: newAdminId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '+91 99990 ' + Math.floor(10000 + Math.random() * 90000),
      role_level: targetRoleLevel,
      adminRole: mappedRole,
      custom_title: data.custom_title.trim(),
      description: data.description?.trim(),
      status: data.status || 'active',
      is_active: (data.status || 'active') === 'active',
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=120&auto=format&fit=crop&q=80`,
      permissions: data.permissions || [],
      can_create_staff: Boolean(data.can_create_staff),
      can_create_admin: Boolean(data.can_create_admin && isMainAdminCreator),
      max_creatable_role: 'STAFF',
      created_by: currentAdmin.id,
      created_by_name: currentAdmin.name,
      created_at: new Date().toISOString(),
      permissions_summary: `${data.custom_title} • ${data.permissions.length} granular permissions granted`,
      must_change_password: true,
    };

    setAdminList((prev) => [newAdmin, ...prev]);

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

    return { success: true, message: `Admin "${newAdmin.name}" (${newAdmin.custom_title}) created successfully.`, admin: newAdmin };
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

    return { success: true, message: `Admin account "${target.name}" updated successfully.` };
  };

  const createStaffMember = (data: {
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
  }): { success: boolean; message: string; staff?: StaffMember } => {
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

    const newStaffId = `stf-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;
    const newStaff: StaffMember = {
      id: newStaffId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '+91 98111 ' + Math.floor(10000 + Math.random() * 90000),
      role_level: 'STAFF',
      staff_title: data.staff_title.trim(),
      description: data.description?.trim(),
      status: data.status || 'active',
      is_active: (data.status || 'active') === 'active',
      avatar_url: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 1000000000)}?w=120&auto=format&fit=crop&q=80`,
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
    };

    setStaffMembers((prev) => [newStaff, ...prev]);

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

    return { success: true, message: `Staff member "${newStaff.name}" (${newStaff.staff_title}) onboarded successfully.`, staff: newStaff };
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

    return { success: true, message: `Staff "${target.name}" updated successfully.` };
  };

  const resetAdminPassword = (adminId: string): { success: boolean; message: string; tempPass?: string } => {
    const isMainAdmin = currentAdmin.role_level === 'MAIN_ADMIN' || currentAdmin.adminRole === 'MAIN_ADMIN';
    if (!isMainAdmin && !hasPermission('change_admin_permissions')) {
      return { success: false, message: 'Permission Denied: Only Main Admin can reset administrator credentials.' };
    }
    const target = adminList.find((a) => a.id === adminId);
    if (!target) return { success: false, message: 'Admin not found.' };

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
        authLoading,
        activeOtpCode,
        sendPhoneOtp,
        verifyPhoneOtp,
        registerCustomerAccountWithPhone,
        customerPhoneLogin,
        sendForgotPasswordPhoneOtp,
        verifyForgotPasswordPhoneOtp,
        resetCustomerPasswordWithPhone,
        sendEmailOtp,
        verifyEmailOtp,
        registerCustomerAccount,
        customerEmailLogin,
        sendForgotPasswordOtp,
        verifyForgotPasswordOtp,
        resetCustomerPassword,
        adminLogin,
        staffLogin,
        logoutUser,
        switchDemoUser,
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
        notifications,
        markNotificationAsRead,
        clearNotifications,
        firebaseConnected: true,
        refreshFirebaseStatus: refreshSupabaseStatus,
        supabaseConnected: true,
        refreshSupabaseStatus,
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
