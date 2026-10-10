import { getSupabaseClient, hasSupabaseConfig } from '../lib/supabaseClient.js';

export { hasSupabaseConfig };

export async function signUp({ email, password, displayName }) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } =
    await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function getUserRole(userId) {
  const { data, error } = await getSupabaseClient()
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Unable to load your account role: ${error.message}`);
  return data.role;
}

export function onAuthStateChange(callback) {
  const { data } = getSupabaseClient().auth.onAuthStateChange(callback);
  return data.subscription;
}
