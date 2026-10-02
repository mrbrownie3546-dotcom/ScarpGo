import { GranularPermission } from '../types/scrapgo';

export interface PermissionDefinition {
  key: GranularPermission;
  label: string;
  description: string;
}

export interface PermissionModuleGroup {
  moduleId: string;
  title: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_MODULE_GROUPS: PermissionModuleGroup[] = [
  {
    moduleId: 'users',
    title: 'User & Profile Management',
    description: 'Customer and account profile visibility and moderation.',
    permissions: [
      { key: 'view_users', label: 'View Users', description: 'Inspect user registry and basic details' },
      { key: 'search_users', label: 'Search Users', description: 'Query customer records by phone, name or email' },
      { key: 'view_user_profile', label: 'View User Profile', description: 'Open detailed customer dossier and booking counts' },
      { key: 'block_user', label: 'Block User', description: 'Suspend suspicious or violating customer accounts' },
      { key: 'unblock_user', label: 'Unblock User', description: 'Restore previously blocked user accounts' },
    ],
  },
  {
    moduleId: 'scrap',
    title: 'Scrap Master Categories & Mandi Rates',
    description: 'Configure recyclable scrap items and live price rates.',
    permissions: [
      { key: 'view_categories', label: 'View Categories', description: 'Browse available scrap categories' },
      { key: 'create_category', label: 'Create Category', description: 'Add new master category (e.g. Copper, Split AC)' },
      { key: 'edit_category', label: 'Edit Category', description: 'Modify category names, units, and descriptions' },
      { key: 'deactivate_category', label: 'Deactivate Category', description: 'Temporarily disable buying of scrap types' },
      { key: 'view_scrap_items', label: 'View Scrap Items', description: 'List granular sub-items in scrap inventory' },
      { key: 'create_scrap_item', label: 'Create Scrap Item', description: 'Add specific scrap item variations' },
      { key: 'edit_scrap_item', label: 'Edit Scrap Item', description: 'Update minimum weights and descriptions' },
      { key: 'deactivate_scrap_item', label: 'Deactivate Scrap Item', description: 'Mark scrap sub-item inactive' },
      { key: 'view_scrap_rates', label: 'View Scrap Rates', description: 'View mandi rates per kg or piece' },
      { key: 'change_scrap_rates', label: 'Change Scrap Rates', description: 'Update live per-kg purchasing rates' },
    ],
  },
  {
    moduleId: 'pickups',
    title: 'Pickup Logistics & Dispatch Operations',
    description: 'Driver assignment, GPS tracking, and doorstep collection workflow.',
    permissions: [
      { key: 'view_pickups', label: 'View Pickups', description: 'View list of scheduled scrap collection requests' },
      { key: 'create_pickup', label: 'Create Pickup', description: 'Schedule pickup on behalf of telephone customer' },
      { key: 'edit_pickup', label: 'Edit Pickup', description: 'Change slot, address landmark or customer phone' },
      { key: 'confirm_pickup', label: 'Confirm Pickup', description: 'Confirm pending booking and lock slot' },
      { key: 'assign_pickup', label: 'Assign Pickup', description: 'Dispatch field driver with collection van' },
      { key: 'update_pickup_status', label: 'Update Pickup Status', description: 'Progression: On The Way, Arrived, Weighing' },
      { key: 'cancel_pickup', label: 'Cancel Pickup', description: 'Cancel scheduled collection with mandatory reason' },
      { key: 'reject_pickup', label: 'Reject Pickup', description: 'Reject out-of-service area or ineligible booking' },
      { key: 'complete_pickup', label: 'Complete Pickup', description: 'Finalize weighed scrap and lock pickup slip' },
      { key: 'view_pickup_history', label: 'View Pickup History', description: 'Audit past completed collections' },
    ],
  },
  {
    moduleId: 'payouts',
    title: 'Financial Payouts & Disbursals',
    description: 'Customer payment verification and Instant UPI/Bank transfers.',
    permissions: [
      { key: 'view_payouts', label: 'View Payouts', description: 'Inspect payout ledger and payment queue' },
      { key: 'create_payout', label: 'Create Payout', description: 'Generate payout order for completed pickup' },
      { key: 'edit_payout', label: 'Edit Payout', description: 'Adjust destination bank details or recipient' },
      { key: 'change_payout_amount', label: 'Change Payout Amount', description: 'Modify final payout sum based on scale weight' },
      { key: 'change_payout_method', label: 'Change Payout Method', description: 'Switch channel between UPI, Cash, and Bank Transfer' },
      { key: 'process_payout', label: 'Process Payout', description: 'Mark payout as Processing with gateway' },
      { key: 'mark_payout_paid', label: 'Mark Payout Paid', description: 'Authorize disbursal with bank reference ID' },
      { key: 'mark_payout_failed', label: 'Mark Payout Failed', description: 'Record failed transfer and trigger retry' },
      { key: 'view_payout_history', label: 'View Payout History', description: 'Access past disbursement records' },
    ],
  },
  {
    moduleId: 'whatsapp',
    title: 'WhatsApp Automation & Helpline',
    description: 'Business WhatsApp gateway settings and notification templates.',
    permissions: [
      { key: 'view_whatsapp_settings', label: 'View WhatsApp Settings', description: 'Check configured WhatsApp numbers' },
      { key: 'change_whatsapp_number', label: 'Change WhatsApp Number', description: 'Update official company WhatsApp number' },
      { key: 'edit_whatsapp_templates', label: 'Edit WhatsApp Templates', description: 'Customize driver & payout SMS/WhatsApp messages' },
    ],
  },
  {
    moduleId: 'content',
    title: 'Website Public Content & Copywriting',
    description: 'Hero banners, About Us, FAQs, and marketing text.',
    permissions: [
      { key: 'edit_homepage', label: 'Edit Homepage', description: 'Update main headlines, value props, and badges' },
      { key: 'edit_about_us', label: 'Edit About Us', description: 'Update company mission and recycling credentials' },
      { key: 'edit_contact', label: 'Edit Contact', description: 'Update address, support emails, and operating hours' },
      { key: 'edit_faq', label: 'Edit FAQ', description: 'Add and update customer frequently asked questions' },
      { key: 'manage_banners', label: 'Manage Banners', description: 'Publish alert banners and festival discount offers' },
      { key: 'manage_website_content', label: 'Manage Website Content', description: 'Full control over public website sections' },
    ],
  },
  {
    moduleId: 'reports',
    title: 'Reports & Business Analytics',
    description: 'Key performance indicators, tonnage collected, and financial trends.',
    permissions: [
      { key: 'view_dashboard', label: 'View Dashboard', description: 'Access KPI summaries and live counters' },
      { key: 'view_reports', label: 'View Reports', description: 'Generate monthly scrap weight and revenue statements' },
      { key: 'view_analytics', label: 'View Analytics', description: 'Inspect regional demand and customer retention rates' },
      { key: 'export_reports', label: 'Export Reports', description: 'Download CSV and Excel transaction logs' },
    ],
  },
  {
    moduleId: 'notifications',
    title: 'Push Notifications & Alerts',
    description: 'Dispatch alerts, driver notifications, and broadcast messages.',
    permissions: [
      { key: 'view_notifications', label: 'View Notifications', description: 'Inspect internal system notification log' },
      { key: 'create_notifications', label: 'Create Notifications', description: 'Draft broadcast messages for customers/drivers' },
      { key: 'edit_notifications', label: 'Edit Notifications', description: 'Modify pending announcement messages' },
      { key: 'send_notifications', label: 'Send Notifications', description: 'Dispatch immediate push notifications' },
    ],
  },
  {
    moduleId: 'admins',
    title: 'Admin Hierarchy & Governance',
    description: 'Create and govern subordinate admin accounts (Main Admin only).',
    permissions: [
      { key: 'view_admins', label: 'View Admins', description: 'View all configured administrator accounts' },
      { key: 'create_admin', label: 'Create Admin', description: 'Provision new admin credentials and set custom title' },
      { key: 'edit_admin', label: 'Edit Admin', description: 'Update display name, title, and profile details' },
      { key: 'activate_admin', label: 'Activate Admin', description: 'Reactivate suspended or inactive admin' },
      { key: 'deactivate_admin', label: 'Deactivate Admin', description: 'Disable administrator account access' },
      { key: 'change_admin_permissions', label: 'Change Admin Permissions', description: 'Modify granted capabilities of other admins' },
      { key: 'assign_staff_creation_permission', label: 'Assign Staff Creation', description: 'Empower sub-admin to hire and manage staff' },
      { key: 'view_admin_activity', label: 'View Admin Activity', description: 'Inspect individual administrative audit trails' },
    ],
  },
  {
    moduleId: 'staff_mgmt',
    title: 'Staff Fleet & Operations Management',
    description: 'Create and assign permissions to subordinate staff workers.',
    permissions: [
      { key: 'view_staff', label: 'View Staff', description: 'View staff members under assigned command' },
      { key: 'create_staff', label: 'Create Staff', description: 'Provision new field staff or support agent account' },
      { key: 'edit_staff', label: 'Edit Staff', description: 'Update staff title, vehicle, and assigned tasks' },
      { key: 'activate_staff', label: 'Activate Staff', description: 'Put driver or staff online and active' },
      { key: 'deactivate_staff', label: 'Deactivate Staff', description: 'Suspend driver from taking bookings' },
      { key: 'change_staff_permissions', label: 'Change Staff Permissions', description: 'Adjust scope of staff capabilities' },
      { key: 'view_staff_activity', label: 'View Staff Activity', description: 'Inspect driver completion rates and weighing logs' },
    ],
  },
  {
    moduleId: 'system',
    title: 'System Settings & Maintenance',
    description: 'System-wide downtime toggles, business settings, and security policies.',
    permissions: [
      { key: 'view_settings', label: 'View Settings', description: 'View business settings and dual approval status' },
      { key: 'edit_settings', label: 'Edit Settings', description: 'Modify company business policies and parameters' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Enable/disable scheduled maintenance downtime' },
      { key: 'manage_business_settings', label: 'Manage Business Settings', description: 'Configure operating hubs and company profile' },
    ],
  },
  {
    moduleId: 'audit',
    title: 'Security Audit Trail',
    description: 'Immutable security log inspection.',
    permissions: [
      { key: 'view_audit_logs', label: 'View Audit Logs', description: 'Inspect immutable cryptographic audit logs' },
    ],
  },
];

// Flat list of all available permissions
export const ALL_PERMISSIONS: GranularPermission[] = PERMISSION_MODULE_GROUPS.flatMap(
  (group) => group.permissions.map((p) => p.key)
);

// PRESET PERMISSIONS FOR ADMINS
export const PRESET_MAIN_ADMIN_PERMISSIONS: GranularPermission[] = [...ALL_PERMISSIONS];

export const PRESET_PICKUP_ADMIN_PERMISSIONS: GranularPermission[] = [
  'view_users',
  'search_users',
  'view_user_profile',
  'view_categories',
  'view_scrap_items',
  'view_scrap_rates',
  'view_pickups',
  'create_pickup',
  'edit_pickup',
  'confirm_pickup',
  'assign_pickup',
  'update_pickup_status',
  'cancel_pickup',
  'reject_pickup',
  'complete_pickup',
  'view_pickup_history',
  'view_dashboard',
  'view_reports',
  'view_notifications',
  'view_staff',
  'create_staff',
  'edit_staff',
  'activate_staff',
  'deactivate_staff',
  'change_staff_permissions',
  'view_staff_activity',
  'view_audit_logs',
];

export const PRESET_PAYOUT_ADMIN_PERMISSIONS: GranularPermission[] = [
  'view_users',
  'view_user_profile',
  'view_pickups',
  'view_pickup_history',
  'view_payouts',
  'create_payout',
  'edit_payout',
  'change_payout_amount',
  'change_payout_method',
  'process_payout',
  'mark_payout_paid',
  'mark_payout_failed',
  'view_payout_history',
  'view_dashboard',
  'view_reports',
  'view_notifications',
  'view_audit_logs',
];

export const PRESET_CONTENT_ADMIN_PERMISSIONS: GranularPermission[] = [
  'view_categories',
  'edit_category',
  'view_scrap_items',
  'edit_homepage',
  'edit_about_us',
  'edit_contact',
  'edit_faq',
  'manage_banners',
  'manage_website_content',
  'view_dashboard',
  'view_notifications',
];

export const PRESET_VIEW_ONLY_PERMISSIONS: GranularPermission[] = [
  'view_users',
  'search_users',
  'view_user_profile',
  'view_categories',
  'view_scrap_items',
  'view_scrap_rates',
  'view_pickups',
  'view_pickup_history',
  'view_payouts',
  'view_payout_history',
  'view_whatsapp_settings',
  'view_dashboard',
  'view_reports',
  'view_analytics',
  'view_notifications',
  'view_admins',
  'view_staff',
  'view_settings',
  'view_audit_logs',
];

// PRESET PERMISSIONS FOR STAFF
export const PRESET_PICKUP_STAFF_PERMISSIONS: GranularPermission[] = [
  'view_pickups',
  'update_pickup_status',
  'complete_pickup',
  'view_pickup_history',
  'view_categories',
  'view_scrap_rates',
  'view_notifications',
];

export const PRESET_PAYOUT_STAFF_PERMISSIONS: GranularPermission[] = [
  'view_payouts',
  'process_payout',
  'view_payout_history',
  'view_notifications',
];

export const PRESET_SUPPORT_STAFF_PERMISSIONS: GranularPermission[] = [
  'view_users',
  'search_users',
  'view_pickups',
  'view_notifications',
  'create_notifications',
];

export const ADMIN_DESIGNATIONS = [
  'Pickup Operations Admin',
  'Payout Admin',
  'Scrap & Rate Admin',
  'Customer Support Admin',
  'Website Content Admin',
  'Operations Manager',
  'Inventory Admin',
  'Finance Admin',
  'Customer Service Admin',
  'Regional Dispatch Admin',
  'Compliance & Audit Admin',
  'Custom Title',
];

export const STAFF_DESIGNATIONS = [
  'Pickup Verification Staff',
  'Field Logistics Driver',
  'Weighing & Quality Staff',
  'Customer Support Staff',
  'Data Entry Staff',
  'Payout Verification Staff',
  'Scrap Inventory Staff',
  'Operations Staff',
  'Custom Staff',
];
