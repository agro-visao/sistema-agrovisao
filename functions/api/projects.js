import { json, error, parseJsonArray } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const { data, error: dbError } = await supabase
      .from('projects')
      .select('id, slug, name, category, category_label, institution, description, services, logo_url')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (dbError) return error(dbError.message, 500);

    const result = (data || []).map((p) => ({
      ...p,
      services: parseJsonArray(p.services),
    }));

    return json({ data: result });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
