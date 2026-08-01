import { json, error, requireAdmin, AuthError, authError } from '../_auth.js';
import { getProductById, validateProductInput, slugify, ensureUniqueSlug, readProductForm } from '../_products.js';
import { b2Configured, validateImageFile, uploadImage, destroyImage, makeFileKey } from '../_b2.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Produto inválido.', 400);

  try {
    const { user, db } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getProductById(db, id);
    if (!existing) return error('Produto não encontrado.', 404);

    if (request.method === 'PUT') {
      const { body, file } = await readProductForm(request);
      const validated = validateProductInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, isNew, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(db, slugify(name), id);

      // Sem nova imagem, mantém a referência atual (nunca zera por omissão).
      const image = {
        fileKey: existing.b2FileKey,
        fileId: existing.b2FileId,
        mimeType: existing.mimeType,
        width: existing.width,
        height: existing.height,
      };
      if (file) {
        const fileCheck = await validateImageFile(file);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        if (!b2Configured(env)) {
          return error('Upload de imagem indisponível: B2 não configurado.', 503);
        }
        const uploaded = await uploadImage(env, {
          bytes: fileCheck.data.bytes,
          mimeType: fileCheck.data.mimeType,
          fileKey: makeFileKey(slug, fileCheck.data.mimeType),
        });
        image.fileKey = uploaded.fileKey;
        image.fileId = uploaded.fileId;
        image.mimeType = uploaded.mimeType;
        image.width = uploaded.width;
        image.height = uploaded.height;
      }

      await db
        .prepare(
          `UPDATE products SET
             slug = ?, name = ?, description = ?, b2_file_key = ?,
             b2_file_id = ?, mime_type = ?, width = ?, height = ?,
             price_cents = ?, compare_price_cents = ?, whatsapp_text = ?,
             category = ?, category_label = ?, stock = ?, featured = ?, is_new = ?,
             updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(
          slug, name, description, image.fileKey, image.fileId, image.mimeType, image.width, image.height,
          price, originalPrice, whatsappText, category, categoryLabel, stock,
          featured ? 1 : 0, isNew ? 1 : 0, id
        )
        .run();

      // Só remove a imagem antiga depois de a nova estar confirmada no D1.
      if (file && existing.b2FileKey && existing.b2FileId && existing.b2FileKey !== image.fileKey) {
        try {
          await destroyImage(env, existing.b2FileId, existing.b2FileKey);
        } catch (e) {
          console.error('[admin] falha ao remover imagem antiga do B2', e.message);
        }
      }

      const updated = await getProductById(db, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      if (existing.b2FileKey && existing.b2FileId) {
        try {
          await destroyImage(env, existing.b2FileId, existing.b2FileKey);
        } catch (e) {
          console.error('[admin] falha ao remover imagem do B2', e.message);
        }
      }
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status, request);
    return error(e.message, 500);
  }
}
