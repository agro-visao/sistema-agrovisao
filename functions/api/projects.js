import { json, error } from './_lib.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const { results } = await db
      .prepare(
        'SELECT id, slug, name, category, category_label, institution, description, services, logo_url FROM projects WHERE active = 1 ORDER BY sort_order ASC'
      )
      .all();

    const data = results.map((p) => ({
      ...p,
      services: JSON.parse(p.services || '[]'),
    }));

    return json({ data });
  } catch (e) {
    return error(e.message);
  }
}
