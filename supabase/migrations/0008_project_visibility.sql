-- ─────────────────────────────────────────────────────────────────────────
-- 0008 — visibilidade independente de "Grid de Projetos" e "Galeria"
--
-- Até aqui, o Grid público (/projetos) mostrava TODO projeto com active=true,
-- e a Galeria (/galeria) mostrava qualquer projeto que tivesse pelo menos uma
-- linha em project_images. Não havia como marcar um projeto para aparecer só
-- num dos dois lugares, ou ficar salvo no painel sem aparecer em nenhum.
--
-- show_in_projects: controla a exibição no Grid (/projetos).
-- show_in_gallery:  controla a exibição na Galeria (/galeria).
--
-- Migration puramente aditiva: todas as colunas têm default, nenhuma linha
-- existente é apagada ou alterada em outros campos.
--
-- Backfill (preserva o comportamento público atual):
--   * show_in_projects default TRUE -> os 21 projetos hoje ativos continuam
--     aparecendo no Grid exatamente como antes.
--   * show_in_gallery é ligado só para os projetos que JÁ têm pelo menos uma
--     imagem em project_images — hoje, apenas 1 projeto ("Plantação Orgânica
--     2024"), preservando a Galeria pública como está.
-- ─────────────────────────────────────────────────────────────────────────

alter table projects
  add column if not exists show_in_gallery boolean not null default false,
  add column if not exists show_in_projects boolean not null default true;

update projects
  set show_in_gallery = true
  where id in (select distinct project_id from project_images);
