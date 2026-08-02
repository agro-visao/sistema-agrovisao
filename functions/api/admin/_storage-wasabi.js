// ─── Adaptador de Storage: Wasabi (S3) — ainda não implementado ─────────────
// Existe para que a troca de provedor seja só STORAGE_PROVIDER=wasabi + as
// variáveis abaixo, sem mexer nas rotas. As operações ainda não têm corpo:
// falta assinar as requisições (AWS SigV4). Enquanto isso, qualquer uso falha
// de forma explícita em vez de gravar em lugar nenhum.

const REQUIRED_VARS = [
  'WASABI_ENDPOINT',
  'WASABI_REGION',
  'WASABI_BUCKET',
  'WASABI_ACCESS_KEY_ID',
  'WASABI_SECRET_ACCESS_KEY',
];

function notImplemented() {
  throw new Error('Adaptador Wasabi ainda não implementado. Use STORAGE_PROVIDER=supabase.');
}

export const wasabiStorage = {
  name: 'wasabi',

  // Só é chamado quando STORAGE_PROVIDER=wasabi — por isso as variáveis da
  // Wasabi seguem opcionais enquanto o provedor for o Supabase.
  assertConfigured(env) {
    const missing = REQUIRED_VARS.filter((key) => !env || !env[key]);
    if (missing.length) {
      throw new Error(`STORAGE_PROVIDER=wasabi exige as variáveis: ${missing.join(', ')}.`);
    }
  },

  upload: notImplemented,
  getUrl: notImplemented,
  delete: notImplemented,
};
