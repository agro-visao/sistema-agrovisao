// Lista de projetos para o painel admin (usada pelo seletor da galeria).
// Diferente de /api/projects (público), inclui também projetos inativos, para
// que a galeria possa ser preparada antes de o projeto ir ao ar.
import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const { data, error: dbError } = await supabase
      .from('projects')
      .select('id, slug, name, category, category_label, active')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (dbError) return error(dbError.message, 500);

    const result = (data || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      categoryLabel: p.category_label,
      active: Boolean(p.active),
    }));

    return json({ data: result });
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
