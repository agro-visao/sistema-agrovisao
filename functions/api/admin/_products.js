// ─── Helpers compartilhados do CRUD de produtos (painel admin) ───────────────
import { readJson } from './_supabase.js';
import { storage } from './_storage.js';

const CATEGORY_LABELS = {
  mudas: 'Mudas',
  insumos: 'Insumos',
};

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// O painel envia o valor JÁ EM CENTAVOS (inteiro), que é como price_cents /
// compare_price_cents são guardados. Multiplicar por 100 aqui — como a versão
// anterior fazia — deixava todo produto salvo pelo painel 100x mais caro.
export function toCents(value) {
  const num = typeof value === 'number' ? value : parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}

export function categoryLabelFor(category) {
  return CATEGORY_LABELS[category] || category;
}

export function buildWhatsappText(name) {
  return `Olá! Tenho interesse em comprar ${name}. Gostaria de receber mais informações.`;
}

// O produto passa a ter UMA imagem: só image_path é gravado. image_path_2 e
// image_path_3 continuam sendo lidos para não sumir com a foto dos produtos
// cadastrados antes desta mudança, mas nenhum upload novo chega neles.
export const IMAGE_COLUMNS_BY_SLOT = ['image_path', 'image_path_2', 'image_path_3'];

// Lê o corpo do formulário de produto aceitando multipart/form-data (upload de
// imagem) ou JSON. No multipart, os campos de texto são strings e a imagem vem
// no campo "image" como File (null quando não há foto nova).
export async function readProductForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await request.formData();
    const body = {};
    for (const key of [
      'name', 'category', 'categoryLabel', 'price', 'originalPrice', 'description',
      'stock', 'featured', 'whatsappText', 'removeImage1',
    ]) {
      const value = fd.get(key);
      if (typeof value === 'string') body[key] = value;
    }
    const candidate = fd.get('image');
    const file = candidate && typeof candidate.size === 'number' && candidate.size > 0 ? candidate : null;
    return { body, file };
  }
  return { body: await readJson(request), file: null };
}

// Recebe a env para poder resolver a URL pública da imagem no Supabase Storage
// (row.image_path -> URL). Antes a imagem era servida via proxy do backend.
export function serializeProduct(row, env) {
  // Os 3 slots continuam saindo no payload por causa dos produtos antigos que
  // ainda têm foto em image_path_2/3. `gallery` traz só as que existem, que é
  // o que a página pública usa nas miniaturas.
  const imagePaths = IMAGE_COLUMNS_BY_SLOT.map((column) => row[column] || '');
  const images = imagePaths.map((path) => storage.getUrl(env, path));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    image: images[0],
    imagePath: imagePaths[0],
    images,
    imagePaths,
    gallery: images.filter(Boolean),
    // Metadados do arquivo já processado (WEBP) que está no Storage.
    imageMimeType: row.image_mime_type || '',
    imageSize: row.image_size || 0,
    imageWidth: row.image_width || 0,
    imageHeight: row.image_height || 0,
    price: row.price_cents,
    originalPrice: row.compare_price_cents !== null && row.compare_price_cents !== undefined ? row.compare_price_cents : null,
    categoryId: row.category_id,
    category: row.category,
    categoryLabel: row.category_label,
    stock: row.stock,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    whatsappText: row.whatsapp_text || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_COLUMNS =
  'id, slug, name, description, image_path, image_path_2, image_path_3, ' +
  'image_mime_type, image_size, image_width, image_height, ' +
  'price_cents, compare_price_cents, ' +
  'whatsapp_phone, whatsapp_text, category, category_label, category_id, stock, featured, active, ' +
  'created_at, updated_at';

export async function getProducts(supabase, env) {
  const { data, error: dbError } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('active', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (dbError) throw new Error(dbError.message);
  return (data || []).map((row) => serializeProduct(row, env));
}

export async function getProductById(supabase, env, id) {
  const { data, error: dbError } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data ? serializeProduct(data, env) : null;
}

export async function ensureUniqueSlug(supabase, baseSlug, excludeId = null) {
  const slug = baseSlug || 'produto';

  const isTaken = async (candidate) => {
    const { data, error: dbError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (dbError) throw new Error(dbError.message);
    if (!data) return false;
    return !(excludeId !== null && data.id === excludeId);
  };

  if (!(await isTaken(slug))) return slug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

// Valida e normaliza o payload do formulário do painel.
// Preços chegam já em centavos (ex.: "3500" = R$ 35,00), como o banco guarda.
export function validateProductInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { ok: false, error: 'Informe o nome do produto.' };

  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'mudas';
  const categoryLabel = typeof body.categoryLabel === 'string' && body.categoryLabel.trim()
    ? body.categoryLabel.trim()
    : categoryLabelFor(category);

  const price = toCents(body.price);
  if (price === null || price < 0) return { ok: false, error: 'Informe um valor válido.' };
  const originalPrice = body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== ''
    ? toCents(body.originalPrice)
    : null;
  if (originalPrice !== null && (originalPrice === null || originalPrice < 0)) {
    return { ok: false, error: 'Informe um valor original válido.' };
  }

  const stock = Math.max(0, parseInt(body.stock, 10) || 0);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const whatsappText = typeof body.whatsappText === 'string' && body.whatsappText.trim()
    ? body.whatsappText.trim()
    : buildWhatsappText(name);

  // A imagem só é limpa quando o painel pede explicitamente (removeImage1);
  // a omissão sempre preserva a foto que já está no produto.
  const removeImage = isTrue(body.removeImage1);

  return {
    ok: true,
    data: {
      name,
      description,
      price,
      originalPrice,
      category,
      categoryLabel,
      stock,
      featured: isTrue(body.featured),
      removeImage,
      whatsappText,
    },
  };
}

function isTrue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}
