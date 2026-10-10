import { getSupabaseClient } from '../lib/supabaseClient.js';
import { getUserRole } from './authService.js';

const SUPPLY_PHOTO_BUCKET = 'supply-photos';
const MAX_SUPPLY_PHOTO_SIZE = 5 * 1024 * 1024;
const PROJECT_FILE_BUCKET = 'project-files';
const MAX_PROJECT_COVER_SIZE = 5 * 1024 * 1024;
const MAX_PROJECT_PATTERN_SIZE = 10 * 1024 * 1024;
const PHOTO_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const PROJECT_COVER_TYPES = new Map(PHOTO_TYPES);
const PROJECT_PATTERN_TYPES = new Map([
  ...PROJECT_COVER_TYPES,
  ['application/pdf', 'pdf'],
]);

export function validateSupplyPhoto(file) {
  if (!file) return;
  if (!PHOTO_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size <= 0 || file.size > MAX_SUPPLY_PHOTO_SIZE) {
    throw new Error('The image must be larger than 0 bytes and no bigger than 5 MB.');
  }
}

export async function uploadSupplyPhoto(file, ownerId) {
  validateSupplyPhoto(file);
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your account: ${authError.message}`);
  if (!authData.user) throw new Error('You must be signed in to upload a supply photo.');

  const extension = PHOTO_TYPES.get(file.type);
  const ownerFolder = ownerId ?? authData.user.id;
  const path = `${ownerFolder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(SUPPLY_PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Unable to upload supply photo: ${error.message}`);
  return path;
}

export async function getSupplyPhotoUrls(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return new Map();

  const { data, error } = await getSupabaseClient()
    .storage.from(SUPPLY_PHOTO_BUCKET)
    .createSignedUrls(uniquePaths, 3600);

  if (error) throw new Error(`Unable to load supply photos: ${error.message}`);
  if (!data || data.length !== uniquePaths.length) {
    throw new Error('Unable to create display links for all supply photos.');
  }

  const urls = new Map();
  for (const item of data) {
    if (item.error || !item.signedUrl) {
      throw new Error(
        `Unable to create a display link for supply photo "${item.path}": ${item.error?.message ?? 'No signed URL returned.'}`,
      );
    }
    urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function deleteSupplyPhoto(path) {
  if (!path) return;

  const { error } = await getSupabaseClient()
    .storage.from(SUPPLY_PHOTO_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Unable to delete supply photo: ${error.message}`);
}

export function validateProjectFile(file, kind) {
  if (!file) return;
  const isCover = kind === 'cover';
  const supportedTypes = isCover ? PROJECT_COVER_TYPES : PROJECT_PATTERN_TYPES;
  const maxSize = isCover ? MAX_PROJECT_COVER_SIZE : MAX_PROJECT_PATTERN_SIZE;
  const formats = isCover ? 'JPG, PNG, or WebP image' : 'JPG, PNG, WebP image, or PDF';

  if (!supportedTypes.has(file.type)) {
    throw new Error(`Choose a ${formats} for the project ${kind}.`);
  }
  if (file.size <= 0 || file.size > maxSize) {
    throw new Error(
      `The project ${kind} must be larger than 0 bytes and no bigger than ${maxSize / 1024 / 1024} MB.`,
    );
  }
}

export async function uploadProjectFile(file, ownerId, projectId, kind) {
  validateProjectFile(file, kind);
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your account: ${authError.message}`);
  if (!authData.user) throw new Error('You must be signed in to upload project files.');
  if (ownerId !== authData.user.id && (await getUserRole(authData.user.id)) !== 'admin') {
    throw new Error('You can only upload files to your own projects.');
  }

  const extension = (kind === 'cover' ? PROJECT_COVER_TYPES : PROJECT_PATTERN_TYPES).get(
    file.type,
  );
  const path = `${ownerId}/${projectId}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PROJECT_FILE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Unable to upload project ${kind}: ${error.message}`);
  return path;
}

export async function getProjectFileUrls(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return new Map();

  const { data, error } = await getSupabaseClient()
    .storage.from(PROJECT_FILE_BUCKET)
    .createSignedUrls(uniquePaths, 3600);

  if (error) throw new Error(`Unable to load project files: ${error.message}`);
  if (!data || data.length !== uniquePaths.length) {
    throw new Error('Unable to create display links for all project files.');
  }

  const urls = new Map();
  for (const item of data) {
    if (item.error || !item.signedUrl) {
      throw new Error(
        `Unable to create a display link for project file "${item.path}": ${item.error?.message ?? 'No signed URL returned.'}`,
      );
    }
    urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function deleteProjectFile(path) {
  if (!path) return;

  const { error } = await getSupabaseClient()
    .storage.from(PROJECT_FILE_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Unable to delete project file: ${error.message}`);
}
