export type UserRole = 'customer' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  address?: string;
  role: UserRole;
  adminRole?: AdminRole;
  avatar_url?: string;
  created_at: string;
  is_blocked?: boolean;
  // Specific for staff
  vehicle_number?: string;
  vehicle_type?: string;
  rating?: number;
  total_pickups_completed?: number;
  is_online?: boolean;
}

export interface ScrapCategory {
  id: string;
  name: string;
  rate_per_kg: number;
  unit: string; // e.g. "kg", "piece"
  icon_name: string;
  category_type: 'paper' | 'plastic' | 'metal' | 'e-waste' | 'appliance' | 'vehicle';
  description: string;
  is_active: boolean;
  min_weight_kg?: number;
  created_at?: string;
}

export interface ServiceArea {
  id: string;
  area_name: string;
  city: string;
  state: string;
  pincode: string;
  is_active: boolean;
}

export type BookingStatus =
  | 'pending'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'weighing'
  | 'completed'
  | 'cancelled';

export type PayoutMethod = 'cash' | 'upi' | 'bank_transfer';

export type PayoutStatus =
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'successful'
  | 'failed';

export interface ScrapItemWeight {
  category_id: string;
  category_name: string;
  rate_per_kg: number;
  weight_kg: number;
  subtotal: number;
}

export interface Booking {
  id: string;
  booking_number: string; // e.g. SG-2026-8942
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  staff_id?: string | null;
  staff_name?: string | null;
  staff_phone?: string | null;
  staff_vehicle?: string | null;

  // Pickup Details
  pickup_address: string;
  pickup_landmark?: string;
  latitude: number;
  longitude: number;
  preferred_date: string;
  preferred_time_slot: string; // e.g. "10:00 AM - 01:00 PM"

  // Expected scrap details
  category_ids: string[];
  expected_scrap_items: string;
  estimated_weight_kg?: number;
  notify_whatsapp?: boolean;

  // Status & Tracking
  status: BookingStatus;
  pickup_otp: string; // 4-digit secret OTP shown to customer
  otp_verified: boolean;

  // Staff live coordinates simulation
  staff_lat?: number;
  staff_lng?: number;
  staff_eta_minutes?: number;
  staff_distance_km?: number;

  // Final Details (Filled by Staff during collection)
  items_collected?: ScrapItemWeight[];
  final_weight_kg?: number;
  final_amount?: number;
  scale_photo_url?: string;
  staff_notes?: string;

  // Payout details
  payout_method: PayoutMethod;
  upi_id?: string;
  upi_qr_url?: string;
  bank_details?: {
    account_number: string;
    ifsc_code: string;
    account_holder: string;
  };
  payout_status: PayoutStatus;
  payout_reference?: string;

  // Customer Rating & Review (distinct per completed pickup)
  rating?: number;
  review_comment?: string;
  rated_at?: string;

  created_at: string;
  updated_at: string;
}

export interface StaffLocation {
  staff_id: string;
  staff_name: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  active_booking_id?: string | null;
  last_updated: string;
}

export interface PayoutRecord {
  id: string;
  booking_id: string;
  booking_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  payout_method: PayoutMethod;
  payout_destination: string; // UPI ID or Bank account
  upi_qr_url?: string;
  status: PayoutStatus;
  transaction_reference?: string;
  processed_by_admin?: string;
  processed_at?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string; // e.g. TKT-9801 or CMP-2026-8921
  ticket_type?: 'inquiry' | 'complaint';
  complaint_category?:
    | 'driver_delayed'
    | 'payment_issue'
    | 'weight_scale_issue'
    | 'staff_behavior'
    | 'cancellation'
    | 'other';
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  booking_id?: string;
  booking_number?: string;
  subject: string;
  description: string;
  status: 'open' | 'ai_resolved' | 'escalated_to_admin' | 'closed';
  priority: 'low' | 'medium' | 'high';
  ai_conversation?: Array<{ sender: 'user' | 'ai' | 'admin'; text: string; time: string }>;
  admin_reply?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'staff' | 'payout' | 'support' | 'system';
  target_role: UserRole | 'all';
  booking_id?: string;
  read: boolean;
  created_at: string;
}

// ==========================================
// SCRAPGO ROLE HIERARCHY & GRANULAR PERMISSIONS
// ==========================================
export type RoleLevel = 'SUPER_ADMIN' | 'MAIN_ADMIN' | 'ADMIN' | 'STAFF';

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'MAIN_ADMIN'
  | 'PICKUP_ADMIN'
  | 'PAYOUT_ADMIN'
  | 'CONTENT_ADMIN'
  | 'VIEW_ONLY_ADMIN';

export type UserPermission =
  | 'view_users'
  | 'search_users'
  | 'view_user_profile'
  | 'block_user'
  | 'unblock_user';

export type ScrapPermission =
  | 'view_categories'
  | 'create_category'
  | 'edit_category'
  | 'deactivate_category'
  | 'view_scrap_items'
  | 'create_scrap_item'
  | 'edit_scrap_item'
  | 'deactivate_scrap_item'
  | 'view_scrap_rates'
  | 'change_scrap_rates';

export type PickupPermission =
  | 'view_pickups'
  | 'create_pickup'
  | 'edit_pickup'
  | 'confirm_pickup'
  | 'assign_pickup'
  | 'update_pickup_status'
  | 'cancel_pickup'
  | 'reject_pickup'
  | 'complete_pickup'
  | 'view_pickup_history';

export type PayoutPermission =
  | 'view_payouts'
  | 'create_payout'
  | 'edit_payout'
  | 'change_payout_amount'
  | 'change_payout_method'
  | 'process_payout'
  | 'mark_payout_paid'
  | 'mark_payout_failed'
  | 'view_payout_history';

export type WhatsAppPermission =
  | 'view_whatsapp_settings'
  | 'change_whatsapp_number'
  | 'edit_whatsapp_templates';

export type ContentPermission =
  | 'edit_homepage'
  | 'edit_about_us'
  | 'edit_contact'
  | 'edit_faq'
  | 'manage_banners'
  | 'manage_website_content';

export type ReportPermission =
  | 'view_dashboard'
  | 'view_reports'
  | 'view_analytics'
  | 'export_reports';

export type NotificationPermission =
  | 'view_notifications'
  | 'create_notifications'
  | 'edit_notifications'
  | 'send_notifications';

export type AdminManagementPermission =
  | 'view_admins'
  | 'create_admin'
  | 'edit_admin'
  | 'activate_admin'
  | 'deactivate_admin'
  | 'change_admin_permissions'
  | 'assign_staff_creation_permission'
  | 'view_admin_activity';

export type StaffManagementPermission =
  | 'view_staff'
  | 'create_staff'
  | 'edit_staff'
  | 'activate_staff'
  | 'deactivate_staff'
  | 'change_staff_permissions'
  | 'view_staff_activity';

export type SystemPermission =
  | 'view_settings'
  | 'edit_settings'
  | 'maintenance_mode'
  | 'manage_business_settings';

export type AuditPermission =
  | 'view_audit_logs';

export type GranularPermission =
  | UserPermission
  | ScrapPermission
  | PickupPermission
  | PayoutPermission
  | WhatsAppPermission
  | ContentPermission
  | ReportPermission
  | NotificationPermission
  | AdminManagementPermission
  | StaffManagementPermission
  | SystemPermission
  | AuditPermission;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_level: RoleLevel; // 'MAIN_ADMIN' | 'ADMIN'
  adminRole: AdminRole;
  custom_title: string; // e.g. "Pickup Operations Admin", "Payout Admin"
  description?: string;
  status: AccountStatus; // 'active' | 'inactive' | 'suspended'
  is_active: boolean;
  avatar_url?: string;
  permissions: GranularPermission[];
  can_create_staff: boolean;
  can_create_admin: boolean;
  max_creatable_role?: RoleLevel;
  created_by?: string;
  created_by_name?: string;
  managed_by?: string;
  created_at: string;
  last_login?: string;
  permissions_summary?: string;
  must_change_password?: boolean;
  password_hash?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_level: 'STAFF';
  staff_title: string; // e.g. "Pickup Verification Staff", "Customer Support Staff"
  description?: string;
  status: AccountStatus;
  is_active: boolean;
  avatar_url?: string;
  permissions: GranularPermission[];
  created_by: string; // Admin ID
  created_by_name: string;
  managed_by: string; // Admin ID
  managed_by_name: string;
  vehicle_number?: string;
  vehicle_type?: string;
  rating?: number;
  total_pickups_completed?: number;
  is_online?: boolean;
  created_at: string;
  last_active?: string;
  must_change_password?: boolean;
  password_hash?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export type ApprovalActionType =
  | 'PAYOUT_AMOUNT_CHANGE'
  | 'PAYOUT_STATUS_PAID'
  | 'ADMIN_ROLE_CHANGE'
  | 'ADMIN_DEACTIVATE'
  | 'RATE_MASTER_CHANGE'
  | 'USER_BLOCK_UNBLOCK'
  | 'PAID_RECORD_EXCEPTION'
  | 'MAINTENANCE_MODE_TOGGLE'
  | 'WHATSAPP_NUMBER_CHANGE'
  | 'GRANT_STAFF_CREATION'
  | 'CREATE_ADMIN_ACCOUNT'
  | 'SUSPEND_ADMIN_ACCOUNT';

export interface ApprovalRequest {
  id: string; // e.g. APR-2026-001
  action_type: ApprovalActionType;
  module: 'payouts' | 'pickups' | 'rates' | 'users' | 'admins' | 'staff' | 'settings' | 'categories';
  target_record_id: string;
  target_title: string;
  acting_admin_id: string;
  acting_admin_name: string;
  acting_admin_role: AdminRole;
  current_value: any;
  proposed_value: any;
  difference?: string;
  reason: string;
  created_at: string;
  status: ApprovalStatus;
  approver_admin_id?: string;
  approver_admin_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface AuditLog {
  id: string; // e.g. AUD-9021
  action_id?: string;
  actor_id: string;
  actor_name: string;
  actor_role: AdminRole | 'SYSTEM';
  action: string;
  module:
    | 'users'
    | 'pickups'
    | 'payouts'
    | 'rates'
    | 'categories'
    | 'content'
    | 'admins'
    | 'staff'
    | 'settings'
    | 'auth'
    | 'approval_center';
  target_id?: string;
  target_name?: string;
  target_role?: string;
  old_permissions?: GranularPermission[];
  new_permissions?: GranularPermission[];
  old_title?: string;
  new_title?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  approval_request_id?: string;
  approver_id?: string;
  timestamp: string;
  result: 'success' | 'blocked' | 'rejected' | 'pending_approval';
  ip_address?: string;
}

export interface SystemSettings {
  business_name: string;
  whatsapp_number: string;
  helpline_number: string;
  support_email: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  require_dual_approval_for_high_risk: boolean;
  min_payout_amount_requiring_dual_approval: number;
  payout_methods_enabled: {
    cash: boolean;
    upi: boolean;
    bank_transfer: boolean;
  };
  whatsapp_templates: {
    pickup_booked: string;
    driver_assigned: string;
    payout_completed: string;
    inquiry: string;
  };
}

export interface WebsiteContentItem {
  id: string;
  section: 'hero' | 'about' | 'contact' | 'faq' | 'how_it_works' | 'banner';
  title: string;
  subtitle?: string;
  body?: string;
  icon_or_image?: string;
  display_order: number;
  is_active: boolean;
  updated_at: string;
  updated_by?: string;
}

export interface ScrapItemMaterial {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  unit: string;
  current_rate: number;
  min_quantity: number;
  max_quantity?: number;
  description: string;
  is_active: boolean;
  display_order: number;
  updated_at: string;
}

