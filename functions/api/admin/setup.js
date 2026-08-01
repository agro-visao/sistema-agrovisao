import { json, error, readJson, normalizeEmail, hashPassword } from './_auth.js';

// Bootstrap do primeiro administrador — executado uma única vez.
//
// Em produção, as credenciais iniciais devem vir de variável temporária segura:
//   npx wrangler pages secret put ADMIN_INITIAL_EMAIL
//   npx wrangler pages secret put ADMIN_INITIAL_PASSWORD
//   curl -X POST https://<site>/api/admin/setup
//   npx wrangler pages secret delete ADMIN_INITIAL_PASSWORD
// (ou via .dev.vars localmente). O e-mail/senha nunca são gravados no repositório
// nem impressos nos logs; apenas o hash PBKDF2 é armazenado no D1.
//
// O usuário é criado com must_change_password = 1: o primeiro login exige a
// troca da senha inicial antes de acessar o painel.
//
// O endpoint só funciona enquanto não existir nenhum administrador cadastrado
// (409 após o bootstrap). Não cria usuário automaticamente a cada requisição.
export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const { count } = await db.prepare('SELECT COUNT(*) AS count FROM admin_users').first();
    if (count > 0) return error('Administrador já cadastrado.', 409);

    const body = await readJson(request);
    const envEmail = context.env.ADMIN_INITIAL_EMAIL;
    const envPassword = context.env.ADMIN_INITIAL_PASSWORD;
    const email = normalizeEmail(typeof envEmail === 'string' && envEmail.trim() ? envEmail : body.email);
    const password =
      typeof envPassword === 'string' && envPassword !== ''
        ? envPassword
        : typeof body.password === 'string'
          ? body.password
          : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error('Informe um e-mail válido.', 400);
    }
    if (!password) {
      return error('Informe uma senha inicial.', 400);
    }

    const passwordHash = await hashPassword(password);
    await db
      .prepare('INSERT INTO admin_users (email, password_hash, must_change_password) VALUES (?, ?, 1)')
      .bind(email, passwordHash)
      .run();

    const user = await db
      .prepare('SELECT id, email FROM admin_users WHERE email = ?')
      .bind(email)
      .first();

    return json(
      {
        data: {
          user: { id: user.id, email: user.email },
          message: 'Administrador criado com sucesso. No primeiro login será obrigatória a troca da senha inicial.',
        },
      },
      201
    );
  } catch (e) {
    return error(e.message, 500);
  }
}
