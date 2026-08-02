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
-- O produto continua com os 3 slots (image_path, image_path_2, image_path_3).
-- Estas colunas descrevem a imagem PRINCIPAL (image_path).
--
-- Migration puramente aditiva: todas as colunas têm default, nenhuma linha
-- existente é alterada. As imagens já cadastradas ficam com os metadados
-- zerados até que o slot seja substituído por um upload novo — nada é
-- reprocessado retroativamente.
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
