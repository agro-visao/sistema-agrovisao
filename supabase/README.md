# Supabase — migração do Cloudflare D1

Este diretório contém os artefatos da migração do banco de dados do
AgroVisão de Cloudflare D1 (SQLite) para Supabase (Postgres + Storage +
Auth). Projeto Supabase: `https://esdcojgmgwpjyblcinpv.supabase.co`.

Nenhum destes passos deve ser commitado com segredos reais (service_role
key, senha de banco, credenciais B2). Use sempre `.dev.vars` (gitignored) ou
variáveis de ambiente exportadas no shell.

## Ordem de execução (manual, uma única vez)

### 1. Aplicar o schema

Rode `supabase/migrations/0001_init.sql` no projeto Supabase, por um dos dois
caminhos:

- **SQL Editor** (painel do Supabase): abra o arquivo, cole o conteúdo
  inteiro no SQL Editor e execute.
- **psql**: `psql "<connection string do projeto>" -f supabase/migrations/0001_init.sql`

O arquivo é idempotente (pode ser reexecutado sem duplicar tabelas, índices
ou políticas).

Em seguida, rode do mesmo jeito `supabase/migrations/0002_gallery_details.sql`,
que adiciona à tabela `project_images` os campos usados pela galeria:
`description` (descrição completa, exibida abaixo das fotos) e `featured`
(imagem de destaque/capa, no máximo uma por projeto). Sem essa migration o
painel não consegue salvar imagens na galeria.

Por fim, `supabase/migrations/0003_gallery_extra_photos.sql` acrescenta
`parent_id`, que transforma cada registro da galeria em "imagem de capa +
breve descrição + fotos complementares + descrição completa": a linha com
`parent_id` nulo é o registro e as linhas que apontam para ela são as fotos
complementares (só com a breve descrição própria, opcional).

Atalho para aplicar tudo de uma vez, sem abrir o painel:

```bash
node --env-file=.dev.vars scripts/apply-migrations.mjs
```

### 2. Criar o usuário administrador

```bash
node --env-file=.dev.vars scripts/setup-admin.mjs
```

Requer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.dev.vars`. Gera uma
senha temporária aleatória e imprime no terminal (copie na hora — o painel
vai obrigar a troca no primeiro login). Pode ser rodado de novo sem
problemas: se o usuário já existir, ele é reaproveitado.

### 3. Migrar os dados do D1

```bash
node --env-file=.dev.vars scripts/migrate-d1-to-supabase.mjs
```

Migra `categories`, `products`, `projects` e `project_images` do D1 remoto
(`agrovisao-db`, via `npx wrangler d1 execute`) para o Supabase. Requer
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

Para também migrar as imagens de produto do Backblaze B2 para o bucket
`product-images` do Supabase Storage, adicione ao `.dev.vars` (ou exporte no
shell): `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`. Sem
essas variáveis, o script migra os dados normalmente e só avisa no console
que pulou as imagens.

O script é idempotente (upsert por `slug`/`key`) — pode ser reexecutado com
segurança.
