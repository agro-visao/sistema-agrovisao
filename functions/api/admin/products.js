import { json, error, requireAdmin, AuthError, authError } from './_auth.js';
import {
  getProducts,
  validateProductInput,
  slugify,
  ensureUniqueSlug,
  serializeProduct,
  readProductForm,
} from './_products.js';
import { b2Configured, validateImageFile, uploadImage, makeFileKey } from './_b2.js';

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
      const products = await getProducts(db);
      return json({ data: products });
    }

    if (request.method === 'POST') {
      const { body, file } = await readProductForm(request);
      const validated = validateProductInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, isNew, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(db, slugify(name));

      const image = { fileKey: '', fileId: '', mimeType: '', width: null, height: null };
      if (file) {
        const fileCheck = await validateImageFile(file);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        if (!b2Configured(context.env)) {
          return error('Upload de imagem indisponível: B2 não configurado.', 503);
        }
        const uploaded = await uploadImage(context.env, {
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
          `INSERT INTO products
             (slug, name, description, b2_file_key, b2_file_id, mime_type, width, height,
              price_cents, compare_price_cents, whatsapp_text, category, category_label,
              stock, featured, is_new, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                   (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM products))`
        )
        .bind(
          slug, name, description, image.fileKey, image.fileId, image.mimeType, image.width, image.height,
          price, originalPrice, whatsappText, category, categoryLabel, stock,
          featured ? 1 : 0, isNew ? 1 : 0
        )
        .run();

      const row = await db.prepare('SELECT * FROM products WHERE slug = ?').bind(slug).first();
      return json({ data: serializeProduct(row) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status, request);
    return error(e.message, 500);
  }
}
