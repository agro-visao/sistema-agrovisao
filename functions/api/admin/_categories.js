// ─── Helpers compartilhados do CRUD de categorias ───────────────────────────

import { readJson } from './_supabase.js';

const CATEGORY_COLUMNS = 'id, key, label, description, sort_order, active, created_at, updated_at';

export async function getCategories(supabase) {
  const { data, error: dbError } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (dbError) throw new Error(dbError.message);
  return (data || []).map(serializeCategory);
}

export async function getCategoryById(supabase, id) {
  const { data, error: dbError } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data ? serializeCategory(data) : null;
}

export async function getCategoryByKey(supabase, key) {
  const { data, error: dbError } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('key', key)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data ? serializeCategory(data) : null;
}

export function serializeCategory(row) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description || '',
    sortOrder: row.sort_order,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function ensureUniqueKey(supabase, baseKey, excludeId = null) {
  const key = baseKey || 'categoria';

  const isTaken = async (candidate) => {
    const { data, error: dbError } = await supabase
      .from('categories')
      .select('id')
      .eq('key', candidate)
      .maybeSingle();
    if (dbError) throw new Error(dbError.message);
    if (!data) return false;
    return !(excludeId !== null && data.id === excludeId);
  };

  if (!(await isTaken(key))) return key;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${key}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${key}-${Date.now()}`;
}

export function validateCategoryInput(body) {
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return { ok: false, error: 'Informe o rótulo da categoria.' };

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const sortOrder = parseInt(body.sortOrder, 10) || 0;

  return {
    ok: true,
    data: {
      label,
      description,
      sortOrder,
      active: body.active === true || body.active === 1 || body.active === '1' || body.active === 'true',
    },
  };
}

export async function readCategoryForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return await readJson(request);
  }
  const fd = await request.formData();
  const body = {};
  for (const key of ['label', 'description', 'sortOrder', 'active']) {
    const value = fd.get(key);
    if (value !== null) body[key] = value;
  }
  return body;
}
