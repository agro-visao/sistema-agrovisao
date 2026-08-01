// ─── Upload/download/destroy de imagens no Supabase Storage (bucket público) ─
// O bucket "product-images" é público (criado via migration do schema), então
// as URLs de imagem passam a ser diretas (getPublicUrl), sem proxy do backend.
// No Postgres fica apenas a referência: products.image_path.

import { getSupabaseAdmin } from './_supabase.js';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const BUCKET = 'product-images';

// Validação do arquivo: extensão, MIME declarado e magic bytes (o tipo enviado
// pelo navegador é controlável pelo cliente, então o conteúdo é verificado).
export async function validateImageFile(file) {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, error: 'Selecione um arquivo de imagem.' };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, error: 'A imagem deve ter no máximo 5 MB.' };
  }
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: 'Extensão inválida. Use .jpg, .jpeg, .png ou .webp.' };
  }
  const declared = String(file.type || '').toLowerCase();
  if (!ALLOWED_MIME.has(declared)) {
    return { ok: false, error: 'Tipo MIME inválido. Use JPG, PNG ou WEBP.' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== declared) {
    return { ok: false, error: 'O conteúdo do arquivo não é uma imagem JPG, PNG ou WEBP válida.' };
  }
  return { ok: true, data: { bytes, mimeType: sniffed } };
}

function sniffImageType(bytes) {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Um mesmo salvamento pode enviar as 3 fotos do produto de uma vez, então o
// índice do slot + sufixo aleatório evitam colisão entre arquivos criados no
// mesmo milissegundo.
export function makeImagePath(slug, mimeType, index = 0) {
  const ext = MIME_EXT[mimeType] || 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  return `products/${slug}-${Date.now()}-${index}-${rand}.${ext}`;
}

// Caminho das imagens da galeria (project_images). Como um mesmo envio pode
// conter várias imagens, o índice + sufixo aleatório evitam colisão entre
// arquivos criados no mesmo milissegundo.
export function makeGalleryImagePath(projectSlug, mimeType, index = 0) {
  const ext = MIME_EXT[mimeType] || 'jpg';
  const safeSlug = String(projectSlug || 'projeto')
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'projeto';
  const rand = Math.random().toString(36).slice(2, 8);
  return `project-images/${safeSlug}-${Date.now()}-${index}-${rand}.${ext}`;
}

export async function uploadProductImage(env, { bytes, mimeType, path }) {
  const supabase = getSupabaseAdmin(env);
  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadErr) {
    const detail = uploadErr.message || String(uploadErr);
    throw new Error(`Falha no upload para o Supabase Storage (${detail}).`);
  }
  return { path, mimeType };
}

export function getPublicImageUrl(env, path) {
  if (!path) return '';
  const supabase = getSupabaseAdmin(env);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return (data && data.publicUrl) || '';
}

export async function deleteProductImage(env, path) {
  if (!path) return;
  try {
    const supabase = getSupabaseAdmin(env);
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeErr) {
      throw new Error(`Falha ao remover imagem do Supabase Storage (${removeErr.message || removeErr}).`);
    }
  } catch (e) {
    // Não relança: o registro já foi excluído/atualizado; falha na remoção
    // remota não deixa o produto inconsistente (a imagem órfã pode ser limpa
    // depois).
    console.error('[admin] falha ao remover imagem do Supabase Storage:', e.message);
  }
}
