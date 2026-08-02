-- ─────────────────────────────────────────────────────────────────────────
-- 0007 — metadados da imagem processada
--
-- As imagens passam a ser convertidas para WEBP no navegador (Canvas) antes
-- do upload. Estas colunas guardam o resultado final já gravado no Storage,
-- para o painel conseguir mostrar peso/dimensões sem baixar o arquivo.
--
-- Os valores são medidos no servidor a partir dos bytes recebidos (cabeçalho
-- RIFF/VP8), nunca a partir do que o navegador declara.
--
-- image_path_2 / image_path_3 continuam existindo por compatibilidade com os
-- produtos já cadastrados, mas o painel não envia mais nada para esses slots:
-- todo produto novo usa somente image_path.
-- ─────────────────────────────────────────────────────────────────────────

alter table products
  add column if not exists image_mime_type text not null default '',
  add column if not exists image_size integer not null default 0,
  add column if not exists image_width integer not null default 0,
  add column if not exists image_height integer not null default 0;

alter table project_images
  add column if not exists mime_type text not null default '',
  add column if not exists size_bytes integer not null default 0,
  add column if not exists width integer not null default 0,
  add column if not exists height integer not null default 0;
