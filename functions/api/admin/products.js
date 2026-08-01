import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  getProducts,
  validateProductInput,
  slugify,
  ensureUniqueSlug,
  serializeProduct,
  readProductForm,
} from './_products.js';
import { validateImageFile, uploadProductImage, makeImagePath } from './_storage.js';

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
      const { body, file } = await readProductForm(request);
      const validated = validateProductInput(body);
      if (!validated.ok) return error(validated.error, 400);

      const { name, description, price, originalPrice, category, categoryLabel, stock, featured, isNew, whatsappText } = validated.data;
      const slug = await ensureUniqueSlug(supabase, slugify(name));

      let imagePath = '';
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
          image_path: imagePath,
          price_cents: price,
          compare_price_cents: originalPrice,
          whatsapp_text: whatsappText,
          category,
          category_label: categoryLabel,
          stock,
          featured,
          is_new: isNew,
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
