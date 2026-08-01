import { json, error, requireAdmin, readJson, AuthError, authError } from '../_supabase.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  serializeUser,
  isOwnerEmail,
} from '../_users.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = String(params.id || '').trim();
  if (!id) return error('Usuário inválido.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const { data: existing, error: getErr } = await supabase.auth.admin.getUserById(id);
    if (getErr || !existing || !existing.user) return error('Usuário não encontrado.', 404);
    const target = existing.user;

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const changes = {};

      if (body.email !== undefined) {
        const email = normalizeEmail(body.email);
        const emailError = validateEmail(email);
        if (emailError) return error(emailError, 400);
        if (isOwnerEmail(env, target.email) && email !== normalizeEmail(target.email)) {
          return error('O e-mail da conta principal é definido pela variável ADMIN_EMAIL.', 400);
        }
        if (email !== normalizeEmail(target.email)) changes.email = email;
      }

      // Senha em branco no formulário = "não mexer na senha".
      const wantsNewPassword = typeof body.password === 'string' && body.password !== '';
      if (wantsNewPassword) {
        const passwordError = validatePassword(body.password);
        if (passwordError) return error(passwordError, 400);
        changes.password = body.password;
      }

      if (Object.keys(changes).length === 0) {
        return json({ data: serializeUser(target, { isOwner: isOwnerEmail(env, target.email) }) });
      }

      const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(id, changes);
      if (updateErr) {
        const msg = /already|registered|exists/i.test(updateErr.message || '')
          ? 'Já existe um usuário com esse e-mail.'
          : updateErr.message;
        return error(msg, 400);
      }

      // Senha definida por outra pessoa: o dono da conta troca no primeiro
      // acesso. Trocando a própria senha, não faz sentido exigir de novo.
      let mustChangePassword = false;
      if (wantsNewPassword && id !== user.id) {
        mustChangePassword = true;
        const { error: profileErr } = await supabase
          .from('admin_profiles')
          .upsert({ user_id: id, must_change_password: true }, { onConflict: 'user_id' });
        if (profileErr) return error(profileErr.message, 500);
      }

      return json({
        data: serializeUser(updated.user, {
          mustChangePassword,
          isOwner: isOwnerEmail(env, updated.user.email),
        }),
      });
    }

    if (request.method === 'DELETE') {
      if (id === user.id) return error('Você não pode excluir a própria conta.', 400);
      if (isOwnerEmail(env, target.email)) {
        return error('A conta principal do painel não pode ser excluída.', 400);
      }

      // admin_profiles tem ON DELETE CASCADE em user_id: o perfil sai junto.
      const { error: deleteErr } = await supabase.auth.admin.deleteUser(id);
      if (deleteErr) return error(deleteErr.message, 500);
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
