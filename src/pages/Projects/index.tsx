import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

interface ProjectItem {
  slug: string
  name: string
  cat: string
  catLabel: string
  inst: string
  desc: string
  services: string[]
  logo: string
}

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'
]

const CATEGORY_ORDER: [string, string][] = [
  ['todos', 'Todos'],
  ['social', 'Projetos Sociais'],
  ['ambiental', 'Ambientais'],
  ['familiar', 'Agricultura Familiar'],
  ['feminino', 'Femininos'],
  ['cultural', 'Culturais'],
]

const FALLBACK_PROJECTS: ProjectItem[] = [
  { slug:'acai-amazonico', name:"Açaí Amazônico", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Cooperativa de Açaicultores", desc:"Fortalecimento da cadeia produtiva do açaí, agregando valor à produção e ampliando o acesso ao mercado.", services:["Elaboração de Projeto","Captação de Recursos","Consultoria Técnica"], logo:"/assets/logos/projetos/acai-amazonico.png" },
  { slug:'agricultura-para-todos', name:"Agricultura Para Todos", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Sindicato dos Trabalhadores Rurais", desc:"Programa de fortalecimento da agricultura familiar, ampliando acesso a crédito, mercado e assistência técnica.", services:["Consultoria PRONAF","Elaboração de Projeto","Capacitação"], logo:"/assets/logos/projetos/agricultura-para-todos.png" },
  { slug:'amazonia-viva', name:"Amazônia Viva", cat:'ambiental', catLabel:"Ambiental", inst:"Instituto Ambiental da Amazônia", desc:"Iniciativa de conservação e uso sustentável dos recursos naturais da floresta amazônica.", services:["Licenciamento Ambiental","Consultoria Técnica","Gestão de Projetos"], logo:"/assets/logos/projetos/amazonia-viva.png" },
  { slug:'aurora-sustentavel', name:"Aurora Sustentável", cat:'ambiental', catLabel:"Ambiental", inst:"Cooperativa Agroecológica", desc:"Projeto de transição agroecológica e produção sustentável, alinhando produtividade à conservação ambiental.", services:["Licenciamento Ambiental","Consultoria Técnica","Captação de Recursos"], logo:"/assets/logos/projetos/aurora-sustentavel.png" },
  { slug:'casa-de-farinha', name:"Casa de Farinha", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Associação de Produtores Rurais", desc:"Estruturação de unidade comunitária de processamento de mandioca, fortalecendo a geração de renda das famílias.", services:["Elaboração de Projeto","Captação de Recursos","Gestão de Projetos"], logo:"/assets/logos/projetos/casa-de-farinha.png" },
  { slug:'casa-de-farinha-2', name:"Casa de Farinha II", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Cooperativa Comunitária", desc:"Ampliação da capacidade produtiva de farinheiras comunitárias, com modernização de equipamentos e processos.", services:["Diagnóstico","Elaboração de Projeto","Captação de Recursos"], logo:"/assets/logos/projetos/casa-de-farinha-2.png" },
  { slug:'cotijuba-mais-verde', name:"Cotijuba Mais Verde", cat:'ambiental', catLabel:"Ambiental", inst:"Associação de Moradores da Ilha", desc:"Projeto de recuperação ambiental e arborização da Ilha de Cotijuba, promovendo sustentabilidade insular.", services:["Licenciamento Ambiental","Diagnóstico","Capacitação"], logo:"/assets/logos/projetos/cotijuba-mais-verde.png" },
  { slug:'cultura-pela-paz', name:"Cultura Pela Paz", cat:'cultural', catLabel:"Cultural", inst:"Secretaria de Cultura", desc:"Programa de difusão cultural e promoção da cidadania por meio da arte, música e expressões da identidade amazônica.", services:["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"], logo:"/assets/logos/projetos/cultura-pela-paz.png" },
  { slug:'de-maos-dadas-com-o-campo', name:"De Mãos Dadas com o Campo", cat:'social', catLabel:"Projeto Social", inst:"Movimento Rural Comunitário", desc:"Ações integradas de apoio às comunidades rurais, fortalecendo vínculos e o desenvolvimento social no campo.", services:["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"], logo:"/assets/logos/projetos/de-maos-dadas-com-o-campo.png" },
  { slug:'eco-vida-plantar', name:"Eco Vida Plantar", cat:'ambiental', catLabel:"Ambiental", inst:"ONG Eco Vida", desc:"Projeto de reflorestamento e educação ambiental, plantando mudas nativas e conscientizando comunidades.", services:["Licenciamento Ambiental","Capacitação","Gestão de Projetos"], logo:"/assets/logos/projetos/eco-vida-plantar.png" },
  { slug:'empodera-elas-para', name:"Empodera Elas Pará", cat:'feminino', catLabel:"Feminino", inst:"Coletivo de Mulheres Rurais", desc:"Programa de empoderamento e autonomia econômica de mulheres rurais, com formação e acesso a mercados.", services:["Elaboração de Projeto","Capacitação","Captação de Recursos"], logo:"/assets/logos/projetos/empodera-elas-para.png" },
  { slug:'expandindo-criacao-de-abelhas', name:"Expandindo a Criação de Abelhas", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Associação de Apicultores", desc:"Estruturação e ampliação da apicultura familiar, com manejo sustentável e valorização do mel amazônico.", services:["Elaboração de Projeto","Consultoria Técnica","Captação de Recursos"], logo:"/assets/logos/projetos/expandindo-criacao-de-abelhas.png" },
  { slug:'iaca', name:"Iaçá", cat:'cultural', catLabel:"Cultural", inst:"Coletivo Cultural Amazônico", desc:"Projeto de valorização das tradições e da cultura ribeirinha amazônica, fortalecendo a identidade local.", services:["Elaboração de Projeto","Captação de Recursos","Prestação de Contas"], logo:"/assets/logos/projetos/iaça.png" },
  { slug:'ilhas-marajoara-acai-farinha-cuia', name:"Ilhas Marajoara — Açaí, Farinha e Cuia", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Cooperativa do Marajó", desc:"Fortalecimento das cadeias produtivas do açaí, farinha e cuia nas ilhas do Marajó, agregando valor à produção tradicional.", services:["Elaboração de Projeto","Consultoria Técnica","Gestão de Projetos"], logo:"/assets/logos/projetos/ilhas-marajoara-acai-farinha-cuia.png" },
  { slug:'maos-de-mulheres', name:"Mãos de Mulheres", cat:'feminino', catLabel:"Feminino", inst:"Associação de Mulheres Artesãs", desc:"Programa de geração de renda e empoderamento feminino por meio do artesanato e do trabalho coletivo.", services:["Capacitação","Elaboração de Projeto","Captação de Recursos"], logo:"/assets/logos/projetos/maos-de-mulheres.png" },
  { slug:'plantando-esperanca', name:"Plantando Esperança", cat:'social', catLabel:"Projeto Social", inst:"Fundação Comunitária", desc:"Iniciativa de inclusão social e segurança alimentar por meio de hortas comunitárias e capacitação.", services:["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"], logo:"/assets/logos/projetos/plantando-esperanca.png" },
  { slug:'projeto-eco-inovar', name:"Projeto Eco Inovar", cat:'ambiental', catLabel:"Ambiental", inst:"Secretaria de Meio Ambiente", desc:"Iniciativa de inovação ambiental e bioeconomia, valorizando cadeias produtivas sustentáveis da floresta.", services:["Elaboração de Projeto","Licenciamento Ambiental","Gestão de Projetos"], logo:"/assets/logos/projetos/projeto-eco-inovar.png" },
  { slug:'projeto-gerando-sonhos', name:"Projeto Gerando Sonhos", cat:'social', catLabel:"Projeto Social", inst:"Fundação Gerardo Soares", desc:"Construindo futuros com oportunidades, por meio de formação, empreendedorismo e inclusão produtiva.", services:["Diagnóstico","Elaboração de Projeto","Gestão de Projetos"], logo:"/assets/logos/projetos/projeto-gerando-sonhos.png" },
  { slug:'projeto-renda-para', name:"Projeto Renda Pará", cat:'familiar', catLabel:"Agricultura Familiar", inst:"Governo do Estado do Pará", desc:"Iniciativa de geração de renda no campo, estruturando cadeias produtivas da agricultura familiar paraense.", services:["Consultoria PRONAF","Captação de Recursos","Gestão de Projetos"], logo:"/assets/logos/projetos/projeto-renda-para.png" },
]

async function fetchProjects(): Promise<ProjectItem[] | null> {
  try {
    const res = await fetch('/api/projects')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data && json.data.length > 0) {
      return json.data.map((p: Record<string, unknown>) => ({
        slug: p.slug as string,
        name: p.name as string,
        cat: p.category as string,
        catLabel: p.category_label as string,
        inst: p.institution as string,
        desc: p.description as string,
        services: (p.services as string[]) || [],
        logo: (p.logo_url as string) || '',
      }))
    }
  } catch (_) {}
  return null
}

function Projects() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [activeCat, setActiveCat] = useState('todos')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  useEffect(() => {
    setTimeout(() => setEntered(true), 80)
  }, [])

  useEffect(() => {
    fetchProjects().then((data) => {
      if (data) {
        setProjects(data)
      } else {
        setProjects(FALLBACK_PROJECTS)
      }
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!entered) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [entered])

  const openModal = useCallback(() => {
    setMOpen(true)
    setMSts('idle')
    setMErrs({})
  }, [])

  const closeModal = useCallback(() => {
    setMOpen(false)
  }, [])

  const submitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const errs: Record<string, string> = {}
      if (!mData.name.trim()) errs.name = 'Campo obrigatório'
      if (!mData.phone.trim()) errs.phone = 'Campo obrigatório'
      if (!mData.email.trim()) errs.email = 'Campo obrigatório'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mData.email)) errs.email = 'Email inválido'
      if (!mData.msg.trim()) errs.msg = 'Campo obrigatório'
      if (!mData.ok) errs.ok = 'Aceite a política de privacidade'
      if (Object.keys(errs).length) {
        setMErrs(errs)
        return
      }
      setMSts('sending')
      setTimeout(() => setMSts('success'), 1200)
    },
    [mData]
  )

  const ch = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = 'checked' in e.target && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setMData((prev) => ({ ...prev, [field]: val }))
    setMErrs((prev) => ({ ...prev, [field]: '' }))
  }

  const up = (d: number) => ({
    opacity: entered ? 1 : 0,
    transform: entered ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 0.9s ease ${d}s, transform 0.9s ease ${d}s`,
  })

  const filtered = projects.filter((p) => activeCat === 'todos' || p.cat === activeCat)

  const highlightProjects = [
    {
      tag: 'Projeto Social · Amazônia Legal',
      title: 'Programa de Desenvolvimento Rural Sustentável',
      desc: 'Projeto de capacitação e estruturação técnica voltado para comunidades ribeirinhas e assentamentos da Amazônia, com foco em agroecologia, regularização fundiária e acesso a políticas públicas.',
      items: ['Diagnóstico e mapeamento de 120 famílias beneficiárias', 'Regularização fundiária coletiva com emissão de títulos', 'Capacitação em agroecologia e manejo sustentável'],
      img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=900&q=88&fm=jpg&fit=crop',
      reversed: false,
    },
    {
      tag: 'Capacitação · Agricultura Familiar',
      title: 'Programa de Capacitação em Gestão Rural',
      desc: 'Formação técnica e gerencial para agricultores familiares, abrangendo desde o manejo sustentável até a comercialização e acesso aos mercados institucionais.',
      items: ['80 agricultores capacitados em 5 municípios paraenses', 'Planos de negócio individualizados elaborados', 'Articulação com mercados locais e PNAE'],
      img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=88&fm=jpg&fit=crop',
      reversed: true,
    },
    {
      tag: 'Ambiental · Licenciamento',
      title: 'Regularização Ambiental de Propriedades Rurais',
      desc: 'Levantamento, diagnóstico ambiental e regularização completa de propriedades rurais no Pará, incluindo CAR, LAR, PCARP, PRAP e Licença Ambiental junto à SEMAS-PA.',
      items: ['Inscrição no CAR e revisão de passivos ambientais', 'Licença Ambiental obtida junto à SEMAS-PA', 'Assessoria para adequação ao Novo Código Florestal'],
      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=88&fm=jpg&fit=crop',
      reversed: false,
    },
  ]

  const galleryItems = [
    { img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&q=85&fm=jpg&fit=crop', label: 'Visitas Técnicas', span: 'row-span-2' },
    { img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=85&fm=jpg&fit=crop', label: 'Capacitações', span: '' },
    { img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=85&fm=jpg&fit=crop', label: 'Proj. Agrícolas', span: '' },
    { img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=85&fm=jpg&fit=crop', label: 'Atividades Comunitárias', span: '' },
    { img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=85&fm=jpg&fit=crop', label: 'Gestão de Projetos', span: '' },
    { img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1100&q=85&fm=jpg&fit=crop', label: 'Imagens Aéreas · Drone', span: 'col-span-2' },
  ]

  const methodologySteps = [
    { num: 1, title: 'Diagnóstico', desc: 'Avaliação técnica inicial' },
    { num: 2, title: 'Planejamento', desc: 'Estratégia e objetivos' },
    { num: 3, title: 'Projeto Técnico', desc: 'Documentação completa' },
    { num: 4, title: 'Captação', desc: 'Editais e crédito rural' },
    { num: 5, title: 'Execução', desc: 'Acompanhamento técnico' },
    { num: 6, title: 'Monitoramento', desc: 'Controle de metas' },
    { num: 7, title: 'Prestação de Contas', desc: 'Relatório e regularização', check: true },
  ]

  const differentiators = [
    { title: '+100 Projetos', desc: 'Mais de cem projetos desenvolvidos com sucesso.' },
    { title: 'Especializado', desc: 'Atendimento personalizado ao perfil de cada cliente.' },
    { title: 'Multidisciplinar', desc: 'Agronomia, direito, gestão e ciências ambientais.' },
    { title: 'Amazônia Legal', desc: 'Conhecimento profundo do território e legislações regionais.', dark: true },
    { title: 'Soluções Completas', desc: 'Da elaboração ao monitoramento, projeto 100% finalizado.' },
    { title: 'Consultoria Técnica', desc: 'Orientação especializada para decisões mais assertivas.' },
    { title: 'Regularização', desc: 'Fundiária, ambiental e documental em conformidade legal.' },
    { title: 'Gestão de Projetos', desc: 'Monitoramento contínuo com relatórios e prestação de contas.' },
  ]

  return (
    <>
      <Header onOpenModal={openModal} />

      {/* HERO */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '760px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=88&fm=jpg&fit=crop"
          alt="Vista aérea projetos rurais"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, rgba(6,14,4,0.14) 0%, rgba(6,14,4,0.48) 40%, rgba(6,14,4,0.90) 100%)' }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 116px' }}>
          <div style={{ maxWidth: '880px' }}>
            <div style={up(0.4)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
                <div style={{ width: '36px', height: '1px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase' }}>Portfólio · +100 Projetos Elaborados</span>
              </div>
            </div>
            <div style={up(0.62)}>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(42px, 5.6vw, 76px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.06, letterSpacing: '-0.022em', marginBottom: '28px', textWrap: 'pretty' }}>
                Transformando Ideias em<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(36px, 4.8vw, 65px)', fontStyle: 'normal' }}>Projetos que Geram Impacto.</span>
              </h1>
            </div>
            <div style={up(0.84)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: 'rgba(246,244,239,0.80)', lineHeight: 1.80, maxWidth: '580px', marginBottom: '52px' }}>
                Mais de 100 projetos elaborados, estruturados e acompanhados para instituições públicas, privadas, organizações sociais e produtores rurais.
              </p>
            </div>
            <div style={up(1.04)}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="#projetos-logos"
                  onClick={(e) => { e.preventDefault(); document.getElementById('projetos-logos')?.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Conheça nossos Projetos
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); openModal() }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(246,244,239,0.40)', transition: 'border-color 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.75)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.40)' }}
                >
                  Falar com Especialista
                </a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, zIndex: 3, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
            <path d="M0,60 L1440,60 L1440,18 Q1080,60 720,28 Q360,0 0,28 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section style={{ background: '#FFFFFF', padding: '120px 0 100px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '72px' }} data-animate>
            <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Credenciais e Números</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid rgba(49,91,44,0.10)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }} data-animate data-d="1">
            <div style={{ padding: '52px 44px', borderRight: '1px solid rgba(49,91,44,0.10)' }}>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '76px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '10px' }}>+100</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.55, marginBottom: '14px' }}>Projetos<br />Elaborados</div>
              <div style={{ width: '24px', height: '2px', background: '#B8D48A' }} />
            </div>
            <div style={{ padding: '52px 44px', borderRight: '1px solid rgba(49,91,44,0.10)' }}>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '76px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '10px' }}>15+</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.55, marginBottom: '14px' }}>Áreas de<br />Atuação</div>
              <div style={{ width: '24px', height: '2px', background: '#B8D48A' }} />
            </div>
            <div style={{ padding: '52px 44px', borderRight: '1px solid rgba(49,91,44,0.10)' }}>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '76px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '10px' }}>∞</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.55, marginBottom: '14px' }}>Municípios<br />Atendidos</div>
              <div style={{ width: '24px', height: '2px', background: '#B8D48A' }} />
            </div>
            <div style={{ padding: '52px 44px', background: '#315B2C' }}>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '76px', fontWeight: 300, color: '#F6F4EF', lineHeight: 1, marginBottom: '10px' }}>10+</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.55, marginBottom: '14px' }}>Anos de<br />Experiência</div>
              <div style={{ width: '24px', height: '2px', background: 'rgba(184,212,138,0.5)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 40px', background: '#F5F8F3', borderRadius: '14px', border: '1px solid rgba(49,91,44,0.08)', flexWrap: 'wrap', gap: '24px' }} data-animate data-d="2">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#315B2C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="#F6F4EF" strokeWidth="1.3" fill="none" /><path d="M6 7H14M6 10H11" stroke="#F6F4EF" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Empresa Registrada</div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '18px', fontWeight: 400, color: '#1a1a18', letterSpacing: '0.04em' }}>CNPJ: 55.818.360/0001-33</div>
              </div>
            </div>
            <div style={{ width: '1px', height: '44px', background: 'rgba(49,91,44,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.5" fill="none" /><circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none" /><circle cx="17.5" cy="6.5" r="1" fill="white" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Instagram Oficial</div>
                <a href="https://www.instagram.com/visaogestaodeprojetos/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Barlow', sans-serif", fontSize: '18px', fontWeight: 400, color: '#1a1a18', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#315B2C' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#1a1a18' }}>@visaogestaodeprojetos</a>
              </div>
            </div>
            <div style={{ width: '1px', height: '44px', background: 'rgba(49,91,44,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#25D366', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Consultoria Técnica</div>
                <a href="https://api.whatsapp.com/send?phone=5591982064340" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Barlow', sans-serif", fontSize: '18px', fontWeight: 400, color: '#1a1a18', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#315B2C' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#1a1a18' }}>(91) 98206-4340</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL */}
      <section style={{ background: '#F5F8F3', padding: '140px 0', borderTop: '1px solid rgba(49,91,44,0.07)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '104px', alignItems: 'center' }}>
            <div data-animate>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
                <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Nossa Experiência</span>
              </div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(36px, 3.8vw, 54px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '26px', textWrap: 'pretty' }}>
                Do planejamento<br />à execução<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(31px, 3.3vw, 46px)', color: '#315B2C', fontStyle: 'normal' }}>completa</span>.
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.9, marginBottom: '44px', maxWidth: '460px' }}>
                A AgroVisão desenvolve projetos integrais — do diagnóstico inicial até a prestação de contas final — garantindo resultados sustentáveis e alinhados às exigências legais.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { num: '1', title: 'Planejamento e Diagnóstico', desc: 'Avaliação técnica do contexto e desenho da estratégia ideal.' },
                  { num: '2', title: 'Elaboração Técnica', desc: 'Desenvolvimento do projeto completo com memorial, planilhas e documentação.' },
                  { num: '3', title: 'Captação de Recursos', desc: 'Identificação e submissão a editais, fundos e linhas de crédito.' },
                  { num: '4', title: 'Gestão e Execução', desc: 'Acompanhamento completo com relatórios periódicos e controle de metas.' },
                  { num: '5', title: 'Prestação de Contas', desc: 'Documentação contábil, relatórios finais e regularização junto aos financiadores.' },
                ].map((s) => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', padding: '18px 0', borderBottom: s.num === '5' ? 'none' : '1px solid rgba(49,91,44,0.09)' }}>
                    <div style={{ width: '30px', height: '30px', border: '1.5px solid #315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '13px', fontWeight: 500, color: '#315B2C' }}>{s.num}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 700, color: '#315B2C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{s.title}</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400, color: '#666660', lineHeight: 1.7 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }} data-animate data-d="2">
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', borderRadius: '16px', boxShadow: '0 28px 80px rgba(0,0,0,0.15)' }}>
                <img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=900&q=88&fm=jpg&fit=crop" alt="Equipe em campo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '-28px', left: '-28px', background: '#315B2C', borderRadius: '14px', padding: '24px 30px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '40px', fontWeight: 300, color: '#F6F4EF', lineHeight: 1, marginBottom: '6px' }}>100<span style={{ fontSize: '22px', color: '#B8D48A' }}>+</span></div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Projetos Aprovados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ background: '#FFFFFF', padding: '140px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Áreas de Atuação</span>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(38px, 4.2vw, 58px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '18px' }}>Categorias de Projetos</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#666660', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>Atuamos em múltiplas frentes do desenvolvimento sustentável, social e econômico para a Amazônia Legal.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }} data-animate data-d="1">
            {[
              { icon: '<path d="M3 20C3 20 7 13 13 11C19 13 23 20 23 20" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" fill="none"></path><path d="M13 20V7" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path><circle cx="13" cy="5" r="1.8" fill="#6F8F3A"></circle>', title: 'Projetos Agropecuários' },
              { icon: '<path d="M6 24C6 19.029 10.029 15 15 15C15 10.029 19.029 6 24 6" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" fill="none"></path><path d="M2 20C2 11.163 9.163 4 18 4" stroke="#6F8F3A" stroke-width="1" stroke-linecap="round" opacity="0.5"></path>', title: 'Projetos Ambientais' },
              { icon: '<circle cx="9" cy="8" r="3.5" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><circle cx="17" cy="8" r="3.5" stroke="#6F8F3A" stroke-width="1" fill="none"></circle><path d="M3 21C3 17.686 5.686 15 9 15H13" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path><path d="M19 15C21.209 15 23 16.791 23 19V21" stroke="#6F8F3A" stroke-width="1" stroke-linecap="round"></path>', title: 'Projetos Sociais' },
              { icon: '<path d="M13 3L4 12H22L13 3Z" stroke="#315B2C" stroke-width="1.3" fill="none"></path><rect x="7" y="12" width="12" height="11" rx="1" stroke="#315B2C" stroke-width="1.3" fill="none"></rect>', title: 'Projetos Culturais' },
              { icon: '<path d="M13 3L15 9H21L16 13L18 19L13 15L8 19L10 13L5 9H11L13 3Z" stroke="#315B2C" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>', title: 'Projetos Esportivos' },
              { dark: true, icon: '<circle cx="13" cy="10" r="4" stroke="#F6F4EF" stroke-width="1.3" fill="none"></circle><path d="M13 14V22M9 21H17" stroke="#F6F4EF" stroke-width="1.3" stroke-linecap="round"></path>', title: 'Projetos para Mulheres' },
              { icon: '<rect x="4" y="13" width="4" height="9" rx="1" stroke="#315B2C" stroke-width="1.3" fill="none"></rect><rect x="11" y="8" width="4" height="14" rx="1" stroke="#315B2C" stroke-width="1.3" fill="none"></rect><rect x="18" y="4" width="4" height="18" rx="1" stroke="#315B2C" stroke-width="1.3" fill="none"></rect>', title: 'Agricultura Familiar' },
              { icon: '<path d="M5 23V10C5 9.448 5.448 9 6 9H20C20.552 9 21 9.448 21 10V23" stroke="#315B2C" stroke-width="1.3" fill="none"></path><path d="M13 9V4" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path><circle cx="13" cy="3.5" r="1.5" fill="#6F8F3A"></circle><path d="M3 23H23" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path>', title: 'Capacitações' },
              { icon: '<circle cx="13" cy="13" r="8" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><path d="M9 13C9 10.791 10.791 9 13 9C15.209 9 17 10.791 17 13" stroke="#6F8F3A" stroke-width="1" fill="none" stroke-linecap="round"></path><circle cx="13" cy="13" r="2" fill="#315B2C" opacity="0.4"></circle>', title: 'Bioeconomia' },
              { icon: '<path d="M13 3L3 9V23H9V15H17V23H23V9L13 3Z" stroke="#315B2C" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>', title: 'Desenv. Sustentável' },
            ].map((cat, idx) => (
              <div key={idx} style={{ background: (cat as { dark?: boolean }).dark ? '#315B2C' : '#FFFFFF', border: `1px solid ${(cat as { dark?: boolean }).dark ? '#315B2C' : 'rgba(49,91,44,0.12)'}`, borderRadius: '14px', padding: '30px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '52px', height: '52px', background: (cat as { dark?: boolean }).dark ? 'rgba(246,244,239,0.12)' : 'rgba(49,91,44,0.07)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '17px', fontWeight: 500, color: (cat as { dark?: boolean }).dark ? '#F6F4EF' : '#1a1a18', lineHeight: 1.3, marginBottom: '8px' }}>{cat.title}</h3>
                <div style={{ width: '18px', height: '2px', background: '#B8D48A', margin: '0 auto' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section style={{ background: '#F5F8F3', padding: '140px 0', borderTop: '1px solid rgba(49,91,44,0.07)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '80px' }} data-animate>
            <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Projetos em Destaque</span>
          </div>
          {highlightProjects.map((h, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: idx < highlightProjects.length - 1 ? '120px' : '0' }} data-animate>
              {!h.reversed ? (
                <>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '16px', boxShadow: '0 24px 72px rgba(0,0,0,0.13)' }}>
                    <img src={h.img} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }} />
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 700, color: '#315B2C', letterSpacing: '0.22em', textTransform: 'uppercase', background: 'rgba(49,91,44,0.08)', padding: '6px 14px', borderRadius: '4px', marginBottom: '26px' }}>{h.tag}</span>
                    <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(30px, 3.2vw, 44px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: '18px', textWrap: 'pretty' }}>{h.title}</h2>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.85, marginBottom: '28px' }}>{h.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                      {h.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M2 8L6 12L14 4" stroke="#315B2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 400, color: '#555550', lineHeight: 1.65 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); openModal() }}
                      style={{ display: 'inline-block', padding: '13px 32px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                    >
                      Solicitar Projeto Similar
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ display: 'inline-block', fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 700, color: '#315B2C', letterSpacing: '0.22em', textTransform: 'uppercase', background: 'rgba(49,91,44,0.08)', padding: '6px 14px', borderRadius: '4px', marginBottom: '26px' }}>{h.tag}</span>
                    <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(30px, 3.2vw, 44px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: '18px', textWrap: 'pretty' }}>{h.title}</h2>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.85, marginBottom: '28px' }}>{h.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                      {h.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M2 8L6 12L14 4" stroke="#315B2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 400, color: '#555550', lineHeight: 1.65 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); openModal() }}
                      style={{ display: 'inline-block', padding: '13px 32px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                    >
                      Solicitar Projeto Similar
                    </a>
                  </div>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '16px', boxShadow: '0 24px 72px rgba(0,0,0,0.13)' }}>
                    <img src={h.img} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FILTERABLE PROJECTS */}
      <section id="projetos-logos" style={{ background: '#FFFFFF', padding: '140px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Portfólio Institucional</span>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(38px, 4.2vw, 58px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '18px' }}>Projetos Desenvolvidos</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#666660', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>Filtre por categoria e clique em um projeto para conhecer os detalhes. Mais de vinte iniciativas realizadas na Amazônia Legal.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '44px' }} data-animate data-d="1">
            {CATEGORY_ORDER.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCat(key)}
                style={{
                  padding: '10px 22px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: activeCat === key ? 700 : 500,
                  color: activeCat === key ? '#F6F4EF' : '#315B2C',
                  background: activeCat === key ? '#315B2C' : 'transparent',
                  border: activeCat === key ? '1px solid #315B2C' : '1px solid rgba(49,91,44,0.2)',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (activeCat !== key) { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.5)'; e.currentTarget.style.background = 'rgba(49,91,44,0.04)' } }}
                onMouseLeave={(e) => { if (activeCat !== key) { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.2)'; e.currentTarget.style.background = 'transparent' } }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }} data-animate data-d="2">
            {loaded ? (
              filtered.length > 0 ? (
                filtered.map((p) => (
                  <div
                    key={p.slug}
                    onClick={() => navigate(`/projetos/${encodeURIComponent(p.slug)}`)}
                    style={{ background: '#FFFFFF', border: '1px solid rgba(49,91,44,0.10)', borderRadius: '12px', padding: '22px 16px', minHeight: '160px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.25s, transform 0.25s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(49,91,44,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} style={{ maxWidth: '100%', maxHeight: '60px', width: 'auto', objectFit: 'contain', display: 'block' }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', background: '#F5F8F3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#315B2C" strokeWidth="1.3" fill="none" /><path d="M9 12L12 15L20 7" stroke="#315B2C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: '#1a1a18', lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>{p.catLabel}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#888882' }}>Nenhum projeto encontrado nesta categoria.</p>
                </div>
              )
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '2px solid rgba(49,91,44,0.15)', borderTopColor: '#315B2C', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#888882' }}>Carregando projetos...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FIELD GALLERY */}
      <section style={{ background: '#F5F8F3', padding: '140px 0', borderTop: '1px solid rgba(49,91,44,0.07)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '56px' }} data-animate>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Atividades de Campo</span>
              </div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(38px, 4.2vw, 56px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em' }}>Projetos em Ação</h2>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#666660', lineHeight: 1.8, maxWidth: '340px', marginBottom: '6px' }}>Visitas técnicas, capacitações, construções e atividades comunitárias desenvolvidas em campo pela equipe AgroVisão.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto', gap: '12px' }} data-animate data-d="1">
            {galleryItems.map((g, idx) => {
              const spans: Record<string, React.CSSProperties> = {
                'row-span-2': { gridRow: 'span 2' },
                'col-span-2': { gridColumn: 'span 2' },
              }
              return (
                <div
                  key={idx}
                  style={{ overflow: 'hidden', borderRadius: '12px', position: 'relative', cursor: 'pointer', ...(spans[g.span] || {}) }}
                  onMouseEnter={(e) => { const img = e.currentTarget.querySelector('img'); if (img) img.style.transform = 'scale(1.05)' }}
                  onMouseLeave={(e) => { const img = e.currentTarget.querySelector('img'); if (img) img.style.transform = 'scale(1)' }}
                >
                  <img src={g.img} alt={g.label} style={{ width: '100%', height: g.span === 'row-span-2' ? '480px' : '230px', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(6,14,4,0.4) 0%, rgba(6,14,4,0.05) 60%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '18px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#F6F4EF', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{g.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section style={{ background: '#131E11', padding: '128px 0', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{ width: '34px', height: '1px', background: '#B8D48A' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Nossa Metodologia</span>
              <div style={{ width: '34px', height: '1px', background: '#B8D48A' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.1, letterSpacing: '-0.018em' }}>
              Como desenvolvemos<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(31px, 3.6vw, 48px)', color: '#B8D48A', fontStyle: 'normal' }}>cada projeto</span>
            </h2>
          </div>
          <div style={{ position: 'relative' }} data-animate data-d="1">
            <div style={{ position: 'absolute', top: '27px', left: '40px', right: '40px', height: '1px', background: 'rgba(184,212,138,0.22)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, position: 'relative' }}>
              {methodologySteps.map((step) => (
                <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 8px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    background: step.num === 1 || step.num === 4 || step.num === 7 ? (step.num === 1 ? '#315B2C' : '#6F8F3A') : '#1e3219',
                    border: `2px solid ${step.num === 1 || step.num === 4 || step.num === 7 ? '#B8D48A' : 'rgba(184,212,138,0.45)'}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '22px',
                    position: 'relative',
                    zIndex: 1,
                    flexShrink: 0,
                  }}>
                    {step.check ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10L8 15L17 5" stroke="#F6F4EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '20px', fontWeight: 400, color: '#F6F4EF' }}>{step.num}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 700, color: '#B8D48A', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>{step.title}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 400, color: 'rgba(246,244,239,0.55)', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY AGROVISÃO */}
      <section style={{ background: '#FFFFFF', padding: '140px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', alignItems: 'center' }}>
            <div data-animate>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
                <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Diferenciais</span>
              </div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(36px, 3.8vw, 52px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '26px', textWrap: 'pretty' }}>
                Por que escolher<br />a <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(31px, 3.3vw, 44px)', color: '#315B2C', fontStyle: 'normal' }}>AgroVisão</span>?
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.9, marginBottom: '44px', maxWidth: '420px' }}>Equipe multidisciplinar com profundo conhecimento do território amazônico, das políticas públicas e das exigências legais vigentes.</p>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal() }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 36px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
              >
                Solicitar Consultoria
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }} data-animate data-d="2">
              {differentiators.map((d, idx) => (
                <div key={idx} style={{ padding: '26px 22px', background: d.dark ? '#315B2C' : '#FAFAF8', border: `1px solid ${d.dark ? '#315B2C' : 'rgba(49,91,44,0.08)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8L6 12L14 4" stroke={d.dark ? '#B8D48A' : '#315B2C'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, color: d.dark ? '#F6F4EF' : '#1a1a18', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{d.title}</h4>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400, color: d.dark ? 'rgba(246,244,239,0.75)' : '#666660', lineHeight: 1.65 }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#F5F8F3', padding: '148px 0', borderTop: '1px solid rgba(49,91,44,0.07)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 84px', textAlign: 'center' }} data-animate>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
            <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Vamos Conversar</span>
            <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
          </div>
          <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(40px, 4.8vw, 66px)', fontWeight: 300, color: '#1a1a18', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '22px', textWrap: 'pretty' }}>
            Vamos transformar sua ideia em um<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(34px, 4.1vw, 56px)', color: '#315B2C', fontStyle: 'normal' }}>projeto de sucesso</span>.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.85, marginBottom: '52px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>Nossa equipe técnica está pronta para analisar seu contexto e estruturar a solução ideal para o seu projeto rural ou ambiental.</p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openModal() }}
              style={{ display: 'inline-block', padding: '16px 44px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
            >
              Solicitar Consultoria
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=5591982064340"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 40px', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1.5px solid rgba(49,91,44,0.28)', transition: 'border-color 0.25s, background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#315B2C'; e.currentTarget.style.background = 'rgba(49,91,44,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.28)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {mOpen && (
        <div
          className="modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(8,18,6,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'mFadeIn 0.22s ease' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal" style={{ background: '#FFFFFF', borderRadius: '14px', width: 'min(720px, 100%)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 100px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '36px 44px 24px', borderBottom: '1px solid rgba(49,91,44,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>Consultoria Gratuita</div>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '30px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2 }}>Solicite um Atendimento</h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#999994', borderRadius: '6px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            {mSts !== 'success' ? (
              <form onSubmit={submitForm} style={{ padding: '32px 44px 44px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Nome Completo <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="text" value={mData.name} onChange={ch('name')} placeholder="Seu nome completo" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.name && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Empresa</label>
                    <input type="text" value={mData.company} onChange={ch('company')} placeholder="Nome da empresa" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Telefone <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="tel" value={mData.phone} onChange={ch('phone')} placeholder="(91) 9 9999-9999" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.phone && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.phone}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Email <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="email" value={mData.email} onChange={ch('email')} placeholder="seu@email.com.br" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.email && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Município</label>
                    <input type="text" value={mData.city} onChange={ch('city')} placeholder="Sua cidade" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Estado</label>
                    <select value={mData.st} onChange={ch('st')} style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Selecione</option>
                      {UFS.map((uf) => (<option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Serviço de Interesse</label>
                  <select value={mData.svc} onChange={ch('svc')} style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione o serviço</option>
                    <option value="regularizacao">Regularização Fundiária</option>
                    <option value="licenciamento">Licenciamento Ambiental</option>
                    <option value="georreferenciamento">Georreferenciamento</option>
                    <option value="car">CAR / CCIR</option>
                    <option value="pronaf">Consultoria PRONAF</option>
                    <option value="projetos">Projetos Agropecuários</option>
                    <option value="gestao">Gestão de Projetos</option>
                    <option value="captacao">Captação de Recursos</option>
                    <option value="outro">Outro / Não sei</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Mensagem <span style={{ color: '#DD8758' }}>*</span></label>
                  <textarea value={mData.msg} onChange={ch('msg')} rows={4} placeholder="Descreva brevemente seu projeto ou necessidade…" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', resize: 'vertical', minHeight: '110px', lineHeight: 1.65 }} />
                  {mErrs.msg && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.msg}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#F8F7F3', borderRadius: '8px', marginBottom: '28px' }}>
                  <input type="checkbox" id="p-prv" checked={mData.ok} onChange={ch('ok')} style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="p-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
                    Li e concordo com a <a href="#" style={{ color: '#315B2C', textDecoration: 'underline' }}>Política de Privacidade</a> da AgroVisão.
                    {mErrs.ok && <span style={{ display: 'block', fontSize: '11.5px', color: '#c0392b', marginTop: '4px' }}>{mErrs.ok}</span>}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={mSts === 'sending'}
                  style={{ width: '100%', padding: '16px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', borderRadius: '8px', cursor: mSts === 'sending' ? 'not-allowed' : 'pointer', opacity: mSts === 'sending' ? 0.7 : 1, transition: 'background 0.22s' }}
                >
                  {mSts === 'sending' ? 'Enviando…' : 'Enviar Solicitação'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '64px 44px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#F5F8F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1.5px solid rgba(49,91,44,0.15)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#315B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '34px', fontWeight: 400, color: '#1a1a18', marginBottom: '16px' }}>Solicitação Enviada!</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#555550', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>
                  Nossa equipe entrará em contato em até <strong style={{ color: '#315B2C' }}>24 horas úteis</strong>.
                </p>
                <button onClick={closeModal} style={{ padding: '14px 44px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.22s' }}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default Projects
