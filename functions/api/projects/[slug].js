import { json, error, parseJsonArray } from '../_lib.js';
import { getSupabaseAdmin, AuthError } from '../admin/_supabase.js';
import { PROJECT_FIELDS_PUBLIC, resolveMediaUrl } from '../admin/_projects.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .select(PROJECT_FIELDS_PUBLIC)
      .eq('slug', params.slug)
      .eq('active', true)
      .eq('show_in_projects', true)
      .maybeSingle();
    if (dbError) return error(dbError.message, 500);
    if (!project) return error('Project not found', 404);

    project.services = parseJsonArray(project.services);
    project.logo_url = resolveMediaUrl(env, project.logo_url);

    return json({ data: project });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
