// ─── Cliente Supabase + autenticação do painel administrativo ────────────────
// Substitui o antigo esquema de cookies HttpOnly + PBKDF2 + D1. A sessão agora
// vive inteiramente no navegador via supabase-js (Supabase Auth); o backend só
// valida o Bearer token recebido em cada request e usa a service role key para
// acessar o Postgres/Storage com privilégios administrativos.

import { createClient } from '@supabase/supabase-js';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Nunca cachear respostas do painel admin.
      'Cache-Control': 'no-store',
    },
  });
}

export function error(msg, status = 500) {
  return json({ data: null, error: msg }, status);
}

// Não há mais cookie de sessão para expirar no navegador (o token Bearer vive
// no supabase-js do cliente), então é só um alias de error() — mantido para
// não exigir mudanças nos call sites existentes.
export function authError(msg, status = 401) {
  return error(msg, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Erro de autenticação/autorização/serviço indisponível: carrega o status
// HTTP a ser usado na resposta. Reaproveitado tanto para 401/403 (token
// ausente/inválido, e-mail não autorizado) quanto para 503 (Supabase não
// configurado), mantendo um único ponto de tratamento nos handlers.
export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

// Cache do client admin por isolate (evita recriar a cada request, mesmo
// padrão do antigo b2SessionCache).
let cachedAdmin = null;
let cachedCacheKey = '';

export function getSupabaseAdmin(env) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AuthError('Serviço indisponível: Supabase não configurado.', 503);
  }
  const cacheKey = `${env.SUPABASE_URL}::${env.SUPABASE_SERVICE_ROLE_KEY}`;
  if (cachedAdmin && cachedCacheKey === cacheKey) return cachedAdmin;
  cachedAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedCacheKey = cacheKey;
  return cachedAdmin;
}

// Lê o header Authorization: Bearer <token>, valida com o Supabase Auth e
// confere se o e-mail bate com ADMIN_EMAIL (quando configurado). Retorna o
// mesmo formato de antes ({ user, <client> }), agora com "supabase" no lugar
// de "db", para minimizar mudanças no resto do código.
export async function requireAdmin(context) {
  const { request, env } = context;
  const supabase = getSupabaseAdmin(env);

  const authHeader = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match ? match[1].trim() : '';
  if (!token) throw new AuthError('Não autenticado.', 401);

  let authUser = null;
  try {
    const { data, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !data || !data.user) throw new AuthError('Não autenticado.', 401);
    authUser = data.user;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError('Não autenticado.', 401);
  }

  if (env.ADMIN_EMAIL && String(authUser.email || '').toLowerCase() !== String(env.ADMIN_EMAIL).toLowerCase()) {
    throw new AuthError('Não autorizado.', 403);
  }

  let mustChangePassword = false;
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('admin_profiles')
      .select('must_change_password')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (!profileErr && profile) {
      mustChangePassword = Boolean(profile.must_change_password);
    }
  } catch {
    // Linha ausente/tabela indisponível: trata como "não precisa trocar senha".
    mustChangePassword = false;
  }

  return {
    user: { id: authUser.id, email: authUser.email, mustChangePassword },
    supabase,
  };
}
