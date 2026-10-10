import { getSupabaseClient } from '../lib/supabaseClient.js';

export async function getAdminOverview() {
  const supabase = getSupabaseClient();
  const [usersResult, suppliesResult, projectsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('supplies').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ]);

  if (usersResult.error) {
    throw new Error(`Unable to load account total: ${usersResult.error.message}`);
  }
  if (suppliesResult.error) {
    throw new Error(`Unable to load supply total: ${suppliesResult.error.message}`);
  }
  if (projectsResult.error) {
    throw new Error(`Unable to load project total: ${projectsResult.error.message}`);
  }

  return {
    users: usersResult.count ?? 0,
    supplies: suppliesResult.count ?? 0,
    projects: projectsResult.count ?? 0,
  };
}

export async function getAdminUsers() {
  const { data, error } = await getSupabaseClient().rpc('admin_list_users');
  if (error) throw new Error(`Unable to load users: ${error.message}`);
  return data;
}

export async function setAdminUserRole(userId, role) {
  if (!userId || !['user', 'admin'].includes(role)) {
    throw new Error('Choose a valid user and role.');
  }
  const { error } = await getSupabaseClient().rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw new Error(`Unable to update user role: ${error.message}`);
}

export async function getAdminCategories() {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .select('id, name, icon')
    .order('name');
  if (error) throw new Error(`Unable to load categories: ${error.message}`);
  return data;
}

export async function saveAdminCategory(categoryId, { name, icon }) {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (!normalizedName || normalizedName.length > 40) {
    throw new Error('Category names must be between 1 and 40 characters.');
  }
  const normalizedIcon = typeof icon === 'string' ? icon.trim() : '';
  const values = { name: normalizedName, icon: normalizedIcon || null };
  const query = getSupabaseClient().from('categories');
  const result = categoryId
    ? await query.update(values).eq('id', categoryId).select('id').maybeSingle()
    : await query.insert(values).select('id').single();

  if (result.error) throw new Error(`Unable to save category: ${result.error.message}`);
  if (!result.data) throw new Error('Category not found or you do not have permission to edit it.');
}

export async function deleteAdminCategory(categoryId) {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Unable to delete category: ${error.message}`);
  if (!data) throw new Error('Category not found or you do not have permission to delete it.');
}
