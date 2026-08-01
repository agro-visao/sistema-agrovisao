-- ─────────────────────────────────────────────────────────────────────────
-- 0004 — duas imagens complementares por produto
--
-- O produto passa a ter até 3 fotos: image_path continua sendo a principal
-- (a que aparece no card da vitrine) e image_path_2 / image_path_3 são as
-- complementares, exibidas como miniaturas na página do produto.
-- Vazio ('') = slot sem imagem, mesma convenção de image_path.
--
-- Idempotente: pode rodar mais de uma vez.
-- ─────────────────────────────────────────────────────────────────────────
alter table products
  add column if not exists image_path_2 text not null default '',
  add column if not exists image_path_3 text not null default '';
