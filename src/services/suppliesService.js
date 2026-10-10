import { getSupabaseClient } from '../lib/supabaseClient.js';

const SUPPLY_FIELDS =
  'id, name, brand, color_code, color_hex, quantity, unit, notes, created_at, category_id, categories(name, icon)';

/**
 * Loads the signed-in user's supplies and the available supply categories.
 * RLS enforces which rows the current user may read.
 */
export async function getSupplyBrowseData() {
  const supabase = getSupabaseClient();
  const [suppliesResult, categoriesResult] = await Promise.all([
    supabase
      .from('supplies')
      .select(SUPPLY_FIELDS)
      .order('name'),
    supabase.from('categories').select('id, name, icon').order('name'),
  ]);

  if (suppliesResult.error) {
    throw new Error(`Unable to load supplies: ${suppliesResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(`Unable to load categories: ${categoriesResult.error.message}`);
  }

  return {
    supplies: suppliesResult.data,
    categories: categoriesResult.data,
  };
}

export async function getSupplyById(supplyId) {
  const { data, error } = await getSupabaseClient()
    .from('supplies')
    .select(SUPPLY_FIELDS)
    .eq('id', supplyId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load supply: ${error.message}`);
  if (!data) throw new Error('Supply not found or you do not have access to it.');
  return data;
}

export async function createSupply(supply) {
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your account: ${authError.message}`);
  if (!authData.user) throw new Error('You must be signed in to add a supply.');

  const { data, error } = await supabase
    .from('supplies')
    .insert({ ...supply, user_id: authData.user.id })
    .select(SUPPLY_FIELDS)
    .single();

  if (error) throw new Error(`Unable to create supply: ${error.message}`);
  return data;
}

export async function updateSupply(supplyId, supply) {
  const { data, error } = await getSupabaseClient()
    .from('supplies')
    .update(supply)
    .eq('id', supplyId)
    .select(SUPPLY_FIELDS)
    .maybeSingle();

  if (error) throw new Error(`Unable to update supply: ${error.message}`);
  if (!data) throw new Error('Supply not found or you do not have permission to update it.');
  return data;
}

export async function deleteSupply(supplyId) {
  const { data, error } = await getSupabaseClient()
    .from('supplies')
    .delete()
    .eq('id', supplyId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Unable to delete supply: ${error.message}`);
  if (!data) throw new Error('Supply not found or you do not have permission to delete it.');
}
