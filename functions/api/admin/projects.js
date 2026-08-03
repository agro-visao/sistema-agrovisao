// ─── Cadastro unificado de Projetos (Grid /projetos + Galeria /galeria) ──────
// Um único formulário no painel cria/edita a linha em `projects` e, quando há
// fotos, o registro correspondente em `project_images` (capa + extras). A
// visibilidade em cada página pública é controlada pelos dois checkboxes
// independentes show_in_projects / show_in_gallery — ver migration 0008.
import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  PROJECT_FIELDS_ADMIN,
  serializeProjectAdmin,
  getAllGallerySummaries,
  resolveCategory,
  slugify,
  uniqueSlug,
  nextSortOrder,
  parseBoolean,
  readProjectForm,
} from './_projects.js';
import { storage } from './_storage.js';
import {
  validateProcessedImage,
  makeGalleryImagePath,
  makeProjectLogoPath,
  GALLERY_IMAGE,
  PROJECT_LOGO,
} from './_image.js';

const MAX_GALLERY_IMAGES = 12;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const { data, error: dbError } = await supabase
        .from('projects')
        .select(PROJECT_FIELDS_ADMIN)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (dbError) return error(dbError.message, 500);

      const galleries = await getAllGallerySummaries(supabase, env);
      const result = (data || []).map((row) =>
        serializeProjectAdmin(row, env, galleries.get(row.id) || null)
      );
      return json({ data: result });
    }

    if (request.method === 'POST') {
      const { body, logo, images } = await readProjectForm(request);

      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      if (!name) return error('Informe o título do projeto.', 400);

      const category = resolveCategory(body.categoryLabel, null);
      if (!category) return error('Informe a categoria do projeto.', 400);

      const base = slugify(name);
      if (!base) return error('O título precisa ter letras ou números.', 400);

      const description = typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : '';
      const alt = typeof body.alt === 'string' ? body.alt.trim().slice(0, 300) : '';
      const showInGallery = parseBoolean(body.showInGallery);
      const showInProjects = parseBoolean(body.showInProjects);

      // Um item marcado para o Grid precisa, no mínimo, de nome (já validado
      // acima), categoria (idem) e imagem de capa — sem isso o card ficaria
      // quebrado em /projetos.
      if (showInProjects && !logo) {
        return error('Para exibir no Grid de Projetos, envie a imagem de capa.', 400);
      }

      if (images.length > MAX_GALLERY_IMAGES) {
        return error(`Envie no máximo ${MAX_GALLERY_IMAGES} imagens do projeto por vez.`, 400);
      }

      // Valida tudo (logo + fotos) antes de subir qualquer arquivo, para não
      // deixar objetos órfãos no Storage se algo no meio do lote for inválido.
      let logoChecked = null;
      if (logo) {
        const check = await validateProcessedImage(logo, PROJECT_LOGO);
        if (!check.ok) return error(`Logo: ${check.error}`, 400);
        logoChecked = check.data;
      }

      const imagesChecked = [];
      for (let i = 0; i < images.length; i++) {
        const check = await validateProcessedImage(images[i], GALLERY_IMAGE);
        if (!check.ok) return error(`Imagem ${i + 1}: ${check.error}`, 400);
        const photoAlt = typeof body[`extraAlt_${i}`] === 'string' ? body[`extraAlt_${i}`].trim().slice(0, 300) : '';
        imagesChecked.push({ ...check.data, alt: photoAlt });
      }

      const slug = await uniqueSlug(supabase, base);

      let logoPath = '';
      try {
        if (logoChecked) {
          const stored = await storage.upload(env, {
            bytes: logoChecked.bytes,
            mimeType: logoChecked.mimeType,
            path: makeProjectLogoPath(slug),
          });
          logoPath = stored.path;
        }
      } catch (uploadErr) {
        return error(uploadErr.message, 500);
      }

      const uploadedImages = [];
      try {
        for (let i = 0; i < imagesChecked.length; i++) {
          const item = imagesChecked[i];
          const stored = await storage.upload(env, {
            bytes: item.bytes,
            mimeType: item.mimeType,
            path: makeGalleryImagePath(slug, i),
          });
          uploadedImages.push({ ...item, path: stored.path });
        }
      } catch (uploadErr) {
        if (logoPath) await storage.delete(env, logoPath);
        for (const img of uploadedImages) await storage.delete(env, img.path);
        return error(uploadErr.message, 500);
      }

      const row = {
        slug,
        name,
        category: category.category,
        category_label: category.categoryLabel,
        description,
        logo_url: logoPath,
        sort_order: await nextSortOrder(supabase),
        active: true,
        show_in_gallery: showInGallery,
        show_in_projects: showInProjects,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('projects')
        .insert(row)
        .select(PROJECT_FIELDS_ADMIN)
        .single();
      if (insertErr) {
        if (logoPath) await storage.delete(env, logoPath);
        for (const img of uploadedImages) await storage.delete(env, img.path);
        return error(insertErr.message, 500);
      }

      let gallery = null;
      if (uploadedImages.length > 0) {
        const cover = uploadedImages[0];
        const { data: coverRow, error: coverErr } = await supabase
          .from('project_images')
          .insert({
            project_id: inserted.id,
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

        const extras = uploadedImages.slice(1);
        let extraRows = [];
        if (extras.length > 0) {
          const { data, error: extraErr } = await supabase
            .from('project_images')
            .insert(
              extras.map((item, i) => ({
                project_id: inserted.id,
                parent_id: coverRow.id,
                url: item.path,
                alt: item.alt,
                description: '',
                sort_order: i + 1,
                mime_type: item.mimeType,
                size_bytes: item.size,
                width: item.width,
                height: item.height,
              }))
            )
            .select('*');
          if (extraErr) return error(extraErr.message, 500);
          extraRows = data || [];
        }

        gallery = {
          recordId: coverRow.id,
          alt: coverRow.alt || '',
          description: coverRow.description || '',
          featured: true,
          coverUrl: storage.getUrl(env, coverRow.url),
          coverPath: coverRow.url,
          imageCount: 1 + extraRows.length,
          extras: extraRows.map((r) => ({ id: r.id, alt: r.alt || '', url: storage.getUrl(env, r.url), path: r.url })),
        };
      }

      return json({ data: serializeProjectAdmin(inserted, env, gallery) }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
