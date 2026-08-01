import { json, error } from './_lib.js';
import { getCategories } from './admin/_categories.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return json(null, 204);
  if (request.method !== 'GET') return error('Method not allowed', 405);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const categories = await getCategories(db);
    const active = categories.filter((c) => c.active);
    return json({ data: active });
  } catch (e) {
    return error(e.message, 500);
  }
}
