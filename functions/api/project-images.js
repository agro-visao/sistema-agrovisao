import { json, error } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const { data, error: dbError } = await supabase
      .from('project_images')
      .select(`
        id,
        url,
        alt,
        sort_order,
        created_at,
        projects!inner (
          id,
          slug,
          name,
          category,
          category_label,
          active,
          sort_order
        )
      `)
      .eq('projects.active', true)
      .order('sort_order', { ascending: true });

    if (dbError) return error(dbError.message, 500);

    const result = (data || []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sort_order,
      createdAt: img.created_at,
      project: {
        id: img.projects.id,
        slug: img.projects.slug,
        name: img.projects.name,
        category: img.projects.category,
        categoryLabel: img.projects.category_label,
      },
    }));

    return json({ data: result });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
