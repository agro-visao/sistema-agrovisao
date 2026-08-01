import { json, error } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';
import { getCategories } from './admin/_categories.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);
    const categories = await getCategories(supabase);
    const active = categories.filter((c) => c.active);
    return json({ data: active });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message, 500);
  }
}
