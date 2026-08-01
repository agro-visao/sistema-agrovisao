// ─── Helpers compartilhados do CRUD de produtos (painel admin) ───────────────
import { readJson } from './_auth.js';

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

export function toCents(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === 'string' && value.trim() !== '') {
    const num = parseFloat(value.replace(',', '.'));
    if (Number.isFinite(num)) return Math.round(num * 100);
  }
  return null;
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

export function serializeProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    image: row.b2_file_key ? `/api/products/${row.id}/image` : '',
    b2FileKey: row.b2_file_key || '',
    b2FileId: row.b2_file_id || '',
    mimeType: row.mime_type || '',
    width: row.width ?? null,
    height: row.height ?? null,
    price: row.price_cents,
    originalPrice: row.compare_price_cents !== null ? row.compare_price_cents : null,
    categoryId: row.category_id,
    category: row.category,
    categoryLabel: row.category_label,
    stock: row.stock,
    featured: row.featured === 1,
    isNew: row.is_new === 1,
    active: row.active === 1,
    whatsappText: row.whatsapp_text || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT =
  'id, slug, name, description, image_url, b2_file_key, b2_file_id, mime_type, width, height, ' +
  'price_cents, compare_price_cents, ' +
  'whatsapp_phone, whatsapp_text, category, category_label, category_id, stock, featured, is_new, active, ' +
  'created_at, updated_at';

export async function getProducts(db) {
  const { results } = await db
    .prepare(`SELECT ${PRODUCT_SELECT} FROM products ORDER BY active DESC, sort_order ASC, id ASC`)
    .all();
  return results.map(serializeProduct);
}

export async function getProductById(db, id) {
  const row = await db
    .prepare(`SELECT ${PRODUCT_SELECT} FROM products WHERE id = ?`)
    .bind(id)
    .first();
  return row ? serializeProduct(row) : null;
}

export async function ensureUniqueSlug(db, baseSlug, excludeId = null) {
  const slug = baseSlug || 'produto';
  const row = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first();
  if (!row || (excludeId !== null && row.id === excludeId)) return slug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    const candidateRow = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(candidate).first();
    if (!candidateRow || (excludeId !== null && candidateRow.id === excludeId)) return candidate;
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
