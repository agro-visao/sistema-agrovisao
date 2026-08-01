// ─── Auth compartilhada do painel administrativo ─────────────────────────────
// Sessões em cookie HttpOnly (SameSite=Strict, Secure em produção), senha com
// hash PBKDF2-SHA256, tokens de sessão/recuperação armazenados apenas como
// hash SHA-256 no banco. Nenhum segredo sai no response.

const encoder = new TextEncoder();

export const SESSION_COOKIE = 'agrovisao_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12h
export const RESET_TTL_SECONDS = 60 * 60; // 1h
const PBKDF2_ITERATIONS = 100_000;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Nunca cachear respostas de autenticação: uma resposta 200 antiga de
      // /api/admin/session não pode recriar estado autenticado no cliente.
      'Cache-Control': 'no-store',
    },
  });
}

export function error(msg, status = 500) {
  return json({ data: null, error: msg }, status);
}

// Erro de autenticação/autorização: além de no-store, expira o cookie de
// sessão no navegador (mesmo nome/Path/atributos), evitando que um cookie
// inválido persista e gere re-autenticações indevidas.
export function authError(msg, status, request) {
  const resp = error(msg, status);
  resp.headers.set('Set-Cookie', clearSessionCookieHeader(request));
  return resp;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export async function sha256Hex(text) {
  const bits = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Senha: PBKDF2-SHA256 com salt aleatório ─────────────────────────────────

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  return [
    'pbkdf2',
    String(PBKDF2_ITERATIONS),
    bytesToB64(salt),
    bytesToB64(hash),
  ].join('$');
}

// Política mínima de segurança para senhas novas (troca inicial e redefinição).
// Retorna null quando a senha é aceita, ou a mensagem de erro em português.
export function passwordPolicyError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }
  if (password.length > 128) {
    return 'A senha deve ter no máximo 128 caracteres.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'A senha deve conter letras e números.';
  }
  return null;
}

export async function verifyPassword(password, storedHash) {
  try {
    if (typeof storedHash !== 'string') return false;
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = parseInt(parts[1], 10);
    if (!Number.isFinite(iterations) || iterations < 1) return false;
    const salt = b64ToBytes(parts[2]);
    const expected = b64ToBytes(parts[3]);
    if (!salt || !expected) return false;
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

function bytesToB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(value) {
  try {
    const bin = atob(value);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// ─── Cookies ─────────────────────────────────────────────────────────────────

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export function sessionCookieHeader(cookieValue, request, maxAgeSeconds = SESSION_TTL_SECONDS) {
  const secure = request.url.startsWith('https:') ? '; Secure' : '';
  return `${SESSION_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookieHeader(request) {
  const secure = request.url.startsWith('https:') ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

// ─── Sessão ──────────────────────────────────────────────────────────────────

export async function createSession(db, userId) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  await db
    .prepare('INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
    .bind(userId, tokenHash, expiresAt)
    .run();
  await db
    .prepare('DELETE FROM admin_sessions WHERE expires_at < ?')
    .bind(Math.floor(Date.now() / 1000))
    .run();
  return token;
}

export async function getSessionUser(db, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.must_change_password, s.expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .bind(tokenHash)
    .first();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { id: row.id, email: row.email, mustChangePassword: row.must_change_password === 1 };
}

export async function destroySession(db, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function requireAdmin(context) {
  const db = context.env.DB;
  if (!db) throw new AuthError('Database not available', 503);
  const user = await getSessionUser(db, context.request);
  if (!user) throw new AuthError('Não autenticado.', 401);
  return { user, db };
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}
