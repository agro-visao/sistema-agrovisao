-- Migration 0002: Dados iniciais (produtos + projetos)
-- Preços em centavos (R$ 35,00 = 3500).

INSERT INTO products (slug, name, description, image_url, price_cents, compare_price_cents, whatsapp_text, sort_order)
VALUES
  ('acai-premium', 'Açaí Premium',
   'Muda com 6 meses de desenvolvimento, pronta para o plantio em solo previamente preparado.',
   'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=500&q=88&fm=jpg&fit=crop',
   3500, 4500,
   'Olá! Tenho interesse em comprar Açaí Premium. Gostaria de receber mais informações.',
   1),

  ('acai-vigorosa', 'Açaí Vigorosa',
   'Variedade selecionada para alta produtividade. Sistema radicular bem desenvolvido e resistente.',
   'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=500&q=88&fm=jpg&fit=crop&crop=entropy&cs=tinysrgb',
   4000, NULL,
   'Olá! Tenho interesse em comprar Açaí Vigorosa. Gostaria de receber mais informações.',
   2),

  ('acai-selecionada', 'Açaí Selecionada',
   'Genética privilegiada com potencial de produção aumentado. Ideal para cultivo em sistemas agroecológicos.',
   'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=500&q=88&fm=jpg&fit=crop&crop=edges',
   3800, NULL,
   'Olá! Tenho interesse em comprar Açaí Selecionada. Gostaria de receber mais informações.',
   3),

  ('acai-paisagismo', 'Açaí Paisagismo',
   'Muda ornamental com forma equilibrada. Perfeita para projetos de paisagismo sustentável e biodiversidade.',
   'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=500&q=88&fm=jpg&fit=crop&crop=north',
   3200, NULL,
   'Olá! Tenho interesse em comprar Açaí Paisagismo. Gostaria de receber mais informações.',
   4),

  ('acai-concentrada', 'Açaí Concentrada',
   'Variedade anã com maior densidade de frutos por metro. Ideal para cultivo em pequenas áreas com alta produção.',
   'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=500&q=88&fm=jpg&fit=crop&crop=south',
   4200, NULL,
   'Olá! Tenho interesse em comprar Açaí Concentrada. Gostaria de receber mais informações.',
   5);

INSERT INTO projects (slug, name, category, category_label, institution, description, services, logo_url, sort_order)
VALUES
  ('acai-amazonico', 'Açaí Amazônico', 'familiar', 'Agricultura Familiar',
   'Cooperativa de Açaicultores',
   'Fortalecimento da cadeia produtiva do açaí, agregando valor à produção e ampliando o acesso ao mercado.',
   '["Elaboração de Projeto","Captação de Recursos","Consultoria Técnica"]',
   './assets/logos/projetos/acai-amazonico.png', 1),

  ('agricultura-para-todos', 'Agricultura Para Todos', 'familiar', 'Agricultura Familiar',
   'Sindicato dos Trabalhadores Rurais',
   'Programa de fortalecimento da agricultura familiar, ampliando acesso a crédito, mercado e assistência técnica.',
   '["Consultoria PRONAF","Elaboração de Projeto","Capacitação"]',
   './assets/logos/projetos/agricultura-para-todos.png', 2),

  ('amazonia-viva', 'Amazônia Viva', 'ambiental', 'Ambiental',
   'Instituto Ambiental da Amazônia',
   'Iniciativa de conservação e uso sustentável dos recursos naturais da floresta amazônica.',
   '["Licenciamento Ambiental","Consultoria Técnica","Gestão de Projetos"]',
   './assets/logos/projetos/amazonia-viva.png', 3),

  ('aurora-sustentavel', 'Aurora Sustentável', 'ambiental', 'Ambiental',
   'Cooperativa Agroecológica',
   'Projeto de transição agroecológica e produção sustentável, alinhando produtividade à conservação ambiental.',
   '["Licenciamento Ambiental","Consultoria Técnica","Captação de Recursos"]',
   './assets/logos/projetos/aurora-sustentavel.png', 4),

  ('casa-de-farinha', 'Casa de Farinha', 'familiar', 'Agricultura Familiar',
   'Associação de Produtores Rurais',
   'Estruturação de unidade comunitária de processamento de mandioca, fortalecendo a geração de renda das famílias.',
   '["Elaboração de Projeto","Captação de Recursos","Gestão de Projetos"]',
   './assets/logos/projetos/casa-de-farinha.png', 5),

  ('casa-de-farinha-2', 'Casa de Farinha II', 'familiar', 'Agricultura Familiar',
   'Cooperativa Comunitária',
   'Ampliação da capacidade produtiva de farinheiras comunitárias, com modernização de equipamentos e processos.',
   '["Diagnóstico","Elaboração de Projeto","Captação de Recursos"]',
   './assets/logos/projetos/casa-de-farinha-2.png', 6),

  ('cotijuba-mais-verde', 'Cotijuba Mais Verde', 'ambiental', 'Ambiental',
   'Associação de Moradores da Ilha',
   'Projeto de recuperação ambiental e arborização da Ilha de Cotijuba, promovendo sustentabilidade insular.',
   '["Licenciamento Ambiental","Diagnóstico","Capacitação"]',
   './assets/logos/projetos/cotijuba-mais-verde.png', 7),

  ('cultura-pela-paz', 'Cultura Pela Paz', 'cultural', 'Cultural',
   'Secretaria de Cultura',
   'Programa de difusão cultural e promoção da cidadania por meio da arte, música e expressões da identidade amazônica.',
   '["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"]',
   './assets/logos/projetos/cultura-pela-paz.png', 8),

  ('de-maos-dadas-com-o-campo', 'De Mãos Dadas com o Campo', 'social', 'Projeto Social',
   'Movimento Rural Comunitário',
   'Ações integradas de apoio às comunidades rurais, fortalecendo vínculos e o desenvolvimento social no campo.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]',
   './assets/logos/projetos/de-maos-dadas-com-o-campo.png', 9),

  ('eco-vida-plantar', 'Eco Vida Plantar', 'ambiental', 'Ambiental',
   'ONG Eco Vida',
   'Projeto de reflorestamento e educação ambiental, plantando mudas nativas e conscientizando comunidades.',
   '["Licenciamento Ambiental","Capacitação","Gestão de Projetos"]',
   './assets/logos/projetos/eco-vida-plantar.png', 10),

  ('empodera-elas-para', 'Empodera Elas Pará', 'feminino', 'Feminino',
   'Coletivo de Mulheres Rurais',
   'Programa de empoderamento e autonomia econômica de mulheres rurais, com formação e acesso a mercados.',
   '["Elaboração de Projeto","Capacitação","Captação de Recursos"]',
   './assets/logos/projetos/empodera-elas-para.png', 11),

  ('expandindo-criacao-de-abelhas', 'Expandindo a Criação de Abelhas', 'familiar', 'Agricultura Familiar',
   'Associação de Apicultores',
   'Estruturação e ampliação da apicultura familiar, com manejo sustentável e valorização do mel amazônico.',
   '["Elaboração de Projeto","Consultoria Técnica","Captação de Recursos"]',
   './assets/logos/projetos/expandindo-criacao-de-abelhas.png', 12),

  ('iaca', 'Iaçá', 'cultural', 'Cultural',
   'Coletivo Cultural Amazônico',
   'Projeto de valorização das tradições e da cultura ribeirinha amazônica, fortalecendo a identidade local.',
   '["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"]',
   './assets/logos/projetos/iaça.png', 13),

  ('ilhas-marajoara', 'Ilhas Marajoara — Açaí, Farinha e Cuia', 'familiar', 'Agricultura Familiar',
   'Cooperativa do Marajó',
   'Fortalecimento das cadeias produtivas do açaí, farinha e cuia nas ilhas do Marajó, agregando valor à produção tradicional.',
   '["Elaboração de Projeto","Consultoria Técnica","Gestão de Projetos"]',
   './assets/logos/projetos/ilhas-marajoara-acai-farinha-cuia.png', 14),

  ('maos-de-mulheres', 'Mãos de Mulheres', 'feminino', 'Feminino',
   'Associação de Mulheres Artesãs',
   'Programa de geração de renda e empoderamento feminino por meio do artesanato e do trabalho coletivo.',
   '["Capacitação","Elaboração de Projeto","Captação de Recursos"]',
   './assets/logos/projetos/maos-de-mulheres.png', 15),

  ('plantando-esperanca', 'Plantando Esperança', 'social', 'Projeto Social',
   'Fundação Comunitária',
   'Iniciativa de inclusão social e segurança alimentar por meio de hortas comunitárias e capacitação.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]',
   './assets/logos/projetos/plantando-esperanca.png', 16),

  ('projeto-eco-inovar', 'Projeto Eco Inovar', 'ambiental', 'Ambiental',
   'Secretaria de Meio Ambiente',
   'Iniciativa de inovação ambiental e bioeconomia, valorizando cadeias produtivas sustentáveis da floresta.',
   '["Elaboração de Projeto","Licenciamento Ambiental","Gestão de Projetos"]',
   './assets/logos/projetos/projeto-eco-inovar.png', 17),

  ('projeto-gerando-sonhos', 'Projeto Gerando Sonhos', 'social', 'Projeto Social',
   'Fundação Gerardo Soares',
   'Construindo futuros com oportunidades, por meio de formação, empreendedorismo e inclusão produtiva.',
   '["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"]',
   './assets/logos/projetos/projeto-gerando-sonhos.png', 18),

  ('projeto-renda-para', 'Projeto Renda Pará', 'familiar', 'Agricultura Familiar',
   'Governo do Estado do Pará',
   'Iniciativa de geração de renda no campo, estruturando cadeias produtivas da agricultura familiar paraense.',
   '["Consultoria PRONAF","Captação de Recursos","Gestão de Projetos"]',
   './assets/logos/projetos/projeto-renda-para.png', 19);
