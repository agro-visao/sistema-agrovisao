import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import { getProductById, validateProductInput, slugify, ensureUniqueSlug, readProductForm } from '../_products.js';
import { validateImageFile, uploadProductImage, deleteProductImage, makeImagePath } from '../_storage.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Produto inválido.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getProductById(supabase, env, id);
    if (!existing) return error('Produto não encontrado.', 404);

    if (request.method === 'PUT') {
      const { body, file } = await readProductForm(request);
      const validated = validateProductInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, isNew, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(supabase, slugify(name), id);

      // Sem nova imagem, mantém a referência atual (nunca zera por omissão).
      let imagePath = existing.imagePath;
      if (file) {
        const fileCheck = await validateImageFile(file);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        const uploaded = await uploadProductImage(env, {
          bytes: fileCheck.data.bytes,
          mimeType: fileCheck.data.mimeType,
          path: makeImagePath(slug, fileCheck.data.mimeType),
        });
        imagePath = uploaded.path;
      }

      const { error: updateErr } = await supabase
        .from('products')
        .update({
          slug,
          name,
          description,
          image_path: imagePath,
          price_cents: price,
          compare_price_cents: originalPrice,
          whatsapp_text: whatsappText,
          category,
          category_label: categoryLabel,
          stock,
          featured,
          is_new: isNew,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateErr) return error(updateErr.message, 500);

      // Só remove a imagem antiga depois de a nova estar confirmada no banco.
      if (file && existing.imagePath && existing.imagePath !== imagePath) {
        await deleteProductImage(env, existing.imagePath);
      }

      const updated = await getProductById(supabase, env, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      const { error: deleteErr } = await supabase.from('products').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);
      if (existing.imagePath) {
        await deleteProductImage(env, existing.imagePath);
      }
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
