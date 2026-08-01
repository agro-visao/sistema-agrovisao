export interface ProductTechnicalInfo {
  especie?: string
  nomeCientifico?: string
  tamanho?: string
  quantidade?: string
  solos?: string
  clima?: string
  inicioProducao?: string
  aplicacao?: string
  certificacao?: string
  prazoPostagem?: string
}

export interface Product {
  id: number
  slug: string
  name: string
  description: string
  descriptionFull?: string
  category: string
  categoryLabel: string
  image: string
  gallery: string[]
  originalPrice: number | null
  price: number
  stock: number
  featured: boolean
  technicalInfo?: ProductTechnicalInfo
  whatsappText: string
}

const FORMATTED_PRICES = [
  { slug: 'acai-premium', price: 3500, compare: 4500 },
  { slug: 'acai-vigorosa', price: 4000, compare: null },
  { slug: 'acai-selecionada', price: 3800, compare: null },
  { slug: 'acai-paisagismo', price: 3200, compare: null },
  { slug: 'acai-concentrada', price: 4200, compare: null },
]

function priceFor(slug: string): { price: number; originalPrice: number | null } {
  const found = FORMATTED_PRICES.find((p) => p.slug === slug)
  if (found) return { price: found.price, originalPrice: found.compare }
  return { price: 3500, originalPrice: null }
}

const IMAGE_BASE = 'https://images.unsplash.com/photo-1464226184081-280282a34a4d?w=600&q=88&fm=jpg&fit=crop'

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: 'acai-premium',
    name: 'Açaí Premium',
    description: 'Muda com 6 meses de desenvolvimento, pronta para o plantio em solo previamente preparado.',
    descriptionFull:
      'Muda de açaí da variedade Premium, selecionada por seu alto vigor vegetativo e sanidade fitossanitária. Com 6 meses de desenvolvimento em viveiro telado, apresenta sistema radicular bem formado e parte aérea robusta, garantindo alto pegamento no transplantio. Recomendada para plantios comerciais e sistemas agroflorestais.',
    category: 'mudas',
    categoryLabel: 'Mudas',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    ...priceFor('acai-premium'),
    stock: 58,
    featured: true,
    technicalInfo: {
      especie: 'Euterpe oleracea',
      nomeCientifico: 'Euterpe oleracea Mart.',
      tamanho: '40–60 cm',
      quantidade: 'Muda unitária',
      solos: 'Argiloso, areno-argiloso, rico em matéria orgânica',
      clima: 'Equatorial úmido, tropical',
      inicioProducao: '3–4 anos',
      aplicacao: 'Plantio comercial, SAFs, recuperação de áreas',
      certificacao: 'Mudas fiscalizadas — ADA/PA',
      prazoPostagem: '5 a 10 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar Açaí Premium. Gostaria de receber mais informações.',
  },
  {
    id: 2,
    slug: 'acai-vigorosa',
    name: 'Açaí Vigorosa',
    description: 'Variedade selecionada para alta produtividade. Sistema radicular bem desenvolvido e resistente.',
    descriptionFull:
      'A variedade Vigorosa é fruto de seleção genética voltada para máxima produtividade de frutos por planta. Suas mudas apresentam sistema radicular agressivo, que proporciona rápida adaptação a diferentes condições de solo e clima. Ideal para o produtor que busca alta rentabilidade por hectare.',
    category: 'mudas',
    categoryLabel: 'Mudas',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    ...priceFor('acai-vigorosa'),
    stock: 35,
    featured: true,
    technicalInfo: {
      especie: 'Euterpe oleracea',
      nomeCientifico: 'Euterpe oleracea Mart.',
      tamanho: '50–70 cm',
      quantidade: 'Muda unitária',
      solos: 'Latossolo, argissolo, várzea drenada',
      clima: 'Tropical úmido',
      inicioProducao: '3 anos',
      aplicacao: 'Plantio comercial adensado',
      certificacao: 'Mudas fiscalizadas — ADA/PA',
      prazoPostagem: '5 a 10 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar Açaí Vigorosa. Gostaria de receber mais informações.',
  },
  {
    id: 3,
    slug: 'acai-selecionada',
    name: 'Açaí Selecionada',
    description: 'Genética privilegiada com potencial de produção aumentado. Ideal para sistemas agroecológicos.',
    descriptionFull:
      'Muda de açaí oriunda de matrizes certificadas com potencial produtivo superior à média. Sua genética privilegiada confere resistência a pragas e doenças, além de frutos com polpa mais espessa e sabor acentuado. Excelente escolha para o cultivo em sistemas agroecológicos e de base familiar.',
    category: 'mudas',
    categoryLabel: 'Mudas',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    ...priceFor('acai-selecionada'),
    stock: 42,
    featured: false,
    technicalInfo: {
      especie: 'Euterpe oleracea',
      nomeCientifico: 'Euterpe oleracea Mart.',
      tamanho: '45–65 cm',
      quantidade: 'Muda unitária',
      solos: 'Bem drenados, férteis, com bom teor de matéria orgânica',
      clima: 'Equatorial, tropical',
      inicioProducao: '3–4 anos',
      aplicacao: 'Agroecologia, agricultura familiar',
      certificacao: 'Mudas fiscalizadas — ADA/PA',
      prazoPostagem: '5 a 10 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar Açaí Selecionada. Gostaria de receber mais informações.',
  },
  {
    id: 4,
    slug: 'acai-paisagismo',
    name: 'Açaí Paisagismo',
    description: 'Muda ornamental com forma equilibrada. Perfeita para paisagismo sustentável.',
    descriptionFull:
      'Muda de açaí com características ornamentais selecionadas — porte equilibrado, estipe elegante e folhagem densa. Ideal para projetos de paisagismo residencial, condomínios e espaços corporativos que busquem integrar elementos da flora amazônica com sofisticação e baixa manutenção.',
    category: 'mudas',
    categoryLabel: 'Mudas',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    ...priceFor('acai-paisagismo'),
    stock: 20,
    featured: false,
    technicalInfo: {
      especie: 'Euterpe oleracea',
      nomeCientifico: 'Euterpe oleracea Mart.',
      tamanho: '60–90 cm',
      quantidade: 'Muda unitária',
      solos: 'Fértil, bem drenado, enriquecido com matéria orgânica',
      clima: 'Tropical, equatorial',
      inicioProducao: '4 anos',
      aplicacao: 'Paisagismo, áreas externas, condomínios',
      certificacao: 'Mudas fiscalizadas — ADA/PA',
      prazoPostagem: '5 a 10 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar Açaí Paisagismo. Gostaria de receber mais informações.',
  },
  {
    id: 5,
    slug: 'acai-concentrada',
    name: 'Açaí Concentrada',
    description: 'Variedade anã com maior densidade de frutos. Ideal para pequenas áreas.',
    descriptionFull:
      'Variedade de açaí de porte baixo que permite maior densidade de plantio por hectare, com produção precoce e frutos de qualidade superior. Desenvolvida especialmente para pequenas propriedades e áreas com limitação de espaço, sem comprometer a produtividade. Facilita os tratos culturais e a colheita.',
    category: 'mudas',
    categoryLabel: 'Mudas',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    ...priceFor('acai-concentrada'),
    stock: 15,
    featured: true,
    technicalInfo: {
      especie: 'Euterpe oleracea',
      nomeCientifico: 'Euterpe oleracea Mart.',
      tamanho: '30–50 cm',
      quantidade: 'Muda unitária',
      solos: 'Argiloso, arenoso com correção',
      clima: 'Tropical úmido, equatorial',
      inicioProducao: '2,5–3 anos',
      aplicacao: 'Pequenas propriedades, plantio adensado',
      certificacao: 'Mudas fiscalizadas — ADA/PA',
      prazoPostagem: '5 a 10 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar Açaí Concentrada. Gostaria de receber mais informações.',
  },
  {
    id: 6,
    slug: 'kit-adubo-organico',
    name: 'Kit Adubo Orgânico',
    description: 'Fertilizante natural enriquecido para plantio de mudas. Embalagem com 5 kg.',
    descriptionFull:
      'Kit completo de adubo orgânico certificado, formulado especialmente para o plantio de mudas de açaí e outras espécies nativas da Amazônia. Rico em nitrogênio, fósforo e potássio de origem vegetal, além de micronutrientes essenciais. Promove crescimento vigoroso e aumenta a resistência natural das plantas.',
    category: 'insumos',
    categoryLabel: 'Insumos',
    image: IMAGE_BASE,
    gallery: [IMAGE_BASE, IMAGE_BASE, IMAGE_BASE],
    price: 4500,
    originalPrice: 5500,
    stock: 100,
    featured: false,
    technicalInfo: {
      tamanho: 'Saco 5 kg',
      quantidade: '1 unidade',
      solos: 'Todos os tipos',
      aplicacao: 'Plantio e cobertura',
      certificacao: 'Certificado MAPA — Registro N 12345',
      prazoPostagem: '7 a 12 dias úteis',
    },
    whatsappText: 'Olá! Tenho interesse em comprar o Kit Adubo Orgânico. Gostaria de receber mais informações.',
  },
]

export const CATEGORIES = [
  { key: 'todos', label: 'Todos' },
  { key: 'mudas', label: 'Mudas' },
  { key: 'insumos', label: 'Insumos' },
]

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}
