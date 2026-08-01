// ─── Helpers compartilhados do CRUD de produtos (painel admin) ───────────────
import { readJson } from './_supabase.js';
import { getPublicImageUrl } from './_storage.js';

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

// Lê o corpo do formulário de produto aceitando multipart/form-data (upload de
// imagem) ou JSON. No multipart, os campos de texto são strings; a imagem fica
// no campo "image" como File (ou null quando o produto não tem imagem).
export async function readProductForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await request.formData();
    const body = {};
    for (const key of [
      'name', 'category', 'categoryLabel', 'price', 'originalPrice', 'description',
      'stock', 'featured', 'isNew', 'whatsappText',
    ]) {
      const value = fd.get(key);
      if (typeof value === 'string') body[key] = value;
    }
    const file = fd.get('image');
    return { body, file: file && typeof file.size === 'number' ? file : null };
  }
  return { body: await readJson(request), file: null };
}

// Recebe a env para poder resolver a URL pública da imagem no Supabase Storage
// (row.image_path -> URL). Antes a imagem era servida via proxy do backend.
export function serializeProduct(row, env) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    image: row.image_path ? getPublicImageUrl(env, row.image_path) : '',
    imagePath: row.image_path || '',
    price: row.price_cents,
    originalPrice: row.compare_price_cents !== null && row.compare_price_cents !== undefined ? row.compare_price_cents : null,
    categoryId: row.category_id,
    category: row.category,
    categoryLabel: row.category_label,
    stock: row.stock,
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    active: Boolean(row.active),
    whatsappText: row.whatsapp_text || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_COLUMNS =
  'id, slug, name, description, image_path, ' +
  'price_cents, compare_price_cents, ' +
  'whatsapp_phone, whatsapp_text, category, category_label, category_id, stock, featured, is_new, active, ' +
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
// Preços chegam em reais (ex.: "35,00" ou 35) e são convertidos para centavos.
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
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const whatsappText = typeof body.whatsappText === 'string' && body.whatsappText.trim()
    ? body.whatsappText.trim()
    : buildWhatsappText(name);

  return {
    ok: true,
    data: {
      name,
      description,
      image,
      price,
      originalPrice,
      category,
      categoryLabel,
      stock,
      featured: body.featured === true || body.featured === 1 || body.featured === '1' || body.featured === 'true',
      isNew: body.isNew === true || body.isNew === 1 || body.isNew === '1' || body.isNew === 'true',
      whatsappText,
    },
  };
}
