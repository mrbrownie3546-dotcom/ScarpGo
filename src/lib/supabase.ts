import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite environment variables (defined in .env.example)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'your-anon-public-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export default supabase;
