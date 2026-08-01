-- ─────────────────────────────────────────────────────────────────────────
-- 0006 — "Categorias de Projetos" (/projetos) editáveis pelo painel
--
-- Os cards dessa seção eram fixos no React. Agora vêm daqui, com o ícone
-- escolhido no painel a partir de um conjunto fechado (a coluna `icon`
-- guarda só a chave; o desenho SVG vive em src/data/projectCategoryIcons.ts,
-- para o painel não virar porta de entrada de HTML arbitrário na página).
--
-- Tabela separada de `categories` de propósito: aquela classifica PRODUTOS
-- da vitrine (mudas, insumos…) e é usada nos filtros de /vendas.
--
-- Idempotente: reexecutar não duplica nem sobrescreve edições do painel.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists project_categories (
  id bigint generated always as identity primary key,
  key text unique not null,
  label text not null,
  icon text not null default 'projeto',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_project_categories_updated_at on project_categories;
create trigger trg_project_categories_updated_at
  before update on project_categories
  for each row
  execute function set_updated_at();

alter table project_categories enable row level security;

drop policy if exists "project_categories_public_read" on project_categories;
create policy "project_categories_public_read"
  on project_categories for select
  to anon, authenticated
  using (active = true);

-- Seed: exatamente os 10 cards que já apareciam na página.
insert into project_categories (key, label, icon, sort_order, active)
values
  ('projetos-agropecuarios', 'Projetos Agropecuários', 'agropecuario', 1, true),
  ('projetos-ambientais', 'Projetos Ambientais', 'ambiental', 2, true),
  ('projetos-sociais', 'Projetos Sociais', 'social', 3, true),
  ('projetos-culturais', 'Projetos Culturais', 'cultural', 4, true),
  ('projetos-esportivos', 'Projetos Esportivos', 'esportivo', 5, true),
  ('projetos-para-mulheres', 'Projetos para Mulheres', 'mulheres', 6, true),
  ('agricultura-familiar', 'Agricultura Familiar', 'familiar', 7, true),
  ('capacitacoes', 'Capacitações', 'capacitacao', 8, true),
  ('bioeconomia', 'Bioeconomia', 'bioeconomia', 9, true),
  ('desenvolvimento-sustentavel', 'Desenv. Sustentável', 'sustentavel', 10, true)
on conflict (key) do nothing;
