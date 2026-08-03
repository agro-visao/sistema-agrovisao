import { useState, useEffect, useCallback } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'
]

function Contact() {
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
      <section className="hero-gap contact-hero" style={{ position: 'relative', width: '100%', height: '82vh', minHeight: '600px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1920&q=88&fm=jpg&fit=crop"
          alt="Paisagem agrícola amazônica"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(6,14,4,0.22) 0%, rgba(6,14,4,0.52) 45%, rgba(6,14,4,0.88) 100%)' }} />
        <div className="hero-content hero-content--page" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 120px' }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={up(0.45)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
                <div style={{ width: '36px', height: '1px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Fale Conosco · Ananindeua, Pará</span>
              </div>
            </div>
            <div style={up(0.65)}>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(49px, calc(6vw + 3px), 83px)', fontWeight: 400, color: '#F6F4EF', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '28px', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
                Vamos conversar<br />sobre seu <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(44px, calc(5.1vw + 3px), 71px)', fontStyle: 'normal' }}>projeto</span>.
              </h1>
            </div>
            <div style={up(0.82)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '19px', fontWeight: 500, color: 'rgba(246,244,239,0.85)', lineHeight: 1.85, maxWidth: '560px', marginBottom: '48px', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                Nossa equipe está pronta para orientar você em regularização fundiária, licenciamento ambiental, projetos rurais e desenvolvimento sustentável.
              </p>
            </div>
            <div style={up(1.0)}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); openModal() }}
                  style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Enviar Mensagem
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=5591982064340"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(246,244,239,0.4)', transition: 'border-color 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.72)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(246,244,239,0.4)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, zIndex: 3, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '72px' }}>
            <path d="M0,72 L1440,72 L1440,20 Q1080,72 720,36 Q360,0 0,36 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* CONTACT INFO CARDS */}
      <section style={{ background: '#FFFFFF', padding: '80px 0 100px' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ width: '34px', height: '1px', background: '#315B2C', margin: '0 auto 18px' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Informações</span>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(4vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>Como nos encontrar</h2>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {/* Address card */}
            <div
              style={{ background: '#FFFFFF', border: '1px solid rgba(49,91,44,0.1)', borderRadius: '14px', padding: '36px 28px', transition: 'box-shadow 0.25s, transform 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(49,91,44,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', background: '#F5F8F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" color="#315B2C">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Endereço</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 400, color: '#444440', lineHeight: 1.8 }}>
                ROD BR 316, 1762<br />
                Edifício Living Next Office<br />
                Bairro Atalaia<br />
                CEP 67013-000<br />
                Ananindeua · Pará · Brasil
              </div>
            </div>

            {/* WhatsApp card */}
            <a
              href="https://api.whatsapp.com/send?phone=5591982064340"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#FFFFFF', border: '1px solid rgba(49,91,44,0.1)', borderRadius: '14px', padding: '36px 28px', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.25s, transform 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(49,91,44,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', background: '#F5F8F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#315B2C"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>WhatsApp</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '21px', fontWeight: 500, color: '#315B2C', lineHeight: 1.4, marginBottom: '8px' }}>(91) 98206-4340</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15.5px', fontWeight: 400, color: '#888882' }}>Clique para conversar</div>
            </a>

            {/* Email card */}
            <a
              href="mailto:contato@agrovisaopara.com.br"
              style={{ background: '#FFFFFF', border: '1px solid rgba(49,91,44,0.1)', borderRadius: '14px', padding: '36px 28px', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.25s, transform 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(49,91,44,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', background: '#F5F8F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="#315B2C" strokeWidth="1.4" fill="none" />
                  <path d="M2 8L12 14L22 8" stroke="#315B2C" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Email</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 500, color: '#315B2C', lineHeight: 1.5, wordBreak: 'break-all', marginBottom: '8px' }}>contato@agrovisaopara.com.br</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15.5px', fontWeight: 400, color: '#888882' }}>Resposta em até 24h</div>
            </a>

            {/* Hours card */}
            <div
              style={{ background: '#F5F8F3', border: '1px solid rgba(49,91,44,0.1)', borderRadius: '14px', padding: '36px 28px', transition: 'box-shadow 0.25s, transform 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(49,91,44,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', background: '#FFFFFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#315B2C" strokeWidth="1.4" fill="none" />
                  <path d="M12 7V12L15.5 14.5" stroke="#315B2C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Atendimento</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 600, color: '#1a1a18', marginBottom: '6px' }}>Segunda a Sexta</div>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '31px', fontWeight: 300, color: '#315B2C', lineHeight: 1.1, marginBottom: '4px' }}>08h – 18h</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15.5px', fontWeight: 400, color: '#888882' }}>Horário de Brasília</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL NETWORKS */}
      <section style={{ background: '#F8F7F3', padding: '100px 0', borderTop: '1px solid rgba(49,91,44,0.07)', borderBottom: '1px solid rgba(49,91,44,0.07)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ width: '34px', height: '1px', background: '#315B2C', margin: '0 auto 18px' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Redes Sociais</span>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(4vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>Acompanhe a AgroVisão</h2>
          </div>

          <div className="social-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/visaogestaodeprojetos/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px', border: '1px solid rgba(49,91,44,0.1)', transition: 'box-shadow 0.25s, transform 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 40px rgba(49,91,44,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: '52px', height: '52px', background: '#F5F8F3', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" color="#315B2C">
                  <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: '#1a1a18', marginBottom: '4px' }}>Instagram</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 400, color: '#888882' }}>@visaogestaodeprojetos</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section style={{ background: '#F5F8F3', padding: '80px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 64px' }}>
          <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '60px', alignItems: 'start' }}>
            {/* Left panel */}
            <div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.26em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Localização</span>
              <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '49px', fontWeight: 600, color: '#1a1a18', lineHeight: 1.1, marginBottom: '12px' }}>Onde estamos</h2>
              <div style={{ width: '40px', height: '3px', background: '#315B2C', borderRadius: '2px', marginBottom: '22px' }} />
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 400, color: '#555550', lineHeight: 1.82, marginBottom: '36px' }}>
                Estamos estrategicamente localizados na Rodovia BR-316, próximos à Castanheira, no coração de Ananindeua, facilitando o atendimento em toda Amazônia Legal.
              </p>

              {/* Escritório */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '26px' }}>
                <div style={{ width: '44px', height: '44px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#F6F4EF" strokeWidth="1.6" fill="none" />
                    <circle cx="12" cy="9" r="2.5" stroke="#F6F4EF" strokeWidth="1.6" fill="none" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Escritório</span>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#1a1a18', lineHeight: 1.7 }}>
                    Sala Comercial 206 Next Office<br />BR 316, próximo à Castanheira<br />Ananindeua - PA
                  </div>
                </div>
              </div>

              {/* Fazenda */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '26px' }}>
                <div style={{ width: '44px', height: '44px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#F6F4EF" strokeWidth="1.6" fill="none" />
                    <circle cx="12" cy="9" r="2.5" stroke="#F6F4EF" strokeWidth="1.6" fill="none" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Fazenda</span>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#1a1a18', lineHeight: 1.7 }}>
                    Fazendinha de Jesus<br />Pau d'Arco - Santa Bárbara do Pará
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href="https://api.whatsapp.com/send?phone=5591982064340"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '26px', textDecoration: 'none' }}
              >
                <div style={{ width: '44px', height: '44px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F6F4EF"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>WhatsApp</span>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '23px', fontWeight: 700, color: '#1a1a18', lineHeight: 1.45 }}>
                    (91) 98206-4340<br />(91) 98719-0993
                  </div>
                </div>
              </a>

              {/* Atendimento */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '36px' }}>
                <div style={{ width: '44px', height: '44px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="#F6F4EF" strokeWidth="1.6" fill="none" />
                    <path d="M8 2V6M16 2V6M3 10H21" stroke="#F6F4EF" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#6F8F3A', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Atendimento</span>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 600, color: '#1a1a18', lineHeight: 1.6 }}>
                    Segunda a Sexta<br />08:00 às 18:00
                  </div>
                </div>
              </div>

              {/* CTA card */}
              <div style={{ background: '#1D3318', borderRadius: '18px', padding: '28px 30px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#B8D48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <circle cx="9" cy="11" r="0.8" fill="#B8D48A" />
                      <circle cx="12" cy="11" r="0.8" fill="#B8D48A" />
                      <circle cx="15" cy="11" r="0.8" fill="#B8D48A" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '25px', fontWeight: 600, color: '#F6F4EF', lineHeight: 1.3 }}>Vamos conversar sobre seu projeto?</h3>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 500, color: 'rgba(246,244,239,0.65)', lineHeight: 1.65, marginBottom: '22px' }}>
                  Nossa equipe está pronta para atender você.
                </p>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); openModal() }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px 24px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '10px', transition: 'background 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#3d7036' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Enviar Mensagem
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F6F4EF"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
              </div>
            </div>

            {/* Right: location map image */}
            <div style={{ position: 'relative', paddingBottom: '48px', paddingRight: '48px' }}>
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '500px', height: '260px', border: '1.5px solid rgba(49,91,44,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: '-44px', bottom: '-44px', width: '400px', height: '400px', border: '1px solid rgba(49,91,44,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 70px rgba(0,0,0,0.14)', height: '720px' }}>
                <img src="/assets/images/mapa.png" alt="Localização AgroVisão no mapa de Ananindeua" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CONTACT */}
      <section style={{ background: '#F5F8F3', padding: '112px 0', borderTop: '1px solid rgba(49,91,44,0.08)', borderBottom: '1px solid rgba(49,91,44,0.08)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div style={{ width: '34px', height: '1px', background: '#315B2C', margin: '0 auto 18px' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Diferenciais</span>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(39px, calc(4vw + 3px), 55px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.015em' }}>Por que nos contatar</h2>
          </div>
          <div className="reasons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px', border: '1px solid rgba(49,91,44,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="#F6F4EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '25px', fontWeight: 500, color: '#1a1a18', lineHeight: 1.2 }}>Atendimento Especializado</h3>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16.5px', fontWeight: 400, color: '#666660', lineHeight: 1.78 }}>Profissionais altamente qualificados com foco exclusivo em soluções agrícolas e fundiárias.</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px', border: '1px solid rgba(49,91,44,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="#F6F4EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '25px', fontWeight: 500, color: '#1a1a18', lineHeight: 1.2 }}>Equipe Técnica</h3>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16.5px', fontWeight: 400, color: '#666660', lineHeight: 1.78 }}>Engenheiros agrônomos, ambientais, geógrafos e advogados especializados em direito agrário.</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '36px 32px', border: '1px solid rgba(49,91,44,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', background: '#315B2C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="#F6F4EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '25px', fontWeight: 500, color: '#1a1a18', lineHeight: 1.2 }}>Consultoria Personalizada</h3>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16.5px', fontWeight: 400, color: '#666660', lineHeight: 1.78 }}>Cada projeto é único. Desenvolvemos soluções sob medida para a sua realidade e necessidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#315B2C', padding: '128px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 84px', textAlign: 'center' }}>
          <div style={{ width: '34px', height: '1px', background: '#B8D48A', margin: '0 auto 18px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.24em', textTransform: 'uppercase', display: 'block', marginBottom: '28px' }}>Próximo Passo</span>
          <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(41px, calc(4.5vw + 3px), 65px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '24px', textWrap: 'pretty' }}>
            Vamos construir seu próximo<br />projeto <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(36px, calc(3.9vw + 3px), 56px)', fontStyle: 'normal' }}>juntos</span>.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 500, color: 'rgba(246,244,239,0.75)', lineHeight: 1.85, marginBottom: '52px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Preencha o formulário de contato ou fale diretamente pelo WhatsApp. Nossa equipe especializada está pronta para orientar você.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); openModal() }}
              style={{ display: 'inline-block', padding: '16px 44px', background: '#F6F4EF', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ede9e2' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F6F4EF' }}
            >
              Solicitar Consultoria
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=5591982064340"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 40px', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '14.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(246,244,239,0.4)', transition: 'border-color 0.25s' }}
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
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>Consultoria Gratuita</div>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '33px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.2 }}>Solicite um Atendimento</h2>
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
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Nome Completo <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="text" value={mData.name} onChange={ch('name')} placeholder="Seu nome completo" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.name && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Empresa</label>
                    <input type="text" value={mData.company} onChange={ch('company')} placeholder="Nome da empresa (opcional)" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Telefone <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="tel" value={mData.phone} onChange={ch('phone')} placeholder="(91) 9 9999-9999" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.phone && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.phone}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Email <span style={{ color: '#DD8758' }}>*</span></label>
                    <input type="email" value={mData.email} onChange={ch('email')} placeholder="seu@email.com.br" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                    {mErrs.email && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14.5px', color: '#c0392b', marginTop: '5px', display: 'block' }}>{mErrs.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Município</label>
                    <input type="text" value={mData.city} onChange={ch('city')} placeholder="Sua cidade" style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Estado</label>
                    <select
                      value={mData.st}
                      onChange={ch('st')}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Selecione o estado</option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Serviço de Interesse</label>
                  <select
                    value={mData.svc}
                    onChange={ch('svc')}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(49,91,44,0.2)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '17px', color: '#1a1a18', background: '#FAFAF9', outline: 'none', appearance: 'none', cursor: 'pointer' }}
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
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Mensagem <span style={{ color: '#DD8758' }}>*</span></label>
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
                    id="c-prv"
                    checked={mData.ok}
                    onChange={ch('ok')}
                    style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <label htmlFor="c-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
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
                <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '37px', fontWeight: 400, color: '#1a1a18', marginBottom: '16px' }}>Solicitação Enviada!</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: '#555550', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>
                  Nossa equipe entrará em contato em até <strong style={{ color: '#315B2C' }}>24 horas úteis</strong>. Obrigado pelo interesse na AgroVisão.
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

export default Contact
