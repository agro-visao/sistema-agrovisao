// scripts/setup-admin.mjs
//
// Cria (ou reaproveita) o usuário administrador único do painel
// (admin@agrovisaopara.com.br) no Supabase Auth e garante a linha
// correspondente em `admin_profiles` com must_change_password = true.
//
// Este script roda UMA VEZ, manualmente, pelo desenvolvedor — não é um
// endpoint HTTP nem é deployado. Ele substitui o antigo endpoint público
// `/api/admin/setup` do D1 (que existia porque o D1 não tinha um jeito
// melhor de fazer bootstrap fora de uma requisição HTTP). Com Supabase Auth
// não faz sentido expor um endpoint público de criação de admin: usamos a
// service_role key localmente, uma única vez, e pronto.
//
// Como rodar (a partir da raiz do repositório):
//
//   node --env-file=.dev.vars scripts/setup-admin.mjs
//
// Requer no .dev.vars (ou exportado no shell):
//   SUPABASE_URL=https://esdcojgmgwpjyblcinpv.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key do projeto>
//
// Por padrão gera uma senha temporária aleatória forte e IMPRIME no console
// (o desenvolvedor deve copiar e trocar no primeiro login — o painel já
// força a troca via admin_profiles.must_change_password = true). Também é
// possível passar uma senha explícita por argumento:
//
//   node --env-file=.dev.vars scripts/setup-admin.mjs "MinhaSenhaTemporaria123!"
//
// NUNCA commite este arquivo com credenciais reais dentro dele — as
// credenciais vêm sempre de variáveis de ambiente/.dev.vars (gitignored).

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@agrovisaopara.com.br';

function fail(message) {
  console.error(`\n[setup-admin] ERRO: ${message}\n`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail(
    'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.\n' +
      '  Exemplo: node --env-file=.dev.vars scripts/setup-admin.mjs'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generateTempPassword() {
  // 16 bytes -> 32 caracteres hex. Suficientemente forte para uma senha
  // temporária de uso único (o admin é obrigado a trocá-la no primeiro
  // login, ver admin_profiles.must_change_password).
  return crypto.randomBytes(16).toString('hex');
}

async function findExistingUserByEmail(email) {
  // supabase-js v2 não tem "getUserByEmail" direto no admin API; paginamos
  // a listagem de usuários procurando pelo e-mail (base de admins é
  // pequena, então isso é suficientemente rápido/simples).
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const cliPassword = process.argv[2];
  const password = cliPassword && cliPassword.trim() ? cliPassword.trim() : generateTempPassword();
  const generated = !cliPassword;

  console.log(`[setup-admin] Configurando administrador: ${ADMIN_EMAIL}`);

  let user = await findExistingUserByEmail(ADMIN_EMAIL);

  if (user) {
    console.log('[setup-admin] Usuário já existe no Supabase Auth — reaproveitando (senha não foi alterada).');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
    });

    if (error) {
      // Corrida entre a checagem acima e o createUser, ou e-mail já existe
      // com outra formatação — mensagem clara em vez de deixar estourar a
      // exceção crua do supabase-js.
      if (String(error.message || '').toLowerCase().includes('already') || error.status === 422) {
        fail(
          `O usuário "${ADMIN_EMAIL}" já existe no Supabase Auth, mas não foi encontrado pela listagem ` +
            `(pode ser um problema temporário de paginação). Verifique manualmente em Authentication > Users no ` +
            `painel do Supabase antes de rodar o script novamente.`
        );
      }
      fail(`Falha ao criar usuário no Supabase Auth: ${error.message}`);
    }

    user = data.user;
    console.log('[setup-admin] Usuário criado no Supabase Auth.');
  }

  const { error: upsertError } = await supabase
    .from('admin_profiles')
    .upsert({ user_id: user.id, must_change_password: true }, { onConflict: 'user_id' });

  if (upsertError) {
    fail(`Falha ao gravar admin_profiles: ${upsertError.message}`);
  }

  console.log('[setup-admin] admin_profiles atualizado (must_change_password = true).');

  console.log('\n──────────────────────────────────────────────────────────');
  console.log('Administrador pronto:');
  console.log(`  E-mail: ${ADMIN_EMAIL}`);
  if (generated) {
    console.log(`  Senha temporária gerada: ${password}`);
    console.log('  ATENÇÃO: copie esta senha agora — ela não será exibida novamente.');
    console.log('  O painel vai obrigar a troca no primeiro login.');
  } else {
    console.log('  Senha: a informada por argumento na linha de comando.');
  }
  console.log('──────────────────────────────────────────────────────────\n');
}

main().catch((e) => {
  fail(e?.message || String(e));
});
