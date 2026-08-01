#!/usr/bin/env node
// Aplica os arquivos SQL de supabase/migrations no projeto Supabase.
//
//   node --env-file=.dev.vars scripts/apply-migrations.mjs                 # todas
//   node --env-file=.dev.vars scripts/apply-migrations.mjs 0002            # só a 0002
//
// Precisa de UMA destas credenciais (a service_role key NÃO serve: ela fala
// com o PostgREST, que não executa DDL):
//
//   SUPABASE_DB_URL       connection string do Postgres
//                         (Dashboard > Project Settings > Database > Connection string > URI)
//   SUPABASE_ACCESS_TOKEN personal access token
//                         (Dashboard > Account > Access Tokens) — usa a Management API
//
// Os arquivos são idempotentes, então reexecutar é seguro.

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');

function projectRefFromUrl(url) {
  const match = /https?:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url || '');
  return match ? match[1] : '';
}

async function listMigrations(filter) {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  return filter ? files.filter((f) => f.includes(filter)) : files;
}

async function runViaManagementApi(sql, token, ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`Management API ${res.status}: ${(await res.text()).slice(0, 500)}`);
}

// db.<ref>.supabase.co só resolve em IPv6; em rede sem IPv6 a conexão direta
// dá ENETUNREACH. Nesse caso caímos no pooler (IPv4), que exige usuário
// "postgres.<ref>". A região não está na connection string, então testamos as
// candidatas: a errada responde "Tenant or user not found" na hora.
const POOLER_REGIONS = [
  'sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1',
  'eu-central-1', 'eu-west-1', 'ap-southeast-1',
];
const NETWORK_ERRORS = ['ENETUNREACH', 'EHOSTUNREACH', 'ENOTFOUND', 'ETIMEDOUT'];

async function connect(pg, config) {
  const client = new pg.Client({ ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000, ...config });
  await client.connect();
  return client;
}

async function openConnection(pg, dbUrl, ref) {
  try {
    return await connect(pg, { connectionString: dbUrl });
  } catch (e) {
    if (!NETWORK_ERRORS.some((code) => e.code === code || e.message.includes(code))) throw e;
    if (!ref) throw e;
  }

  const url = new URL(dbUrl);
  const password = decodeURIComponent(url.password);
  for (const region of POOLER_REGIONS) {
    for (const port of [6543, 5432]) {
      try {
        return await connect(pg, {
          host: `aws-0-${region}.pooler.supabase.com`,
          port,
          user: `postgres.${ref}`,
          password,
          database: 'postgres',
        });
      } catch {
        // região/porta errada — segue para a próxima candidata
      }
    }
  }
  throw new Error('host direto inacessível (IPv6) e nenhum pooler aceitou a conexão.');
}

async function runViaPostgres(sql, dbUrl, ref) {
  const { default: pg } = await import('pg');
  const client = await openConnection(pg, dbUrl, ref);
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function main() {
  const filter = process.argv[2] || '';
  const dbUrl = process.env.SUPABASE_DB_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = projectRefFromUrl(process.env.SUPABASE_URL);

  if (!dbUrl && !(token && ref)) {
    console.error(
      'Nenhuma credencial de DDL encontrada.\n' +
        'Adicione ao .dev.vars (arquivo gitignored) UMA das linhas:\n' +
        '  SUPABASE_DB_URL=postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres\n' +
        '  SUPABASE_ACCESS_TOKEN=sbp_...\n'
    );
    process.exit(1);
  }

  const files = await listMigrations(filter);
  if (files.length === 0) {
    console.error(`Nenhuma migration encontrada para "${filter}".`);
    process.exit(1);
  }

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`→ aplicando ${file} … `);
    if (dbUrl) await runViaPostgres(sql, dbUrl, ref);
    else await runViaManagementApi(sql, token, ref);
    console.log('ok');
  }

  console.log(`\n${files.length} migration(s) aplicada(s).`);
}

main().catch((e) => {
  console.error('\nfalhou:', e.message);
  process.exit(1);
});
