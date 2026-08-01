-- Migration 0002: campos extras da galeria (project_images).
--
-- A página pública /galeria/:slug passa a ter dois textos por imagem:
--   * alt         -> breve descrição, exibida ao lado da foto principal;
--   * description -> descrição completa, exibida abaixo das fotos.
--
-- E uma imagem por projeto pode ser marcada como destaque (`featured`), que é
-- a capa mostrada na listagem /galeria e a primeira aberta na tela de
-- detalhes. Sem destaque definido, a UI cai para a primeira imagem pelo
-- sort_order (comportamento anterior).
--
-- Idempotente: pode ser reexecutado sem erro.

alter table project_images
  add column if not exists description text not null default '';

alter table project_images
  add column if not exists featured boolean not null default false;

-- Garante no máximo UMA imagem em destaque por projeto (índice parcial: as
-- linhas com featured = false não entram na restrição).
create unique index if not exists uniq_project_images_featured
  on project_images (project_id)
  where featured;
