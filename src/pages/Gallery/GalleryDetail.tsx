import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import WhatsAppButton from '../../components/shared/WhatsAppButton'
import styles from '../Sales/Sales.module.css'

interface ProjectImage {
  id: number
  url: string
  /** Breve descrição, exibida ao lado da foto principal. */
  alt: string
  /** Descrição completa, exibida abaixo das fotos (só no registro). */
  description: string
  featured: boolean
  /** Preenchido nas fotos complementares; aponta para o registro da galeria. */
  parentId: number | null
  sortOrder: number
  project: {
    id: number
    slug: string
    name: string
    category: string
    categoryLabel: string
  }
}

/**
 * Deixa cada registro seguido das suas fotos complementares, para que as
 * miniaturas apareçam na mesma ordem em que foram cadastradas no painel.
 */
function sortByRecord(images: ProjectImage[]): ProjectImage[] {
  const byId = new Map(images.map((img) => [img.id, img]))
  const recordOrder = (img: ProjectImage) => {
    const record = img.parentId ? byId.get(img.parentId) : img
    return record ? record.sortOrder : img.sortOrder
  }
  return [...images].sort((a, b) => {
    const diff = recordOrder(a) - recordOrder(b)
    if (diff !== 0) return diff
    if (!a.parentId !== !b.parentId) return a.parentId ? 1 : -1
    return a.sortOrder - b.sortOrder
  })
}

async function fetchProjectImages(slug: string): Promise<ProjectImage[] | null> {
  try {
    const res = await fetch('/api/project-images')
    if (!res.ok) throw new Error('API unavailable')
    const json = await res.json()
    if (json.data) {
      return sortByRecord(json.data.filter((img: ProjectImage) => img.project.slug === slug))
    }
  } catch (_) {}
  return null
}

function GalleryDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [images, setImages] = useState<ProjectImage[]>([])
  const [project, setProject] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null)

  useEffect(() => {
    if (slug) {
      fetchProjectImages(slug).then((data) => {
        if (data && data.length > 0) {
          setImages(data)
          setProject(data[0].project)
          // Abre pela capa marcada como destaque no painel; sem destaque
          // definido, mantém a primeira pela ordem de exibição.
          setSelectedImage(data.find((img) => img.featured) || data[0])
        }
        setLoaded(true)
      })
    }
  }, [slug])

  // A foto complementar herda os textos do registro: a breve descrição dela é
  // opcional e a descrição completa é sempre a do registro.
  const selectedRecord = selectedImage?.parentId
    ? images.find((img) => img.id === selectedImage.parentId) || selectedImage
    : selectedImage
  const briefDescription = selectedImage?.alt || selectedRecord?.alt || ''
  const fullDescription = selectedRecord?.description || ''

  return (
    <>
      <Header onOpenModal={() => {}} />

      <div className={styles.page}>
        <div className={styles.benefits}>
          <div className={styles.benefitsInner}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitDot} />
              Galeria de Imagens do Projeto
            </div>
          </div>
        </div>

        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <div className={styles.eyebrow}>
              <div className={styles.eyebrowLine} />
              <span className={styles.eyebrowText}>{project?.categoryLabel || 'Projeto'}</span>
            </div>
            <h2 className={styles.title}>{project?.name || 'Galeria'}</h2>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.grid}>
            {!loaded ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '2px solid rgba(49,91,44,0.15)', borderTopColor: '#315B2C', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#888882' }}>Carregando galeria...</p>
              </div>
            ) : images.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '22px', fontWeight: 500, color: '#1a1a18', marginBottom: '8px' }}>Nenhuma imagem encontrada</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#777772', marginBottom: '24px' }}>Este projeto não possui imagens registradas.</p>
                <button
                  onClick={() => navigate('/galeria')}
                  style={{ display: 'inline-block', padding: '12px 28px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background 0.22s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                >
                  Voltar à Galeria
                </button>
              </div>
            ) : (
              <>
                {/* Selected Image Display */}
                <div style={{ gridColumn: '1 / -1', marginBottom: '48px' }}>
                  {selectedImage && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start' }}>
                      <div style={{ overflow: 'hidden', borderRadius: '14px', boxShadow: '0 12px 40px rgba(49,91,44,0.12)' }}>
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.alt}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '9.5px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
                          {project?.categoryLabel}
                        </div>
                        {briefDescription && (
                          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '19px', fontWeight: 400, color: '#1a1a18', lineHeight: 1.55, marginBottom: '16px', letterSpacing: '-0.005em' }}>
                            {briefDescription}
                          </p>
                        )}
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400, color: '#888882', lineHeight: 1.8, marginBottom: '28px' }}>
                          Imagem {images.indexOf(selectedImage) + 1} de {images.length} • {project?.name}
                        </p>
                        <button
                          onClick={() => navigate('/galeria')}
                          style={{ display: 'inline-block', padding: '12px 28px', background: '#315B2C', color: '#F6F4EF', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background 0.22s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#254822' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#315B2C' }}
                        >
                          Voltar à Galeria
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnails Grid */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                      Todas as imagens ({images.length})
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          overflow: 'hidden',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          border: selectedImage?.id === img.id ? '2px solid #315B2C' : '1px solid rgba(49,91,44,0.12)',
                          transition: 'all 0.2s',
                          aspectRatio: '1',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedImage?.id !== img.id) {
                            e.currentTarget.style.borderColor = 'rgba(49,91,44,0.25)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedImage?.id !== img.id) {
                            e.currentTarget.style.borderColor = 'rgba(49,91,44,0.12)'
                          }
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.alt}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descrição completa do registro selecionado, abaixo das fotos */}
                {fullDescription && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '48px', maxWidth: '780px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: '#6F8F3A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                      Descrição
                    </div>
                    {fullDescription.split(/\n{2,}/).map((paragraph, i) => (
                      <p
                        key={i}
                        style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 400, color: '#555550', lineHeight: 1.9, marginBottom: '16px', whiteSpace: 'pre-line' }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default GalleryDetail
