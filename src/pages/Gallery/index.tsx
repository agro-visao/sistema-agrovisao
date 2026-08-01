import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'

interface GalleryImage {
  id: number
  url: string
  alt: string
  sortOrder: number
  createdAt: string
  project: {
    id: number
    slug: string
    name: string
    category: string
    categoryLabel: string
  }
}

async function fetchGalleryImages(): Promise<GalleryImage[] | null> {
  try {
    const res = await fetch('/api/project-images')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data && json.data.length > 0) {
      return json.data as GalleryImage[]
    }
  } catch (_) {}
  return null
}

function Gallery() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setEntered(true), 80)
  }, [])

  useEffect(() => {
    fetchGalleryImages().then((data) => {
      if (data) {
        setImages(data)
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
    // Abre modal de contato no Header
  }, [])

  const up = (d: number) => ({
    opacity: entered ? 1 : 0,
    transform: entered ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 0.9s ease ${d}s, transform 0.9s ease ${d}s`,
  })

  return (
    <>
      <Header onOpenModal={openModal} />

      {/* HERO */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '760px', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=88&fm=jpg&fit=crop"
          alt="Galeria de Projetos"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, rgba(6,14,4,0.14) 0%, rgba(6,14,4,0.48) 40%, rgba(6,14,4,0.90) 100%)' }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 116px' }}>
          <div style={{ maxWidth: '880px' }}>
            <div style={up(0.4)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
                <div style={{ width: '36px', height: '1px', background: '#B8D48A' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#B8D48A', letterSpacing: '0.32em', textTransform: 'uppercase' }}>Galeria · Atividades em Campo</span>
              </div>
            </div>
            <div style={up(0.62)}>
              <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(42px, 5.6vw, 76px)', fontWeight: 300, color: '#F6F4EF', lineHeight: 1.06, letterSpacing: '-0.022em', marginBottom: '28px', textWrap: 'pretty' }}>
                Acompanhe Nossas<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(36px, 4.8vw, 65px)', fontStyle: 'normal' }}>Atividades em Campo.</span>
              </h1>
            </div>
            <div style={up(0.84)}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 400, color: 'rgba(246,244,239,0.80)', lineHeight: 1.80, maxWidth: '580px', marginBottom: '52px' }}>
                Visitas técnicas, capacitações, construções e momentos de trabalho com as comunidades que atendemos na Amazônia Legal.
              </p>
            </div>
            <div style={up(1.04)}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="#galeria"
                  onClick={(e) => { e.preventDefault(); document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.25s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Ver Galeria
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

      {/* GALLERY GRID */}
      <section id="galeria" style={{ background: '#FFFFFF', padding: '140px 0' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Galeria de Imagens</span>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(38px, 4.2vw, 58px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '18px' }}>Momentos do Trabalho</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#666660', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto' }}>Registros visuais dos projetos, atividades comunitárias e transformações alcançadas através do nosso trabalho.</p>
          </div>

          {!loaded ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ width: '40px', height: '40px', border: '2px solid rgba(49,91,44,0.15)', borderTopColor: '#315B2C', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#888882' }}>Carregando galeria...</p>
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: '#888882' }}>Galeria em breve. Fique atento às próximas atualizações!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '80px' }} data-animate>
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => navigate(`/projetos/${encodeURIComponent(img.project.slug)}`)}
                    style={{ overflow: 'hidden', borderRadius: '14px', cursor: 'pointer', background: '#FFFFFF', border: '1px solid rgba(49,91,44,0.08)', transition: 'box-shadow 0.25s, transform 0.25s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(49,91,44,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ position: 'relative', height: '280px', overflow: 'hidden', background: '#F5F8F3' }}>
                      <img
                        src={img.url}
                        alt={img.alt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(6,14,4,0.5) 0%, rgba(6,14,4,0.1) 60%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                        <div style={{ width: '100%' }}>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 600, color: '#B8D48A', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                            {img.project.categoryLabel}
                          </div>
                          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '18px', fontWeight: 500, color: '#F6F4EF', lineHeight: 1.2 }}>
                            {img.project.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '18px 20px' }}>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 400, color: '#777772', lineHeight: 1.6, margin: 0, minHeight: '40px' }}>
                        {img.alt}
                      </p>
                      <div style={{ marginTop: '14px' }}>
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(49,91,44,0.08)', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, borderRadius: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Ver Projeto
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F5F8F3', padding: '100px 0', borderTop: '1px solid rgba(49,91,44,0.07)' }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 84px' }}>
          <div style={{ textAlign: 'center' }} data-animate>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 500, color: '#6F8F3A', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Interessado em Colaborar</span>
              <div style={{ width: '34px', height: '1px', background: '#315B2C' }} />
            </div>
            <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 'clamp(36px, 4.2vw, 52px)', fontWeight: 400, color: '#1a1a18', lineHeight: 1.1, letterSpacing: '-0.018em', marginBottom: '28px', textWrap: 'pretty' }}>
              Vamos transformar sua<br /><span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 'clamp(31px, 3.6vw, 45px)', color: '#315B2C', fontStyle: 'normal' }}>ideia em projeto realizado.</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#666660', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 40px' }}>
              Conheça nossos serviços especializados e descubra como podemos ajudar seu projeto ou instituição.
            </p>
            <button
              onClick={() => openModal()}
              style={{ display: 'inline-block', padding: '15px 40px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
            >
              Solicitar Orçamento
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default Gallery
