import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import {
  getGalleryImageById,
  getProjectById,
  nextSortOrder,
  readGalleryForm,
  parseProjectId,
  readAlt,
  readDescription,
  parseBoolean,
  setFeaturedImage,
} from '../_gallery.js';
import { validateImageFile, uploadProductImage, deleteProductImage, makeGalleryImagePath } from '../_storage.js';

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Imagem inválida.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getGalleryImageById(supabase, env, id);
    if (!existing) return error('Imagem não encontrada.', 404);

    if (request.method === 'PUT') {
      const { body, files } = await readGalleryForm(request);

      const projectId = parseProjectId(body.projectId) || existing.projectId;
      const project = await getProjectById(supabase, projectId);
      if (!project) return error('Projeto não encontrado.', 404);

      const alt = typeof body.alt === 'string' ? body.alt.trim().slice(0, 300) : readAlt(body, 0);
      const description = typeof body.description === 'string'
        ? body.description.trim().slice(0, 5000)
        : readDescription(body, 0);
      const featured = parseBoolean(body.featured);

      // Sem novo arquivo, mantém a imagem atual (nunca zera por omissão).
      let imagePath = existing.imagePath;
      let replaced = false;
      if (files.length > 0) {
        const fileCheck = await validateImageFile(files[0]);
        if (!fileCheck.ok) return error(fileCheck.error, 400);
        const uploaded = await uploadProductImage(env, {
          bytes: fileCheck.data.bytes,
          mimeType: fileCheck.data.mimeType,
          path: makeGalleryImagePath(project.slug, fileCheck.data.mimeType, 0),
        });
        imagePath = uploaded.path;
        replaced = true;
      }

      // Ao mudar de projeto, a imagem vai para o fim da galeria de destino.
      const patch = {
        project_id: projectId,
        alt,
        description,
        url: replaced ? imagePath : existing.imagePath || existing.url,
      };
      if (projectId !== existing.projectId) {
        patch.sort_order = await nextSortOrder(supabase, projectId);
        // Ao trocar de projeto, o destaque anterior não vale mais na galeria
        // de destino — é reaplicado abaixo só se o formulário pediu.
        patch.featured = false;
      }
      if (!featured) patch.featured = false;

      const { error: updateErr } = await supabase
        .from('project_images')
        .update(patch)
        .eq('id', id);
      if (updateErr) return error(updateErr.message, 500);

      if (featured) {
        await setFeaturedImage(supabase, projectId, id);
      }

      // Só remove o arquivo antigo depois de a troca estar confirmada no banco.
      if (replaced && existing.imagePath && existing.imagePath !== imagePath) {
        await deleteProductImage(env, existing.imagePath);
      }

      const updated = await getGalleryImageById(supabase, env, id);
      return json({ data: updated });
    }

    if (request.method === 'DELETE') {
      const { error: deleteErr } = await supabase.from('project_images').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);
      if (existing.imagePath) {
        await deleteProductImage(env, existing.imagePath);
      }
      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
