import {
  json,
  error,
  readJson,
  requireAdmin,
  AuthError,
  authError,
  verifyPassword,
  hashPassword,
  passwordPolicyError,
  sha256Hex,
  getCookie,
  SESSION_COOKIE,
} from './_auth.js';

// Troca de senha do administrador logado.
// Exigido no primeiro login (quando o usuário foi criado pelo bootstrap com a
// senha inicial); também pode ser usado voluntariamente. Invalida as demais
// sessões do usuário, mantendo a atual válida.
export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const { user, db } = await requireAdmin(context);

    const body = await readJson(request);
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword) return error('Informe a senha atual.', 400);
    const policyMsg = passwordPolicyError(newPassword);
    if (policyMsg) return error(policyMsg, 400);

    const row = await db
      .prepare('SELECT password_hash FROM admin_users WHERE id = ?')
      .bind(user.id)
      .first();
    if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
      return error('Senha atual incorreta.', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .prepare(
        `UPDATE admin_users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(passwordHash, user.id)
      .run();

    const token = getCookie(request, SESSION_COOKIE);
    if (token) {
      const tokenHash = await sha256Hex(token);
      await db
        .prepare('DELETE FROM admin_sessions WHERE user_id = ? AND token_hash != ?')
        .bind(user.id, tokenHash)
        .run();
    }

    return json({ data: { ok: true, message: 'Senha atualizada com sucesso.' } });
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status, request);
    return error(e.message, 500);
  }
}
