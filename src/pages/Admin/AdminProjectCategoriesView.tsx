import { useEffect, useState, useCallback } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import {
  PROJECT_CATEGORY_ICONS,
  DEFAULT_PROJECT_CATEGORY_ICON,
  projectCategoryIconSvg,
} from '../../data/projectCategoryIcons'
import styles from './Admin.module.css'

interface ProjectCategory {
  id: number
  key: string
  label: string
  icon: string
  sortOrder: number
  active: boolean
}

interface FormState {
  label: string
  icon: string
  active: boolean
}

const EMPTY_FORM: FormState = { label: '', icon: DEFAULT_PROJECT_CATEGORY_ICON, active: true }

const ICON_OPTIONS = Object.entries(PROJECT_CATEGORY_ICONS).map(([key, icon]) => ({
  key,
  label: icon.label,
  svg: icon.svg,
}))

function CategoryIcon({ icon, size = 26 }: { icon: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: projectCategoryIconSvg(icon) }}
    />
  )
}

function AdminProjectCategoriesView() {
  const [categories, setCategories] = useState<ProjectCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectCategory | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ProjectCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setListError(false)
      const res = await api('/api/admin/project-categories')
      if (res.ok) {
        setCategories((res.payload?.data as ProjectCategory[]) || [])
      } else {
        setListError(true)
      }
    } catch (error) {
      console.error('Load project categories error:', error)
      setListError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((cat: ProjectCategory) => {
    setEditing(cat)
    setForm({ label: cat.label, icon: cat.icon, active: cat.active })
    setFormError('')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }, [saving])

  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')
      if (!form.label.trim()) {
        setFormError('Informe o nome da categoria.')
        return
      }

      try {
        setSaving(true)
        const endpoint = editing
          ? `/api/admin/project-categories/${editing.id}`
          : '/api/admin/project-categories'
        const res = await api(endpoint, {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({ label: form.label.trim(), icon: form.icon, active: form.active }),
        })

        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar categoria.')
          return
        }

        showToast('success', editing ? 'Categoria atualizada!' : 'Categoria criada!')
        await loadCategories()
        setModalOpen(false)
        setEditing(null)
        setForm(EMPTY_FORM)
      } catch (error) {
        console.error('Save project category error:', error)
        setFormError('Erro ao salvar categoria. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [editing, form, loadCategories, showToast]
  )

  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/project-categories/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao excluir.')
        return
      }
      showToast('success', 'Categoria excluída!')
      setConfirmDelete(null)
      await loadCategories()
    } catch (error) {
      console.error('Delete project category error:', error)
      showToast('error', 'Erro ao excluir categoria')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadCategories, showToast])

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Categorias de Projetos</h1>
          <p className={styles.dashboardSubtitle}>
            Alimentam a seção “Categorias de Projetos” da página /projetos.
          </p>
        </div>
        <button className={styles.btnAdd} onClick={openCreate} data-testid="add-project-category">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar categoria
        </button>
      </div>

      <div className={styles.dashboardMain}>
        {listError ? (
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
            <div className={styles.emptyDesc}>Adicione a primeira categoria da página de projetos.</div>
          </div>
        ) : (
          <div className={styles.projectCatGrid}>
            {categories.map((cat) => (
              <div className={styles.projectCatCard} key={cat.id} data-testid="project-category-row">
                <div className={styles.projectCatIcon}>
                  <CategoryIcon icon={cat.icon} />
                </div>
                <div className={styles.projectCatName}>{cat.label}</div>
                {!cat.active && <span className={styles.tableTag}>Oculta no site</span>}
                <div className={styles.rowActions} style={{ marginTop: 'auto' }}>
                  <button className={styles.btnEdit} onClick={() => openEdit(cat)} data-testid="edit-project-category">Editar</button>
                  <button className={styles.btnDelete} onClick={() => setConfirmDelete(cat)} data-testid="delete-project-category">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editing ? 'Editar categoria' : 'Adicionar categoria'}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{editing ? 'Atualizar' : 'Novo cadastro'}</div>
                <div className={styles.modalTitle}>{editing ? 'Editar categoria' : 'Adicionar categoria'}</div>
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={submitForm} noValidate data-testid="project-category-form">
              {formError && <div className={styles.alertError} role="alert">{formError}</div>}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="pc-label">Nome da categoria</label>
                <input
                  id="pc-label"
                  className={styles.input}
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex.: Projetos Ambientais"
                  data-testid="pc-label"
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Ícone</label>
                <div className={styles.iconPicker}>
                  {ICON_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.key}
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={form.icon === option.key}
                      className={`${styles.iconOption} ${form.icon === option.key ? styles.iconOptionOn : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, icon: option.key }))}
                      data-testid={`pc-icon-${option.key}`}
                    >
                      <CategoryIcon icon={option.key} size={22} />
                    </button>
                  ))}
                </div>
                <div className={styles.inputHint}>
                  {PROJECT_CATEGORY_ICONS[form.icon]?.label || 'Ícone'}
                </div>
              </div>

              <div className={`${styles.field} ${styles.checkboxRow}`}>
                <input
                  id="pc-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  data-testid="pc-active"
                />
                <label className={styles.checkboxLabel} htmlFor="pc-active">Exibir na página de projetos</label>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="pc-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDelete(null) }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>Atenção</div>
                <div className={styles.modalTitle}>Excluir categoria</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Excluir <strong>{confirmDelete.label}</strong> da seção de categorias da página de projetos?
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting}>
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="pc-delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir categoria'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default AdminProjectCategoriesView
