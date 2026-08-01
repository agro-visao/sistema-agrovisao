import { useEffect, useState, useCallback } from 'react'
import styles from './Admin.module.css'

interface Category {
  id: number
  key: string
  label: string
  description: string
  sort_order: number
  active: boolean
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

function AdminCategoriesView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api('/api/admin/categories')
      if (res.ok) {
        setCategories((res.payload?.data as Category[]) || [])
      } else {
        setError('Não foi possível carregar as categorias')
      }
    } catch (err) {
      console.error('Load categories error:', err)
      setError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const deleteCategory = useCallback(
    async (id: number) => {
      if (!window.confirm('Tem certeza?')) return
      try {
        const res = await api(`/api/admin/categories/${id}`, { method: 'DELETE' })
        if (res.ok) {
          showToast('success', 'Categoria deletada!')
          await loadCategories()
        } else {
          showToast('error', res.payload?.error || 'Erro ao deletar')
        }
      } catch (error) {
        console.error('Delete category error:', error)
        showToast('error', 'Erro ao deletar categoria')
      }
    },
    [loadCategories, showToast]
  )

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Categorias</h1>
        </div>
        <button className={styles.btnAdd} onClick={() => alert('Em breve - adicionar categoria')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar categoria
        </button>
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
            <div className={styles.emptyTitle}>Não foi possível carregar as categorias</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadCategories}>Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando categorias…</div>
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Nenhuma categoria cadastrada</div>
            <div className={styles.emptyDesc}>Crie a primeira categoria para começar.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  background: 'var(--clr-bg)',
                  border: '1px solid var(--border-green-08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: 'var(--clr-text)', margin: 0 }}>
                    {cat.label}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--clr-text-muted)', margin: '4px 0 0' }}>
                    {cat.key}
                  </p>
                </div>
                {cat.description && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--clr-text-body)', margin: 0, lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    className={styles.btnEdit}
                    onClick={() => alert('Em breve - editar categoria')}
                    style={{ flex: 1 }}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => deleteCategory(cat.id)}
                    style={{ flex: 1 }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`} role="status">
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10L8 14L16 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4L16 16M16 4L4 16" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </>
  )
}

export default AdminCategoriesView
