import { json, error, requireAdmin, readJson, AuthError, authError } from './_supabase.js';
import {
  getProjectCategories,
  validateProjectCategoryInput,
  serializeProjectCategory,
  slugify,
  ensureUniqueKey,
  nextSortOrder,
} from './_project-categories.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      return json({ data: await getProjectCategories(supabase) });
    }

    if (request.method === 'POST') {
      const validated = validateProjectCategoryInput(await readJson(request));
      if (!validated.ok) return error(validated.error, 400);

      const { label, icon, active } = validated.data;
      const key = await ensureUniqueKey(supabase, slugify(label));
      const sortOrder = await nextSortOrder(supabase);

      const { data: inserted, error: insertErr } = await supabase
        .from('project_categories')
        .insert({ key, label, icon, sort_order: sortOrder, active })
        .select('*')
        .single();
      if (insertErr) return error(insertErr.message, 500);

      return json({ data: serializeProjectCategory(inserted) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
