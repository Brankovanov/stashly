import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Loads the signed-in user's supplies and the available supply categories.
 * RLS enforces which rows the current user may read.
 */
export async function getSupplyBrowseData() {
  const supabase = getSupabaseClient();
  const [suppliesResult, categoriesResult] = await Promise.all([
    supabase
      .from('supplies')
      .select(
        'id, name, brand, color_code, color_hex, quantity, unit, notes, created_at, category_id, categories(name, icon)',
      )
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
