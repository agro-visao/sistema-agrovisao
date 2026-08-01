import { json, error, requireAdmin, AuthError, authError } from '../_auth.js';
import { getCategoryById, validateCategoryInput, slugify, ensureUniqueKey, readCategoryForm } from '../_categories.js';

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Categoria inválida.', 400);

  try {
    const { user, db } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getCategoryById(db, id);
    if (!existing) return error('Categoria não encontrada.', 404);

    if (request.method === 'PUT') {
      const body = await readCategoryForm(request);
      const validated = validateCategoryInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { label, description, sortOrder, active } = validated.data;
      const key = await ensureUniqueKey(db, slugify(label), id);

      await db
        .prepare(
          `UPDATE categories SET
             key = ?, label = ?, description = ?, sort_order = ?, active = ?,
             updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(key, label, description, sortOrder, active ? 1 : 0, id)
        .run();

      const updated = await getCategoryById(db, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      const productCount = await db
        .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
        .bind(id)
        .first();

      if (productCount && productCount.count > 0) {
        return error(
          `Não é possível excluir esta categoria pois ${productCount.count} produto(s) a utiliza(m).`,
          409
        );
      }

      await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status, request);
    return error(e.message, 500);
  }
}
