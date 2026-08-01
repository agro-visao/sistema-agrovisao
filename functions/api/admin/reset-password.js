import { json, error, readJson, sha256Hex, hashPassword, passwordPolicyError } from './_auth.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const body = await readJson(request);
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) return error('Link de recuperação inválido.', 400);
    const policyMsg = passwordPolicyError(password);
    if (policyMsg) return error(policyMsg, 400);

    const tokenHash = await sha256Hex(token);
    const row = await db
      .prepare('SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = ?')
      .bind(tokenHash)
      .first();

    if (!row) return error('Link de recuperação inválido.', 400);
    if (row.used === 1) return error('Este link de recuperação já foi utilizado.', 400);
    if (row.expires_at < Math.floor(Date.now() / 1000)) {
      return error('Este link de recuperação expirou.', 400);
    }

    const passwordHash = await hashPassword(password);
    await db
      .prepare(
        `UPDATE admin_users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(passwordHash, row.user_id)
      .run();
    await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').bind(row.id).run();
    await db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(row.user_id).run();

    return json({ data: { ok: true } });
  } catch (e) {
    return error(e.message, 500);
  }
}
