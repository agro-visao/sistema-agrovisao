-- Migration 0001: Schema inicial no Supabase (Postgres) — migração do Cloudflare D1.
--
-- Este arquivo é a versão Postgres consolidada de migrations/0001..0006 do D1
-- (SQLite). Principais diferenças em relação ao schema antigo:
--   * IDs: INTEGER AUTOINCREMENT (SQLite) -> bigint generated always as identity.
--   * Datas: TEXT (datetime('now')) -> timestamptz default now().
--   * Booleans: INTEGER 0/1 -> boolean nativo (active, featured, is_new,
--     must_change_password).
--   * Preços continuam em centavos (integer), nunca numeric/float, para evitar
--     erro de arredondamento monetário.
--   * A tabela `admin_users` (com password_hash PBKDF2) e `admin_sessions` e
--     `password_reset_tokens` do D1 DEIXAM DE EXISTIR: autenticação agora é
--     100% Supabase Auth (auth.users), que já cuida de hash de senha, sessão
--     (JWT) e recuperação de senha. Só guardamos aqui um flag extra que o
--     Supabase Auth não tem nativamente: `admin_profiles.must_change_password`.
--   * As colunas de imagem do produto (b2_file_key, b2_file_id, mime_type,
--     width, height, cloudinary_public_id, image_url) somem e viram uma única
--     coluna `image_path`, que referencia um objeto no bucket público
--     `product-images` do Supabase Storage (o bucket trocou de privado/B2
--     para público porque o Storage do Supabase já serve com CDN e cache,
--     dispensando o proxy que existia em /api/products/[id]/image).
--
-- Este arquivo é seguro para rodar mais de uma vez (idempotente): usa
-- `create table if not exists`, `create index if not exists`,
-- `drop policy if exists` antes de recriar políticas, e `on conflict do
-- nothing` no seed de storage.buckets.

-- ─────────────────────────────────────────────────────────────────────────
-- Extensões auxiliares (uuid-ossp não é necessária: auth.users já usa uuid
-- gerado pelo próprio Supabase Auth; pgcrypto fica disponível caso algum
-- endpoint precise gerar token/hash no futuro).
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Function utilitária: atualiza updated_at automaticamente em qualquer
-- tabela que tenha essa coluna. Evita repetir `updated_at = now()` em cada
-- UPDATE feito pelo backend (Pages Functions).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- categories — equivalente a migrations/0006_b2_and_categories.sql
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists categories (
  id bigint generated always as identity primary key,
  key text unique not null,
  label text not null,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_key on categories(key);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- products — equivalente a migrations/0001, 0003, 0005, 0006 (colunas
-- acumuladas ao longo do tempo no D1, aqui já consolidadas em uma tabela só).
-- Preços em centavos (R$ 35,00 = 3500), igual ao D1.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists products (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  -- Caminho do objeto dentro do bucket 'product-images' do Supabase Storage
  -- (ex.: 'agrovisao/products/acai-premium-1690000000000.jpg').
  -- Vazio ('') = produto sem imagem. Substitui b2_file_key/b2_file_id do D1;
  -- não guardamos mais file_id porque o Storage do Supabase já versiona/
  -- resolve por path, sem precisar de um segundo identificador.
  image_path text not null default '',
  price_cents integer not null,
  compare_price_cents integer,
  whatsapp_phone text not null default '5591982064340',
  whatsapp_text text not null default '',
  category_id bigint references categories(id),
  -- category/category_label ficam desnormalizados (como no D1) para permitir
  -- exibição rápida sem join e por compatibilidade com produtos legados que
  -- ainda não têm category_id preenchido.
  category text not null default 'mudas',
  category_label text not null default 'Mudas',
  stock integer not null default 0,
  featured boolean not null default false,
  is_new boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_category on products(category);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- projects — equivalente a migrations/0001_schema.sql
-- `services` era TEXT com um array JSON serializado no D1; aqui vira jsonb
-- nativo, o que permite validar/consultar o conteúdo sem parse manual.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists projects (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  category text not null,
  category_label text not null,
  institution text not null default '',
  description text not null default '',
  services jsonb not null default '[]',
  logo_url text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
  before update on projects
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- project_images — equivalente a migrations/0001_schema.sql
-- Sem coluna `active`: a visibilidade é herdada do projeto pai (projects.active).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists project_images (
  id bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_images_project_id on project_images(project_id);

-- ─────────────────────────────────────────────────────────────────────────
-- admin_profiles — substitui admin_users/admin_sessions/password_reset_tokens
-- do D1. A autenticação em si (senha, sessão, recuperação de senha por
-- e-mail) passa a ser 100% responsabilidade do Supabase Auth (auth.users).
-- Esta tabela guarda só o que o Auth não modela nativamente: o flag que
-- obriga a troca da senha inicial (equivalente ao must_change_password que
-- existia em admin_users, migrations/0004_must_change_password.sql).
-- user_id é a mesma PK/uuid de auth.users -> ON DELETE CASCADE remove o
-- perfil automaticamente se o usuário for apagado do Auth.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_profiles_updated_at on admin_profiles;
create trigger trg_admin_profiles_updated_at
  before update on admin_profiles
  for each row
  execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
--
-- O backend (Cloudflare Pages Functions) sempre acessa o Supabase usando a
-- service_role key, que ignora RLS por padrão — é assim que o painel admin
-- consegue inserir/editar/excluir produtos, projetos e categorias mesmo sem
-- nenhuma policy de insert/update/delete abaixo. As policies de SELECT
-- servem apenas para o cenário em que o frontend público eventualmente
-- consulte o Supabase diretamente com a chave anon (ex.: leitura via
-- supabase-js no client), sem passar pelo backend. Por segurança, RLS fica
-- habilitado em todas as tabelas mesmo que hoje só o backend as acesse —
-- assim, se uma chave anon vazar ou for usada por engano, ela só enxerga
-- dados públicos e ativos, nunca escreve nada.
-- ═══════════════════════════════════════════════════════════════════════

alter table categories enable row level security;
alter table products enable row level security;
alter table projects enable row level security;
alter table project_images enable row level security;
alter table admin_profiles enable row level security;

-- categories: leitura pública só das categorias ativas (vitrine pública).
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read"
  on categories for select
  to anon, authenticated
  using (active = true);

-- products: leitura pública só dos produtos ativos (vitrine pública).
drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (active = true);

-- projects: leitura pública só dos projetos ativos (portfólio público).
drop policy if exists "projects_public_read" on projects;
create policy "projects_public_read"
  on projects for select
  to anon, authenticated
  using (active = true);

-- project_images: não tem coluna `active` própria; a galeria de imagens de
-- um projeto inativo simplesmente não aparece porque a consulta ao projeto
-- pai já retorna vazio (a UI nunca busca project_images de um projeto que
-- ela não conseguiu carregar). Por isso a policy aqui libera leitura geral.
drop policy if exists "project_images_public_read" on project_images;
create policy "project_images_public_read"
  on project_images for select
  to anon, authenticated
  using (true);

-- admin_profiles: cada usuário autenticado só enxerga/edita o próprio
-- perfil (auth.uid() = user_id). Não existe policy pública nem de insert:
-- a criação do perfil é feita só pelo backend/scripts com service_role
-- (ver scripts/setup-admin.mjs), nunca pelo próprio usuário.
drop policy if exists "admin_profiles_select_own" on admin_profiles;
create policy "admin_profiles_select_own"
  on admin_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "admin_profiles_update_own" on admin_profiles;
create policy "admin_profiles_update_own"
  on admin_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nenhuma policy de insert/update/delete foi criada para categories,
-- products, projects e project_images de propósito: toda escrita nessas
-- tabelas passa pelo painel admin (Cloudflare Pages Functions), que usa a
-- service_role key e portanto ignora RLS. Isso evita ter que manter regras
-- de autorização duplicadas (uma no backend, outra em policy SQL) e reduz a
-- superfície de ataque: mesmo que a chave anon vaze, ninguém escreve direto
-- no banco.

-- ═══════════════════════════════════════════════════════════════════════
-- Storage: bucket público 'product-images'
--
-- Trocamos o Backblaze B2 (bucket privado + proxy de leitura autenticado em
-- /api/products/[id]/image) pelo Supabase Storage com bucket PÚBLICO: as
-- imagens de produto não são sensíveis (é catálogo público de mudas/
-- insumos), então servir direto pela CDN do Storage é mais simples e rápido
-- que manter um proxy no backend só para leitura.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Leitura pública dos objetos do bucket (equivalente ao bucket ser "public").
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Sem policies de insert/update/delete em storage.objects: assim como nas
-- tabelas acima, só o backend com service_role sobe/substitui/remove
-- arquivos do bucket (a service_role ignora RLS também no Storage). Se no
-- futuro o upload passar a ser feito diretamente do navegador (sem passar
-- pelo backend), será necessário criar uma policy de insert restrita ao
-- usuário admin autenticado — não é o caso hoje.
