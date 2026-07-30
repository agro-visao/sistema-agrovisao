import { json, error } from '../_lib.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const project = await db
      .prepare(
        'SELECT id, slug, name, category, category_label, institution, description, services, logo_url FROM projects WHERE slug = ? AND active = 1'
      )
      .bind(params.slug)
      .first();

    if (!project) return error('Project not found', 404);

    project.services = JSON.parse(project.services || '[]');

    return json({ data: project });
  } catch (e) {
    return error(e.message);
  }
}
