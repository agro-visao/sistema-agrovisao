// ─── Helpers do CRUD de usuários do painel ───────────────────────────────────
// O usuário em si vive no Supabase Auth (auth.users, gerenciado pela service
// role key); admin_profiles guarda o que o Auth não modela: quem tem acesso ao
// painel e se a senha inicial ainda precisa ser trocada.

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validateEmail(email) {
  if (!email) return 'Informe o e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.';
  return '';
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'A senha deve conter letras e números.';
  }
  return '';
}

export function serializeUser(authUser, { mustChangePassword = false, isOwner = false } = {}) {
  return {
    id: authUser.id,
    email: authUser.email || '',
    createdAt: authUser.created_at || null,
    lastSignInAt: authUser.last_sign_in_at || null,
    mustChangePassword: Boolean(mustChangePassword),
    // A conta do ADMIN_EMAIL não pode ser excluída pelo painel: é ela que
    // garante acesso caso admin_profiles fique vazia por engano.
    isOwner: Boolean(isOwner),
  };
}

export function isOwnerEmail(env, email) {
  return Boolean(env.ADMIN_EMAIL) && normalizeEmail(email) === normalizeEmail(env.ADMIN_EMAIL);
}

// Lê o must_change_password de todos os usuários de uma vez (uma query só).
export async function getProfileFlags(supabase) {
  const { data, error: dbError } = await supabase
    .from('admin_profiles')
    .select('user_id, must_change_password');
  if (dbError) throw new Error(dbError.message);
  const flags = new Map();
  for (const row of data || []) flags.set(row.user_id, Boolean(row.must_change_password));
  return flags;
}

export async function listAuthUsers(supabase) {
  const { data, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authErr) throw new Error(authErr.message);
  return (data && data.users) || [];
}
