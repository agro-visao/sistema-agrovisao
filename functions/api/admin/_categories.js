// ─── Helpers compartilhados do CRUD de categorias ───────────────────────────

import { readJson } from './_auth.js';

export async function getCategories(db) {
  const { results } = await db
    .prepare('SELECT id, key, label, description, sort_order, active, created_at, updated_at FROM categories ORDER BY sort_order ASC, id ASC')
    .all();
  return results.map(serializeCategory);
}

export async function getCategoryById(db, id) {
  const row = await db
    .prepare('SELECT id, key, label, description, sort_order, active, created_at, updated_at FROM categories WHERE id = ?')
    .bind(id)
    .first();
  return row ? serializeCategory(row) : null;
}

export async function getCategoryByKey(db, key) {
  const row = await db
    .prepare('SELECT id, key, label, description, sort_order, active, created_at, updated_at FROM categories WHERE key = ?')
    .bind(key)
    .first();
  return row ? serializeCategory(row) : null;
}

export function serializeCategory(row) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description || '',
    sortOrder: row.sort_order,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function ensureUniqueKey(db, baseKey, excludeId = null) {
  const key = baseKey || 'categoria';
  const row = await db.prepare('SELECT id FROM categories WHERE key = ?').bind(key).first();
  if (!row || (excludeId !== null && row.id === excludeId)) return key;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${key}-${i}`;
    const candidateRow = await db.prepare('SELECT id FROM categories WHERE key = ?').bind(candidate).first();
    if (!candidateRow || (excludeId !== null && candidateRow.id === excludeId)) return candidate;
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
