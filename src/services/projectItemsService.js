import { getSupabaseClient } from '../lib/supabaseClient.js';
import { calculateProjectItemStatus } from '../utils/projectItemValidation.js';
import { getProjectById } from './projectsService.js';

const PROJECT_ITEM_FIELDS =
  'id, project_id, supply_id, category_id, name, brand, color_code, quantity_needed, unit, created_at, updated_at, supplies(id, quantity, unit)';

export async function getProjectSupplyData(projectId) {
  const project = await getProjectById(projectId);
  const [{ data: items, error: itemsError }, supplies] = await Promise.all([
    getSupabaseClient()
      .from('project_items')
      .select(PROJECT_ITEM_FIELDS)
      .eq('project_id', projectId)
      .order('created_at'),
    getProjectSupplyOptions(project.user_id),
  ]);

  if (itemsError) throw new Error(`Unable to load project supplies: ${itemsError.message}`);
  const projectItems = items.map(calculateProjectItemStatus);
  const total = projectItems.length;
  const owned = projectItems.filter((item) => item.ownership_status === 'owned').length;

  return {
    project,
    items: projectItems,
    supplies,
    progress: {
      total,
      owned,
      percent: total ? Math.round((owned / total) * 100) : 0,
    },
  };
}

export async function getProjectSupplyOptions(ownerId) {
  const { data, error } = await getSupabaseClient()
    .from('supplies')
    .select('id, category_id, name, brand, color_code, quantity, unit, categories(name)')
    .eq('user_id', ownerId)
    .order('name');

  if (error) throw new Error(`Unable to load your supplies: ${error.message}`);
  return data;
}

export async function createProjectItem(projectId, item) {
  const { data, error } = await getSupabaseClient()
    .from('project_items')
    .insert({ ...item, project_id: projectId })
    .select('id')
    .single();

  if (error) throw new Error(`Unable to add project supply: ${error.message}`);
  return data;
}

export async function updateProjectItem(itemId, item) {
  const { data, error } = await getSupabaseClient()
    .from('project_items')
    .update(item)
    .eq('id', itemId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Unable to update project supply: ${error.message}`);
  if (!data) throw new Error('Project supply not found or you do not have permission to update it.');
}

export async function deleteProjectItem(itemId) {
  const { data, error } = await getSupabaseClient()
    .from('project_items')
    .delete()
    .eq('id', itemId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Unable to remove project supply: ${error.message}`);
  if (!data) throw new Error('Project supply not found or you do not have permission to remove it.');
}
