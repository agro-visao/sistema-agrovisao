import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import { getProductById, validateProductInput, slugify, ensureUniqueSlug, readProductForm } from '../_products.js';
import { storage } from '../_storage.js';
import { validateProcessedImage, makeImagePath, PRODUCT_IMAGE } from '../_image.js';

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

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, removeImage, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(supabase, slugify(name), id);

      const currentPath = existing.imagePaths[0];

      // Grava tudo menos a imagem; a parte da imagem entra por parâmetro para
      // o commit acontecer entre o upload do arquivo novo e a remoção do antigo.
      const saveProduct = async ({ path, mimeType, size, width, height }) => {
        const { error: updateErr } = await supabase
          .from('products')
          .update({
            slug,
            name,
            description,
            image_path: path,
            image_mime_type: mimeType,
            image_size: size,
            image_width: width,
            image_height: height,
            price_cents: price,
            compare_price_cents: originalPrice,
            whatsapp_text: whatsappText,
            category,
            category_label: categoryLabel,
            stock,
            featured,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (updateErr) throw new Error(updateErr.message);
      };

      // Arquivo novo substitui, removeImage1 limpa e a omissão mantém o que
      // está lá (com os metadados atuais intactos).
      if (file) {
        const fileCheck = await validateProcessedImage(file, PRODUCT_IMAGE);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        const { mimeType, size, width, height } = fileCheck.data;
        await storage.replace(
          env,
          {
            bytes: fileCheck.data.bytes,
            mimeType,
            path: makeImagePath(slug),
            previousPath: currentPath,
          },
          (stored) => saveProduct({ path: stored.path, mimeType, size, width, height })
        );
      } else if (removeImage && currentPath) {
        await saveProduct({ path: '', mimeType: '', size: 0, width: 0, height: 0 });
        await storage.delete(env, currentPath);
      } else {
        await saveProduct({
          path: currentPath,
          mimeType: existing.imageMimeType,
          size: existing.imageSize,
          width: existing.imageWidth,
          height: existing.imageHeight,
        });
      }

      const updated = await getProductById(supabase, env, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      const { error: deleteErr } = await supabase.from('products').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);
      // Inclui image_path_2/3 dos produtos antigos, para não deixar arquivo
      // órfão no bucket ao excluir um produto cadastrado antes da mudança.
      for (const path of existing.imagePaths.filter(Boolean)) {
        await storage.delete(env, path);
      }
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
