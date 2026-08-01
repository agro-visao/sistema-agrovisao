import { json, error, destroySession, clearSessionCookieHeader } from './_auth.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    await destroySession(db, request);
    const resp = json({ data: { ok: true } });
    resp.headers.set('Set-Cookie', clearSessionCookieHeader(request));
    return resp;
  } catch (e) {
    return error(e.message, 500);
  }
}
