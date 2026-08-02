// ─── Camada única de armazenamento ──────────────────────────────────────────
// Todo acesso a arquivo passa por aqui. As rotas não conhecem o provedor: para
// migrar para a Wasabi basta trocar STORAGE_PROVIDER e implementar o adaptador
// correspondente, sem tocar em produtos/galeria.
//
// Nenhuma chave é exposta ao frontend — os adaptadores só leem `env`, que no
// Cloudflare Pages existe apenas dentro das Functions.

import { supabaseStorage } from './_storage-supabase.js';
import { wasabiStorage } from './_storage-wasabi.js';

const ADAPTERS = {
  supabase: supabaseStorage,
  wasabi: wasabiStorage,
};

const DEFAULT_PROVIDER = 'supabase';

function adapterFor(env) {
  const name = String((env && env.STORAGE_PROVIDER) || DEFAULT_PROVIDER).trim().toLowerCase();
  const adapter = ADAPTERS[name];
  if (!adapter) {
    throw new Error(
      `STORAGE_PROVIDER inválido: "${name}". Valores aceitos: ${Object.keys(ADAPTERS).join(', ')}.`
    );
  }
  adapter.assertConfigured(env);
  return adapter;
}

export const storage = {
  async upload(env, { bytes, mimeType, path }) {
    return adapterFor(env).upload(env, { bytes, mimeType, path });
  },

  // Substituição em duas fases: o arquivo antigo só é removido depois de
  // `commit` gravar o novo caminho no banco. Se o commit falhar, o objeto
  // anterior continua íntegro e o registro segue apontando para ele.
  async replace(env, { bytes, mimeType, path, previousPath }, commit) {
    const adapter = adapterFor(env);
    const stored = await adapter.upload(env, { bytes, mimeType, path });
    if (commit) await commit(stored);
    if (previousPath && previousPath !== stored.path) {
      await removeQuietly(adapter, env, previousPath);
    }
    return stored;
  },

  // Falha ao remover não é propagada: o registro já foi excluído/atualizado no
  // banco e um objeto órfão no bucket não deixa o site inconsistente.
  async delete(env, path) {
    if (!path) return;
    await removeQuietly(adapterFor(env), env, path);
  },

  getUrl(env, path) {
    if (!path) return '';
    return adapterFor(env).getUrl(env, path);
  },
};

async function removeQuietly(adapter, env, path) {
  try {
    await adapter.delete(env, path);
  } catch (e) {
    console.error(`[admin] falha ao remover objeto do storage (${adapter.name}):`, e.message);
  }
}
