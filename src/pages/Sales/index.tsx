import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'
import type { Product } from '../../data/products'
import { PRODUCTS, CATEGORIES, formatBRL } from '../../data/products'
import styles from './Sales.module.css'

interface Category {
  id?: number
  key: string
  label: string
}

async function fetchProducts(): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/products')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data && json.data.length > 0) {
      return json.data.map((p: Record<string, unknown>) => ({
        id: (p.id as number) || 0,
        slug: p.slug as string,
        name: p.name as string,
        description: (p.description as string) || '',
        descriptionFull: undefined,
        category: (p.category as string) || 'mudas',
        categoryLabel: (p.category_label as string) || 'Mudas',
        image: (p.image_url as string) || '',
        gallery: [],
        originalPrice: (p.compare_price_cents as number) || null,
        price: (p.price_cents as number) || 0,
        stock: (p.stock as number) || 0,
        featured: (p.featured as number) === 1,
        technicalInfo: undefined,
        whatsappText: (p.whatsapp_text as string) || '',
      }))
    }
  } catch {}
  return null
}

async function fetchCategories(): Promise<Category[] | null> {
  try {
    const res = await fetch('/api/categories')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data && json.data.length > 0) {
      return json.data.map((c: Record<string, unknown>) => ({
        id: (c.id as number) || 0,
        key: (c.key as string) || '',
        label: (c.label as string) || '',
      }))
    }
  } catch {}
  return null
}

const BENEFITS = [
  'Entrega para todo o Brasil',
  'Compra segura',
  'Atendimento especializado',
  'Produtos certificados',
]

function Sales() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('todos')
  const [mOpen, setMOpen] = useState(false)
  const [mSts, setMSts] = useState<'idle' | 'sending' | 'success'>('idle')
  const [mData, setMData] = useState({ name: '', company: '', phone: '', email: '', city: '', st: '', svc: '', msg: '', ok: false })
  const [mErrs, setMErrs] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(([productsData, categoriesData]) => {
      if (productsData && productsData.length > 0) {
        setProducts(productsData)
      } else {
        setProducts(PRODUCTS)
      }

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData)
      } else {
        setCategories(CATEGORIES.filter(c => c.key !== 'todos'))
      }

      setLoaded(true)
    }).catch(() => {
      setProducts(PRODUCTS)
      setCategories(CATEGORIES.filter(c => c.key !== 'todos'))
      setLoaded(true)
      setLoadError(true)
    })
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

  const ch = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = 'checked' in e.target && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setMData((prev) => ({ ...prev, [field]: val }))
    setMErrs((prev) => ({ ...prev, [field]: '' }))
  }

  const query = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filtered = products.filter((p) => {
    const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const descNorm = p.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const matchSearch = !search || nameNorm.includes(query) || descNorm.includes(query)
    const matchCat = activeCat === 'todos' || p.category === activeCat
    return matchSearch && matchCat
  })

  const retry = () => {
    setLoadError(false)
    setLoaded(false)
    Promise.all([fetchProducts(), fetchCategories()]).then(([productsData, categoriesData]) => {
      if (productsData && productsData.length > 0) {
        setProducts(productsData)
      } else {
        setProducts(PRODUCTS)
      }

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData)
      } else {
        setCategories(CATEGORIES.filter(c => c.key !== 'todos'))
      }

      setLoaded(true)
    }).catch(() => {
      setProducts(PRODUCTS)
      setCategories(CATEGORIES.filter(c => c.key !== 'todos'))
      setLoaded(true)
      setLoadError(true)
    })
  }

  return (
    <>
      <Header onOpenModal={openModal} />

      <div className={styles.page}>
        <div className={styles.benefits}>
          <div className={styles.benefitsInner}>
            {BENEFITS.map((b, i) => (
              <div key={i} className={styles.benefitItem}>
                <div className={styles.benefitDot} />
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <div className={styles.eyebrow}>
              <div className={styles.eyebrowLine} />
              <span className={styles.eyebrowText}>Vitrine de Produtos</span>
            </div>
            <h2 className={styles.title}>Destaques</h2>
          </div>
          <div className={styles.controls}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className={styles.searchInput}
            />
            <div className={styles.filterGroup}>
              <button
                onClick={() => setActiveCat('todos')}
                className={`${styles.filterBtn} ${activeCat === 'todos' ? styles.filterBtnActive : ''}`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCat(cat.key)}
                  className={`${styles.filterBtn} ${activeCat === cat.key ? styles.filterBtnActive : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.grid}>
            {!loaded ? (
              <div className={styles.loading}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Carregando produtos...</p>
              </div>
            ) : loadError && products.length === 0 ? (
              <div className={styles.errorBox}>
                <div className={styles.emptyIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#DD8758" strokeWidth="1.5" fill="none" />
                    <path d="M12 8v5M12 15.5v.5" stroke="#DD8758" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className={styles.errorTitle}>Erro ao carregar</h3>
                <p className={styles.errorDesc}>
                  Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.
                </p>
                <button onClick={retry} className={styles.errorBtn}>
                  Tentar Novamente
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6" stroke="#315B2C" strokeWidth="1.5" fill="none" />
                    <path d="M16 16L21 21" stroke="#315B2C" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>
                  {search ? 'Nenhum resultado encontrado' : 'Nenhum produto disponível'}
                </h3>
                <p className={styles.emptyDesc}>
                  {search
                    ? `Nenhum produto corresponde a "${search}". Tente outros termos.`
                    : 'Nenhum produto encontrado nesta categoria.'}
                </p>
                {(search || activeCat !== 'todos') && (
                  <button
                    onClick={() => { setSearch(''); setActiveCat('todos') }}
                    className={styles.emptyBtn}
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.productGrid}>
                {filtered.map((p) => (
                  <div
                    key={p.slug}
                    className={styles.card}
                    onClick={() => navigate(`/vendas/${encodeURIComponent(p.slug)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.cardImageWrap}>
                      {p.originalPrice !== null && (
                        <span className={`${styles.cardBadge} ${styles.badgeOffer}`}>Oferta</span>
                      )}
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className={styles.cardImage}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.cardImagePlaceholder}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
                            <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <span className={styles.cardCategory}>{p.categoryLabel}</span>
                      <h3 className={styles.cardTitle}>{p.name}</h3>
                      <p className={styles.cardDesc}>{p.description}</p>
                      <div className={styles.cardPriceRow}>
                        {p.originalPrice !== null && (
                          <span className={styles.cardOriginalPrice}>
                            {formatBRL(p.originalPrice)}
                          </span>
                        )}
                        <span className={styles.cardPrice}>{formatBRL(p.price)}</span>
                      </div>
                      <span
                        className={styles.cardBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/vendas/${encodeURIComponent(p.slug)}`)
                        }}
                      >
                        Ver detalhes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

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
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO','outro'].map((uf) => (<option key={uf} value={uf}>{uf === 'outro' ? 'Outro' : uf}</option>))}
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
                  <input type="checkbox" id="s-prv" checked={mData.ok} onChange={ch('ok')} style={{ width: '18px', height: '18px', accentColor: '#315B2C', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="s-prv" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400, color: '#555550', lineHeight: 1.65, cursor: 'pointer' }}>
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
    </>
  )
}

export default Sales
