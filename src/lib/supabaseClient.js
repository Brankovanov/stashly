import { createClient } from '@supabase/supabase-js';

let supabaseClient;

export function hasSupabaseConfig() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseClient() {
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey } =
    import.meta.env;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
  }

  return supabaseClient;
}
