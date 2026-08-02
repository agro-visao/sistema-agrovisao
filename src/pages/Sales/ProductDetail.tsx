import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'
import type { Product } from '../../data/products'
import { PRODUCTS, formatBRL } from '../../data/products'
import styles from './ProductDetail.module.css'

const WHATSAPP_NUMBER = '5591982064340'

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`)
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data) {
      const p = json.data
      return {
        id: p.id || 0,
        slug: p.slug,
        name: p.name,
        description: p.description || '',
        descriptionFull: undefined,
        category: p.category || 'mudas',
        categoryLabel: p.category_label || 'Mudas',
        image: p.image_url || '',
        // Principal + complementares, na ordem em que foram cadastradas.
        gallery: Array.isArray(p.gallery) ? p.gallery.filter(Boolean) : [],
        // Mesmos campos camelCase do /api/products (valores em centavos).
        originalPrice: p.originalPrice || null,
        price: p.price || 0,
        stock: p.stock || 0,
        featured: p.featured === 1,
        technicalInfo: undefined,
        whatsappText: p.whatsapp_text || '',
      }
    }
  } catch {}
  return null
}

const INSTITUTIONAL_BENEFITS = [
  { title: 'Qualidade Garantida', desc: 'Mudas certificadas e fiscalizadas pelos órgãos competentes.', icon: 'check' },
  { title: 'Atendimento Especializado', desc: 'Equipe técnica pronta para orientar sua compra.', icon: 'headset' },
  { title: 'Entrega Segura', desc: 'Logística cuidadosa para todo o Brasil.', icon: 'truck' },
  { title: 'Parceria de Confiança', desc: 'Mais de 10 anos de experiência no mercado agrícola.', icon: 'star' },
]

function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [mainImg, setMainImg] = useState(0)
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!slug) return
    const decodedSlug = decodeURIComponent(slug)
    fetchProductBySlug(decodedSlug).then((data) => {
      if (data) {
        setProduct(data)
      } else {
        const fallback = PRODUCTS.find((p) => p.slug === decodedSlug)
        if (fallback) {
          setProduct(fallback)
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

  const ch = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = 'checked' in e.target && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setMData((prev) => ({ ...prev, [field]: val }))
    setMErrs((prev) => ({ ...prev, [field]: '' }))
  }

  if (notFound) {
    return (
      <>
        <Header onOpenModal={openModal} />
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Produto não encontrado</h1>
          <p className={styles.notFoundDesc}>
            O produto que você está procurando pode ter sido removido ou o endereço está incorreto.
          </p>
          <Link to="/vendas" className={styles.notFoundBtn}>
            Ver Todos os Produtos
          </Link>
        </div>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header onOpenModal={openModal} />
        <div className={styles.loading}>
          <div className={styles.loadingSpin} />
          <p className={styles.loadingText}>Carregando produto...</p>
        </div>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  const galleryImages = product.gallery.length > 0
    ? product.gallery
    : product.image
      ? [product.image]
      : []

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  ).slice(0, 4)

  const stockLabel = product.stock > 5
    ? 'Em estoque'
    : product.stock > 0
      ? 'Estoque limitado'
      : 'Sob consulta'

  const stockClass = product.stock > 5
    ? styles.stockAvailable
    : product.stock > 0
      ? styles.stockLow
      : styles.stockOut

  const whatsappLink = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
    (product.whatsappText || `Olá! Tenho interesse em comprar ${product.name}.`) +
    `\n\nQuantidade: ${qty} unidade(s)`
  )}`

  const techEntries = product.technicalInfo
    ? Object.entries(product.technicalInfo).filter(([, v]) => v)
    : []

  const techLabels: Record<string, string> = {
    especie: 'Espécie',
    nomeCientifico: 'Nome Científico',
    tamanho: 'Tamanho',
    quantidade: 'Quantidade',
    solos: 'Solos',
    clima: 'Clima',
    inicioProducao: 'Início da Produção',
    aplicacao: 'Aplicação',
    certificacao: 'Certificação',
    prazoPostagem: 'Prazo de Postagem',
  }

  return (
    <>
      <Header onOpenModal={openModal} />

      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <div className={styles.breadcrumbList}>
            <Link to="/" className={styles.breadcrumbLink}>Início</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link to="/vendas" className={styles.breadcrumbLink}>Vendas</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{product.categoryLabel}</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </div>
        </nav>

        <div className={styles.main}>
          <div className={styles.gallery}>
            <div className={styles.mainImageWrap}>
              {galleryImages[mainImg] ? (
                <img
                  src={galleryImages[mainImg]}
                  alt={product.name}
                  className={styles.mainImage}
                />
              ) : (
                <div className={styles.mainImagePlaceholder}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
                    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className={styles.thumbnails}>
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`${styles.thumb} ${idx === mainImg ? styles.thumbActive : ''}`}
                    onClick={() => setMainImg(idx)}
                  >
                    {img ? (
                      <img src={img} alt="" className={styles.thumbImg} />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.category}>{product.categoryLabel}</span>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.priceRow}>
              {product.originalPrice !== null && (
                <span className={styles.originalPrice}>{formatBRL(product.originalPrice)}</span>
              )}
              <span className={styles.currentPrice}>{formatBRL(product.price)}</span>
            </div>

            <span className={`${styles.stock} ${stockClass}`}>{stockLabel}</span>

            {product.stock > 0 && (
              <div className={styles.qtyRow}>
                <span className={styles.qtyLabel}>Quantidade</span>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className={styles.qtyValue}
                    value={qty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) setQty(v)
                    }}
                    min="1"
                  />
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(qty + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnPrimary}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Tenho interesse
              </a>
              <button className={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Calcular frete
              </button>
            </div>
          </div>
        </div>

        <section className={styles.descSection}>
          <div className={styles.descTitle}>Descrição do Produto</div>
          <p className={styles.descText}>
            {product.descriptionFull || product.description}
          </p>
        </section>
      </div>

      {techEntries.length > 0 && (
        <section className={styles.techSection}>
          <div className={styles.techInner}>
            <div className={styles.techTitle}>Informações Técnicas</div>
            <div className={styles.techGrid}>
              {techEntries.map(([key, value]) => (
                <div key={key} className={styles.techItem}>
                  <span className={styles.techLabel}>{techLabels[key] || key}</span>
                  <span className={styles.techValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.benefitsSection}>
        <div className={styles.benefitsInner}>
          <h2 className={styles.benefitsTitle}>Por que comprar com a AgroVisão?</h2>
          <div className={styles.benefitsGrid}>
            {INSTITUTIONAL_BENEFITS.map((b, idx) => (
              <div key={idx} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  {b.icon === 'check' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8 14L16 6" stroke="#F6F4EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {b.icon === 'headset' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 13V10a7 7 0 0114 0v3" stroke="#F6F4EF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 13a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1a2 2 0 012-2h3v3zM3 13a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 00-2-2H3v3z" stroke="#F6F4EF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {b.icon === 'truck' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="1" y="7" width="12" height="8" rx="1" stroke="#F6F4EF" strokeWidth="1.3" fill="none" />
                      <path d="M13 11h3l3-3v4a2 2 0 01-2 2h-1" stroke="#F6F4EF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="5" cy="15" r="1.5" stroke="#F6F4EF" strokeWidth="1.2" fill="none" />
                      <circle cx="15" cy="15" r="1.5" stroke="#F6F4EF" strokeWidth="1.2" fill="none" />
                    </svg>
                  )}
                  {b.icon === 'star' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 1l2.39 4.84L17.6 7l-3.8 3.7.9 5.24L10 13.22 5.3 15.94l.9-5.24L2.4 7l5.21-1.16L10 1z" stroke="#F6F4EF" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <h4 className={styles.benefitCardTitle}>{b.title}</h4>
                <p className={styles.benefitCardDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedInner}>
            <div className={styles.relatedTitle}>Produtos Relacionados</div>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p) => (
                <div
                  key={p.slug}
                  className={styles.relatedCard}
                  onClick={() => {
                    setMainImg(0)
                    setQty(1)
                    navigate(`/vendas/${encodeURIComponent(p.slug)}`)
                  }}
                >
                  <div className={styles.relatedCardImage}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8D48A' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.relatedCardBody}>
                    <div className={styles.relatedCardCat}>{p.categoryLabel}</div>
                    <div className={styles.relatedCardName}>{p.name}</div>
                    <div className={styles.relatedCardPrice}>{formatBRL(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppButton />

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'].map((uf) => (<option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>))}
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
                  <input type="checkbox" id="pd-prv" checked={mData.ok} onChange={ch('ok')} style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="pd-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
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
    </>
  )
}

export default ProductDetail
