import { json, error, requireAdmin, AuthError, authError } from './_supabase.js';
import {
  getGalleryImages,
  getGalleryImageById,
  getProjectById,
  nextSortOrder,
  readGalleryForm,
  serializeGalleryImage,
  parseProjectId,
  readAlt,
  parseBoolean,
  setFeaturedImage,
  MAX_IMAGES_PER_UPLOAD,
} from './_gallery.js';
import { storage } from './_storage.js';
import { validateProcessedImage, makeGalleryImagePath, GALLERY_IMAGE } from './_image.js';

// Um registro da galeria = imagem de capa + breve descrição + fotos
// complementares + descrição completa.
//
// POST sem `parentId`  → cria o registro: o 1º arquivo é a capa (leva a breve
//                        descrição, a descrição completa e o destaque) e os
//                        demais entram como fotos complementares dele.
// POST com `parentId`  → anexa fotos complementares a um registro existente.
//
// Em ambos os casos a breve descrição de cada arquivo vem em `alt_<índice>`.
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

      const parentId = parseProjectId(body.parentId);
      let parent = null;
      if (parentId) {
        parent = await getGalleryImageById(supabase, env, parentId);
        if (!parent) return error('Registro da galeria não encontrado.', 404);
        if (parent.parentId) return error('Este item já é uma foto complementar.', 400);
      }

      const projectId = parent ? parent.projectId : parseProjectId(body.projectId);
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
        const fileCheck = await validateProcessedImage(files[i], GALLERY_IMAGE);
        if (!fileCheck.ok) return error(`Imagem ${i + 1}: ${fileCheck.error}`, 400);
        checked.push({ ...fileCheck.data, alt: readAlt(body, i) });
      }

      let sortOrder = await nextSortOrder(supabase, projectId);
      const uploaded = [];
      try {
        for (let i = 0; i < checked.length; i++) {
          const item = checked[i];
          const stored = await storage.upload(env, {
            bytes: item.bytes,
            mimeType: item.mimeType,
            path: makeGalleryImagePath(project.slug, i),
          });
          uploaded.push({
            path: stored.path,
            alt: item.alt,
            sortOrder: sortOrder++,
            mimeType: item.mimeType,
            size: item.size,
            width: item.width,
            height: item.height,
          });
        }
      } catch (uploadErr) {
        return error(uploadErr.message, 500);
      }

      // Só a capa guarda descrição completa e destaque; as complementares
      // carregam apenas a breve descrição.
      const description = typeof body.description === 'string'
        ? body.description.trim().slice(0, 5000)
        : '';
      const featured = parseBoolean(body.featured);

      let recordId = parentId;
      const inserted = [];

      if (!parentId) {
        const cover = uploaded[0];
        const { data: coverRow, error: coverErr } = await supabase
          .from('project_images')
          .insert({
            project_id: projectId,
            url: cover.path,
            alt: cover.alt,
            description,
            sort_order: cover.sortOrder,
            mime_type: cover.mimeType,
            size_bytes: cover.size,
            width: cover.width,
            height: cover.height,
          })
          .select('*')
          .single();
        if (coverErr) return error(coverErr.message, 500);
        recordId = coverRow.id;
        inserted.push(coverRow);
      }

      const extras = uploaded.slice(parentId ? 0 : 1);
      if (extras.length > 0) {
        const { data: extraRows, error: extraErr } = await supabase
          .from('project_images')
          .insert(
            extras.map((item) => ({
              project_id: projectId,
              parent_id: recordId,
              url: item.path,
              alt: item.alt,
              description: '',
              sort_order: item.sortOrder,
              mime_type: item.mimeType,
              size_bytes: item.size,
              width: item.width,
              height: item.height,
            }))
          )
          .select('*');
        if (extraErr) return error(extraErr.message, 500);
        inserted.push(...(extraRows || []));
      }

      if (!parentId && featured) {
        await setFeaturedImage(supabase, projectId, recordId);
        if (inserted[0]) inserted[0].featured = true;
      }

      const serialized = inserted.map((row) =>
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
