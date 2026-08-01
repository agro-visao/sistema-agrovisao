import { json, error, requireAdmin, readJson, AuthError, authError } from '../_supabase.js';
import {
  getProjectCategoryById,
  validateProjectCategoryInput,
  serializeProjectCategory,
  slugify,
  ensureUniqueKey,
} from '../_project-categories.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Categoria inválida.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getProjectCategoryById(supabase, id);
    if (!existing) return error('Categoria não encontrada.', 404);

    if (request.method === 'PUT') {
      const validated = validateProjectCategoryInput(await readJson(request));
      if (!validated.ok) return error(validated.error, 400);

      const { label, icon, active } = validated.data;
      // A key acompanha o nome, mas continua única entre as demais.
      const key = label === existing.label
        ? existing.key
        : await ensureUniqueKey(supabase, slugify(label), id);

      const { data: updated, error: updateErr } = await supabase
        .from('project_categories')
        .update({ key, label, icon, active })
        .eq('id', id)
        .select('*')
        .single();
      if (updateErr) return error(updateErr.message, 500);

      return json({ data: serializeProjectCategory(updated) });
    }

    if (request.method === 'DELETE') {
      const { error: deleteErr } = await supabase.from('project_categories').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
