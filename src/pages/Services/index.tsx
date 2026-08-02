import { useState, useEffect, useCallback } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'
]

const SERVICES_ITEMS = [
  {
    id: 'regularizacao-fundiaria',
    title: 'Regularização<br>Fundiária',
    desc: 'Soluções completas para regularizar sua propriedade rural, com análise de documentação, levantamentos topográficos e procedimentos junto aos órgãos competentes.',
    btn: 'Solicitar Orçamento',
    whatsapp: 'Conversar no WhatsApp',
    bg: '#FFFFFF',
    reversed: false,
    panelBg: '#F5F8F3',
    iconBg: '#315B2C',
    items: [
      { title: 'Análise de Documentação', desc: 'Revisão completa de títulos, matrículas e registros imobiliários para identificar inconsistências.' },
      { title: 'Levantamentos Topográficos', desc: 'Demarcação precisa de limites de propriedade com equipamentos de alta precisão.' },
      { title: 'Procedimentos Legais', desc: 'Acompanhamento de todos os processos junto a cartórios, prefeituras e órgãos ambientais.' },
    ],
  },
  {
    id: 'licenciamento-ambiental',
    title: 'Licenciamento<br>Ambiental',
    desc: 'Orientação especializada em legislação ambiental, com elaboração de estudos técnicos e gestão de processos junto à SEMA e demais órgãos.',
    btn: 'Solicitar Orçamento',
    whatsapp: 'Conversar no WhatsApp',
    bg: '#F8F7F3',
    reversed: true,
    panelBg: '#FFFFFF',
    iconBg: '#6F8F3A',
    items: [
      { title: 'Estudos Ambientais', desc: 'EIA, RIMA, RAS e diagnósticos completos da situação ambiental do empreendimento.' },
      { title: 'Gestão de Licenças', desc: 'LP, LI e LO — coordenação de todos os procedimentos junto aos órgãos licenciadores.' },
      { title: 'Conformidade Regulatória', desc: 'Monitoramento contínuo de regulamentações e adequação às normas ambientais vigentes.' },
    ],
  },
  {
    id: 'georreferenciamento',
    title: 'Georreferenciamento',
    desc: 'Demarcação e registro de propriedades com coordenadas geodésicas certificadas, atendendo às exigências do INCRA.',
    btn: 'Solicitar Orçamento',
    whatsapp: 'Fale com Especialista',
    bg: '#FFFFFF',
    reversed: false,
    panelBg: '#F5F8F3',
    iconBg: '#315B2C',
    items: [
      { title: 'Levantamento com GPS/GNSS', desc: 'Posicionamento de alta precisão em sistema de referência geodésico oficial.' },
      { title: 'Certificação INCRA', desc: 'Memória descritiva e plantas georreferenciadas certificadas pelo Instituto Nacional de Colonização.' },
      { title: 'SIG e Cartografia', desc: 'Mapeamento digital e análise espacial de propriedades rurais com sistemas de informação geográfica.' },
    ],
  },
  {
    id: 'car-ccir',
    title: 'CAR / CCIR<br>e Registros',
    desc: 'Gestão completa de cadastros ambientais, certificados comprobatórios e documentação exigida para propriedades rurais.',
    btn: 'Solicitar Consultoria',
    whatsapp: 'Fale com Especialista',
    bg: '#F8F7F3',
    reversed: true,
    panelBg: '#FFFFFF',
    iconBg: '#6F8F3A',
    items: [
      { title: 'CAR – Cadastro Ambiental', desc: 'Inscrição no Cadastro Ambiental Rural com identificação de áreas de preservação e uso da terra.' },
      { title: 'CCIR / CAFIR / CIB / ITR', desc: 'Obtenção de certificados e documentos comprobatórios para operações e financiamentos rurais.' },
      { title: 'Compliance Ambiental', desc: 'Auditoria de conformidade ambiental e documentação requerida por órgãos reguladores.' },
    ],
  },
  {
    id: 'pronaf',
    title: 'Consultoria<br>PRONAF',
    desc: 'Orientação especializada para pequenos e médios produtores rurais interessados em crédito agrícola e programas de financiamento.',
    btn: 'Solicitar Consultoria',
    whatsapp: 'Conversar no WhatsApp',
    bg: '#FFFFFF',
    reversed: false,
    panelBg: '#F5F8F3',
    iconBg: '#315B2C',
    items: [
      { title: 'Acesso a Crédito', desc: 'Orientação sobre linhas de crédito PRONAF, seus requisitos e processo de solicitação.' },
      { title: 'Elaboração de Projetos', desc: 'Desenvolvimento de projetos técnicos e econômicos para submissão aos bancos e instituições financeiras.' },
      { title: 'Acompanhamento', desc: 'Suporte durante todo o processo de análise e aprovação da solicitação de crédito.' },
    ],
  },
  {
    id: 'gestao-projetos',
    title: 'Gestão de<br>Projetos',
    desc: 'Coordenação completa de projetos agrícolas e rurais, desde o planejamento até a execução e entrega.',
    btn: 'Solicitar Consultoria',
    whatsapp: 'Fale com Especialista',
    bg: '#F8F7F3',
    reversed: true,
    panelBg: '#FFFFFF',
    iconBg: '#6F8F3A',
    items: [
      { title: 'Planejamento Estratégico', desc: 'Definição clara de objetivos, escopo e viabilidade econômica de empreendimentos rurais.' },
      { title: 'Gestão de Recursos', desc: 'Otimização de tempo, orçamento e recursos humanos durante a execução do projeto.' },
      { title: 'Monitoramento', desc: 'Acompanhamento contínuo e relatórios de progresso com correção de desvios.' },
    ],
  },
]

const TABS = [
  { id: 'regularizacao-fundiaria', label: 'Regularização Fundiária' },
  { id: 'licenciamento-ambiental', label: 'Licenciamento Ambiental' },
  { id: 'georreferenciamento', label: 'Georreferenciamento' },
  { id: 'car-ccir', label: 'CAR / CCIR' },
  { id: 'pronaf', label: 'Consultoria PRONAF' },
  { id: 'gestao-projetos', label: 'Gestão de Projetos' },
]

function Services() {
  const [entered, setEntered] = useState(false)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  useEffect(() => {
    setTimeout(() => setEntered(true), 80)
  }, [])

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
      <section className="hero-gap services-hero" style={{ position: 'relative', width: '100%', height: '82vh', minHeight: '600px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1920&q=88&fm=jpg&fit=crop"
          alt="Serviços de consultoria agrícola"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(6,14,4,0.22) 0%, rgba(6,14,4,0.52) 45%, rgba(6,14,4,0.88) 100%)' }} />
        <div className="hero-content hero-content--page" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 120px' }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={up(0.45)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
                <div style={{ width: '36px', height: '1px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Nossos Serviços</span>
              </div>
            </div>
            <div style={up(0.65)}>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(47px, calc(6vw + 1px), 81px)', fontWeight: 400, color: '#F6F4EF', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '28px', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
                Soluções Técnicas<br />para a Amazônia.
              </h1>
            </div>
            <div style={up(0.82)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 500, color: 'rgba(246,244,239,0.85)', lineHeight: 1.85, maxWidth: '560px', marginBottom: '48px', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                Regularização fundiária, licenciamento ambiental, georreferenciamento e gestão de projetos rurais para produtores, empresas e instituições.
              </p>
            </div>
            <div style={up(1.0)}>
              <a
                href="#regularizacao-fundiaria"
                style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
              >
                Explorar Serviços
              </a>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, zIndex: 3, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '72px' }}>
            <path d="M0,72 L1440,72 L1440,20 Q1080,72 720,36 Q360,0 0,36 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* SERVICES NAV */}
      <section className="services-nav" style={{ background: '#FFFFFF', padding: '60px 0 40px', position: 'sticky', top: '80px', zIndex: 99 }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div className="services-tabs" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px', scrollBehavior: 'smooth' }}>
            {TABS.map((tab, idx) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                style={{
                  flexShrink: 0,
                  padding: '10px 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: idx === 0 ? 600 : 500,
                  color: idx === 0 ? '#315B2C' : '#999994',
                  textDecoration: 'none',
                  borderBottom: idx === 0 ? '2px solid #315B2C' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.color = '#555550' }}
                onMouseLeave={(e) => { if (idx !== 0) e.currentTarget.style.color = '#999994' }}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE SECTIONS */}
      {SERVICES_ITEMS.map((svc) => (
        <section
          key={svc.id}
          id={svc.id}
          style={{ background: svc.bg, padding: '100px 0 80px', borderBottom: '1px solid rgba(49,91,44,0.08)' }}
        >
          <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
            <div
              className="service-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: svc.reversed ? '1fr 420px' : '420px 1fr',
                gap: '80px',
                alignItems: 'center',
              }}
            >
              {svc.reversed ? (
                <>
                  <div className="service-panel" style={{ background: svc.panelBg, borderRadius: '14px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', order: -1 }}>
                    {svc.items.map((item) => (
                      <div key={item.title} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ width: '42px', height: '42px', background: svc.iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F6F4EF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: '#1a1a18', marginBottom: '6px' }}>{item.title}</h3>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#666660', lineHeight: 1.6 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ width: '34px', height: '1px', background: '#315B2C', marginBottom: '18px' }} />
                    <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '43px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: svc.title }} />
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#555550', lineHeight: 1.85, marginBottom: '32px' }}>{svc.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); openModal() }}
                        style={{ display: 'inline-block', padding: '14px 32px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s', textAlign: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                      >
                        {svc.btn}
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?phone=5591982064340"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', padding: '13px 32px', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(49,91,44,0.28)', transition: 'border-color 0.25s', textAlign: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.6)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.28)' }}
                      >
                        {svc.whatsapp}
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ width: '34px', height: '1px', background: '#315B2C', marginBottom: '18px' }} />
                    <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '43px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: svc.title }} />
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#555550', lineHeight: 1.85, marginBottom: '32px' }}>{svc.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); openModal() }}
                        style={{ display: 'inline-block', padding: '14px 32px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s', textAlign: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                      >
                        {svc.btn}
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?phone=5591982064340"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', padding: '13px 32px', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(49,91,44,0.28)', transition: 'border-color 0.25s', textAlign: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.6)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(49,91,44,0.28)' }}
                      >
                        {svc.whatsapp}
                      </a>
                    </div>
                  </div>
                  <div className="service-panel" style={{ background: svc.panelBg, borderRadius: '14px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {svc.items.map((item) => (
                      <div key={item.title} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ width: '42px', height: '42px', background: svc.iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F6F4EF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: '#1a1a18', marginBottom: '6px' }}>{item.title}</h3>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#666660', lineHeight: 1.6 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background: '#315B2C', padding: '128px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 84px', textAlign: 'center' }}>
          <div style={{ width: '34px', height: '1px', background: '#B8D48A', margin: '0 auto 18px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '28px' }}>
            Pronto para começar?
          </span>
          <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(4.5vw + 1px), 63px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '24px', textWrap: 'pretty' }}>
            Encontre a solução<br />ideal para seu<br />
            <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(34px, calc(3.9vw + 1px), 54px)', fontStyle: 'normal' }}>projeto</span>.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 500, color: 'rgba(246,244,239,0.75)', lineHeight: 1.85, marginBottom: '52px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Conversamos sobre sua necessidade e apresentamos a melhor proposta técnica e comercial.
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
              Falar no WhatsApp
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
            background: 'rgba(8,18,6,0.62)',
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
          <div className="modal" style={{ background: '#FFFFFF', borderRadius: '12px', width: 'min(720px, 100%)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 100px rgba(0,0,0,0.28)' }}>
            <div style={{ padding: '36px 44px 24px', borderBottom: '1px solid rgba(49,91,44,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1, borderRadius: '12px 12px 0 0' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>Consultoria Gratuita</div>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '31px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2 }}>Solicite um Atendimento</h2>
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
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Nome Completo <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="text" value={mData.name} onChange={ch('name')} placeholder="Seu nome completo" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.name && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Empresa</label>
                    <input type="text" value={mData.company} onChange={ch('company')} placeholder="Nome da empresa (opcional)" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Telefone <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="tel" value={mData.phone} onChange={ch('phone')} placeholder="(91) 9 9999-9999" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.phone && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.phone}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Email <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="email" value={mData.email} onChange={ch('email')} placeholder="seu@email.com.br" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.email && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Município</label>
                    <input type="text" value={mData.city} onChange={ch('city')} placeholder="Sua cidade" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Estado</label>
                    <select
                      value={mData.st}
                      onChange={ch('st')}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Selecione o estado</option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Serviço de Interesse</label>
                  <select
                    value={mData.svc}
                    onChange={ch('svc')}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Selecione o serviço</option>
                    <option value="regularizacao">Regularização Fundiária</option>
                    <option value="licenciamento">Licenciamento Ambiental</option>
                    <option value="georreferenciamento">Georreferenciamento</option>
                    <option value="car">CAR – Cadastro Ambiental Rural</option>
                    <option value="ccir">CCIR / CAFIR / CIB / ITR</option>
                    <option value="pronaf">Consultoria PRONAF</option>
                    <option value="projetos">Projetos Agropecuários</option>
                    <option value="gestao">Gestão de Projetos</option>
                    <option value="outro">Outro / Não sei</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Mensagem <span style={{ color: '#DD8758' }}>*</span></label>
                  <textarea
                    value={mData.msg}
                    onChange={ch('msg')}
                    rows={4}
                    placeholder="Descreva brevemente seu projeto ou necessidade…"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', resize: 'vertical', minHeight: '110px', lineHeight: 1.65 }}
                  />
                  {mErrs.msg && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.msg}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#F8F7F3', borderRadius: '8px', marginBottom: '28px' }}>
                  <input
                    type="checkbox"
                    id="s-prv"
                    checked={mData.ok}
                    onChange={ch('ok')}
                    style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <label htmlFor="s-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
                    Li e concordo com a <a href="#" style={{ color: '#315B2C', textDecoration: 'underline' }}>Política de Privacidade</a> da AgroVisão.
                    {mErrs.ok && <span style={{ display: 'block', fontSize: '12.5px', color: '#c0392b', marginTop: '4px' }}>{mErrs.ok}</span>}
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
                    fontSize: '12.5px',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: mSts === 'sending' ? 'not-allowed' : 'pointer',
                    opacity: mSts === 'sending' ? 0.7 : 1,
                    transition: 'background 0.25s',
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
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '35px', fontWeight: 400, color: '#1a1a18', marginBottom: '16px' }}>Solicitação Enviada!</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#555550', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>
                  Nossa equipe entrará em contato em até <strong style={{ color: '#315B2C' }}>24 horas úteis</strong>. Obrigado pelo interesse na AgroVisão.
                </p>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '14px 44px',
                    background: '#315B2C',
                    color: '#F6F4EF',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.25s',
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

export default Services
