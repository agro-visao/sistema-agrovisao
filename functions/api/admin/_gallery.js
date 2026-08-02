// ─── Helpers compartilhados do CRUD da galeria (painel admin) ────────────────
// A galeria pública (/galeria) é alimentada pela tabela project_images: cada
// linha é UMA imagem pertencente a UM projeto. Não há qualquer vínculo com
// produtos — o admin de galeria é totalmente independente do admin de vendas.

import { readJson } from './_supabase.js';
import { storage } from './_storage.js';

export const MAX_IMAGES_PER_UPLOAD = 12;

// `*` (em vez da lista explícita de colunas) mantém a leitura funcionando
// mesmo antes de a migration 0002 (description/featured) ser aplicada.
const IMAGE_COLUMNS = '*';
const IMAGE_COLUMNS_WITH_PROJECT =
  `${IMAGE_COLUMNS}, projects ( id, slug, name, category, category_label, active )`;

// Registros antigos podem guardar uma URL absoluta em project_images.url;
// os novos guardam apenas o caminho do objeto no bucket do Supabase Storage.
export function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value || '');
}

export function serializeGalleryImage(row, env) {
  const raw = row.url || '';
  const project = row.projects || null;
  return {
    id: row.id,
    projectId: row.project_id,
    // Registro da galeria (parentId null) x foto complementar dele (parentId
    // apontando para o registro). A foto complementar só tem breve descrição.
    parentId: row.parent_id || null,
    url: isAbsoluteUrl(raw) ? raw : storage.getUrl(env, raw),
    // Vazio quando a imagem é uma URL externa (não há objeto para remover).
    imagePath: isAbsoluteUrl(raw) ? '' : raw,
    // alt = breve descrição (ao lado da foto); description = texto completo
    // (abaixo das fotos, na tela de detalhes).
    alt: row.alt || '',
    description: row.description || '',
    featured: Boolean(row.featured),
    // Metadados do arquivo processado (WEBP) gravado no Storage.
    mimeType: row.mime_type || '',
    sizeBytes: row.size_bytes || 0,
    width: row.width || 0,
    height: row.height || 0,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    projectName: project ? project.name : '',
    projectSlug: project ? project.slug : '',
    projectCategoryLabel: project ? project.category_label : '',
    projectActive: project ? Boolean(project.active) : true,
  };
}

export async function getGalleryImages(supabase, env) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select(IMAGE_COLUMNS_WITH_PROJECT)
    .order('project_id', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (dbError) throw new Error(dbError.message);
  return (data || []).map((row) => serializeGalleryImage(row, env));
}

// Fotos complementares de um registro (usadas para limpar o Storage quando o
// registro é excluído — o delete das linhas é feito em cascata pelo banco).
export async function getChildImages(supabase, env, parentId) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select(IMAGE_COLUMNS)
    .eq('parent_id', parentId);
  if (dbError) throw new Error(dbError.message);
  return (data || []).map((row) => serializeGalleryImage(row, env));
}

export async function getGalleryImageById(supabase, env, id) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select(IMAGE_COLUMNS_WITH_PROJECT)
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data ? serializeGalleryImage(data, env) : null;
}

export async function getProjectById(supabase, id) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select('id, slug, name, category_label, active')
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data || null;
}

// Próxima posição livre dentro do projeto (as imagens são ordenadas por
// sort_order dentro de cada galeria).
export async function nextSortOrder(supabase, projectId) {
  const { data, error: dbError } = await supabase
    .from('project_images')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return (data && typeof data.sort_order === 'number' ? data.sort_order : -1) + 1;
}

// Lê o formulário da galeria aceitando multipart/form-data (upload) ou JSON
// (edição só de texto). No multipart, o campo "images" pode repetir para enviar
// várias imagens de uma vez; a descrição de cada uma vem em "alt_<índice>",
// com fallback para o campo único "alt".
export async function readGalleryForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await request.formData();
    const body = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === 'string') body[key] = value;
    }
    const files = fd
      .getAll('images')
      .filter((f) => f && typeof f.size === 'number' && f.size > 0);
    const single = fd.get('image');
    if (single && typeof single.size === 'number' && single.size > 0) {
      files.push(single);
    }
    return { body, files };
  }
  return { body: await readJson(request), files: [] };
}

export function parseProjectId(value) {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function readAlt(body, index) {
  const perImage = body[`alt_${index}`];
  if (typeof perImage === 'string' && perImage.trim()) return perImage.trim().slice(0, 300);
  if (typeof body.alt === 'string' && body.alt.trim()) return body.alt.trim().slice(0, 300);
  return '';
}

export function readDescription(body, index) {
  const perImage = body[`description_${index}`];
  if (typeof perImage === 'string' && perImage.trim()) return perImage.trim().slice(0, 5000);
  if (typeof body.description === 'string' && body.description.trim()) {
    return body.description.trim().slice(0, 5000);
  }
  return '';
}

export function parseBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

// Só pode existir uma imagem em destaque por projeto (a capa da galeria), então
// os demais destaques do mesmo projeto são desmarcados antes de marcar o novo.
export async function setFeaturedImage(supabase, projectId, imageId) {
  const { error: clearErr } = await supabase
    .from('project_images')
    .update({ featured: false })
    .eq('project_id', projectId)
    .neq('id', imageId);
  if (clearErr) throw new Error(clearErr.message);

  const { error: setErr } = await supabase
    .from('project_images')
    .update({ featured: true })
    .eq('id', imageId);
  if (setErr) throw new Error(setErr.message);
}
