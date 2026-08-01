import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'
import styles from '../Sales/Sales.module.css'

interface ProjectGallery {
  id: number
  slug: string
  name: string
  category: string
  categoryLabel: string
  firstImage: string
  imageCount: number
}

async function fetchProjectGalleries(): Promise<ProjectGallery[] | null> {
  try {
    const res = await fetch('/api/project-images')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data && json.data.length > 0) {
      const grouped = new Map<number, { project: any; images: any[] }>()

      json.data.forEach((img: any) => {
        const key = img.project.id
        if (!grouped.has(key)) {
          grouped.set(key, { project: img.project, images: [] })
        }
        grouped.get(key)!.images.push(img)
      })

      return Array.from(grouped.values()).map((g) => {
        // A capa é o registro marcado como destaque no painel; sem destaque
        // definido, usa o primeiro registro (nunca uma foto complementar).
        const cover =
          g.images.find((img: any) => img.featured) ||
          g.images.find((img: any) => !img.parentId) ||
          g.images[0]
        return {
          id: g.project.id,
          slug: g.project.slug,
          name: g.project.name,
          category: g.project.category,
          categoryLabel: g.project.categoryLabel,
          firstImage: cover?.url || '',
          imageCount: g.images.length,
        }
      })
    }
  } catch (_) {}
  return null
}

const BENEFITS = [
  'Documentação visual de projetos',
  'Histórico de atividades',
  'Acompanhamento técnico',
  'Atividades em campo',
]

function Gallery() {
  const navigate = useNavigate()
  const [galleries, setGalleries] = useState<ProjectGallery[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchProjectGalleries().then((data) => {
      if (data) {
        setGalleries(data)
      }
      setLoaded(true)
    }).catch(() => {
      setLoaded(true)
      setLoadError(true)
    })
  }, [])

  const query = search.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const filtered = galleries.filter((g) => {
    const nameNorm = g.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const matchSearch = !search || nameNorm.includes(query)
    return matchSearch
  })

  const retry = () => {
    setLoadError(false)
    setLoaded(false)
    fetchProjectGalleries().then((data) => {
      if (data) {
        setGalleries(data)
      }
      setLoaded(true)
    }).catch(() => {
      setLoaded(true)
      setLoadError(true)
    })
  }

  return (
    <>
      <Header onOpenModal={() => {}} />

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
              <span className={styles.eyebrowText}>Galeria de Projetos</span>
            </div>
            <h2 className={styles.title}>Galeria</h2>
          </div>
          <div className={styles.controls}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.grid}>
            {!loaded ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '2px solid rgba(49,91,44,0.15)', borderTopColor: '#315B2C', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#888882' }}>Carregando galeria...</p>
              </div>
            ) : loadError ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '22px', fontWeight: 500, color: '#DD8758', marginBottom: '8px' }}>Erro ao carregar</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#777772', marginBottom: '24px' }}>Não foi possível carregar a galeria. Tente novamente em instantes.</p>
                <button
                  onClick={retry}
                  style={{ display: 'inline-block', padding: '12px 28px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background 0.22s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '22px', fontWeight: 500, color: '#1a1a18', marginBottom: '8px' }}>Nenhum projeto encontrado</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#777772' }}>Tente ajustar sua busca.</p>
              </div>
            ) : (
              <div className={styles.productGrid}>
                {filtered.map((g) => (
                  <div
                    key={g.id}
                    className={styles.card}
                    onClick={() => navigate(`/galeria/${encodeURIComponent(g.slug)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.cardImageWrap}>
                      {g.firstImage ? (
                        <img src={g.firstImage} alt={g.name} className={styles.cardImage} />
                      ) : (
                        <div className={styles.cardImagePlaceholder}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#315B2C', color: '#F6F4EF', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', zIndex: 1 }}>
                        {g.imageCount} {g.imageCount === 1 ? 'imagem' : 'imagens'}
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardCategory}>{g.categoryLabel}</div>
                      <div className={styles.cardTitle}>{g.name}</div>
                      <div style={{ marginTop: '14px' }}>
                        <button
                          style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(49,91,44,0.08)', color: '#315B2C', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px', border: '1px solid rgba(49,91,44,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(49,91,44,0.12)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(49,91,44,0.08)' }}
                        >
                          Ver Galeria
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default Gallery
