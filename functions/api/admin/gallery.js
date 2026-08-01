import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  getGalleryImages,
  getProjectById,
  nextSortOrder,
  readGalleryForm,
  serializeGalleryImage,
  parseProjectId,
  readAlt,
  readDescription,
  setFeaturedImage,
  MAX_IMAGES_PER_UPLOAD,
} from './_gallery.js';
import { validateImageFile, uploadProductImage, makeGalleryImagePath } from './_storage.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json(null, 204);

  try {
    const { user, supabase } = await requireAdmin(context);
    if (user.mustChangePassword) {
      return error('Troque a senha inicial antes de continuar.', 403);
    }

    if (request.method === 'GET') {
      const images = await getGalleryImages(supabase, env);
      return json({ data: images });
    }

    if (request.method === 'POST') {
      const { body, files } = await readGalleryForm(request);

      const projectId = parseProjectId(body.projectId);
      if (!projectId) return error('Selecione o projeto da galeria.', 400);

      const project = await getProjectById(supabase, projectId);
      if (!project) return error('Projeto não encontrado.', 404);

      if (files.length === 0) return error('Selecione ao menos uma imagem.', 400);
      if (files.length > MAX_IMAGES_PER_UPLOAD) {
        return error(`Envie no máximo ${MAX_IMAGES_PER_UPLOAD} imagens por vez.`, 400);
      }

      // Valida tudo antes de subir qualquer arquivo, para não deixar imagens
      // órfãs no Storage caso a última do lote seja inválida.
      const checked = [];
      for (let i = 0; i < files.length; i++) {
        const fileCheck = await validateImageFile(files[i]);
        if (!fileCheck.ok) return error(`Imagem ${i + 1}: ${fileCheck.error}`, 400);
        checked.push({
          ...fileCheck.data,
          alt: readAlt(body, i),
          description: readDescription(body, i),
        });
      }

      // Índice (dentro deste envio) da imagem escolhida como destaque da galeria.
      const featuredIndex = parseInt(body.featuredIndex, 10);
      const hasFeatured = Number.isInteger(featuredIndex) && featuredIndex >= 0 && featuredIndex < checked.length;

      let sortOrder = await nextSortOrder(supabase, projectId);
      const rows = [];
      const uploadedPaths = [];

      try {
        for (let i = 0; i < checked.length; i++) {
          const item = checked[i];
          const uploaded = await uploadProductImage(env, {
            bytes: item.bytes,
            mimeType: item.mimeType,
            path: makeGalleryImagePath(project.slug, item.mimeType, i),
          });
          uploadedPaths.push(uploaded.path);
          rows.push({
            project_id: projectId,
            url: uploaded.path,
            alt: item.alt,
            description: item.description,
            sort_order: sortOrder++,
          });
        }
      } catch (uploadErr) {
        return error(uploadErr.message, 500);
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('project_images')
        .insert(rows)
        .select('*');
      if (insertErr) return error(insertErr.message, 500);

      if (hasFeatured && inserted && inserted[featuredIndex]) {
        await setFeaturedImage(supabase, projectId, inserted[featuredIndex].id);
        inserted.forEach((row, i) => { row.featured = i === featuredIndex; });
      }

      const serialized = (inserted || []).map((row) =>
        serializeGalleryImage({ ...row, projects: project }, env)
      );
      return json({ data: serialized }, 201);
    }

    return error('Method not allowed', 405);
  } catch (e) {
    if (e instanceof AuthError) return authError(e.message, e.status);
    return error(e.message, 500);
  }
}
