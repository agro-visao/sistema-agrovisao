#!/usr/bin/env node
/**
 * Bundle Cloudflare Pages Functions com esbuild, marcando @supabase/supabase-js
 * como external (não tenta fazer bundle dela, usa em runtime).
 *
 * O bundle sai SEMPRE em .functions-bundle/ (fora do controle de versão), nunca
 * por cima de functions/. Antes o esbuild gravava com allowOverwrite dentro da
 * própria pasta de origem, e um `npm run build` local trocava todo o código-
 * fonte das Functions pela versão minificada.
 *
 * O Cloudflare Pages publica a partir de functions/, então lá — e só lá — o
 * resultado é copiado por cima. A cópia é detectada por CF_PAGES/CI ou forçada
 * com `--emit`:
 *
 *   npm run build              → valida o bundle, não toca em functions/
 *   npm run build:functions -- --emit  → grava o bundle em functions/
 */

import { build } from 'esbuild';
import { glob } from 'glob';
import { resolve, dirname, join } from 'path';
import { cp, mkdir, rm } from 'fs/promises';

const functionsDir = resolve(process.cwd(), 'functions');
const bundleDir = resolve(process.cwd(), '.functions-bundle');
const files = await glob('**/*.js', { cwd: functionsDir });

if (files.length === 0) {
  console.log('✓ Nenhuma Functions para fazer bundle');
  process.exit(0);
}

// O Pages define CF_PAGES nos builds dele; `--emit` serve para reproduzir o
// mesmo comportamento na mão.
const emit = process.argv.includes('--emit') || Boolean(process.env.CF_PAGES) || process.env.CI === 'true';

try {
  await rm(bundleDir, { recursive: true, force: true });
  await mkdir(bundleDir, { recursive: true });

  await build({
    entryPoints: files.map((f) => resolve(functionsDir, f)),
    outdir: bundleDir,
    outbase: functionsDir,
    platform: 'browser',
    format: 'esm',
    bundle: true,
    external: ['@supabase/supabase-js', 'node:*'],
    minify: true,
    logLevel: 'info',
  });

  if (emit) {
    for (const f of files) {
      const dest = join(functionsDir, f);
      await mkdir(dirname(dest), { recursive: true });
      await cp(join(bundleDir, f), dest);
    }
    console.log('✓ Functions bundled e publicadas em functions/');
  } else {
    console.log(`✓ Functions bundled em .functions-bundle/ (fontes intactos; use --emit para publicar)`);
  }
} catch (err) {
  console.error('✘ Erro ao fazer bundle das Functions:', err.message);
  process.exit(1);
}
