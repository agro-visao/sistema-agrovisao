// ─── Helpers do CRUD das "Categorias de Projetos" (seção de /projetos) ───────
// Tabela separada de `categories`: aquela classifica produtos da vitrine.

const COLUMNS = 'id, key, label, icon, sort_order, active, created_at, updated_at';

// Chaves de ícone aceitas — espelham src/data/projectCategoryIcons.ts. O banco
// guarda só a chave; o SVG mora no frontend, então uma chave desconhecida cai
// no ícone genérico em vez de quebrar a página.
export const ICON_KEYS = [
  'agropecuario', 'ambiental', 'social', 'cultural', 'esportivo', 'mulheres',
  'familiar', 'capacitacao', 'bioeconomia', 'sustentavel', 'projeto',
  'agua', 'tecnologia', 'saude',
];
export const DEFAULT_ICON = 'projeto';

export function serializeProjectCategory(row) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    icon: ICON_KEYS.includes(row.icon) ? row.icon : DEFAULT_ICON,
    sortOrder: row.sort_order,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProjectCategories(supabase) {
  const { data, error: dbError } = await supabase
    .from('project_categories')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (dbError) throw new Error(dbError.message);
  return (data || []).map(serializeProjectCategory);
}

export async function getProjectCategoryById(supabase, id) {
  const { data, error: dbError } = await supabase
    .from('project_categories')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data ? serializeProjectCategory(data) : null;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function ensureUniqueKey(supabase, baseKey, excludeId = null) {
  const key = baseKey || 'categoria';

  const isTaken = async (candidate) => {
    const { data, error: dbError } = await supabase
      .from('project_categories')
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

// Próxima posição na grade, para a categoria nova entrar no fim da seção.
export async function nextSortOrder(supabase) {
  const { data, error: dbError } = await supabase
    .from('project_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return (data && typeof data.sort_order === 'number' ? data.sort_order : 0) + 1;
}

export function validateProjectCategoryInput(body) {
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return { ok: false, error: 'Informe o nome da categoria.' };
  if (label.length > 60) return { ok: false, error: 'O nome deve ter no máximo 60 caracteres.' };

  const icon = typeof body.icon === 'string' && ICON_KEYS.includes(body.icon) ? body.icon : DEFAULT_ICON;
  // `active` ausente = ativa (é o caso comum ao criar pelo painel).
  const active = body.active === undefined
    ? true
    : body.active === true || body.active === 1 || body.active === '1' || body.active === 'true';

  return { ok: true, data: { label, icon, active } };
}
