import { getSupabaseClient } from '../lib/supabaseClient.js';
import {
  deleteProfileAvatar,
  uploadProfileAvatar,
} from './storageService.js';

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
  if (typeof displayName !== 'string') {
    throw new Error('Your display name must be between 1 and 80 characters.');
  }
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

export async function replaceCurrentProfileAvatar(file, previousPath) {
  const avatarPath = await uploadProfileAvatar(file);
  let profile;
  try {
    profile = await updateAvatarPath(avatarPath);
  } catch (error) {
    try {
      await deleteProfileAvatar(avatarPath);
    } catch (cleanupError) {
      throw new Error(
        `${error.message} The new photo was uploaded but could not be cleaned up: ${cleanupError.message}`,
      );
    }
    throw error;
  }

  const cleanupError = await removePreviousAvatar(previousPath);
  return { profile, cleanupError };
}

export async function removeCurrentProfileAvatar(previousPath) {
  const profile = await updateAvatarPath(null);
  const cleanupError = await removePreviousAvatar(previousPath);
  return { profile, cleanupError };
}

async function updateAvatarPath(avatarPath) {
  const user = await getCurrentUser();
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update({ avatar_path: avatarPath })
    .eq('id', user.id)
    .select(PROFILE_FIELDS)
    .maybeSingle();

  if (error) throw new Error(`Unable to save your profile photo: ${error.message}`);
  if (!data) throw new Error('Your profile photo could not be saved.');
  return data;
}

async function removePreviousAvatar(path) {
  if (!path) return null;
  try {
    await deleteProfileAvatar(path);
    return null;
  } catch (error) {
    return error.message;
  }
}
