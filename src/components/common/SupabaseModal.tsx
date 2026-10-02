import React, { useState } from 'react';
import { useScrap } from '../../context/ScrapContext';
import {
  clearSupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabaseClient';
import {
  Database,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Server,
  RefreshCw,
} from 'lucide-react';

const SUPABASE_SCHEMA_SQL = `-- ==========================================
-- ♻️ SCRAPGO DATABASE SCHEMA FOR SUPABASE (PostgreSQL)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ==========================================

-- 1. Users Table (Customer, Staff, Admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
    avatar_url TEXT,
    vehicle_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Scrap Categories Table (Managed by Admin)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rate_per_kg NUMERIC NOT NULL,
    unit TEXT DEFAULT 'kg',
    category_type TEXT DEFAULT 'metal',
    icon_name TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Service Areas (Delhi, Sonipat, Gurugram, etc.)
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    area_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Bookings Table (Core transaction table)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL, -- e.g. SG-2026-8942
    customer_id UUID REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    staff_id UUID REFERENCES users(id),
    staff_name TEXT,
    staff_phone TEXT,
    staff_vehicle TEXT,
    
    -- Pickup Address
    pickup_address TEXT NOT NULL,
    pickup_landmark TEXT,
    latitude NUMERIC DEFAULT 28.9931,
    longitude NUMERIC DEFAULT 77.0151,
    preferred_date DATE NOT NULL,
    preferred_time_slot TEXT DEFAULT '10:00 AM - 01:00 PM',
    
    -- Scrap Details
    expected_scrap_items TEXT,
    estimated_weight_kg NUMERIC DEFAULT 20,
    
    -- Live Tracking & Status
    status TEXT CHECK (status IN ('pending', 'assigned', 'on_the_way', 'arrived', 'weighing', 'completed', 'cancelled')) DEFAULT 'pending',
    pickup_otp TEXT NOT NULL, -- 4-digit code shown to customer
    otp_verified BOOLEAN DEFAULT FALSE,
    staff_lat NUMERIC,
    staff_lng NUMERIC,
    staff_distance_km NUMERIC,
    staff_eta_minutes INTEGER,
    
    -- Final Details (Entered by staff on digital scale)
    final_weight_kg NUMERIC,
    final_amount NUMERIC,
    items_collected JSONB,
    scale_photo_url TEXT,
    staff_notes TEXT,
    
    -- Customer Payout Preference & Status
    payout_method TEXT CHECK (payout_method IN ('cash', 'upi', 'bank_transfer')) DEFAULT 'upi',
    upi_id TEXT,
    bank_details JSONB,
    payout_status TEXT CHECK (payout_status IN ('pending_approval', 'approved', 'processing', 'successful', 'failed')) DEFAULT 'pending_approval',
    payout_reference TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Staff Live Location (For real-time GPS tracking)
CREATE TABLE IF NOT EXISTS staff_locations (
    staff_id UUID PRIMARY KEY,
    staff_name TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    is_online BOOLEAN DEFAULT TRUE,
    active_booking_id UUID REFERENCES bookings(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Payouts History (Requires Admin approval)
CREATE TABLE IF NOT EXISTS payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) UNIQUE NOT NULL,
    booking_number TEXT NOT NULL,
    customer_id UUID REFERENCES users(id),
    customer_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payout_method TEXT NOT NULL,
    payout_destination TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending_approval', 'approved', 'processing', 'successful', 'failed')) DEFAULT 'pending_approval',
    transaction_reference TEXT,
    processed_by_admin TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Complaints & Support Tickets (AI Bot + Admin queue)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    booking_id UUID REFERENCES bookings(id),
    booking_number TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'ai_resolved', 'escalated_to_admin', 'closed')) DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    ai_conversation JSONB,
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow public read of active scrap rates and service areas
CREATE POLICY "Public scrap categories read" ON categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public service areas read" ON service_areas FOR SELECT USING (is_active = TRUE);
`;

export const SupabaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { refreshSupabaseStatus } = useScrap();
  const config = getStoredSupabaseConfig();

  const [activeTab, setActiveTab] = useState<'sql' | 'credentials' | 'architecture'>('sql');
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.anonKey);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      refreshSupabaseStatus();
    }
    setTesting(false);
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestResult(null);
    refreshSupabaseStatus();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Supabase PostgreSQL Backend & Schema</h2>
              <p className="text-xs text-slate-400">
                Connected relational database for Customers, Staff, Pickups, and Payout approvals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SQL Schema (Phase 1)</span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connect Supabase Project</span>
            {config.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>System Architecture</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Supabase PostgreSQL Tables & RLS Schema
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy and run this in your Supabase SQL Editor. It creates all tables needed for SCRAPGO.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">How to deploy to Supabase:</p>
                  <ol className="list-decimal ml-4 mt-1 space-y-0.5 text-emerald-800">
                    <li>Go to your Supabase Project Dashboard (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold">supabase.com</a>).</li>
                    <li>Click on <strong>SQL Editor</strong> in the left sidebar.</li>
                    <li>Click <strong>New Query</strong>, paste the copied SQL, and click <strong>Run</strong>.</li>
                    <li>Then go to Project Settings &rarr; API, and enter your URL & Key in the &quot;Connect Supabase Project&quot; tab!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Connect Your Supabase Project</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connect live or continue using the built-in local persistent state with full simulated workflows.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklm.supabase.co"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys (anon public)
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveAndTest}
                    disabled={testing || !supabaseUrl}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{testing ? 'Testing Connection...' : 'Test & Connect'}</span>
                  </button>

                  {config.isConnected && (
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Automatic Offline & Local Sync: </span>
                  Even without adding keys right away, SCRAPGO runs seamlessly with instant reactivity, customer booking, staff OTP validation, digital scale calculation, and admin payout approvals.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Complete 3-Portal SCRAPGO Flow</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Customer (scrapgo.in)
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                    <li>Browse real-time scrap rates & categories</li>
                    <li>Instant booking with pickup address & date slot</li>
                    <li>Choose payout: Cash / UPI / Bank Account</li>
                    <li>Receive unique 4-digit pickup OTP & tracking link</li>
                    <li>Live GPS view of driver moving to location</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Staff (staff.scrapgo.in)
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                    <li>Accept assigned booking & click "On The Way"</li>
                    <li>GPS navigation to customer address</li>
                    <li>Arrived at doorstep & prompt customer for OTP</li>
                    <li>Verify 4-digit OTP to unlock Digital Scale</li>
                    <li>Weigh items, auto-calculate bill, and submit</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Admin (admin.scrapgo.in)
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                    <li>Dispatch & assign staff to new pickup requests</li>
                    <li><strong>Mandatory Payout Approval:</strong> Review verified scrap weight and approve instant payment disbursement</li>
                    <li>Real-time scrap rate updates per kg</li>
                    <li>Manage AI Support escalations & complaints</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">PostgreSQL Schema ready for Supabase v2</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
