// scripts/seed-supabase.mjs
//
// Popula o Supabase com dados de exemplo (categorias, produtos, projetos)
// compatíveis com o schema 0001_init.sql. Idempotente: pode rodar de novo
// sem duplicar dados (upsert por slug/key).
//
// Como rodar:
//   node --env-file=.dev.vars scripts/seed-supabase.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'ERRO: Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n' +
      '  Exemplo: node --env-file=.dev.vars scripts/seed-supabase.mjs'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('[seed] Iniciando população de dados de exemplo...\n');

  // 1. Categorias
  const categories = [
    {
      key: 'frutas',
      label: 'Frutas',
      description: 'Frutas frescas da região',
      active: true,
    },
    {
      key: 'hortalizas',
      label: 'Hortaliças',
      description: 'Verduras e legumes frescos',
      active: true,
    },
    {
      key: 'graos',
      label: 'Grãos',
      description: 'Grãos e cereais',
      active: true,
    },
  ];

  console.log('→ Criando categorias...');
  for (const cat of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert(cat, { onConflict: 'key' });
    if (error) console.error(`  ERRO em ${cat.key}:`, error.message);
    else console.log(`  ✓ ${cat.name}`);
  }

  // 2. Produtos
  const products = [
    {
      slug: 'banana-prata',
      name: 'Banana Prata',
      category_key: 'frutas',
      category_label: 'Frutas',
      description: 'Banana prata fresca, polpa macia e sabor doce.',
      price_cents: 450, // R$ 4.50 por kg
      image_path: 'products/banana-prata-default.jpg',
      active: true,
    },
    {
      slug: 'alface-crespa',
      name: 'Alface Crespa',
      category_key: 'hortalizas',
      category_label: 'Hortaliças',
      description: 'Alface crespa fresca, ideal para saladas.',
      price_cents: 300, // R$ 3.00 por unidade
      image_path: 'products/alface-crespa-default.jpg',
      active: true,
    },
    {
      slug: 'arroz-integral',
      name: 'Arroz Integral',
      category_key: 'graos',
      category_label: 'Grãos',
      description: 'Arroz integral integral, 100% natural.',
      price_cents: 1200, // R$ 12.00 por kg
      image_path: 'products/arroz-integral-default.jpg',
      active: true,
    },
    {
      slug: 'mamao-papaia',
      name: 'Mamão Papaia',
      category_key: 'frutas',
      category_label: 'Frutas',
      description: 'Mamão papaia doce e suculento.',
      price_cents: 600, // R$ 6.00 por unidade
      image_path: 'products/mamao-papaia-default.jpg',
      active: true,
    },
  ];

  // Resolve category_id por category_key
  console.log('\n→ Resolvendo category IDs...');
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, key');
  const catMap = Object.fromEntries(allCats.map((c) => [c.key, c.id]));

  products.forEach((p) => {
    p.category_id = catMap[p.category_key];
    p.category = p.category_key;
    delete p.category_key;
  });

  console.log('→ Criando produtos...');
  let sortOrder = 0;
  for (const prod of products) {
    const { error } = await supabase
      .from('products')
      .upsert(
        { ...prod, sort_order: sortOrder++ },
        { onConflict: 'slug' }
      );
    if (error) console.error(`  ERRO em ${prod.slug}:`, error.message);
    else console.log(`  ✓ ${prod.name}`);
  }

  // 3. Projetos (galerias/portfólio)
  const projects = [
    {
      slug: 'plantacao-organica-2024',
      name: 'Plantação Orgânica 2024',
      category: 'agricultura',
      category_label: 'Agricultura',
      description: 'Nosso projeto de agricultura orgânica no primeiro semestre de 2024.',
      active: true,
    },
    {
      slug: 'colheita-colaborativa',
      name: 'Colheita Colaborativa',
      category: 'comunidade',
      category_label: 'Comunidade',
      description: 'Evento de colheita com a comunidade local.',
      active: true,
    },
  ];

  console.log('\n→ Criando projetos...');
  for (const proj of projects) {
    const { error } = await supabase
      .from('projects')
      .upsert(proj, { onConflict: 'slug' });
    if (error) console.error(`  ERRO em ${proj.slug}:`, error.message);
    else console.log(`  ✓ ${proj.name}`);
  }

  // 4. Imagens de projetos
  const projectImages = [
    {
      project_slug: 'plantacao-organica-2024',
      url: 'project-images/plantacao-01.jpg',
      alt: 'Plantio inicial',
      sort_order: 0,
    },
    {
      project_slug: 'plantacao-organica-2024',
      url: 'project-images/plantacao-02.jpg',
      alt: 'Crescimento das plantas',
      sort_order: 1,
    },
    {
      project_slug: 'colheita-colaborativa',
      url: 'project-images/colheita-01.jpg',
      alt: 'Primeira colheita em grupo',
      sort_order: 0,
    },
  ];

  // Resolve project_id por project_slug
  console.log('\n→ Resolvendo project IDs...');
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, slug');
  const projMap = Object.fromEntries(allProjects.map((p) => [p.slug, p.id]));

  projectImages.forEach((img) => {
    img.project_id = projMap[img.project_slug];
    delete img.project_slug;
  });

  console.log('→ Criando imagens de projetos...');
  for (const img of projectImages) {
    const { error } = await supabase
      .from('project_images')
      .insert(img);
    if (error) console.error(`  ERRO:`, error.message);
    else console.log(`  ✓ ${img.alt}`);
  }

  console.log('\n✅ População concluída!');
}

seed().catch((e) => {
  console.error('\n❌ ERRO:', e.message);
  process.exit(1);
});
