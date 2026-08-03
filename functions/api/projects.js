import { json, error, parseJsonArray } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';
import { PROJECT_FIELDS_PUBLIC, resolveMediaUrl } from './admin/_projects.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const { data, error: dbError } = await supabase
      .from('projects')
      .select(PROJECT_FIELDS_PUBLIC)
      .eq('active', true)
      .eq('show_in_projects', true)
      .order('sort_order', { ascending: true });
    if (dbError) return error(dbError.message, 500);

    const result = (data || []).map((p) => ({
      ...p,
      services: parseJsonArray(p.services),
      // Logos legadas são caminhos estáticos (/assets/...); as novas são
      // objetos no Storage e precisam virar URL pública.
      logo_url: resolveMediaUrl(env, p.logo_url),
    }));

    return json({ data: result });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
