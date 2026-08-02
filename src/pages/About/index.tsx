import { useState, useEffect, useCallback } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

const SERVICES = [
  {
    title: 'Consultoria Agrícola',
    desc: 'Diagnóstico, planejamento e assistência técnica para otimização da produção agropecuária.',
    icon: '<path d="M16 28V14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path><path d="M12 22C12 22 13 16 16 14C19 16 20 22 20 22" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><path d="M9 26C9 26 11 20 16 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"></path><path d="M23 26C23 26 21 20 16 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"></path>',
  },
  {
    title: 'Gestão de Projetos',
    desc: 'Coordenação completa de projetos rurais do planejamento à entrega, com rastreabilidade e relatórios técnicos.',
    icon: '<line x1="6" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="6" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="6" y1="6" x2="6" y2="26" stroke="currentColor" stroke-width="1" stroke-linecap="round"></line>',
  },
  {
    title: 'Regularização Fundiária',
    desc: 'Titulação, legalização e regularização de imóveis rurais conforme legislação agrária federal e estadual.',
    icon: '<rect x="4" y="4" width="24" height="24" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"></rect><line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" stroke-width="1" stroke-dasharray="2.5 2"></line><line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" stroke-width="1" stroke-dasharray="2.5 2"></line><circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.35"></circle>',
  },
  {
    title: 'Licenciamento Ambiental',
    desc: 'EIA/RIMA, licenças ambientais e acompanhamento junto à SEMAS-PA, IBAMA e órgãos estaduais.',
    icon: '<path d="M6 26C6 26 10 16 26 8C26 22 18 28 6 26Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 26L16 16" stroke="currentColor" stroke-width="1" stroke-linecap="round"></path>',
  },
  {
    title: 'Georreferenciamento',
    desc: 'Levantamento topográfico e certificação de imóveis rurais conforme normas do INCRA e SIGEF.',
    icon: '<circle cx="16" cy="16" r="11" stroke="currentColor" stroke-width="1.3" fill="none"></circle><circle cx="16" cy="16" r="3" stroke="currentColor" stroke-width="1.3" fill="none"></circle><line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="16" y1="22" x2="16" y2="28" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="4" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line><line x1="22" y1="16" x2="28" y2="16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></line>',
  },
  {
    title: 'Projetos Rurais',
    desc: 'Elaboração de projetos agropecuários, planos de negócios e sistemas de produção integrados e sustentáveis.',
    icon: '<rect x="7" y="3" width="18" height="26" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"></rect><line x1="11" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></line><line x1="11" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></line><line x1="11" y1="20" x2="21" y2="20" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></line>',
  },
  {
    title: 'Agricultura Familiar',
    desc: 'Assistência técnica especializada para pequenos produtores, assentamentos e comunidades rurais amazônicas.',
    icon: '<path d="M4 16L16 5L28 16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><path d="M8 16V27H24V16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><path d="M13 27V21H19V27" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  },
  {
    title: 'Captação de Recursos',
    desc: 'Acesso a crédito rural, PRONAF, editais públicos e programas de fomento para projetos agropecuários.',
    icon: '<circle cx="16" cy="13" r="7" stroke="currentColor" stroke-width="1.3" fill="none"></circle><path d="M16 10V16M13.5 13H18.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path><path d="M9 28C9 24.13 12.13 21 16 21C19.87 21 23 24.13 23 28" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"></path>',
  },
]

const PROCESS_STEPS = [
  { num: '01', title: 'Diagnóstico', desc: 'Avaliação técnica completa da propriedade e das necessidades do produtor.' },
  { num: '02', title: 'Planejamento', desc: 'Elaboração do plano de ação com metas, prazos e recursos necessários.' },
  { num: '03', title: 'Regularização', desc: 'Adequação documental, fundiária e ambiental conforme exigências legais.' },
  { num: '04', title: 'Execução', desc: 'Implementação das soluções técnicas com equipe multidisciplinar em campo.' },
  { num: '05', title: 'Acompanhamento', desc: 'Monitoramento contínuo, relatórios periódicos e suporte técnico permanente.' },
  { num: '06', title: 'Resultados', desc: 'Entrega certificada com documentação completa e impacto mensurável.', accent: true },
]

const DIFFERENTIALS = [
  { num: '01', title: 'Expertise Técnica Comprovada', desc: 'Equipe de engenheiros, geógrafos e advogados especializados em legislação agrária e ambiental amazônica.' },
  { num: '02', title: 'Atuação em Políticas Públicas', desc: 'Experiência consolidada em projetos junto ao INCRA, SEMAS, BASA, BNDES e programas federais de desenvolvimento rural.' },
  { num: '03', title: 'Presença na Amazônia Legal', desc: 'Conhecimento profundo das particularidades fundiárias, ambientais e sociais da Amazônia brasileira.' },
  { num: '04', title: 'Equipe Multidisciplinar', desc: 'Profissionais de diferentes áreas trabalhando de forma integrada para soluções completas e consistentes.' },
  { num: '05', title: 'Desenvolvimento Sustentável', desc: 'Compromisso com práticas que aliam produtividade, preservação ambiental e desenvolvimento das comunidades.' },
  { num: '06', title: 'Parcerias Institucionais', desc: 'Rede consolidada de parcerias com associações, cooperativas, prefeituras e instituições de pesquisa agropecuária.' },
]

const UFS = ['AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO', 'outro']

function About() {
  const [entered, setEntered] = useState(false)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})
  const [svcHover, setSvcHover] = useState<number | null>(null)
  const [galHover, setGalHover] = useState<number | null>(null)

  useEffect(() => {
    setTimeout(() => setEntered(true), 80)
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

  return (
    <>
      <Header onOpenModal={openModal} />

      {/* HERO */}
      <section className="hero" style={{ position: 'relative', width: '100%', height: '88vh', minHeight: '640px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1920&q=88&fm=jpg&fit=crop"
          alt="Paisagem amazônica com produção agrícola"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, rgba(6,14,4,0.20) 0%, rgba(6,14,4,0.48) 45%, rgba(6,14,4,0.88) 100%)' }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 100px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={up(0.4)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
                <div style={{ width: '36px', height: '1px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase' }}>A Empresa · Belém, Pará</span>
              </div>
            </div>
            <div style={up(0.62)}>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(51px, calc(6vw + 3px), 87px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.06, letterSpacing: '-0.02em', marginBottom: '28px' }}>Sobre a<br />AgroVisão</h1>
            </div>
            <div style={up(0.84)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'rgba(246,244,239,0.78)', lineHeight: 1.75, maxWidth: '560px' }}>Transformando conhecimento técnico em desenvolvimento sustentável para a agricultura amazônica.</p>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, zIndex: 3, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
            <path d="M0,60 L1440,60 L1440,18 Q1080,60 720,28 Q360,0 0,28 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="section-about" style={{ background: '#FFFFFF', padding: '148px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '108px', alignItems: 'center' }}>
            <div style={{ overflow: 'hidden', background: '#d4d0c8' }}>
              <div style={{ aspectRatio: '4/5', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=88&fm=jpg&fit=crop" alt="Vista aérea de área agrícola" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
            <div>
              <div style={{ width: '34px', height: '1px', background: '#315B2C', marginBottom: '18px' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '30px' }}>Quem Somos</span>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(3.6vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2, letterSpacing: '-0.015em', marginBottom: '32px', textWrap: 'pretty' }}>Uma consultoria dedicada ao desenvolvimento sustentável da Amazônia</h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.92, marginBottom: '22px' }}>A AgroVisão é uma consultoria técnica especializada em desenvolvimento rural, regularização fundiária e gestão ambiental na Amazônia Legal. Atuamos ao lado de produtores rurais, associações, cooperativas, ONGs e instituições públicas, oferecendo soluções completas e alinhadas às exigências legais vigentes.</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.92, marginBottom: '48px' }}>Nossa equipe multidisciplinar combina formação técnica de excelência com profundo conhecimento do território amazônico e das políticas públicas voltadas ao desenvolvimento da agricultura familiar e empresarial.</p>
              <div className="stats-row" style={{ display: 'flex', gap: '48px' }}>
                <div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '51px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '8px' }}>15<span style={{ fontSize: '31px', color: '#6F8F3A' }}>+</span></div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1.5 }}>Anos de<br />Experiência</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(49,91,44,0.12)' }} />
                <div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '51px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '8px' }}>500<span style={{ fontSize: '31px', color: '#6F8F3A' }}>+</span></div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1.5 }}>Projetos<br />Concluídos</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(49,91,44,0.12)' }} />
                <div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '51px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '8px' }}>12</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1.5 }}>Estados<br />Atendidos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="section-mission" style={{ background: '#F5F8F3', padding: '128px 0', borderTop: '1px solid rgba(49,91,44,0.08)', borderBottom: '1px solid rgba(49,91,44,0.08)' }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 84px', textAlign: 'center' }}>
          <div style={{ width: '34px', height: '1px', background: '#315B2C', margin: '0 auto 24px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '48px' }}>Nossa Missão</span>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(35px, calc(4vw + 3px), 57px)', fontWeight: 500, color: '#1a1a18', lineHeight: 1.25, letterSpacing: '-0.01em', marginBottom: '40px', textWrap: 'pretty' }}>&ldquo;Elaborando sonhos no presente,<br />construindo o amanhã<br />a partir da melhor Visão.&rdquo;</div>
          <div style={{ width: '40px', height: '1px', background: '#6F8F3A', margin: '0 auto 20px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.22em', textTransform: 'uppercase' }}>AgroVisão — Consultoria Agrícola</span>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="section-what" style={{ background: '#FFFFFF', padding: '148px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Serviços</span>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4.5vw + 3px), 63px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.08, letterSpacing: '-0.02em' }}>O Que<br />Fazemos</h2>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#555550', lineHeight: 1.8, maxWidth: '380px', marginBottom: '6px' }}>Soluções técnicas integradas para o desenvolvimento rural sustentável em toda a Amazônia Legal.</p>
          </div>
          <div className="services-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {SERVICES.map((svc, idx) => (
              <div
                key={svc.title}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${svcHover === idx ? 'rgba(49,91,44,0.28)' : 'rgba(49,91,44,0.12)'}`,
                  borderRadius: '12px',
                  padding: '32px 28px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  boxShadow: svcHover === idx ? '0 4px 24px rgba(49,91,44,0.07)' : 'none',
                }}
                onMouseEnter={() => setSvcHover(idx)}
                onMouseLeave={() => setSvcHover(null)}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: '20px', color: '#315B2C' }} dangerouslySetInnerHTML={{ __html: svc.icon }} />
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '25px', fontWeight: 500, color: '#1a1a18', lineHeight: 1.25, marginBottom: '12px' }}>{svc.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#666660', lineHeight: 1.78, flex: 1, marginBottom: '20px' }}>{svc.desc}</p>
                <a href="/" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#315B2C', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.85 }}>
                  Saiba mais
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="section-process" style={{ background: '#F8F7F3', padding: '128px 0', borderTop: '1px solid rgba(49,91,44,0.08)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ marginBottom: '80px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Metodologia</span>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4.5vw + 3px), 63px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.08, letterSpacing: '-0.02em' }}>Como Trabalhamos</h2>
          </div>
          <div className="process-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px' }}>
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} style={{ borderTop: '1.5px solid #B8D48A', paddingTop: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-5px', left: 0, width: '8px', height: '8px', background: step.accent ? '#DD8758' : '#315B2C', borderRadius: '50%' }} />
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '43px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '14px' }}>{step.num}</div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: '#1a1a18', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15.5px', fontWeight: 400, color: '#666660', lineHeight: 1.72 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY AGROVISÃO */}
      <section className="section-diff" style={{ background: '#FFFFFF', padding: '148px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div className="diff-sticky-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '108px', alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: '120px' }}>
              <div style={{ width: '34px', height: '1px', background: '#315B2C', marginBottom: '18px' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '28px' }}>Nossos Diferenciais</span>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4vw + 3px), 59px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: '28px' }}>Por que escolher a AgroVisão</h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.88 }}>Mais de 15 anos consolidando nossa presença no setor agropecuário da Amazônia com resultados técnicos comprovados.</p>
            </div>
            <div className="diff-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {DIFFERENTIALS.map((diff, idx) => {
                const isEven = idx % 2 === 0
                const isLastRow = idx >= 4
                return (
                  <div
                    key={diff.num}
                    style={{
                      padding: isEven ? (isLastRow ? '36px 32px 0 0' : '36px 32px 36px 0') : (isLastRow ? '36px 0 0 32px' : '36px 0 36px 32px'),
                      borderBottom: isLastRow ? 'none' : '1px solid rgba(49,91,44,0.1)',
                      borderRight: isEven ? '1px solid rgba(49,91,44,0.1)' : 'none',
                    }}
                  >
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '16px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>{diff.num}</div>
                    <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '29px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.25, marginBottom: '12px' }}>{diff.title}</h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16.5px', fontWeight: 400, color: '#666660', lineHeight: 1.78 }}>{diff.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE GALLERY */}
      <section className="section-gallery" style={{ background: '#F5F8F3', padding: '0 0 0 0', borderTop: '1px solid rgba(49,91,44,0.08)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '128px 84px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '56px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Campo</span>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4.5vw + 3px), 61px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.08, letterSpacing: '-0.02em' }}>Nossa Experiência<br />em Campo</h2>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 400, color: '#555550', lineHeight: 1.8, maxWidth: '360px', marginBottom: '8px' }}>Atuamos em toda a extensão da Amazônia Legal, de comunidades rurais a grandes propriedades agropecuárias.</p>
          </div>
        </div>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px 128px' }}>
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '3px', height: '620px' }}>
            <div
              style={{ overflow: 'hidden', background: '#c8c4bc' }}
              onMouseEnter={() => setGalHover(0)}
              onMouseLeave={() => setGalHover(null)}
            >
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=82&fm=jpg&fit=crop"
                alt="Vista aérea de área agrícola mapeada"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s ease', transform: galHover === 0 ? 'scale(1.03)' : 'scale(1)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{ overflow: 'hidden', flex: 1, background: '#c0bcb4' }}
                onMouseEnter={() => setGalHover(1)}
                onMouseLeave={() => setGalHover(null)}
              >
                <img
                  src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=620&q=82&fm=jpg&fit=crop"
                  alt="Atividade técnica em campo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s ease', transform: galHover === 1 ? 'scale(1.04)' : 'scale(1)' }}
                />
              </div>
              <div
                style={{ overflow: 'hidden', flex: 1, background: '#b8c4b0' }}
                onMouseEnter={() => setGalHover(2)}
                onMouseLeave={() => setGalHover(null)}
              >
                <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=620&q=82&fm=jpg&fit=crop"
                  alt="Produção agrícola ao entardecer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s ease', transform: galHover === 2 ? 'scale(1.04)' : 'scale(1)' }}
                />
              </div>
            </div>
            <div
              style={{ overflow: 'hidden', background: '#b4c0a8' }}
              onMouseEnter={() => setGalHover(3)}
              onMouseLeave={() => setGalHover(null)}
            >
              <img
                src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&q=82&fm=jpg&fit=crop"
                alt="Vegetação e preservação ambiental"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s ease', transform: galHover === 3 ? 'scale(1.03)' : 'scale(1)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta" style={{ background: '#FFFFFF', padding: '148px 0', borderTop: '1px solid rgba(49,91,44,0.08)' }}>
        <div className="cta-grid container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ width: '34px', height: '1px', background: '#315B2C', marginBottom: '18px' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '32px' }}>Próximo Passo</span>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4.5vw + 3px), 65px)', fontWeight: 300, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.02em', textWrap: 'pretty' }}>
              Vamos construir seu<br />próximo projeto<br />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(36px, calc(3.9vw + 3px), 56px)', fontStyle: 'normal' }}>juntos</span>.
            </h2>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.88, marginBottom: '48px' }}>Nossa equipe está pronta para avaliar seu projeto sem custo e indicar o melhor caminho técnico para regularizar, licenciar e desenvolver sua propriedade na Amazônia Legal.</p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '16px 42px',
                  background: '#315B2C',
                  color: '#F6F4EF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'background 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
              >
                Conheça Nossos Serviços
              </a>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal() }}
                style={{
                  display: 'inline-block',
                  padding: '15px 42px',
                  color: '#315B2C',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  border: '1px solid rgba(49,91,44,0.3)',
                  transition: 'border-color 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.7)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.3)' }}
              >
                Fale com Nossa Equipe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {mOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(8,18,6,0.60)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'mFadeIn 0.22s ease',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal" style={{ background: '#FFFFFF', borderRadius: '14px', width: 'min(720px, 100%)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 100px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '36px 44px 24px', borderBottom: '1px solid rgba(49,91,44,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Consultoria Gratuita
                </div>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '33px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2 }}>
                  Solicite um Atendimento
                </h2>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#999994', borderRadius: '6px' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {mSts !== 'success' ? (
              <form onSubmit={submitForm} style={{ padding: '32px 44px 44px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Nome Completo <span style={{ color: '#DD8758' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={mData.name}
                      onChange={ch('name')}
                      placeholder="Seu nome completo"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }}
                    />
                    {mErrs.name && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={mData.company}
                      onChange={ch('company')}
                      placeholder="Nome da empresa"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Telefone <span style={{ color: '#DD8758' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={mData.phone}
                      onChange={ch('phone')}
                      placeholder="(91) 9 9999-9999"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }}
                    />
                    {mErrs.phone && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.phone}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Email <span style={{ color: '#DD8758' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={mData.email}
                      onChange={ch('email')}
                      placeholder="seu@email.com.br"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }}
                    />
                    {mErrs.email && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Município
                    </label>
                    <input
                      type="text"
                      value={mData.city}
                      onChange={ch('city')}
                      placeholder="Sua cidade"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Estado
                    </label>
                    <select
                      value={mData.st}
                      onChange={ch('st')}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Selecione</option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Serviço de Interesse
                  </label>
                  <select
                    value={mData.svc}
                    onChange={ch('svc')}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
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
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Mensagem <span style={{ color: '#DD8758' }}>*</span>
                  </label>
                  <textarea
                    value={mData.msg}
                    onChange={ch('msg')}
                    rows={4}
                    placeholder="Descreva brevemente seu projeto ou necessidade…"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', resize: 'vertical', minHeight: '110px', lineHeight: 1.65 }}
                  />
                  {mErrs.msg && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.msg}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#F8F7F3', borderRadius: '8px', marginBottom: '28px' }}>
                  <input
                    type="checkbox"
                    id="a-prv"
                    checked={mData.ok}
                    onChange={ch('ok')}
                    style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <label htmlFor="a-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
                    Li e concordo com a <a href="#" style={{ color: '#315B2C', textDecoration: 'underline' }}>Política de Privacidade</a> da AgroVisão.
                    {mErrs.ok && <span style={{ display: 'block', fontSize: '14.5px', color: '#c0392b', marginTop: '4px' }}>{mErrs.ok}</span>}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={mSts === 'sending'}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#315B2C',
                    color: '#F6F4EF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: mSts === 'sending' ? 'not-allowed' : 'pointer',
                    opacity: mSts === 'sending' ? 0.7 : 1,
                    transition: 'background 0.22s',
                  }}
                >
                  {mSts === 'sending' ? 'Enviando…' : 'Enviar Solicitação'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '64px 44px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#F5F8F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1.5px solid rgba(49,91,44,0.15)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14L11 20L23 8" stroke="#315B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '37px', fontWeight: 400, color: '#1a1a18', marginBottom: '16px' }}>
                  Solicitação Enviada!
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: '#555550', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>
                  Nossa equipe entrará em contato em até <strong style={{ color: '#315B2C' }}>24 horas úteis</strong>.
                </p>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '14px 44px',
                    background: '#315B2C',
                    color: '#F6F4EF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.22s',
                  }}
                >
                  Fechar
                </button>
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

export default About
