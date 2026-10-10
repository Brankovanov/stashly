import { getSupabaseClient } from '../lib/supabaseClient.js';

const PROJECT_FIELDS =
  'id, user_id, title, description, status, cover_path, pattern_path, created_at, updated_at';

export async function getProjects() {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Unable to load projects: ${error.message}`);
  return data;
}

export async function getProjectById(projectId) {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select(PROJECT_FIELDS)
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load project: ${error.message}`);
  if (!data) throw new Error('Project not found or you do not have access to it.');
  return data;
}

export async function createProject(project) {
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your account: ${authError.message}`);
  if (!authData.user) throw new Error('You must be signed in to create a project.');

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: authData.user.id })
    .select(PROJECT_FIELDS)
    .single();

  if (error) throw new Error(`Unable to create project: ${error.message}`);
  return data;
}

export async function updateProject(projectId, project) {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .update(project)
    .eq('id', projectId)
    .select(PROJECT_FIELDS)
    .maybeSingle();

  if (error) throw new Error(`Unable to update project: ${error.message}`);
  if (!data) {
    throw new Error('Project not found or you do not have permission to update it.');
  }
  return data;
}

export async function deleteProject(projectId) {
  const project = await getProjectById(projectId);
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Unable to delete project: ${error.message}`);
  if (!data) {
    throw new Error('Project not found or you do not have permission to delete it.');
  }

  return {
    filePaths: [project.cover_path, project.pattern_path].filter(Boolean),
  };
}
