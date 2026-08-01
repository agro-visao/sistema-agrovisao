// Projetos do painel admin (usados pelo seletor da galeria).
// Diferente de /api/projects (público), inclui também projetos inativos, para
// que a galeria possa ser preparada antes de o projeto ir ao ar, e permite
// criar um projeto novo direto do formulário da galeria.
import { json, error, requireAdmin, readJson, AuthError, authError } from './_supabase.js';

const PROJECT_FIELDS = 'id, slug, name, category, category_label, active';

function serializeProject(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    categoryLabel: p.category_label,
    active: Boolean(p.active),
  };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// O slug é único na tabela: se o nome escolhido colidir com um projeto
// existente, acrescenta um sufixo numérico até sobrar um livre.
async function uniqueSlug(supabase, base) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('slug')
    .like('slug', `${base}%`);
  if (dbError) throw new Error(dbError.message);

  const taken = new Set((data || []).map((row) => row.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function nextSortOrder(supabase) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return (data && typeof data.sort_order === 'number' ? data.sort_order : -1) + 1;
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const { data, error: dbError } = await supabase
        .from('projects')
        .select(PROJECT_FIELDS)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (dbError) return error(dbError.message, 500);
      return json({ data: (data || []).map(serializeProject) });
    }

    if (request.method === 'POST') {
      const body = await readJson(request);

      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      if (!name) return error('Informe o nome do projeto.', 400);

      const base = slugify(name);
      if (!base) return error('O nome do projeto precisa ter letras ou números.', 400);

      const categoryLabel =
        typeof body.categoryLabel === 'string' && body.categoryLabel.trim()
          ? body.categoryLabel.trim().slice(0, 60)
          : 'Projeto';

      const row = {
        slug: await uniqueSlug(supabase, base),
        name,
        category: slugify(categoryLabel) || 'projeto',
        category_label: categoryLabel,
        sort_order: await nextSortOrder(supabase),
        active: true,
      };

      const { data, error: insertErr } = await supabase
        .from('projects')
        .insert(row)
        .select(PROJECT_FIELDS)
        .single();
      if (insertErr) return error(insertErr.message, 500);

      return json({ data: serializeProject(data) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
