import { json, error } from '../_lib.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const product = await db
      .prepare(
        'SELECT id, slug, name, description, image_url, price_cents, compare_price_cents, whatsapp_phone, whatsapp_text FROM products WHERE slug = ? AND active = 1'
      )
      .bind(params.slug)
      .first();

    if (!product) return error('Product not found', 404);

    return json({ data: product });
  } catch (e) {
    return error(e.message);
  }
}
