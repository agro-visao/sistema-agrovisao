import { json, error } from './_lib.js';
import { getSupabaseAdmin, AuthError } from './admin/_supabase.js';
import { getProjectCategories } from './admin/_project-categories.js';

// Alimenta a seção "Categorias de Projetos" da página /projetos.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const supabase = getSupabaseAdmin(env);
    const categories = await getProjectCategories(supabase);
    return json({ data: categories.filter((c) => c.active) });
  } catch (e) {
    if (e instanceof AuthError) return error(e.message, e.status);
    return error(e.message);
  }
}
