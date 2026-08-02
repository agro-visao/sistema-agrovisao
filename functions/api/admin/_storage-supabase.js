// ─── Adaptador de Storage: Supabase (bucket público "product-images") ───────
// Implementa o contrato consumido por _storage.js. Nenhuma outra parte do
// código fala com supabase.storage diretamente.

import { getSupabaseAdmin } from './_supabase.js';

const BUCKET = 'product-images';

export const supabaseStorage = {
  name: 'supabase',

  // As credenciais já são exigidas por getSupabaseAdmin (SUPABASE_URL e
  // SUPABASE_SERVICE_ROLE_KEY), então não há configuração extra a validar.
  assertConfigured() {},

  async upload(env, { bytes, mimeType, path }) {
    const supabase = getSupabaseAdmin(env);
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadErr) {
      throw new Error(`Falha no upload para o Supabase Storage (${uploadErr.message || uploadErr}).`);
    }
    return { path, mimeType };
  },

  getUrl(env, path) {
    const supabase = getSupabaseAdmin(env);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return (data && data.publicUrl) || '';
  },

  async delete(env, path) {
    const supabase = getSupabaseAdmin(env);
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeErr) {
      throw new Error(`Falha ao remover imagem do Supabase Storage (${removeErr.message || removeErr}).`);
    }
  },
};
