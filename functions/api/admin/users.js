import { json, error, requireAdmin, readJson, AuthError, authError } from './_supabase.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  serializeUser,
  isOwnerEmail,
  getProfileFlags,
  listAuthUsers,
} from './_users.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const [users, flags] = await Promise.all([listAuthUsers(supabase), getProfileFlags(supabase)]);
      const data = users
        .map((u) =>
          serializeUser(u, {
            mustChangePassword: flags.get(u.id),
            isOwner: isOwnerEmail(env, u.email),
          })
        )
        .sort((a, b) => String(a.email).localeCompare(String(b.email)));
      return json({ data });
    }

    if (request.method === 'POST') {
      const body = await readJson(request);
      const email = normalizeEmail(body.email);
      const emailError = validateEmail(email);
      if (emailError) return error(emailError, 400);
      const passwordError = validatePassword(body.password);
      if (passwordError) return error(passwordError, 400);

      // email_confirm: o admin está criando a conta, não há e-mail de
      // confirmação a esperar — o usuário já entra com a senha definida aqui.
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      });
      if (createErr) {
        const msg = /already|registered|exists/i.test(createErr.message || '')
          ? 'Já existe um usuário com esse e-mail.'
          : createErr.message;
        return error(msg, 400);
      }

      // A linha em admin_profiles é o que dá acesso ao painel. Sem ela o
      // usuário existe no Auth mas leva 403 em /api/admin/*.
      const { error: profileErr } = await supabase
        .from('admin_profiles')
        .insert({ user_id: created.user.id, must_change_password: true });
      if (profileErr) {
        // Desfaz o usuário órfão para não deixar uma conta sem acesso nenhum.
        await supabase.auth.admin.deleteUser(created.user.id);
        return error(profileErr.message, 500);
      }

      return json(
        {
          data: serializeUser(created.user, {
            mustChangePassword: true,
            isOwner: isOwnerEmail(env, created.user.email),
          }),
        },
        201
      );
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
