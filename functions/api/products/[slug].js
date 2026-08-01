import { json, error } from '../_lib.js';
import { serializeProduct } from '../admin/_products.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const PRODUCT_SELECT =
      'id, slug, name, description, b2_file_key, b2_file_id, mime_type, width, height, ' +
      'price_cents, compare_price_cents, ' +
      'whatsapp_phone, whatsapp_text, category, category_label, stock, featured, is_new, active, ' +
      'created_at, updated_at';

    const product = await db
      .prepare(`SELECT ${PRODUCT_SELECT} FROM products WHERE slug = ? AND active = 1`)
      .bind(params.slug)
      .first();

    if (!product) return error('Product not found', 404);

    const serialized = serializeProduct(product);
    return json({ data: { ...serialized, image_url: serialized.image } });
  } catch (e) {
    return error(e.message);
  }
}
