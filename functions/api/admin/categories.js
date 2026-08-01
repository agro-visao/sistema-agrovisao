import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  getCategories,
  validateCategoryInput,
  slugify,
  ensureUniqueKey,
  serializeCategory,
  readCategoryForm,
} from './_categories.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const categories = await getCategories(supabase);
      return json({ data: categories });
    }

    if (request.method === 'POST') {
      const body = await readCategoryForm(request);
      const validated = validateCategoryInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { label, description, sortOrder, active } = validated.data;
      const key = await ensureUniqueKey(supabase, slugify(label));

      const { data: inserted, error: insertErr } = await supabase
        .from('categories')
        .insert({
          key,
          label,
          description,
          sort_order: sortOrder,
          active,
        })
        .select('*')
        .single();
      if (insertErr) return error(insertErr.message, 500);

      return json({ data: serializeCategory(inserted) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
