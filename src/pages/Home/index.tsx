import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

const PROJECTS_ROW1 = [
  { name: 'Açaí Amazônico', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/acai-amazonico.png' },
  { name: 'Agricultura Para Todos', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/agricultura-para-todos.png' },
  { name: 'Amazônia Viva', cat: 'Ambiental', img: '/assets/logos/projetos/amazonia-viva.png' },
  { name: 'Aurora Sustentável', cat: 'Ambiental', img: '/assets/logos/projetos/aurora-sustentavel.png' },
  { name: 'Casa de Farinha', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/casa-de-farinha.png' },
  { name: 'Casa de Farinha II', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/casa-de-farinha-2.png' },
  { name: 'Cotijuba Mais Verde', cat: 'Ambiental', img: '/assets/logos/projetos/cotijuba-mais-verde.png' },
  { name: 'Cultura Pela Paz', cat: 'Cultural', img: '/assets/logos/projetos/cultura-pela-paz.png' },
  { name: 'De Mãos Dadas com o Campo', cat: 'Projeto Social', img: '/assets/logos/projetos/de-maos-dadas-com-o-campo.png' },
  { name: 'Eco Vida Plantar', cat: 'Ambiental', img: '/assets/logos/projetos/eco-vida-plantar.png' },
]

const PROJECTS_ROW2 = [
  { name: 'Empodera Elas Pará', cat: 'Feminino', img: '/assets/logos/projetos/empodera-elas-para.png' },
  { name: 'Expandindo a Criação de Abelhas', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/expandindo-criacao-de-abelhas.png' },
  { name: 'Iaçá', cat: 'Cultural', img: '/assets/logos/projetos/iaça.png' },
  { name: 'Ilhas Marajoara', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/ilhas-marajoara-acai-farinha-cuia.png' },
  { name: 'Mãos de Mulheres', cat: 'Feminino', img: '/assets/logos/projetos/maos-de-mulheres.png' },
  { name: 'Plantando Esperança', cat: 'Projeto Social', img: '/assets/logos/projetos/plantando-esperanca.png' },
  { name: 'Projeto Eco Inovar', cat: 'Ambiental', img: '/assets/logos/projetos/projeto-eco-inovar.png' },
  { name: 'Projeto Gerando Sonhos', cat: 'Projeto Social', img: '/assets/logos/projetos/projeto-gerando-sonhos.png' },
  { name: 'Projeto Renda Pará', cat: 'Agricultura Familiar', img: '/assets/logos/projetos/projeto-renda-para.png' },
]

const SERVICES = [
  {
    slug: 'regularizacao-fundiaria',
    title: 'Regularização Fundiária',
    desc: 'Titulação, legalização e regularização de imóveis rurais.',
    icon: '<rect x="2" y="2" width="18" height="18" rx="1.5" stroke="#315B2C" stroke-width="1.3" fill="none"></rect><path d="M2 11H20M11 2V20" stroke="#315B2C" stroke-width="1" stroke-dasharray="2 2"></path><circle cx="11" cy="11" r="2.5" fill="#315B2C" opacity="0.3"></circle>',
  },
  {
    slug: 'licenciamento',
    title: 'Licenciamento Ambiental',
    desc: 'EIA/RIMA, licenças e acompanhamento junto a SEMAS e IBAMA.',
    icon: '<path d="M6 20C6 14.477 10.477 10 16 10C16 4.477 20.477 0 26 0" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" fill="none" transform="scale(0.72) translate(1,1)"></path><path d="M3 18C3 12 7 8 11 7C11 2 15 2 19 3" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" fill="none"></path><circle cx="11" cy="11" r="8" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><path d="M8 11C8 9.343 9.343 8 11 8C12.657 8 14 9.343 14 11" stroke="#315B2C" stroke-width="1" fill="none"></path>',
  },
  {
    slug: 'pronaf',
    title: 'Projetos Rurais',
    desc: 'Elaboração e gestão de projetos agropecuários e sociais.',
    icon: '<path d="M11 3V19M3 11H19" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path><circle cx="11" cy="11" r="9" stroke="#315B2C" stroke-width="1.3" fill="none"></circle>',
  },
  {
    slug: 'pronaf',
    title: 'Consultoria PRONAF',
    desc: 'Crédito rural, DAP, planos e acompanhamento bancário.',
    icon: '<path d="M3 16L7 12L10 15L14 9L19 16" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"></path><rect x="2" y="2" width="18" height="18" rx="2" stroke="#315B2C" stroke-width="1.3" fill="none"></rect>',
  },
  {
    slug: 'georreferenciamento',
    title: 'Georreferenciamento',
    desc: 'Levantamento topográfico e certificação INCRA/SIGEF.',
    icon: '<circle cx="11" cy="11" r="9" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><circle cx="11" cy="11" r="2.5" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><path d="M11 2V5M11 17V20M2 11H5M17 11H20" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path>',
  },
  {
    slug: 'gestao',
    title: 'Gestão de Projetos',
    desc: 'Coordenação completa do planejamento à prestação de contas.',
    icon: '<path d="M4 18V12M8 18V8M12 18V10M16 18V5M20 18V2" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path>',
  },
]

const PROCESS_STEPS = [
  { num: '1', title: 'Diagnóstico', desc: 'Avaliação técnica inicial' },
  { num: '2', title: 'Planejamento', desc: 'Estratégia e metas' },
  { num: '3', title: 'Projeto', desc: 'Documentação completa' },
  { num: '4', title: 'Aprovação', desc: 'Captação e liberação' },
  { num: '5', title: 'Execução', desc: 'Acompanhamento técnico' },
  { num: '✓', title: 'Acompanhamento', desc: 'Relatórios e prestação' },
]

const DIFFERENTIALS = [
  { title: 'Equipe especializada', desc: 'Profissionais experientes em diversas áreas do desenvolvimento rural e ambiental.', icon: '<path d="M3 11C3 6.582 6.582 3 11 3C15.418 3 19 6.582 19 11C19 15.418 15.418 19 11 19C6.582 19 3 15.418 3 11Z" stroke="#315B2C" stroke-width="1.3" fill="none"></path><path d="M7 11L10 14L15 8" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>' },
  { title: 'Atendimento personalizado', desc: 'Soluções sob medida para cada realidade, contexto e necessidade do cliente.', icon: '<path d="M11 3V7M11 15V19M3 11H7M15 11H19" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round"></path><circle cx="11" cy="11" r="4" stroke="#315B2C" stroke-width="1.3" fill="none"></circle>' },
  { title: 'Projetos aprovados', desc: 'Mais de 100 projetos aprovados e executados com sucesso em toda a Amazônia Legal.', icon: '<path d="M11 3L13.5 8.5L19 9.5L15 13.5L16 19L11 16.5L6 19L7 13.5L3 9.5L8.5 8.5L11 3Z" stroke="#B8D48A" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>', dark: true },
  { title: 'Resposta rápida', desc: 'Agilidade no atendimento com resposta em até 24 horas úteis para qualquer demanda.', icon: '<circle cx="11" cy="8" r="4" stroke="#315B2C" stroke-width="1.3" fill="none"></circle><path d="M3 20C3 16.134 6.582 13 11 13C15.418 13 19 16.134 19 20" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" fill="none"></path>' },
  { title: 'Experiência comprovada', desc: 'Mais de 15 anos de atuação no desenvolvimento rural e ambiental da Amazônia Legal.', icon: '<path d="M3 18L8 12L12 16L16 9L19 18" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>' },
  { title: 'Acompanhamento completo', desc: 'Do diagnóstico à prestação de contas, entregamos o projeto 100% finalizado.', icon: '<path d="M4 11H18M18 11L13 6M18 11L13 16" stroke="#315B2C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>' },
]

const UFS = ['AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO', 'outro']

function Home() {
  const [entered, setEntered] = useState(false)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  const statsRef = useRef<HTMLDivElement>(null)
  const [counted, setCounted] = useState(false)

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

  useEffect(() => {
    if (counted || !statsRef.current) return
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !counted) {
            setCounted(true)
            const el = e.target as HTMLElement
            const target = parseInt(el.dataset.counter || '0', 10)
            const dur = 1800
            const t0 = Date.now()
            const tick = () => {
              const p = Math.min((Date.now() - t0) / dur, 1)
              const v = 1 - Math.pow(1 - p, 3)
              el.textContent = String(Math.round(v * target))
              if (p < 1) requestAnimationFrame(tick)
              else el.textContent = String(target)
            }
            requestAnimationFrame(tick)
            cio.unobserve(el)
          }
        })
      },
      { threshold: 0.5 }
    )
    statsRef.current.querySelectorAll('[data-counter]').forEach((el) => cio.observe(el))
    return () => cio.disconnect()
  }, [counted, entered])

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
      <section
        className="hero"
        style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '720px', overflow: 'hidden' }}
      >
        <img
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=85&fm=jpg&fit=crop"
          alt="Consultoria estratégica agrícola"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, rgba(4,12,3,0.88) 0%, rgba(4,12,3,0.70) 45%, rgba(4,12,3,0.32) 100%)',
          }}
        />
        <div
          className="hero-content hero-content--page"
          style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 84px', paddingTop: 'var(--hero-header-gap)' }}
        >
          <div style={{ maxWidth: '700px', marginTop: '40px' }}>
            <div style={up(0.4)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                <div style={{ width: '32px', height: '2px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  Consultoria Agrícola Estratégica
                </span>
              </div>
            </div>
            <div style={up(0.62)}>
              <h1
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: 'clamp(43px, calc(5.2vw + 3px), 73px)',
                  fontWeight: 400,
                  color: '#F6F4EF',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '26px',
                  textWrap: 'pretty',
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}
              >
                Planejamento que<br />transforma o presente,<br />
                <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(36px, calc(4.4vw + 3px), 62px)', color: '#B8D48A' }}>
                  resultados que constroem o futuro.
                </span>
              </h1>
            </div>
            <div style={up(0.84)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18.5px', fontWeight: 500, color: 'rgba(246,244,239,0.85)', lineHeight: 1.85, maxWidth: '520px', marginBottom: '40px', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                Consultoria especializada em projetos que geram impacto real na Amazônia e no Brasil.
              </p>
            </div>
            <div style={up(1.06)}>
              <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); openModal() }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 32px',
                    background: '#315B2C',
                    color: '#F6F4EF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background 0.22s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Solicitar Consultoria
                </a>
                <a
                  href="/servicos"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '13px 28px',
                    color: '#F6F4EF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: '1px solid rgba(246,244,239,0.38)',
                    transition: 'border-color 0.22s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.7)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.38)' }}
                >
                  Conheça nossos Serviços{' '}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5H11M8 3.5L11 6.5L8 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div className="hero-badges" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {['Estratégia', 'Planejamento', 'Gestão', 'Resultados'].map((badge) => (
                  <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#B8D48A" strokeWidth="1.2" />
                      <path d="M4 7L6 9L10 5" stroke="#B8D48A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 500, color: 'rgba(246,244,239,0.85)' }}>
                      {badge}
                    </span>
                  </div>
                ))}
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

      {/* SERVICES */}
      <section className="section-services" style={{ background: '#FFFFFF', padding: '100px 0 80px' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                Nossas Soluções
              </span>
              <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(3.6vw + 3px), 53px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
              Serviços especializados para<br />o desenvolvimento rural
            </h2>
          </div>
          <div className="services-grid" style={{ display: 'flex', gap: '16px' }} data-animate data-d="1">
            {SERVICES.map((svc) => (
              <a key={svc.title} href={`/servicos#${svc.slug}`} className="svc-card" style={{ textDecoration: 'none' }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(49,91,44,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" dangerouslySetInnerHTML={{ __html: svc.icon }} />
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '21px', fontWeight: 500, color: '#1a1a18', marginBottom: '8px', lineHeight: 1.25 }}>
                  {svc.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15.5px', fontWeight: 400, color: '#777772', lineHeight: 1.7, marginBottom: '16px' }}>
                  {svc.desc}
                </p>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 700, color: '#315B2C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Saiba mais →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section-about" style={{ background: '#FAFAF8', padding: '120px 0', borderTop: '1px solid rgba(49,91,44,0.06)' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 64px' }}>
          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '96px', alignItems: 'center' }}>
            <div data-animate>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                  Quem Somos
                </span>
              </div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(3.4vw + 3px), 51px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.12, letterSpacing: '-0.015em', marginBottom: '22px', textWrap: 'pretty' }}>
                Consultoria que impulsiona desenvolvimento e oportunidades
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.88, marginBottom: '16px' }}>
                A AgroVisão é uma consultoria especializada em planejamento, gestão e execução de projetos que geram valor para pessoas, comunidades e territórios.
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.88, marginBottom: '44px' }}>
                Atuamos com responsabilidade, inovação e compromisso com um futuro mais próspero e sustentável para a Amazônia Legal.
              </p>
              <div ref={statsRef} className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid rgba(49,91,44,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '40px' }}>
                <div style={{ padding: '24px 22px', borderRight: '1px solid rgba(49,91,44,0.1)' }}>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '47px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '6px' }}>
                    +<span data-counter={500}>0</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Projetos
                  </div>
                </div>
                <div style={{ padding: '24px 22px' }}>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '47px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '6px' }}>
                    +<span data-counter={15}>0</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Anos
                  </div>
                </div>
                <div style={{ padding: '24px 22px', borderTop: '1px solid rgba(49,91,44,0.1)', borderRight: '1px solid rgba(49,91,44,0.1)' }}>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '47px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '6px' }}>
                    <span data-counter={12}>0</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Estados
                  </div>
                </div>
                <div style={{ padding: '24px 22px', borderTop: '1px solid rgba(49,91,44,0.1)' }}>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '47px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '6px' }}>
                    Multi
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    disciplinar
                  </div>
                </div>
              </div>
              <a
                href="/sobre"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  background: '#315B2C',
                  color: '#F6F4EF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'background 0.22s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
              >
                Saiba Mais sobre Nós{' '}
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5H11M8 3.5L11 6.5L8 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="about-image" style={{ position: 'relative' }} data-animate data-d="2">
              <div style={{ aspectRatio: '4/5', overflow: 'hidden', borderRadius: '20px', boxShadow: '0 24px 72px rgba(0,0,0,0.12)' }}>
                <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=88&fm=jpg&fit=crop"
                  alt="Campo agrícola ao amanhecer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', background: '#FFFFFF', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(49,91,44,0.08)' }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '39px', fontWeight: 300, color: '#315B2C', lineHeight: 1, marginBottom: '4px' }}>
                  +500
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Projetos<br />Desenvolvidos
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT MARQUEE */}
      <section
        className="section-marquee"
        style={{
          background: '#FFFFFF',
          padding: '100px 0',
          borderTop: '1px solid rgba(49,91,44,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', left: '-120px', top: '50%', transform: 'translateY(-50%)', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(111,143,58,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-120px', bottom: '60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(111,143,58,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: '60px', position: 'relative', zIndex: 1 }} data-animate>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
              Projetos que Transformam
            </span>
            <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
          </div>
          <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(3.6vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em', marginBottom: '14px' }}>
            Nossos Projetos em{' '}
            <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(33px, calc(3.2vw + 3px), 48px)', color: '#315B2C' }}>
              Movimento
            </span>
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#666660', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto' }}>
            Iniciativas que geram impacto real e transformam vidas, comunidades e territórios na Amazônia e além.
          </p>
        </div>

        <div className="mq-row" style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 80px, black calc(100% - 80px), transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0px, black 80px, black calc(100% - 80px), transparent 100%)', marginBottom: '14px' }}>
          <div className="mq-track" style={{ animation: 'scrollRight 38s linear infinite' }}>
            {[...PROJECTS_ROW1, ...PROJECTS_ROW1].map((p, i) => (
              <div key={i} className="mq-chip">
                <div className="mq-logo"><img src={p.img} width="46" height="46" alt={p.name} /></div>
                <div><div className="mq-name">{p.name}</div><div className="mq-cat">{p.cat}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mq-row" style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 80px, black calc(100% - 80px), transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0px, black 80px, black calc(100% - 80px), transparent 100%)', marginBottom: '52px' }}>
          <div className="mq-track" style={{ animation: 'scrollLeft 42s linear infinite' }}>
            {[...PROJECTS_ROW2, ...PROJECTS_ROW2].map((p, i) => (
              <div key={i} className="mq-chip">
                <div className="mq-logo"><img src={p.img} width="46" height="46" alt={p.name} /></div>
                <div><div className="mq-name">{p.name}</div><div className="mq-cat">{p.cat}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <a
            href="/projetos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 32px',
              border: '1.5px solid rgba(49,91,44,0.28)',
              color: '#315B2C',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'background 0.22s, border-color 0.22s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(49,91,44,0.05)'; e.currentTarget.style.borderColor = '#315B2C' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(49,91,44,0.28)' }}
          >
            Ver Todos os Projetos{' '}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section-process" style={{ background: '#FAFAF8', padding: '100px 0', borderTop: '1px solid rgba(49,91,44,0.06)' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                Nosso Processo
              </span>
              <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(3.4vw + 3px), 51px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
              Como entregamos<br />cada projeto
            </h2>
          </div>
          <div style={{ position: 'relative' }} data-animate data-d="1">
            <div style={{ position: 'absolute', top: '22px', left: '40px', right: '40px', height: '1px', background: 'rgba(49,91,44,0.15)' }} />
            <div className="process-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
              {PROCESS_STEPS.map((step) => (
                <div key={step.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      background: step.num === '1' ? '#315B2C' : step.num === '4' ? '#6F8F3A' : '#FFFFFF',
                      border: step.num === '✓' ? 'none' : '1.5px solid rgba(49,91,44,0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                      position: 'relative',
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  >
                    {step.num === '✓' ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 9L7 13L15 5" stroke="#315B2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '20px', fontWeight: 400, color: step.num === '1' || step.num === '4' ? '#F6F4EF' : '#315B2C' }}>
                        {step.num}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: '#315B2C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#888882', lineHeight: 1.6 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIALS */}
      <section className="section-diff" style={{ background: '#FFFFFF', padding: '100px 0', borderTop: '1px solid rgba(49,91,44,0.06)' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 64px' }}>
          <div className="section-header-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '52px' }} data-animate>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '2px', background: '#315B2C' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                  Diferenciais
                </span>
              </div>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(37px, calc(3.4vw + 3px), 51px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                Por que escolher<br />a AgroVisão
              </h2>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openModal() }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 26px',
                background: '#315B2C',
                color: '#F6F4EF',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background 0.22s',
                flexShrink: 0,
                marginBottom: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
            >
              Falar com Especialista
            </a>
          </div>
          <div className="diff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} data-animate data-d="1">
            {DIFFERENTIALS.map((diff) => (
              <div
                key={diff.title}
                className="diff-card"
                style={diff.dark ? { background: '#315B2C', borderColor: '#315B2C' } : {}}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    background: diff.dark ? 'rgba(246,244,239,0.12)' : 'rgba(49,91,44,0.07)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" dangerouslySetInnerHTML={{ __html: diff.icon }} />
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '23px', fontWeight: 500, color: diff.dark ? '#F6F4EF' : '#1a1a18', marginBottom: '8px' }}>
                  {diff.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: diff.dark ? 'rgba(246,244,239,0.75)' : '#777772', lineHeight: 1.72 }}>
                  {diff.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta" style={{ background: '#EEF6E8', padding: '100px 0', borderTop: '1px solid rgba(49,91,44,0.1)' }} data-animate>
        <div className="cta-inner container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(35px, calc(3.8vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em', marginBottom: '16px', textWrap: 'pretty' }}>
              Vamos transformar sua ideia<br />em um{' '}
              <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(31px, calc(3.3vw + 3px), 48px)', color: '#315B2C' }}>
                grande projeto
              </span>
              ?
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17.5px', fontWeight: 400, color: '#4a4a44', lineHeight: 1.8, maxWidth: '440px' }}>
              Fale com nossa equipe e descubra como podemos levar sua iniciativa ainda mais longe.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openModal() }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '15px 36px',
                background: '#315B2C',
                color: '#F6F4EF',
                fontFamily: 'var(--font-sans)',
                fontSize: '14.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'background 0.22s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
            >
              Solicitar Consultoria
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=5591982064340"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 36px',
                background: '#FFFFFF',
                color: '#1a1a18',
                fontFamily: 'var(--font-sans)',
                fontSize: '14.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '8px',
                border: '1.5px solid rgba(49,91,44,0.2)',
                transition: 'border-color 0.22s, background 0.22s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#315B2C'; e.currentTarget.style.background = 'rgba(49,91,44,0.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.2)'; e.currentTarget.style.background = '#FFFFFF' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Fale Conosco pelo WhatsApp
            </a>
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

export default Home
