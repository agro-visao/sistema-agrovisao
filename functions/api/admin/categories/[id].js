import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import { getCategoryById, validateCategoryInput, slugify, ensureUniqueKey, readCategoryForm } from '../_categories.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Categoria inválida.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getCategoryById(supabase, id);
    if (!existing) return error('Categoria não encontrada.', 404);

    if (request.method === 'PUT') {
      const body = await readCategoryForm(request);
      const validated = validateCategoryInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { label, description, sortOrder, active } = validated.data;
      const key = await ensureUniqueKey(supabase, slugify(label), id);

      const { error: updateErr } = await supabase
        .from('categories')
        .update({
          key,
          label,
          description,
          sort_order: sortOrder,
          active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateErr) return error(updateErr.message, 500);

      const updated = await getCategoryById(supabase, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      const { count: productCount, error: countErr } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);
      if (countErr) return error(countErr.message, 500);

      if (productCount && productCount > 0) {
        return error(
          `Não é possível excluir esta categoria pois ${productCount} produto(s) a utiliza(m).`,
          409
        );
      }

      const { error: deleteErr } = await supabase.from('categories').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);

      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
