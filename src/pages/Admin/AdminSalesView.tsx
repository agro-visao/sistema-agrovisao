import { useEffect, useState, useCallback, useRef } from 'react'
import { formatBRL } from '../../data/products'
import { adminApi as api } from '../../lib/adminApi'
import styles from './Admin.module.css'

interface AdminProduct {
  id: number
  slug: string
  name: string
  description: string
  image: string
  price: number
  originalPrice: number | null
  category: string
  categoryLabel: string
  stock: number
  featured: boolean
  isNew: boolean
  active: boolean
  whatsappText: string
}

interface FormState {
  name: string
  category: string
  price: string
  originalPrice: string
  description: string
  stock: string
  featured: boolean
  isNew: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'mudas',
  price: '',
  originalPrice: '',
  description: '',
  stock: '0',
  featured: false,
  isNew: false,
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// ─── Máscara monetária (R$ 0,00) ────────────────────────────────────────────
// O campo sempre exibe o valor formatado: só os dígitos digitados contam e o
// valor vai sendo preenchido da direita para a esquerda (centavos primeiro).

function centsToInput(cents: number): string {
  return formatBRL(cents)
}

/** Reformata o que foi digitado; ignora tudo que não é dígito. */
function maskBRL(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 11)
  if (!digits) return ''
  return formatBRL(parseInt(digits, 10))
}

/** Valor do campo em centavos; null quando está vazio. */
function inputToCents(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : null
}

interface Category {
  key: string
  label: string
}

function AdminSalesView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const previewUrlRef = useRef<string | null>(null)

  const categoryLabelFor = useCallback((key: string): string => {
    const found = categories.find((c) => c.key === key)
    return found ? found.label : key
  }, [categories])

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  const resetImageState = useCallback(() => {
    revokePreview()
    setSelectedFile(null)
    setPreviewUrl(null)
    setImageError('')
  }, [revokePreview])

  useEffect(() => () => revokePreview(), [revokePreview])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      setImageError('')
      if (!file) {
        resetImageState()
        return
      }
      const extOk = /\.(jpe?g|png|webp)$/i.test(file.name)
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !extOk) {
        setImageError('Formato inválido. Use JPG, PNG ou WEBP.')
        resetImageState()
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError('A imagem deve ter no máximo 5 MB.')
        resetImageState()
        return
      }
      revokePreview()
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setSelectedFile(file)
      setPreviewUrl(url)
    },
    [revokePreview, resetImageState]
  )

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setListError(false)
      const res = await api('/api/admin/products')
      if (res.ok) {
        setProducts((res.payload?.data as AdminProduct[]) || [])
      } else {
        setListError(true)
      }
    } catch (error) {
      console.error('Load products error:', error)
      setListError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const res = await api('/api/admin/categories')
      if (res.ok) {
        const cats = (res.payload?.data as Array<{ key: string; label: string }>) || []
        setCategories(cats)
      }
    } catch (error) {
      console.error('Load categories error:', error)
    }
  }, [])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    resetImageState()
    setModalOpen(true)
  }, [resetImageState])

  const openEdit = useCallback((p: AdminProduct) => {
    setEditing(p)
    setForm({
      name: p.name,
      category: p.category,
      price: centsToInput(p.price),
      originalPrice: p.originalPrice !== null ? centsToInput(p.originalPrice) : '',
      description: p.description || '',
      stock: String(p.stock),
      featured: p.featured,
      isNew: p.isNew,
    })
    setFormError('')
    resetImageState()
    setModalOpen(true)
  }, [resetImageState])

  const closeModal = useCallback(() => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setFormError('')
    resetImageState()
  }, [saving, resetImageState])

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')
      if (!form.name.trim()) {
        setFormError('Informe o nome do produto.')
        return
      }
      if (!form.price.trim()) {
        setFormError('Informe o valor do produto.')
        return
      }
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('category', form.category)
      fd.append('categoryLabel', categoryLabelFor(form.category))
      fd.append('description', form.description.trim())
      fd.append('stock', form.stock)
      fd.append('featured', String(form.featured))
      fd.append('isNew', String(form.isNew))

      const priceCents = inputToCents(form.price)
      if (priceCents === null || priceCents < 0) {
        setFormError('Valor inválido.')
        return
      }
      fd.append('price', String(priceCents))

      const originalCents = inputToCents(form.originalPrice)
      if (originalCents !== null && originalCents > 0) {
        fd.append('originalPrice', String(originalCents))
      }

      if (selectedFile) {
        fd.append('image', selectedFile)
      }

      try {
        setSaving(true)
        const endpoint = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products'
        const method = editing ? 'PUT' : 'POST'
        const res = await api(endpoint, { method, body: fd })

        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar produto.')
          return
        }

        showToast('success', editing ? 'Produto atualizado!' : 'Produto criado!')
        await loadProducts()
        closeModal()
      } catch (error) {
        console.error('Save error:', error)
        setFormError('Erro ao salvar produto. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [editing, form, selectedFile, categoryLabelFor, loadProducts, closeModal, showToast]
  )

  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/products/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao deletar.')
        return
      }
      showToast('success', 'Produto deletado!')
      setConfirmDelete(null)
      await loadProducts()
    } catch (error) {
      console.error('Delete error:', error)
      showToast('error', 'Erro ao deletar produto')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadProducts, showToast])

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Produtos</h1>
        </div>
        <button className={styles.btnAdd} onClick={openCreate} data-testid="add-product">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar produto
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
            <div className={styles.emptyTitle}>Não foi possível carregar os produtos</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadProducts} data-testid="reload-products">Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando produtos…</div>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Nenhum produto cadastrado</div>
            <div className={styles.emptyDesc}>Comece adicionando o primeiro produto da sua loja.</div>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <div className={styles.productCard} key={p.id} data-testid="product-row" data-product-name={p.name}>
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
                    {p.originalPrice !== null && (
                      <div className={styles.productCardOriginalPrice}>{formatBRL(p.originalPrice)}</div>
                    )}
                  </div>
                  <div className={styles.productCardActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(p)} data-testid="edit-product">Editar</button>
                    <button className={styles.btnDelete} onClick={() => setConfirmDelete(p)} data-testid="delete-product">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editing ? 'Editar produto' : 'Adicionar produto'}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{editing ? 'Atualizar' : 'Novo cadastro'}</div>
                <div className={styles.modalTitle}>{editing ? 'Editar produto' : 'Adicionar produto'}</div>
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={submitForm} noValidate data-testid="product-form">
              {formError && <div className={styles.alertError} role="alert" data-testid="form-error">{formError}</div>}
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-category">Categoria</label>
                  <select
                    id="p-category"
                    className={styles.input}
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    data-testid="f-category"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-name">Nome do produto</label>
                  <input
                    id="p-name"
                    className={styles.input}
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Ex.: Açaí Premium"
                    data-testid="f-name"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-price">Valor (R$)</label>
                  <input
                    id="p-price"
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => setField('price', maskBRL(e.target.value))}
                    placeholder="R$ 0,00"
                    data-testid="f-price"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-original-price">Valor original (opcional)</label>
                  <input
                    id="p-original-price"
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    value={form.originalPrice}
                    onChange={(e) => setField('originalPrice', maskBRL(e.target.value))}
                    placeholder="R$ 0,00"
                    data-testid="f-original-price"
                  />
                </div>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-desc">Descrição</label>
                <textarea
                  id="p-desc"
                  className={styles.input}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Descrição curta exibida na vitrine"
                  data-testid="f-desc"
                />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-image">Imagem do produto</label>
                <div className={styles.uploadArea}>
                  {previewUrl || (editing?.image && !selectedFile) ? (
                    <img
                      className={styles.uploadPreview}
                      src={previewUrl || editing!.image}
                      alt="Pré-visualização"
                      data-testid="image-preview"
                    />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Nenhuma imagem selecionada</span>
                    </div>
                  )}
                  <div className={styles.uploadControls}>
                    <label className={styles.btnUpload} htmlFor="p-image">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      {selectedFile ? 'Trocar imagem' : editing ? 'Enviar nova imagem' : 'Selecionar imagem'}
                    </label>
                    <input
                      id="p-image"
                      className={styles.fileInput}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      data-testid="f-image"
                    />
                    {selectedFile && (
                      <button type="button" className={styles.linkBtn} onClick={resetImageState} data-testid="image-clear">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.inputHint}>JPG, PNG ou WEBP · máximo 5 MB</div>
                {imageError && (
                  <div className={styles.fieldError} role="alert" data-testid="image-error">{imageError}</div>
                )}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-stock">Estoque</label>
                  <input
                    id="p-stock"
                    className={styles.input}
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setField('stock', e.target.value)}
                    data-testid="f-stock"
                  />
                </div>
                <div className={`${styles.field} ${styles.checkboxRow}`}>
                  <input
                    id="p-featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setField('featured', e.target.checked)}
                    data-testid="f-featured"
                  />
                  <label className={styles.checkboxLabel} htmlFor="p-featured">Produto em destaque</label>
                </div>
                <div className={`${styles.field} ${styles.checkboxRow}`}>
                  <input
                    id="p-new"
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(e) => setField('isNew', e.target.checked)}
                    data-testid="f-new"
                  />
                  <label className={styles.checkboxLabel} htmlFor="p-new">Produto novo</label>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeModal} data-testid="form-cancel">Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="form-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar produto'}
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
                <div className={styles.modalTitle}>Excluir produto</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Tem certeza de que deseja excluir <strong>{confirmDelete.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting} data-testid="delete-cancel">
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir produto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`} role="status" data-testid="toast">
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

export default AdminSalesView
