import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  getProducts,
  validateProductInput,
  slugify,
  ensureUniqueSlug,
  serializeProduct,
  readProductForm,
} from './_products.js';
import { storage } from './_storage.js';
import { validateProcessedImage, makeImagePath, PRODUCT_IMAGE } from './_image.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    void user;
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const products = await getProducts(supabase, env);
      return json({ data: products });
    }

    if (request.method === 'POST') {
      const { body, files } = await readProductForm(request);
      const validated = validateProductInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(supabase, slugify(name));

      // Slot 0 = imagem principal; 1 e 2 = complementares. Cada um é opcional
      // e chega aqui já convertido para WEBP pelo painel.
      const imagePaths = ['', '', ''];
      let imageMeta = { mimeType: '', size: 0, width: 0, height: 0 };
      for (let i = 0; i < files.length; i++) {
        if (!files[i]) continue;
        const fileCheck = await validateProcessedImage(files[i], PRODUCT_IMAGE);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        const uploaded = await storage.upload(env, {
          bytes: fileCheck.data.bytes,
          mimeType: fileCheck.data.mimeType,
          path: makeImagePath(slug, i),
        });
        imagePaths[i] = uploaded.path;
        // Os metadados gravados são os da imagem principal.
        if (i === 0) imageMeta = fileCheck.data;
      }

      const { data: lastRow, error: sortErr } = await supabase
        .from('products')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sortErr) return error(sortErr.message, 500);
      const sortOrder = (lastRow && typeof lastRow.sort_order === 'number' ? lastRow.sort_order : 0) + 1;

      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert({
          slug,
          name,
          description,
          image_path: imagePaths[0],
          image_path_2: imagePaths[1],
          image_path_3: imagePaths[2],
          image_mime_type: imageMeta.mimeType,
          image_size: imageMeta.size,
          image_width: imageMeta.width,
          image_height: imageMeta.height,
          price_cents: price,
          compare_price_cents: originalPrice,
          whatsapp_text: whatsappText,
          category,
          category_label: categoryLabel,
          stock,
          featured,
          sort_order: sortOrder,
        })
        .select('*')
        .single();
      if (insertErr) return error(insertErr.message, 500);

      return json({ data: serializeProduct(inserted, env) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
