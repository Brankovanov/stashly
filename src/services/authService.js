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

/**
 * Emails a password recovery link. Succeeds for unknown addresses too, so the
 * form cannot be used to discover which emails are registered.
 */
export async function requestPasswordReset(email) {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/reset-password.html`,
  });

  if (error) throw new Error(error.message);
}

/** Sets a new password for the user signed in via a recovery link or session. */
export async function updatePassword(password) {
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

/**
 * Changes the password of the signed-in user after re-checking the current one,
 * so a left-open browser session alone cannot take over the account.
 */
export async function changePassword({ currentPassword, newPassword }) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) throw new Error('Please sign in again before changing your password.');

  const { error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (error) throw new Error('Your current password is incorrect.');
  await updatePassword(newPassword);
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
