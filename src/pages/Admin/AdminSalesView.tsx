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
  /** Os 3 slots de foto na ordem (string vazia = slot livre). */
  images: string[]
  price: number
  originalPrice: number | null
  category: string
  categoryLabel: string
  stock: number
  featured: boolean
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
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'mudas',
  price: '',
  originalPrice: '',
  description: '',
  stock: '0',
  featured: false,
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// ─── Imagens do produto ─────────────────────────────────────────────────────
// São 3 slots independentes: a principal (que vai para o card da vitrine) e
// duas complementares, exibidas como miniaturas na página do produto. Cada
// slot é enviado no campo `field` e limpo com `removeImage<N>`.
const IMAGE_SLOTS = [
  { field: 'image', label: 'Imagem principal', hint: 'Aparece no card da vitrine' },
  { field: 'image2', label: 'Imagem complementar 1', hint: 'Opcional' },
  { field: 'image3', label: 'Imagem complementar 2', hint: 'Opcional' },
]

interface ImageSlotState {
  /** Arquivo novo escolhido agora (ainda não enviado). */
  file: File | null
  previewUrl: string | null
  /** Marca a foto já salva para ser apagada ao salvar. */
  remove: boolean
  error: string
}

function emptySlots(): ImageSlotState[] {
  return IMAGE_SLOTS.map(() => ({ file: null, previewUrl: null, remove: false, error: '' }))
}

// ─── Campo monetário (R$ 0,00) ──────────────────────────────────────────────
// A digitação é livre: o número é interpretado em REAIS e só é formatado
// quando o campo perde o foco. Reformatar a cada tecla embaralhava o cursor
// dentro do texto já formatado e fazia o valor sair errado.

function centsToInput(cents: number): string {
  return formatBRL(cents)
}

/**
 * Lê o que foi digitado em centavos, aceitando vírgula ou ponto como
 * separador decimal:
 *
 *   "8"  "8,00"  "8.00"  "R$ 8,00" → 800      (R$ 8,00)
 *   "12,5"                         → 1250     (R$ 12,50)
 *   "1200"  "1.200"  "1.200,00"    → 120000   (R$ 1.200,00)
 *
 * Regra: o último ponto/vírgula seguido de 1 ou 2 dígitos é o separador
 * decimal; qualquer outro é separador de milhar. Retorna null se não houver
 * número nenhum.
 */
function parseMoneyToCents(value: string): number | null {
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!/\d/.test(cleaned)) return null

  let reaisPart = cleaned
  let centsPart = ''

  const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'))
  if (lastSeparator !== -1) {
    const afterSeparator = cleaned.slice(lastSeparator + 1)
    if (/^\d{1,2}$/.test(afterSeparator)) {
      reaisPart = cleaned.slice(0, lastSeparator)
      centsPart = afterSeparator.padEnd(2, '0')
    }
  }

  const reais = reaisPart.replace(/\D/g, '').slice(0, 9)
  const cents = centsPart ? parseInt(centsPart, 10) : 0
  return parseInt(reais || '0', 10) * 100 + cents
}

interface Category {
  key: string
  label: string
}

/**
 * Campo de valor em reais: digite à vontade ("8", "8,00", "8.00", "1.200,50")
 * que o campo se formata sozinho ao sair — nada é reescrito no meio da
 * digitação. Focar seleciona tudo, para trocar um valor já preenchido.
 */
function MoneyInput({
  id,
  value,
  onChange,
  testId,
}: {
  id: string
  value: string
  onChange: (text: string) => void
  testId: string
}) {
  return (
    <input
      id={id}
      className={styles.input}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        const cents = parseMoneyToCents(value)
        onChange(cents === null ? '' : formatBRL(cents))
      }}
      placeholder="R$ 0,00"
      data-testid={testId}
    />
  )
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
  const [slots, setSlots] = useState<ImageSlotState[]>(emptySlots)
  const previewUrlsRef = useRef<(string | null)[]>(IMAGE_SLOTS.map(() => null))

  const categoryLabelFor = useCallback((key: string): string => {
    const found = categories.find((c) => c.key === key)
    return found ? found.label : key
  }, [categories])

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const revokePreview = useCallback((index: number) => {
    const url = previewUrlsRef.current[index]
    if (url) {
      URL.revokeObjectURL(url)
      previewUrlsRef.current[index] = null
    }
  }, [])

  const resetImageState = useCallback(() => {
    previewUrlsRef.current.forEach((_, i) => revokePreview(i))
    setSlots(emptySlots())
  }, [revokePreview])

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => { if (url) URL.revokeObjectURL(url) })
  }, [])

  const patchSlot = useCallback((index: number, patch: Partial<ImageSlotState>) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)))
  }, [])

  const handleFileSelect = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return

      const extOk = /\.(jpe?g|png|webp)$/i.test(file.name)
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !extOk) {
        revokePreview(index)
        patchSlot(index, { file: null, previewUrl: null, error: 'Formato inválido. Use JPG, PNG ou WEBP.' })
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        revokePreview(index)
        patchSlot(index, { file: null, previewUrl: null, error: 'A imagem deve ter no máximo 5 MB.' })
        return
      }

      revokePreview(index)
      const url = URL.createObjectURL(file)
      previewUrlsRef.current[index] = url
      // Escolher um arquivo novo cancela a remoção pendente do slot.
      patchSlot(index, { file, previewUrl: url, remove: false, error: '' })
    },
    [revokePreview, patchSlot]
  )

  // "Remover" descarta o arquivo recém-escolhido; se não houver, marca a foto
  // já salva para ser apagada no próximo salvamento (reversível até lá).
  const clearSlot = useCallback(
    (index: number, hasSaved: boolean) => {
      const hadFile = previewUrlsRef.current[index] !== null
      revokePreview(index)
      setSlots((prev) =>
        prev.map((slot, i) =>
          i === index
            ? {
                file: null,
                previewUrl: null,
                remove: hadFile ? slot.remove : hasSaved ? !slot.remove : false,
                error: '',
              }
            : slot
        )
      )
    },
    [revokePreview]
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

      const priceCents = parseMoneyToCents(form.price)
      if (priceCents === null || priceCents < 0) {
        setFormError('Valor inválido.')
        return
      }
      fd.append('price', String(priceCents))

      const originalCents = parseMoneyToCents(form.originalPrice)
      if (originalCents !== null && originalCents > 0) {
        fd.append('originalPrice', String(originalCents))
      }

      // Cada slot vai separado: arquivo novo substitui, removeImageN apaga e a
      // ausência dos dois mantém a foto que já está salva.
      slots.forEach((slot, i) => {
        if (slot.file) {
          fd.append(IMAGE_SLOTS[i].field, slot.file)
        } else if (slot.remove) {
          fd.append(`removeImage${i + 1}`, 'true')
        }
      })

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
    [editing, form, slots, categoryLabelFor, loadProducts, closeModal, showToast]
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
                  {p.featured && (
                    <div className={styles.productCardBadges}>
                      <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Destaque</span>
                    </div>
                  )}
                  {(p.images || []).filter(Boolean).length > 1 && (
                    <span className={styles.productCardPhotoCount}>
                      {(p.images || []).filter(Boolean).length} fotos
                    </span>
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
                    {/* A linha do valor original é sempre renderizada (vazia
                        quando não há) para os preços ficarem alinhados entre
                        os cards da grade. */}
                    <div className={styles.productCardOriginalPrice}>
                      {p.originalPrice !== null ? formatBRL(p.originalPrice) : ' '}
                    </div>
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
                  <MoneyInput
                    id="p-price"
                    value={form.price}
                    onChange={(masked) => setField('price', masked)}
                    testId="f-price"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-original-price">Valor original (opcional)</label>
                  <MoneyInput
                    id="p-original-price"
                    value={form.originalPrice}
                    onChange={(masked) => setField('originalPrice', masked)}
                    testId="f-original-price"
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
                <label className={styles.label}>Imagens do produto</label>
                <div className={styles.imageSlots}>
                  {IMAGE_SLOTS.map((meta, i) => {
                    const slot = slots[i]
                    const savedImage = editing?.images?.[i] || ''
                    const shownImage = slot.previewUrl || (slot.remove ? '' : savedImage)
                    const inputId = `p-${meta.field}`
                    return (
                      <div className={styles.imageSlot} key={meta.field}>
                        <div className={styles.imageSlotTitle}>{meta.label}</div>
                        {shownImage ? (
                          <img
                            className={styles.uploadPreview}
                            src={shownImage}
                            alt="Pré-visualização"
                            data-testid={`image-preview-${i + 1}`}
                          />
                        ) : (
                          <div className={styles.uploadPlaceholder}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>{slot.remove ? 'Será removida ao salvar' : 'Nenhuma imagem'}</span>
                          </div>
                        )}
                        <div className={styles.uploadControls}>
                          <label className={styles.btnUpload} htmlFor={inputId}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            {shownImage ? 'Trocar' : 'Selecionar'}
                          </label>
                          <input
                            id={inputId}
                            className={styles.fileInput}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={(e) => handleFileSelect(i, e)}
                            data-testid={`f-${meta.field}`}
                          />
                          {(slot.file || savedImage) && (
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => clearSlot(i, Boolean(savedImage))}
                              data-testid={`image-clear-${i + 1}`}
                            >
                              {slot.remove ? 'Desfazer' : 'Remover'}
                            </button>
                          )}
                        </div>
                        <div className={styles.inputHint}>{meta.hint}</div>
                        {slot.error && (
                          <div className={styles.fieldError} role="alert" data-testid={`image-error-${i + 1}`}>{slot.error}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className={styles.inputHint}>JPG, PNG ou WEBP · máximo 5 MB por imagem</div>
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
