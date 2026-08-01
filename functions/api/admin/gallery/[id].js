import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import {
  getGalleryImageById,
  getChildImages,
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

    // Foto complementar: só a breve descrição e o próprio arquivo são
    // editáveis — projeto, destaque e descrição completa pertencem ao registro.
    const isChild = Boolean(existing.parentId);

    if (request.method === 'PUT') {
      const { body, files } = await readGalleryForm(request);

      const projectId = isChild
        ? existing.projectId
        : parseProjectId(body.projectId) || existing.projectId;
      const project = await getProjectById(supabase, projectId);
      if (!project) return error('Projeto não encontrado.', 404);

      const alt = typeof body.alt === 'string' ? body.alt.trim().slice(0, 300) : readAlt(body, 0);
      const description = isChild
        ? ''
        : typeof body.description === 'string'
          ? body.description.trim().slice(0, 5000)
          : readDescription(body, 0);
      const featured = isChild ? false : parseBoolean(body.featured);

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

      // Ao mudar de projeto, o registro vai para o fim da galeria de destino.
      const patch = {
        project_id: projectId,
        alt,
        description,
        url: replaced ? imagePath : existing.imagePath || existing.url,
      };
      const movedProject = projectId !== existing.projectId;
      if (movedProject) {
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

      // As fotos complementares acompanham o registro na troca de projeto.
      if (movedProject && !isChild) {
        const { error: childErr } = await supabase
          .from('project_images')
          .update({ project_id: projectId })
          .eq('parent_id', id);
        if (childErr) return error(childErr.message, 500);
      }

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
      // As linhas filhas somem por cascata (parent_id ... on delete cascade),
      // mas os arquivos delas precisam ser removidos do Storage na mão.
      const children = isChild ? [] : await getChildImages(supabase, env, id);

      const { error: deleteErr } = await supabase.from('project_images').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);

      for (const item of [existing, ...children]) {
        if (item.imagePath) await deleteProductImage(env, item.imagePath);
      }
      return json({ data: { ok: true, removed: 1 + children.length } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
