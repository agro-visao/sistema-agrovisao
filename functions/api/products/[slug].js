import { json, error } from '../_lib.js';
import { getSupabaseAdmin, AuthError } from '../admin/_supabase.js';
import { serializeProduct } from '../admin/_products.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);

    const PRODUCT_SELECT =
      'id, slug, name, description, image_path, image_path_2, image_path_3, ' +
      'price_cents, compare_price_cents, ' +
      'whatsapp_phone, whatsapp_text, category, category_label, stock, featured, active, ' +
      'created_at, updated_at';

    const { data: product, error: dbError } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle();

    if (dbError) return error(dbError.message, 500);
    if (!product) return error('Product not found', 404);

    const serialized = serializeProduct(product, env);
    return json({ data: { ...serialized, image_url: serialized.image } });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
