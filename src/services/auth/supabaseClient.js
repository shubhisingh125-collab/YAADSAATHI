/**
 * supabaseClient.js
 * Supabase client initialization for YaadSaathi.
 * Connects to Supabase PostgreSQL & Auth with Row Level Security (RLS).
 * 
 * Exposes ONLY the publishable / anon client key to the frontend.
 * Never use service_role or admin secret keys in browser code.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) || '';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) || '';

/**
 * Checks whether Supabase cloud environment variables are configured.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'));
}

/**
 * Custom memory storage for non-browser / Node testing environments
 */
const inMemoryStorage = (() => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
  };
})();

/**
 * Active Supabase JS Client instance
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : inMemoryStorage,
      },
    })
  : null;

/**
 * Safe client accessor that never crashes if Supabase is unconfigured.
 * Returns null or the active client.
 */
export function getSupabase() {
  return supabase;
}

export default supabase;
