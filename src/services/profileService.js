import { getSupabaseClient } from '../lib/supabaseClient.js';

const PROFILE_FIELDS = 'id, display_name, avatar_path, created_at, updated_at';

async function getCurrentUser() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw new Error(`Unable to verify your account: ${error.message}`);
  if (!data.user) throw new Error('You must be signed in to manage your profile.');
  return data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load your profile: ${error.message}`);
  if (!data) throw new Error('Your profile could not be found.');

  return {
    ...data,
    email: user.email ?? '',
  };
}

export async function updateCurrentProfile({ displayName }) {
  const normalizedName = displayName.trim();
  if (!normalizedName || normalizedName.length > 80) {
    throw new Error('Your display name must be between 1 and 80 characters.');
  }

  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update({ display_name: normalizedName })
    .eq('id', user.id)
    .select(PROFILE_FIELDS)
    .maybeSingle();

  if (error) throw new Error(`Unable to save your profile: ${error.message}`);
  if (!data) throw new Error('Your profile could not be updated.');
  return data;
}
