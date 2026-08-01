// scripts/migrate-d1-to-supabase.mjs
//
// Migra os DADOS reais (categories, products, projects, project_images) do
// D1 remoto (Cloudflare) para o Supabase (Postgres + Storage). Não mexe em
// credenciais de admin — isso é feito por scripts/setup-admin.mjs.
//
// Pré-requisitos:
//   - supabase/migrations/0001_init.sql já aplicada no projeto Supabase.
//   - `npx wrangler` autenticado e com acesso ao banco `agrovisao-db`
//     (o mesmo usado hoje em produção, ver wrangler.toml / histórico do repo).
//
// Como rodar (a partir da raiz do repositório), só dados, sem migrar imagens:
//
//   node --env-file=.dev.vars scripts/migrate-d1-to-supabase.mjs
//
// Como rodar migrando também as imagens de produto do Backblaze B2 para o
// Supabase Storage (bucket 'product-images'), com TODAS as env vars:
//
//   SUPABASE_URL=https://esdcojgmgwpjyblcinpv.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   B2_APPLICATION_KEY_ID=<key id> \
//   B2_APPLICATION_KEY=<application key> \
//   B2_BUCKET_NAME=<nome do bucket B2> \
//   node --env-file=.dev.vars scripts/migrate-d1-to-supabase.mjs
//
// (ou coloque todas essas variáveis dentro do .dev.vars e rode só com
// `node --env-file=.dev.vars scripts/migrate-d1-to-supabase.mjs`).
//
// Se as variáveis B2_* não estiverem definidas, o script pula a migração de
// imagem de cada produto (avisando no console) e migra os dados normalmente,
// com image_path = ''.
//
// Idempotência: todos os inserts usam upsert por slug/key (onConflict), então
// rodar o script mais de uma vez não duplica registros. Reexecutar também
// tenta migrar de novo a imagem de produtos que ainda estejam com
// image_path vazio.
//
// NUNCA commite este arquivo com credenciais reais dentro dele — todas as
// credenciais vêm de variáveis de ambiente/.dev.vars (gitignored).

import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const D1_DATABASE_NAME = 'agrovisao-db';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const B2_APPLICATION_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;
const B2_API_URL = 'https://api.backblazeb2.com/b2api/v2';

function fail(message) {
  console.error(`\n[migrate] ERRO: ${message}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail(
    'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.\n' +
      '  Exemplo: node --env-file=.dev.vars scripts/migrate-d1-to-supabase.mjs'
  );
}

const b2Enabled = Boolean(B2_APPLICATION_KEY_ID && B2_APPLICATION_KEY && B2_BUCKET_NAME);
if (!b2Enabled) {
  console.warn(
    '[migrate] AVISO: B2_APPLICATION_KEY_ID / B2_APPLICATION_KEY / B2_BUCKET_NAME não definidos — ' +
      'a migração de imagens de produto será pulada (image_path ficará vazio para produtos com b2_file_key).'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────────────────
// Leitura das tabelas do D1 remoto via wrangler CLI.
// ─────────────────────────────────────────────────────────────────────────
function d1Query(sql) {
  const stdout = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', D1_DATABASE_NAME, '--remote', '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }
  );
  // `wrangler d1 execute --json` imprime um array de resultados, um por
  // statement executado: [{ results: [...], success: true, meta: {...} }]
  const parsed = JSON.parse(stdout);
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!first || !Array.isArray(first.results)) {
    throw new Error(`Resposta inesperada do wrangler d1 execute para: ${sql}`);
  }
  return first.results;
}

function toBool(value) {
  return value === 1 || value === true;
}

// ─────────────────────────────────────────────────────────────────────────
// Backblaze B2: autenticação e download (adaptado de functions/api/admin/_b2.js
// para Node — mesma lógica, usando fetch nativo do Node 18+).
// ─────────────────────────────────────────────────────────────────────────
let b2SessionCache = null;

async function b2Authorize() {
  if (b2SessionCache) return b2SessionCache;
  const credentials = Buffer.from(`${B2_APPLICATION_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64');
  const res = await fetch(`${B2_API_URL}/b2_authorize_account`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')) || res.statusText;
    throw new Error(`Falha ao autenticar no Backblaze B2 (${res.status}). ${detail.slice(0, 200)}`);
  }
  const auth = await res.json();
  b2SessionCache = { accountToken: auth.authorizationToken, downloadUrl: auth.downloadUrl };
  return b2SessionCache;
}

async function b2DownloadFile(fileKey) {
  const session = await b2Authorize();
  const url = `${session.downloadUrl}/file/${B2_BUCKET_NAME}/${fileKey}`;
  const res = await fetch(url, { headers: { Authorization: session.accountToken } });
  if (!res.ok) {
    throw new Error(`Falha ao baixar "${fileKey}" do Backblaze B2 (${res.status}).`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function migrateProductImage(fileKey) {
  if (!b2Enabled || !fileKey) return '';
  try {
    const { buffer, contentType } = await b2DownloadFile(fileKey);
    // Mantemos o mesmo caminho relativo usado no B2 (já vinha no formato
    // "agrovisao/products/<slug>-<timestamp>.<ext>", ver makeFileKey em
    // functions/api/admin/_b2.js), assim o objeto fica organizado da mesma
    // forma dentro do bucket 'product-images' do Supabase Storage.
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileKey, buffer, { contentType, upsert: true });
    if (error) throw error;
    console.log(`[migrate]   imagem migrada: ${fileKey}`);
    return fileKey;
  } catch (e) {
    console.warn(`[migrate]   AVISO: falha ao migrar imagem "${fileKey}": ${e.message} — produto ficará sem imagem.`);
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Migração de categories
// ─────────────────────────────────────────────────────────────────────────
async function migrateCategories() {
  const rows = d1Query('SELECT * FROM categories');
  if (rows.length === 0) {
    console.log('[migrate] categories: nenhum registro encontrado no D1.');
    return new Map();
  }

  const payload = rows.map((r) => ({
    key: r.key,
    label: r.label,
    description: r.description ?? '',
    sort_order: r.sort_order ?? 0,
    active: toBool(r.active),
  }));

  const { data, error } = await supabase.from('categories').upsert(payload, { onConflict: 'key' }).select('id, key');
  if (error) fail(`Falha ao migrar categories: ${error.message}`);

  console.log(`[migrate] categories: ${data.length} registro(s) migrado(s)/atualizado(s).`);

  // Mapa key -> novo id no Supabase, usado para resolver products.category_id
  // (não confiamos que os ids numéricos batam entre D1 e Postgres).
  return new Map(data.map((c) => [c.key, c.id]));
}

// ─────────────────────────────────────────────────────────────────────────
// Migração de products
// ─────────────────────────────────────────────────────────────────────────
async function migrateProducts(categoryKeyToId) {
  const rows = d1Query('SELECT * FROM products');
  if (rows.length === 0) {
    console.log('[migrate] products: nenhum registro encontrado no D1.');
    return;
  }

  // Para resolver category_id, primeiro buscamos no D1 a que `key` cada
  // category_id antigo corresponde (a FK antiga é por id numérico do D1).
  const oldCategories = d1Query('SELECT * FROM categories');
  const oldCategoryIdToKey = new Map(oldCategories.map((c) => [c.id, c.key]));

  const payload = [];
  let imagesMigrated = 0;
  let imagesSkipped = 0;

  for (const r of rows) {
    let imagePath = '';
    if (r.b2_file_key) {
      imagePath = await migrateProductImage(r.b2_file_key);
      if (imagePath) imagesMigrated += 1;
      else imagesSkipped += 1;
    }

    const oldCategoryKey = r.category_id != null ? oldCategoryIdToKey.get(r.category_id) : null;
    const newCategoryId = oldCategoryKey ? categoryKeyToId.get(oldCategoryKey) ?? null : null;

    payload.push({
      slug: r.slug,
      name: r.name,
      description: r.description ?? '',
      image_path: imagePath,
      price_cents: r.price_cents,
      compare_price_cents: r.compare_price_cents ?? null,
      whatsapp_phone: r.whatsapp_phone ?? '5591982064340',
      whatsapp_text: r.whatsapp_text ?? '',
      category_id: newCategoryId,
      category: r.category ?? 'mudas',
      category_label: r.category_label ?? 'Mudas',
      stock: r.stock ?? 0,
      featured: toBool(r.featured),
      is_new: toBool(r.is_new),
      sort_order: r.sort_order ?? 0,
      active: toBool(r.active),
    });
  }

  const { data, error } = await supabase.from('products').upsert(payload, { onConflict: 'slug' }).select('id');
  if (error) fail(`Falha ao migrar products: ${error.message}`);

  console.log(
    `[migrate] products: ${data.length} registro(s) migrado(s)/atualizado(s). ` +
      `Imagens: ${imagesMigrated} transferida(s), ${imagesSkipped} pulada(s).`
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Migração de projects + project_images
// ─────────────────────────────────────────────────────────────────────────
async function migrateProjects() {
  const rows = d1Query('SELECT * FROM projects');
  if (rows.length === 0) {
    console.log('[migrate] projects: nenhum registro encontrado no D1.');
    return new Map();
  }

  const payload = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    category_label: r.category_label,
    institution: r.institution ?? '',
    description: r.description ?? '',
    // `services` vem como TEXT (JSON serializado) no D1; convertemos para
    // um valor JS real antes de mandar pro supabase-js, que já serializa
    // corretamente para a coluna jsonb.
    services: safeParseJsonArray(r.services),
    logo_url: r.logo_url ?? '',
    sort_order: r.sort_order ?? 0,
    active: toBool(r.active),
  }));

  const { data, error } = await supabase.from('projects').upsert(payload, { onConflict: 'slug' }).select('id, slug');
  if (error) fail(`Falha ao migrar projects: ${error.message}`);

  console.log(`[migrate] projects: ${data.length} registro(s) migrado(s)/atualizado(s).`);

  return new Map(data.map((p) => [p.slug, p.id]));
}

function safeParseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateProjectImages(projectSlugToId) {
  const rows = d1Query('SELECT * FROM project_images');
  if (rows.length === 0) {
    console.log('[migrate] project_images: nenhum registro encontrado no D1.');
    return;
  }

  const oldProjects = d1Query('SELECT * FROM projects');
  const oldProjectIdToSlug = new Map(oldProjects.map((p) => [p.id, p.slug]));

  const payload = [];
  for (const r of rows) {
    const slug = oldProjectIdToSlug.get(r.project_id);
    const newProjectId = slug ? projectSlugToId.get(slug) : null;
    if (!newProjectId) {
      console.warn(
        `[migrate]   AVISO: project_images.id=${r.id} referencia project_id=${r.project_id} não encontrado — pulando.`
      );
      continue;
    }
    payload.push({
      project_id: newProjectId,
      url: r.url,
      alt: r.alt ?? '',
      sort_order: r.sort_order ?? 0,
    });
  }

  if (payload.length === 0) {
    console.log('[migrate] project_images: nenhum registro válido para inserir.');
    return;
  }

  // project_images não tem uma coluna única natural para onConflict (id
  // antigo não é preservado). Para manter o script idempotente sem
  // duplicar, apagamos e reinserimos as imagens dos projetos migrados
  // nesta execução antes de inserir — mais simples e seguro que tentar
  // deduplicar por (project_id, url, sort_order).
  const projectIds = [...new Set(payload.map((p) => p.project_id))];
  const { error: deleteError } = await supabase.from('project_images').delete().in('project_id', projectIds);
  if (deleteError) fail(`Falha ao limpar project_images antes de reinserir: ${deleteError.message}`);

  const { data, error } = await supabase.from('project_images').insert(payload).select('id');
  if (error) fail(`Falha ao migrar project_images: ${error.message}`);

  console.log(`[migrate] project_images: ${data.length} registro(s) inserido(s).`);
}

// ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[migrate] Iniciando migração D1 (${D1_DATABASE_NAME}) -> Supabase (${SUPABASE_URL})\n`);

  const categoryKeyToId = await migrateCategories();
  await migrateProducts(categoryKeyToId);
  const projectSlugToId = await migrateProjects();
  await migrateProjectImages(projectSlugToId);

  console.log('\n[migrate] Migração concluída.');
}

main().catch((e) => {
  fail(e?.message || String(e));
});
