import { json, error, requireAdmin, AuthError, authError } from '../_supabase.js';
import {
  PROJECT_FIELDS_ADMIN,
  serializeProjectAdmin,
  getProjectGallerySummary,
  resolveCategory,
  slugify,
  uniqueSlug,
  parseBoolean,
  readProjectForm,
  readIdArray,
  isServableAsIs,
} from '../_projects.js';
import { storage } from '../_storage.js';
import {
  validateProcessedImage,
  makeGalleryImagePath,
  makeProjectLogoPath,
  GALLERY_IMAGE,
  PROJECT_LOGO,
} from '../_image.js';

const MAX_GALLERY_IMAGES = 12;

async function getProject(supabase, id) {
  const { data, error: dbError } = await supabase
    .from('projects')
    .select(PROJECT_FIELDS_ADMIN)
    .eq('id', id)
    .maybeSingle();
  if (dbError) throw new Error(dbError.message);
  return data || null;
}

// Só apaga do Storage caminhos que o Storage realmente controla — nunca uma
// URL absoluta/estática (logos dos 19 projetos seed, por exemplo).
async function deleteIfManaged(env, path) {
  if (path && !isServableAsIs(path)) await storage.delete(env, path);
}

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Projeto inválido.', 400);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    const existing = await getProject(supabase, id);
    if (!existing) return error('Projeto não encontrado.', 404);

    if (request.method === 'PUT') {
      const { body, logo, coverImage, images } = await readProjectForm(request);

      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      if (!name) return error('Informe o título do projeto.', 400);

      const category = resolveCategory(body.categoryLabel, existing);
      if (!category) return error('Informe a categoria do projeto.', 400);

      const description = typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : '';
      const alt = typeof body.alt === 'string' ? body.alt.trim().slice(0, 300) : '';
      const showInGallery = parseBoolean(body.showInGallery);
      const showInProjects = parseBoolean(body.showInProjects);
      const removeLogo = parseBoolean(body.removeLogo);
      const removeExtraIds = readIdArray(body.removeExtraIds);

      // Um item marcado para o Grid precisa, no mínimo, de nome (já validado
      // acima), categoria (idem) e imagem de capa — sem isso o card ficaria
      // quebrado em /projetos.
      const willHaveLogo = logo ? true : removeLogo ? false : Boolean(existing.logo_url);
      if (showInProjects && !willHaveLogo) {
        return error('Para exibir no Grid de Projetos, envie a imagem de capa.', 400);
      }

      if (images.length > MAX_GALLERY_IMAGES) {
        return error(`Envie no máximo ${MAX_GALLERY_IMAGES} imagens do projeto por vez.`, 400);
      }

      // Slug: só muda se o título mudou (evita link público quebrar à toa).
      let slug = existing.slug;
      const newBase = slugify(name);
      if (!newBase) return error('O título precisa ter letras ou números.', 400);
      if (newBase !== slugify(existing.name)) {
        slug = await uniqueSlug(supabase, newBase, id);
      }

      // Valida todo arquivo novo antes de subir qualquer coisa.
      let logoChecked = null;
      if (logo) {
        const check = await validateProcessedImage(logo, PROJECT_LOGO);
        if (!check.ok) return error(`Logo: ${check.error}`, 400);
        logoChecked = check.data;
      }
      let coverReplaceChecked = null;
      if (coverImage) {
        const check = await validateProcessedImage(coverImage, GALLERY_IMAGE);
        if (!check.ok) return error(`Capa: ${check.error}`, 400);
        coverReplaceChecked = check.data;
      }

      const imagesChecked = [];
      for (let i = 0; i < images.length; i++) {
        const check = await validateProcessedImage(images[i], GALLERY_IMAGE);
        if (!check.ok) return error(`Imagem ${i + 1}: ${check.error}`, 400);
        const photoAlt = typeof body[`extraAlt_${i}`] === 'string' ? body[`extraAlt_${i}`].trim().slice(0, 300) : '';
        imagesChecked.push({ ...check.data, alt: photoAlt });
      }

      const currentGallery = await getProjectGallerySummary(supabase, env, id);

      // ─── Logo ────────────────────────────────────────────────────────────
      let logoPath = existing.logo_url || '';
      let oldLogoToDelete = '';
      if (logoChecked) {
        const stored = await storage.upload(env, {
          bytes: logoChecked.bytes,
          mimeType: logoChecked.mimeType,
          path: makeProjectLogoPath(slug),
        });
        oldLogoToDelete = logoPath;
        logoPath = stored.path;
      } else if (removeLogo) {
        oldLogoToDelete = logoPath;
        logoPath = '';
      }

      // ─── Fotos do projeto (capa substituída + extras novas) ────────────────
      let newCover = null;
      const uploadedImages = [];
      try {
        if (coverReplaceChecked) {
          const stored = await storage.upload(env, {
            bytes: coverReplaceChecked.bytes,
            mimeType: coverReplaceChecked.mimeType,
            path: makeGalleryImagePath(slug, 0),
          });
          newCover = { ...coverReplaceChecked, path: stored.path };
        }
        for (let i = 0; i < imagesChecked.length; i++) {
          const item = imagesChecked[i];
          const stored = await storage.upload(env, {
            bytes: item.bytes,
            mimeType: item.mimeType,
            path: makeGalleryImagePath(slug, i + 1),
          });
          uploadedImages.push({ ...item, path: stored.path });
        }
      } catch (uploadErr) {
        if (logoChecked) await deleteIfManaged(env, logoPath);
        if (newCover) await deleteIfManaged(env, newCover.path);
        for (const img of uploadedImages) await deleteIfManaged(env, img.path);
        return error(uploadErr.message, 500);
      }

      // ─── 1. Atualiza o projeto ──────────────────────────────────────────
      const { error: updateErr } = await supabase
        .from('projects')
        .update({
          name,
          slug,
          category: category.category,
          category_label: category.categoryLabel,
          description,
          logo_url: logoPath,
          show_in_gallery: showInGallery,
          show_in_projects: showInProjects,
        })
        .eq('id', id);
      if (updateErr) {
        if (newCover) await deleteIfManaged(env, newCover.path);
        for (const img of uploadedImages) await deleteIfManaged(env, img.path);
        return error(updateErr.message, 500);
      }

      // ─── 2. Remove extras marcadas para exclusão ────────────────────────
      const extrasToDeletePaths = [];
      if (removeExtraIds.length > 0 && currentGallery) {
        const idsInThisRecord = currentGallery.extras
          .filter((e) => removeExtraIds.includes(e.id))
          .map((e) => e.id);
        if (idsInThisRecord.length > 0) {
          const { error: delErr } = await supabase
            .from('project_images')
            .delete()
            .in('id', idsInThisRecord);
          if (delErr) return error(delErr.message, 500);
          currentGallery.extras
            .filter((e) => idsInThisRecord.includes(e.id))
            .forEach((e) => e.path && extrasToDeletePaths.push(e.path));
        }
      }

      // ─── 3. Cria ou atualiza o registro de galeria (capa + novas extras) ─
      let oldCoverToDelete = '';
      let coverRow = null;
      if (currentGallery) {
        const patch = { alt, description };
        if (newCover) {
          patch.url = newCover.path;
          patch.mime_type = newCover.mimeType;
          patch.size_bytes = newCover.size;
          patch.width = newCover.width;
          patch.height = newCover.height;
          oldCoverToDelete = currentGallery.coverPath;
        }
        const { data, error: coverErr } = await supabase
          .from('project_images')
          .update(patch)
          .eq('id', currentGallery.recordId)
          .select('*')
          .single();
        if (coverErr) return error(coverErr.message, 500);
        coverRow = data;
      } else if (newCover || uploadedImages.length > 0) {
        // Projeto ainda sem galeria: a capa é o arquivo de capa, se enviado,
        // ou a primeira das fotos.
        const cover = newCover || uploadedImages.shift();
        const { data, error: coverErr } = await supabase
          .from('project_images')
          .insert({
            project_id: id,
            url: cover.path,
            alt,
            description,
            featured: true,
            sort_order: 0,
            mime_type: cover.mimeType,
            size_bytes: cover.size,
            width: cover.width,
            height: cover.height,
          })
          .select('*')
          .single();
        if (coverErr) return error(coverErr.message, 500);
        coverRow = data;
      }

      if (coverRow && uploadedImages.length > 0) {
        const baseSort = currentGallery
          ? 1 + currentGallery.extras.filter((e) => !removeExtraIds.includes(e.id)).length
          : 1;
        const { error: extraErr } = await supabase.from('project_images').insert(
          uploadedImages.map((item, i) => ({
            project_id: id,
            parent_id: coverRow.id,
            url: item.path,
            alt: item.alt,
            description: '',
            sort_order: baseSort + i,
            mime_type: item.mimeType,
            size_bytes: item.size,
            width: item.width,
            height: item.height,
          }))
        );
        if (extraErr) return error(extraErr.message, 500);
      }

      // ─── 4. Só agora remove do Storage o que foi substituído/excluído ───
      if (oldLogoToDelete) await deleteIfManaged(env, oldLogoToDelete);
      if (oldCoverToDelete) await deleteIfManaged(env, oldCoverToDelete);
      for (const path of extrasToDeletePaths) await deleteIfManaged(env, path);

      const updated = await getProject(supabase, id);
      const gallery = await getProjectGallerySummary(supabase, env, id);
      return json({ data: serializeProjectAdmin(updated, env, gallery) });
    }

    if (request.method === 'DELETE') {
      const gallery = await getProjectGallerySummary(supabase, env, id);

      // project_images é removida em cascata pelo banco (FK on delete cascade).
      const { error: deleteErr } = await supabase.from('projects').delete().eq('id', id);
      if (deleteErr) return error(deleteErr.message, 500);

      await deleteIfManaged(env, existing.logo_url);
      if (gallery) {
        await deleteIfManaged(env, gallery.coverPath);
        for (const extra of gallery.extras) await deleteIfManaged(env, extra.path);
      }

      return json({ data: { ok: true } });
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
