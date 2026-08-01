import { json, error, parseJsonArray } from '../_lib.js';
import { getSupabaseAdmin, AuthError } from '../admin/_supabase.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .select('id, slug, name, category, category_label, institution, description, services, logo_url')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle();
    if (dbError) return error(dbError.message, 500);
    if (!project) return error('Project not found', 404);

    project.services = parseJsonArray(project.services);

    return json({ data: project });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
