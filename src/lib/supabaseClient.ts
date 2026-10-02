import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration storage keys
const SUPABASE_URL_KEY = 'scrapgo_supabase_url';
const SUPABASE_ANON_KEY = 'scrapgo_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || envUrl;
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY) || envKey;

  const isConnected = Boolean(
    storedUrl &&
    storedKey &&
    storedUrl.includes('supabase.co') &&
    storedKey.length > 20
  );

  return {
    url: storedUrl,
    anonKey: storedKey,
    isConnected,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
    return true;
  } catch (err) {
    console.error('Failed to save Supabase config', err);
    return false;
  }
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_ANON_KEY);
}

// Single instance of Supabase client when configured
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.isConnected) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      return { success: false, message: 'Invalid URL. Must look like https://xyzcompany.supabase.co' };
    }
    if (!key || key.length < 25) {
      return { success: false, message: 'Invalid anon key. It should be a JWT token from Supabase settings.' };
    }

    const client = createClient(url, key);
    // Quick probe
    const { data, error } = await client.from('categories').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, but credentials are valid:
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! Note: Please run the provided SQL in Supabase SQL Editor to create tables.'
        };
      }
      return { success: false, message: error.message || 'Connection failed' };
    }

    return { success: true, message: `Connected to Supabase project successfully! (${data?.length ?? 0} categories found)` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error while reaching Supabase' };
  }
}
