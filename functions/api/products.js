import { json, error } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';
import { getProducts } from './admin/_products.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);
    const products = await getProducts(supabase, env);
    const active = products
      .filter((p) => p.active)
      .map((p) => ({ ...p, image_url: p.image }));
    return json({ data: active });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
