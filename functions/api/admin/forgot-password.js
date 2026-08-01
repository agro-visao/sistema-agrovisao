import { json, error, readJson, normalizeEmail, randomToken, sha256Hex, RESET_TTL_SECONDS } from './_auth.js';
import { sendPasswordResetEmail } from './_mail.js';

// Fluxo seguro de recuperação de senha:
//  1. O backend sempre responde com a mesma mensagem genérica, sem revelar se o
//     e-mail existe.
//  2. Gera um token aleatório temporário e armazena apenas o hash SHA-256 no D1.
//  3. O link é enviado por e-mail (Resend) quando RESEND_API_KEY está configurado.
//  4. O token nunca é retornado na resposta HTTP de produção. O binding
//     ADMIN_DEBUG_RESET=1 (apenas desenvolvimento) inclui data.debugResetUrl para
//     permitir testar localmente sem provedor de e-mail.
export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    if (!email) return error('Informe o e-mail cadastrado.', 400);

    const user = await db.prepare('SELECT id, email FROM admin_users WHERE email = ?').bind(email).first();

    const data = {
      message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
    };

    if (user) {
      const token = randomToken();
      const tokenHash = await sha256Hex(token);
      const expiresAt = Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS;
      await db
        .prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
        .bind(user.id, tokenHash, expiresAt)
        .run();
      await db
        .prepare('DELETE FROM password_reset_tokens WHERE expires_at < ?')
        .bind(Math.floor(Date.now() / 1000))
        .run();

      if (context.env.RESEND_API_KEY) {
        const base = (context.env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
        const resetUrl = `${base}/admin?resetToken=${token}`;
        try {
          await sendPasswordResetEmail(context.env, user.email, resetUrl);
        } catch (err) {
          console.error('[admin] falha ao enviar e-mail de recuperação', err.message);
        }
      }

      if (context.env.ADMIN_DEBUG_RESET === '1') {
        const origin = new URL(request.url).origin;
        data.debugResetUrl = `${origin}/admin?resetToken=${token}`;
      }
    }

    return json({ data });
  } catch (e) {
    return error(e.message, 500);
  }
}
