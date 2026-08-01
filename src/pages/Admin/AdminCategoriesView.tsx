import { useEffect, useState, useCallback } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import styles from './Admin.module.css'

interface Category {
  id: number
  key: string
  label: string
  description: string
  sortOrder: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

interface FormMode {
  type: 'add' | 'edit'
  category?: Category
}

function AdminCategoriesView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formData, setFormData] = useState({ label: '', description: '', active: true })
  const [formError, setFormError] = useState('')
  const [formBusy, setFormBusy] = useState(false)

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

  const openAddForm = useCallback(() => {
    setFormMode({ type: 'add' })
    setFormData({ label: '', description: '', active: true })
    setFormError('')
  }, [])

  const openEditForm = useCallback((cat: Category) => {
    setFormMode({ type: 'edit', category: cat })
    setFormData({ label: cat.label, description: cat.description, active: cat.active })
    setFormError('')
  }, [])

  const closeForm = useCallback(() => {
    setFormMode(null)
    setFormData({ label: '', description: '', active: true })
    setFormError('')
  }, [])

  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.label.trim()) {
        setFormError('Informe o rótulo da categoria.')
        return
      }
      if (!formMode) return

      setFormBusy(true)
      setFormError('')

      try {
        const method = formMode.type === 'add' ? 'POST' : 'PUT'
        const url = formMode.type === 'add' ? '/api/admin/categories' : `/api/admin/categories/${formMode.category?.id}`

        const res = await api(url, {
          method,
          body: JSON.stringify({
            label: formData.label.trim(),
            description: formData.description.trim(),
            active: formData.active,
          }),
        })

        if (res.ok) {
          showToast('success', formMode.type === 'add' ? 'Categoria criada!' : 'Categoria atualizada!')
          closeForm()
          await loadCategories()
        } else {
          setFormError(res.payload?.error || 'Erro ao salvar categoria')
        }
      } catch (err) {
        console.error('Submit form error:', err)
        setFormError('Erro de conexão ao salvar.')
      } finally {
        setFormBusy(false)
      }
    },
    [formMode, formData, showToast, closeForm, loadCategories]
  )

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Categorias</h1>
        </div>
        <button className={styles.btnAdd} onClick={openAddForm}>
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
                    onClick={() => openEditForm(cat)}
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

      {formMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !formBusy && closeForm()}
        >
          <div
            style={{
              backgroundColor: 'var(--clr-bg)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 16px', color: 'var(--clr-text)' }}>
              {formMode.type === 'add' ? 'Adicionar categoria' : 'Editar categoria'}
            </h2>

            {formError && (
              <div className={styles.alertError} style={{ marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={submitForm}>
              <div className={styles.field} style={{ marginBottom: '16px' }}>
                <label className={styles.label} htmlFor="cat-label">
                  Rótulo
                </label>
                <input
                  id="cat-label"
                  className={styles.input}
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex.: Frutas"
                  disabled={formBusy}
                />
              </div>

              <div className={styles.field} style={{ marginBottom: '16px' }}>
                <label className={styles.label} htmlFor="cat-desc">
                  Descrição
                </label>
                <textarea
                  id="cat-desc"
                  className={styles.input}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve da categoria"
                  disabled={formBusy}
                  style={{ minHeight: '80px', fontFamily: 'var(--font-sans)' }}
                />
              </div>

              <div className={styles.field} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="cat-active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  disabled={formBusy}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label className={styles.label} htmlFor="cat-active" style={{ margin: 0, cursor: 'pointer' }}>
                  Ativa
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formBusy}
                  style={{ flex: 1 }}
                >
                  {formBusy ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={closeForm}
                  disabled={formBusy}
                  style={{ flex: 0.5 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminCategoriesView
