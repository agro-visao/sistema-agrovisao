#!/usr/bin/env node
/**
 * Bundle Cloudflare Pages Functions com esbuild, marcando @supabase/supabase-js
 * como external (não tenta fazer bundle dela, usa em runtime).
 */

import { build } from 'esbuild';
import { glob } from 'glob';
import { resolve, relative } from 'path';

const functionsDir = resolve(process.cwd(), 'functions');
const files = await glob('**/*.js', { cwd: functionsDir });

if (files.length === 0) {
  console.log('✓ Nenhuma Functions para fazer bundle');
  process.exit(0);
}

try {
  await build({
    entryPoints: files.map(f => resolve(functionsDir, f)),
    outdir: functionsDir,
    platform: 'browser',
    format: 'esm',
    bundle: true,
    external: ['@supabase/supabase-js', 'node:*'],
    minify: true,
    allowOverwrite: true,
    logLevel: 'info',
  });
  console.log('✓ Functions bundled com sucesso');
} catch (err) {
  console.error('✘ Erro ao fazer bundle das Functions:', err.message);
  process.exit(1);
}
