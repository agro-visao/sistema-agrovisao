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
        'SELECT id, slug, name, description, image_url, price_cents, compare_price_cents, whatsapp_phone, whatsapp_text FROM products WHERE active = 1 ORDER BY sort_order ASC'
      )
      .all();

    return json({ data: results });
  } catch (e) {
    return error(e.message);
  }
}
