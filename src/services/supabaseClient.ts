import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe env retrieval across Vite browser and Node environments
const getEnvVar = (name: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.[name]) {
      return import.meta.env[name];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.[name]) {
      return process.env[name] as string;
    }
  } catch {}
  return '';
};

// Clean and normalize Supabase project URL
const rawUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  'https://pssizsvkbgabnarlyawj.supabase.co';

const cleanUrl = rawUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const anonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('SUPABASE_PUBLISHABLE_KEY') ||
  'sb_publishable_Edhz1UUdYBSAmU65NCv08w_Z5u-D2mp';

export const SUPABASE_URL = cleanUrl;
export const SUPABASE_ANON_KEY = anonKey.trim();

export const getSupabaseProjectId = (): string => {
  try {
    const parsed = new URL(SUPABASE_URL);
    return parsed.hostname.split('.')[0] || 'pssizsvkbgabnarlyawj';
  } catch {
    return 'pssizsvkbgabnarlyawj';
  }
};

// Client for 'api' schema (current exposed schema on project)
export const supabaseApi: SupabaseClient<any, any, any> = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'api' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Client for 'public' schema (standard PostgreSQL schema)
export const supabasePublic: SupabaseClient<any, any, any> = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Default active client - starts with supabasePublic (where products reside)
export let supabase: SupabaseClient<any, any, any> = supabasePublic;
export let activeSchema: 'api' | 'public' = 'public';

export function setActiveSchema(schema: 'api' | 'public') {
  activeSchema = schema;
  supabase = schema === 'public' ? supabasePublic : supabaseApi;
}


