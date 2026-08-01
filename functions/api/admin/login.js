import { json, error, readJson, normalizeEmail, verifyPassword, createSession, sessionCookieHeader } from './_auth.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return error('Informe e-mail e senha.', 400);

    const user = await db
      .prepare('SELECT id, email, password_hash, must_change_password FROM admin_users WHERE email = ?')
      .bind(email)
      .first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return error('E-mail ou senha inválidos.', 401);
    }

    const token = await createSession(db, user.id);
    const resp = json({
      data: { user: { id: user.id, email: user.email, mustChangePassword: user.must_change_password === 1 } },
    });
    resp.headers.set('Set-Cookie', sessionCookieHeader(token, request));
    return resp;
  } catch (e) {
    return error(e.message, 500);
  }
}
