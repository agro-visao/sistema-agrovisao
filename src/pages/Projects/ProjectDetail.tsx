import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

async function fetchProjectBySlug(slug: string): Promise<ProjectItem | null> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`)
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data) {
      const p = json.data
      return {
        slug: p.slug,
        name: p.name,
        cat: p.category,
        catLabel: p.category_label,
        inst: p.institution,
        desc: p.description,
        services: p.services || [],
        logo: p.logo_url || '',
      }
    }
  } catch (_) {}
  return null
}

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'
]

function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectItem | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!slug) return
    const decodedSlug = decodeURIComponent(slug)
    fetchProjectBySlug(decodedSlug).then((data) => {
      if (data) {
        setProject(data)
      } else {
        const fallback = FALLBACK_PROJECTS.find((p) => p.slug === decodedSlug)
        if (fallback) {
          setProject(fallback)
        } else {
          setNotFound(true)
        }
      }
    })
  }, [slug])

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

  if (notFound) {
    return (
      <>
        <Header onOpenModal={openModal} />
        <section style={{ padding: '200px 84px 140px', textAlign: 'center', background: '#F5F8F3', minHeight: '60vh' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(4vw + 1px), 53px)', fontWeight: 400, color: '#1a1a18', marginBottom: '20px' }}>Projeto não encontrado</h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#666660', lineHeight: 1.8, marginBottom: '36px' }}>O projeto que você está procurando pode ter sido removido ou o endereço está incorreto.</p>
            <a
              href="/projetos"
              onClick={(e) => { e.preventDefault(); navigate('/projetos') }}
              style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
            >
              Ver Todos os Projetos
            </a>
          </div>
        </section>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  if (!project) {
    return (
      <>
        <Header onOpenModal={openModal} />
        <section style={{ padding: '200px 84px 140px', textAlign: 'center', background: '#F5F8F3', minHeight: '60vh' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid rgba(49,91,44,0.15)', borderTopColor: '#315B2C', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#888882' }}>Carregando projeto...</p>
        </section>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  return (
    <>
      <Header onOpenModal={openModal} />

      {/* HERO */}
      <section style={{ position: 'relative', width: '100%', minHeight: '420px', overflow: 'hidden', background: '#131E11', padding: '180px 0 80px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px', position: 'relative', zIndex: 2 }}>
          <a
            href="/projetos"
            onClick={(e) => { e.preventDefault(); navigate('/projetos') }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: '#B8D48A', textDecoration: 'none', marginBottom: '32px', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Voltar para Projetos
          </a>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
            {project.logo && (
              <div style={{ width: '100px', height: '100px', background: '#FFFFFF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', flexShrink: 0, border: '1px solid rgba(49,91,44,0.1)' }}>
                <img src={project.logo} alt={project.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            <div>
              <span style={{ display: 'inline-block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, color: '#B8D48A', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(184,212,138,0.12)', padding: '5px 14px', borderRadius: '4px', marginBottom: '16px' }}>{project.catLabel}</span>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(33px, calc(3.6vw + 1px), 51px)', fontWeight: 400, color: '#F6F4EF', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: '10px', textWrap: 'pretty' }}>{project.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 500, color: 'rgba(246,244,239,0.6)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12V5L7 2L12 5V12" stroke="rgba(246,244,239,0.6)" strokeWidth="1.1" fill="none" strokeLinejoin="round" /><path d="M5.5 12V8.5H8.5V12" stroke="rgba(246,244,239,0.6)" strokeWidth="1.1" fill="none" /></svg>
                {project.inst}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL */}
      <section style={{ background: '#FFFFFF', padding: '100px 0 80px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Sobre o Projeto</div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(29px, calc(2.8vw + 1px), 41px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.15, letterSpacing: '-0.012em', marginBottom: '24px' }}>{project.name}</h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.9, marginBottom: '36px' }}>{project.desc}</p>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal() }}
                style={{ display: 'inline-block', padding: '15px 36px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
              >
                Solicitar um Projeto Semelhante
              </a>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>Serviços Executados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
                {project.services.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: '#F5F8F3', borderRadius: '10px', border: '1px solid rgba(49,91,44,0.08)' }}>
                    <div style={{ width: '28px', height: '28px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#F6F4EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 500, color: '#315B2C' }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F5F8F3', borderRadius: '14px', padding: '28px 32px', border: '1px solid rgba(49,91,44,0.08)' }}>
                <h4 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '19px', fontWeight: 600, color: '#1a1a18', marginBottom: '8px' }}>Instituição</h4>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#555550', lineHeight: 1.7 }}>{project.inst}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#315B2C', padding: '120px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 84px', textAlign: 'center' }}>
          <div style={{ width: '34px', height: '1px', background: '#B8D48A', margin: '0 auto 18px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '28px' }}>Próximo Passo</span>
          <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(4.5vw + 1px), 63px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '24px', textWrap: 'pretty' }}>
            Vamos construir seu próximo<br />projeto <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(34px, calc(3.9vw + 1px), 54px)', fontStyle: 'normal' }}>juntos</span>.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: 'rgba(246,244,239,0.75)', lineHeight: 1.85, marginBottom: '52px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Preencha o formulário de contato ou fale diretamente pelo WhatsApp. Nossa equipe especializada está pronta para orientar você.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openModal() }}
              style={{ display: 'inline-block', padding: '16px 44px', background: '#F6F4EF', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ede9e2' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F6F4EF' }}
            >
              Solicitar Consultoria
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=5591982064340"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 40px', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(246,244,239,0.4)', transition: 'border-color 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.72)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.4)' }}
            >
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
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>Consultoria Gratuita</div>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '31px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2 }}>Solicite um Atendimento</h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#999994', borderRadius: '6px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            {mSts !== 'success' ? (
              <form onSubmit={submitForm} style={{ padding: '32px 44px 44px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Nome Completo <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="text" value={mData.name} onChange={ch('name')} placeholder="Seu nome completo" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.name && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Empresa</label>
                    <input type="text" value={mData.company} onChange={ch('company')} placeholder="Nome da empresa" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Telefone <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="tel" value={mData.phone} onChange={ch('phone')} placeholder="(91) 9 9999-9999" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.phone && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.phone}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Email <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="email" value={mData.email} onChange={ch('email')} placeholder="seu@email.com.br" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.email && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Município</label>
                    <input type="text" value={mData.city} onChange={ch('city')} placeholder="Sua cidade" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Estado</label>
                    <select value={mData.st} onChange={ch('st')} style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Selecione</option>
                      {UFS.map((uf) => (<option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Serviço de Interesse</label>
                  <select value={mData.svc} onChange={ch('svc')} style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
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
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Mensagem <span style={{ color: '#DD8758' }}>*</span></label>
                  <textarea value={mData.msg} onChange={ch('msg')} rows={4} placeholder="Descreva brevemente seu projeto ou necessidade…" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', resize: 'vertical', minHeight: '110px', lineHeight: 1.65 }} />
                  {mErrs.msg && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.msg}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#F8F7F3', borderRadius: '8px', marginBottom: '28px' }}>
                  <input type="checkbox" id="d-prv" checked={mData.ok} onChange={ch('ok')} style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="d-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
                    Li e concordo com a <a href="#" style={{ color: '#315B2C', textDecoration: 'underline' }}>Política de Privacidade</a> da AgroVisão.
                    {mErrs.ok && <span style={{ display: 'block', fontSize: '12.5px', color: '#c0392b', marginTop: '4px' }}>{mErrs.ok}</span>}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={mSts === 'sending'}
                  style={{ width: '100%', padding: '16px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', borderRadius: '8px', cursor: mSts === 'sending' ? 'not-allowed' : 'pointer', opacity: mSts === 'sending' ? 0.7 : 1, transition: 'background 0.22s' }}
                >
                  {mSts === 'sending' ? 'Enviando…' : 'Enviar Solicitação'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '64px 44px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#F5F8F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1.5px solid rgba(49,91,44,0.15)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="#315B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '35px', fontWeight: 400, color: '#1a1a18', marginBottom: '16px' }}>Solicitação Enviada!</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#555550', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>
                  Nossa equipe entrará em contato em até <strong style={{ color: '#315B2C' }}>24 horas úteis</strong>.
                </p>
                <button onClick={closeModal} style={{ padding: '14px 44px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.22s' }}>Fechar</button>
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

export default ProjectDetail
