import { json, error, requireAdmin, AuthError, authError } from './_auth.js';
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
    const { user, db } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const categories = await getCategories(db);
      return json({ data: categories });
    }

    if (request.method === 'POST') {
      const body = await readCategoryForm(request);
      const validated = validateCategoryInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { label, description, sortOrder, active } = validated.data;
      const key = await ensureUniqueKey(db, slugify(label));

      await db
        .prepare(
          `INSERT INTO categories
             (key, label, description, sort_order, active)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(key, label, description, sortOrder, active ? 1 : 0)
        .run();

      const row = await db.prepare('SELECT * FROM categories WHERE key = ?').bind(key).first();
      return json({ data: serializeCategory(row) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status, request);
    return error(e.message, 500);
  }
}
