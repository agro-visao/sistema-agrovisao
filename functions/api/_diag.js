// ─── Diagnóstico TEMPORÁRIO de variáveis de ambiente ─────────────────────────
//
// Existe para descobrir por que SUPABASE_SERVICE_ROLE_KEY não chega ao runtime
// das Pages Functions mesmo aparecendo cadastrada no dashboard. Responde só com
// NOMES e TAMANHOS — nenhum valor é revelado — e ainda assim exige o token
// abaixo, para não ficar aberto na internet.
//
// APAGAR este arquivo assim que o deploy estiver resolvido.

const TOKEN = 'ZnNuWcVI8GGYIWA9m7TFVf';

const EXPECTED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'PUBLIC_SITE_URL',
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== TOKEN) {
    return new Response('Not found', { status: 404 });
  }

  // Nomes de verdade presentes no env, com JSON.stringify para que espaço
  // sobrando ou caractere invisível no nome apareça de forma visível.
  const allKeys = Object.keys(env || {}).sort();

  const expected = EXPECTED.map((name) => {
    const value = env && env[name];
    return {
      name,
      present: value !== undefined && value !== null,
      type: typeof value,
      // Tamanho do valor: 0 revela "cadastrada mas vazia", que é indistinguível
      // de "ausente" na checagem normal.
      length: typeof value === 'string' ? value.length : null,
    };
  });

  // Qualquer chave parecida com as esperadas mas não idêntica (typo, espaço,
  // caractere invisível) — é aqui que um nome errado se denuncia.
  const lookalikes = allKeys
    .filter((k) => /supabase|service|role|admin|site/i.test(k))
    .filter((k) => !EXPECTED.includes(k))
    .map((k) => JSON.stringify(k));

  return new Response(
    JSON.stringify(
      {
        expected,
        lookalikes,
        allKeyNames: allKeys.map((k) => JSON.stringify(k)),
        totalKeys: allKeys.length,
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}
