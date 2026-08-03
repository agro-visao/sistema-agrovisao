// ─── Helpers compartilhados do cadastro unificado de Projetos ────────────────
// Um único registro em `projects` alimenta dois lugares públicos, cada um
// controlado por um checkbox independente no painel:
//   * show_in_projects -> aparece no Grid (/projetos);
//   * show_in_gallery  -> aparece na Galeria (/galeria), desde que também
//     tenha ao menos uma foto em project_images (o registro "capa + extras").
//
// A logo (projects.logo_url) e as fotos da galeria (project_images) usam o
// mesmo Storage dos produtos, então tanto valores legados (paths estáticos
// como "/assets/logos/projetos/x.png") quanto uploads novos (objetos no
// bucket) precisam ser resolvidos da mesma forma — ver isServableAsIs/
// resolveMediaUrl abaixo.

import { readJson } from './_supabase.js';
import { storage } from './_storage.js';

export const PROJECT_FIELDS_ADMIN =
  'id, slug, name, category, category_label, institution, description, services, ' +
  'logo_url, active, show_in_gallery, show_in_projects, sort_order, created_at, updated_at';

export const PROJECT_FIELDS_PUBLIC =
  'id, slug, name, category, category_label, institution, description, services, logo_url';

// Um valor "servível como está" é uma URL absoluta (http/https) ou um caminho
// raiz do próprio site (os 19 projetos seed guardam logos em
// /assets/logos/projetos/*.png, servidos direto pelo Vite/Cloudflare Pages).
// Qualquer outra coisa é um caminho de objeto dentro do bucket do Storage e
// precisa passar por storage.getUrl().
export function isServableAsIs(value) {
  return /^https?:\/\//i.test(value || '') || /^\//.test(value || '');
}

export function resolveMediaUrl(env, raw) {
  if (!raw) return '';
  return isServableAsIs(raw) ? raw : storage.getUrl(env, raw);
}

export function slugify(value) {
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
export async function uniqueSlug(supabase, base, excludeId = null) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('id, slug')
    .like('slug', `${base}%`);
  if (dbError) throw new Error(dbError.message);

  const taken = new Set(
    (data || []).filter((row) => row.id !== excludeId).map((row) => row.slug)
  );
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function nextSortOrder(supabase) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return (data && typeof data.sort_order === 'number' ? data.sort_order : -1) + 1;
}

// A categoria é texto livre (igual ao cadastro rápido que já existia antes da
// unificação) — NÃO vem de "Cat. de Projetos" (project_categories), que é uma
// tabela diferente (ícones da seção "Áreas de Atuação" em /projetos).
//
// O slug (`category`) só é recalculado quando o rótulo muda de fato: os 19
// projetos seed usam slugs curtos escolhidos à mão (ex.: "familiar"), que o
// Grid público usa para filtrar (CATEGORY_ORDER em Projects/index.tsx) — se
// toda edição recalculasse `slugify(label)`, um projeto salvo sem alterar a
// categoria sairia do filtro por engano.
export function resolveCategory(categoryLabel, existing) {
  const label = String(categoryLabel || '').trim().slice(0, 60);
  if (!label) return null;
  if (existing && label === existing.category_label) {
    return { category: existing.category, categoryLabel: existing.category_label };
  }
  return { category: slugify(label) || 'projeto', categoryLabel: label };
}

export function serializeProjectAdmin(row, env, gallery) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categoryLabel: row.category_label,
    institution: row.institution || '',
    description: row.description || '',
    services: row.services,
    logoUrl: resolveMediaUrl(env, row.logo_url),
    logoPath: isServableAsIs(row.logo_url) ? '' : row.logo_url || '',
    active: Boolean(row.active),
    showInGallery: Boolean(row.show_in_gallery),
    showInProjects: Boolean(row.show_in_projects),
    gallery: gallery || null,
  };
}

// Resumo do registro de galeria (capa + extras) de UM projeto — no modelo
// unificado, cada projeto tem no máximo um registro "raiz" (parent_id nulo).
export async function getProjectGallerySummary(supabase, env, projectId) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (dbError) throw new Error(dbError.message);

  const rows = data || [];
  const cover = rows.find((r) => !r.parent_id) || null;
  if (!cover) return null;

  const extras = rows.filter((r) => r.parent_id === cover.id);
  return {
    recordId: cover.id,
    alt: cover.alt || '',
    description: cover.description || '',
    featured: Boolean(cover.featured),
    coverUrl: resolveMediaUrl(env, cover.url),
    coverPath: isServableAsIs(cover.url) ? '' : cover.url || '',
    imageCount: 1 + extras.length,
    extras: extras.map((r) => ({
      id: r.id,
      alt: r.alt || '',
      url: resolveMediaUrl(env, r.url),
      path: isServableAsIs(r.url) ? '' : r.url || '',
    })),
  };
}

// Mesma consulta acima, mas para TODOS os projetos de uma vez (lista do
// painel) — evita N+1 fazendo uma única query em project_images.
export async function getAllGallerySummaries(supabase, env) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select('*')
    .order('project_id', { ascending: true })
    .order('sort_order', { ascending: true });
  if (dbError) throw new Error(dbError.message);

  const rows = data || [];
  const byProject = new Map();
  rows.forEach((r) => {
    if (!byProject.has(r.project_id)) byProject.set(r.project_id, []);
    byProject.get(r.project_id).push(r);
  });

  const result = new Map();
  for (const [projectId, projectRows] of byProject.entries()) {
    const cover = projectRows.find((r) => !r.parent_id);
    if (!cover) continue;
    const extras = projectRows.filter((r) => r.parent_id === cover.id);
    result.set(projectId, {
      recordId: cover.id,
      alt: cover.alt || '',
      description: cover.description || '',
      featured: Boolean(cover.featured),
      coverUrl: resolveMediaUrl(env, cover.url),
      coverPath: isServableAsIs(cover.url) ? '' : cover.url || '',
      imageCount: 1 + extras.length,
      extras: extras.map((r) => ({
        id: r.id,
        alt: r.alt || '',
        url: resolveMediaUrl(env, r.url),
        path: isServableAsIs(r.url) ? '' : r.url || '',
      })),
    });
  }
  return result;
}

export function parseBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

// Lê o formulário do cadastro unificado: multipart/form-data (upload de logo
// e/ou fotos) ou JSON puro (edição só de texto/checkboxes).
//
// Campos multipart:
//   logo        arquivo único — logo/imagem principal do projeto;
//   coverImage  arquivo único — substitui a capa da galeria já existente;
//   images      múltiplos — na criação, o 1º vira a capa e o resto as fotos
//               complementares; na edição, todos entram como complementares;
//   removeLogo  'true' remove a logo atual sem substituir.
export async function readProjectForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await request.formData();
    const body = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === 'string') body[key] = value;
    }
    const pickFile = (key) => {
      const raw = fd.get(key);
      return raw && typeof raw.size === 'number' && raw.size > 0 ? raw : null;
    };
    const images = fd
      .getAll('images')
      .filter((f) => f && typeof f.size === 'number' && f.size > 0);
    return { body, logo: pickFile('logo'), coverImage: pickFile('coverImage'), images };
  }
  return { body: await readJson(request), logo: null, coverImage: null, images: [] };
}

export function readIdArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => parseInt(v, 10)).filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}
