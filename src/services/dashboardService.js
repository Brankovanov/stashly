import { getSupabaseClient } from '../lib/supabaseClient.js';
import { calculateProjectItemStatus } from '../utils/projectItemValidation.js';

const DASHBOARD_ITEM_FIELDS =
  'quantity_needed, unit, supplies(quantity, unit)';

export async function getDashboardData() {
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your account: ${authError.message}`);
  if (!authData.user) throw new Error('You must be signed in to view your dashboard.');

  const userId = authData.user.id;
  const [suppliesResult, projectsResult, profileResult] = await Promise.all([
    supabase
      .from('supplies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('projects')
      .select('id, title, status, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (suppliesResult.error) {
    throw new Error(`Unable to load your inventory summary: ${suppliesResult.error.message}`);
  }
  if (projectsResult.error) {
    throw new Error(`Unable to load your project summary: ${projectsResult.error.message}`);
  }
  if (profileResult.error) {
    throw new Error(`Unable to load your profile: ${profileResult.error.message}`);
  }

  const projects = projectsResult.data;
  let itemsToBuyCount = 0;
  if (projects.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('project_items')
      .select(DASHBOARD_ITEM_FIELDS)
      .in('project_id', projects.map((project) => project.id));

    if (itemsError) {
      throw new Error(`Unable to load your shopping summary: ${itemsError.message}`);
    }
    itemsToBuyCount = items.map(calculateProjectItemStatus)
      .filter((item) => item.quantity_missing > 0).length;
  }

  return {
    displayName: profileResult.data?.display_name ?? '',
    supplyCount: suppliesResult.count ?? 0,
    projectCount: projects.length,
    itemsToBuyCount,
    recentProjects: projects.slice(0, 3),
  };
}
