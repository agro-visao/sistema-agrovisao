import { useEffect, useState, useCallback } from 'react'
import { formatBRL } from '../../data/products'
import styles from './Admin.module.css'

interface Product {
  id: number
  name: string
  image: string
  price: number
  category: string
  categoryLabel: string
  featured: boolean
  isNew: boolean
  stock: number
}

async function api(path: string, options?: RequestInit) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: typeof options?.body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    })
    clearTimeout(timeout)
    let payload: { data?: unknown; error?: string } | null = null
    try {
      payload = await res.json()
    } catch {}
    return { ok: res.ok, status: res.status, payload }
  } catch (error) {
    console.error('API call failed:', path, error)
    return { ok: false, status: 0, payload: { error: 'Erro de conexão' } }
  }
}

function AdminGalleryView() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api('/api/admin/products')
      if (res.ok) {
        setProducts((res.payload?.data as Product[]) || [])
      } else {
        setError('Não foi possível carregar os produtos')
      }
    } catch (err) {
      console.error('Load gallery error:', err)
      setError('Erro ao carregar galeria')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Galeria</h1>
        </div>
      </div>

      <div className={styles.dashboardMain}>
        {error ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Não foi possível carregar a galeria</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadProducts}>Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando galeria…</div>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15L16 10L5 21" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Nenhuma imagem na galeria</div>
            <div className={styles.emptyDesc}>Adicione produtos com imagens na tela de Vendas.</div>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <div className={styles.productCard} key={p.id}>
                <div className={styles.productCardImage}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} loading="lazy" />
                  ) : (
                    <div className={styles.productCardPlaceholder}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {(p.featured || p.isNew) && (
                    <div className={styles.productCardBadges}>
                      {p.featured && <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Destaque</span>}
                      {p.isNew && <span className={`${styles.productCardBadge} ${styles.badgeNew}`}>Novo</span>}
                    </div>
                  )}
                </div>
                <div className={styles.productCardBody}>
                  <div className={styles.productCardName}>{p.name}</div>
                  <div className={styles.productCardMeta}>
                    <span>{p.categoryLabel}</span>
                    {p.stock > 0 ? <span>{p.stock} em estoque</span> : <span style={{ color: '#B03A2E' }}>Sem estoque</span>}
                  </div>
                  <div className={styles.productCardPrice}>
                    <div className={styles.productCardCurrentPrice}>{formatBRL(p.price)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default AdminGalleryView
