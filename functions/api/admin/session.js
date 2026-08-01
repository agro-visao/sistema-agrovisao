import { json, error, getSessionUser } from './_auth.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const user = await getSessionUser(db, request);
    if (!user) return error('Não autenticado.', 401);

    return json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          mustChangePassword: user.mustChangePassword === true,
        },
      },
    });
  } catch (e) {
    return error(e.message, 500);
  }
}
