-- ─────────────────────────────────────────────────────────────────────────
-- 0005 — carrega o portfólio institucional em `projects`
--
-- Os 19 projetos da seção "Projetos Desenvolvidos" (/projetos) viviam só no
-- D1, que foi apagado na migração para o Supabase. Sem eles, /api/projects
-- devolve apenas os 2 projetos de galeria e a grade de cards com as logos
-- some — o site hoje só continua mostrando os cards porque o React cai numa
-- lista embutida (FALLBACK_PROJECTS) quando a API falha.
--
-- Os dados abaixo são exatamente os dessa lista embutida, e logo_url aponta
-- para os arquivos que já estão em public/assets/logos/projetos/.
--
-- `on conflict (slug) do nothing`: reexecutar é seguro e nunca sobrescreve
-- uma edição feita depois pelo painel.
-- ─────────────────────────────────────────────────────────────────────────
insert into projects (slug, name, category, category_label, institution, description, services, logo_url, sort_order, active)
values
  ('acai-amazonico', 'Açaí Amazônico', 'familiar', 'Agricultura Familiar', 'Cooperativa de Açaicultores',
   'Fortalecimento da cadeia produtiva do açaí, agregando valor à produção e ampliando o acesso ao mercado.',
   '["Elaboração de Projeto","Captação de Recursos","Consultoria Técnica"]'::jsonb,
   '/assets/logos/projetos/acai-amazonico.png', 1, true),

  ('agricultura-para-todos', 'Agricultura Para Todos', 'familiar', 'Agricultura Familiar', 'Sindicato dos Trabalhadores Rurais',
   'Programa de fortalecimento da agricultura familiar, ampliando acesso a crédito, mercado e assistência técnica.',
   '["Consultoria PRONAF","Elaboração de Projeto","Capacitação"]'::jsonb,
   '/assets/logos/projetos/agricultura-para-todos.png', 2, true),

  ('amazonia-viva', 'Amazônia Viva', 'ambiental', 'Ambiental', 'Instituto Ambiental da Amazônia',
   'Iniciativa de conservação e uso sustentável dos recursos naturais da floresta amazônica.',
   '["Licenciamento Ambiental","Consultoria Técnica","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/amazonia-viva.png', 3, true),

  ('aurora-sustentavel', 'Aurora Sustentável', 'ambiental', 'Ambiental', 'Cooperativa Agroecológica',
   'Projeto de transição agroecológica e produção sustentável, alinhando produtividade à conservação ambiental.',
   '["Licenciamento Ambiental","Consultoria Técnica","Captação de Recursos"]'::jsonb,
   '/assets/logos/projetos/aurora-sustentavel.png', 4, true),

  ('casa-de-farinha', 'Casa de Farinha', 'familiar', 'Agricultura Familiar', 'Associação de Produtores Rurais',
   'Estruturação de unidade comunitária de processamento de mandioca, fortalecendo a geração de renda das famílias.',
   '["Elaboração de Projeto","Captação de Recursos","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/casa-de-farinha.png', 5, true),

  ('casa-de-farinha-2', 'Casa de Farinha II', 'familiar', 'Agricultura Familiar', 'Cooperativa Comunitária',
   'Ampliação da capacidade produtiva de farinheiras comunitárias, com modernização de equipamentos e processos.',
   '["Diagnóstico","Elaboração de Projeto","Captação de Recursos"]'::jsonb,
   '/assets/logos/projetos/casa-de-farinha-2.png', 6, true),

  ('cotijuba-mais-verde', 'Cotijuba Mais Verde', 'ambiental', 'Ambiental', 'Associação de Moradores da Ilha',
   'Projeto de recuperação ambiental e arborização da Ilha de Cotijuba, promovendo sustentabilidade insular.',
   '["Licenciamento Ambiental","Diagnóstico","Capacitação"]'::jsonb,
   '/assets/logos/projetos/cotijuba-mais-verde.png', 7, true),

  ('cultura-pela-paz', 'Cultura Pela Paz', 'cultural', 'Cultural', 'Secretaria de Cultura',
   'Programa de difusão cultural e promoção da cidadania por meio da arte, música e expressões da identidade amazônica.',
   '["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"]'::jsonb,
   '/assets/logos/projetos/cultura-pela-paz.png', 8, true),

  ('de-maos-dadas-com-o-campo', 'De Mãos Dadas com o Campo', 'social', 'Projeto Social', 'Movimento Rural Comunitário',
   'Ações integradas de apoio às comunidades rurais, fortalecendo vínculos e o desenvolvimento social no campo.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/de-maos-dadas-com-o-campo.png', 9, true),

  ('eco-vida-plantar', 'Eco Vida Plantar', 'ambiental', 'Ambiental', 'ONG Eco Vida',
   'Projeto de reflorestamento e educação ambiental, plantando mudas nativas e conscientizando comunidades.',
   '["Licenciamento Ambiental","Capacitação","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/eco-vida-plantar.png', 10, true),

  ('empodera-elas-para', 'Empodera Elas Pará', 'feminino', 'Feminino', 'Coletivo de Mulheres Rurais',
   'Programa de empoderamento e autonomia econômica de mulheres rurais, com formação e acesso a mercados.',
   '["Elaboração de Projeto","Capacitação","Captação de Recursos"]'::jsonb,
   '/assets/logos/projetos/empodera-elas-para.png', 11, true),

  ('expandindo-criacao-de-abelhas', 'Expandindo a Criação de Abelhas', 'familiar', 'Agricultura Familiar', 'Associação de Apicultores',
   'Estruturação e ampliação da apicultura familiar, com manejo sustentável e valorização do mel amazônico.',
   '["Elaboração de Projeto","Consultoria Técnica","Captação de Recursos"]'::jsonb,
   '/assets/logos/projetos/expandindo-criacao-de-abelhas.png', 12, true),

  ('iaca', 'Iaçá', 'cultural', 'Cultural', 'Coletivo Cultural Amazônico',
   'Projeto de valorização das tradições e da cultura ribeirinha amazônica, fortalecendo a identidade local.',
   '["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"]'::jsonb,
   '/assets/logos/projetos/iaça.png', 13, true),

  ('ilhas-marajoara-acai-farinha-cuia', 'Ilhas Marajoara — Açaí, Farinha e Cuia', 'familiar', 'Agricultura Familiar', 'Cooperativa do Marajó',
   'Fortalecimento das cadeias produtivas do açaí, farinha e cuia nas ilhas do Marajó, agregando valor à produção tradicional.',
   '["Elaboração de Projeto","Consultoria Técnica","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/ilhas-marajoara-acai-farinha-cuia.png', 14, true),

  ('maos-de-mulheres', 'Mãos de Mulheres', 'feminino', 'Feminino', 'Associação de Mulheres Artesãs',
   'Programa de geração de renda e empoderamento feminino por meio do artesanato e do trabalho coletivo.',
   '["Capacitação","Elaboração de Projeto","Captação de Recursos"]'::jsonb,
   '/assets/logos/projetos/maos-de-mulheres.png', 15, true),

  ('plantando-esperanca', 'Plantando Esperança', 'social', 'Projeto Social', 'Fundação Comunitária',
   'Iniciativa de inclusão social e segurança alimentar por meio de hortas comunitárias e capacitação.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/plantando-esperanca.png', 16, true),

  ('projeto-eco-inovar', 'Projeto Eco Inovar', 'ambiental', 'Ambiental', 'Secretaria de Meio Ambiente',
   'Iniciativa de inovação ambiental e bioeconomia, valorizando cadeias produtivas sustentáveis da floresta.',
   '["Elaboração de Projeto","Licenciamento Ambiental","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/projeto-eco-inovar.png', 17, true),

  ('projeto-gerando-sonhos', 'Projeto Gerando Sonhos', 'social', 'Projeto Social', 'Fundação Gerardo Soares',
   'Construindo futuros com oportunidades, por meio de formação, empreendedorismo e inclusão produtiva.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/projeto-gerando-sonhos.png', 18, true),

  ('projeto-renda-para', 'Projeto Renda Pará', 'familiar', 'Agricultura Familiar', 'Governo do Estado do Pará',
   'Iniciativa de geração de renda no campo, estruturando cadeias produtivas da agricultura familiar paraense.',
   '["Consultoria PRONAF","Captação de Recursos","Gestão de Projetos"]'::jsonb,
   '/assets/logos/projetos/projeto-renda-para.png', 19, true)
on conflict (slug) do nothing;
