import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import styles from './Admin.module.css'

interface GalleryImage {
  id: number
  projectId: number
  url: string
  imagePath: string
  alt: string
  sortOrder: number
  projectName: string
  projectSlug: string
  projectCategoryLabel: string
  projectActive: boolean
}

interface Project {
  id: number
  slug: string
  name: string
  category: string
  categoryLabel: string
  active: boolean
}

interface PendingImage {
  file: File
  previewUrl: string
  alt: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGES_PER_UPLOAD = 12

function AdminGalleryView() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [filterProject, setFilterProject] = useState('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [pending, setPending] = useState<PendingImage[]>([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [editProjectId, setEditProjectId] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<GalleryImage | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Todas as object URLs criadas para pré-visualização, revogadas ao fechar o
  // modal / desmontar (senão o blob fica retido na memória do navegador).
  const objectUrlsRef = useRef<string[]>([])

  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.push(url)
    return url
  }, [])

  const revokeAllUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }, [])

  useEffect(() => () => revokeAllUrls(), [revokeAllUrls])

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const loadImages = useCallback(async () => {
    try {
      setLoading(true)
      setListError(false)
      const res = await api('/api/admin/gallery')
      if (res.ok) {
        setImages((res.payload?.data as GalleryImage[]) || [])
      } else {
        setListError(true)
      }
    } catch (error) {
      console.error('Load gallery error:', error)
      setListError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const res = await api('/api/admin/projects')
      if (res.ok) {
        setProjects((res.payload?.data as Project[]) || [])
      }
    } catch (error) {
      console.error('Load projects error:', error)
    }
  }, [])

  useEffect(() => {
    loadImages()
    loadProjects()
  }, [loadImages, loadProjects])

  const validateFile = useCallback((file: File): string => {
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !extOk) {
      return `${file.name}: formato inválido. Use JPG, PNG ou WEBP.`
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `${file.name}: a imagem deve ter no máximo 5 MB.`
    }
    return ''
  }, [])

  // ─── Criação (envio em lote) ───────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setCreateProjectId((prev) => prev || String(projects[0]?.id || ''))
    setPending([])
    setFormError('')
    setCreateOpen(true)
  }, [projects])

  const closeCreate = useCallback(() => {
    if (saving) return
    setCreateOpen(false)
    setPending([])
    setFormError('')
    revokeAllUrls()
  }, [saving, revokeAllUrls])

  const handleFilesSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      e.target.value = ''
      if (files.length === 0) return

      setFormError('')
      const accepted: PendingImage[] = []
      for (const file of files) {
        const err = validateFile(file)
        if (err) {
          setFormError(err)
          continue
        }
        accepted.push({ file, previewUrl: trackUrl(URL.createObjectURL(file)), alt: '' })
      }

      setPending((prev) => {
        const next = [...prev, ...accepted]
        if (next.length > MAX_IMAGES_PER_UPLOAD) {
          setFormError(`Envie no máximo ${MAX_IMAGES_PER_UPLOAD} imagens por vez.`)
          return next.slice(0, MAX_IMAGES_PER_UPLOAD)
        }
        return next
      })
    },
    [validateFile, trackUrl]
  )

  const setPendingAlt = useCallback((index: number, alt: string) => {
    setPending((prev) => prev.map((p, i) => (i === index ? { ...p, alt } : p)))
  }, [])

  const removePending = useCallback((index: number) => {
    setPending((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const submitCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')
      if (!createProjectId) {
        setFormError('Selecione o projeto da galeria.')
        return
      }
      if (pending.length === 0) {
        setFormError('Selecione ao menos uma imagem.')
        return
      }

      const fd = new FormData()
      fd.append('projectId', createProjectId)
      pending.forEach((item, index) => {
        fd.append('images', item.file)
        fd.append(`alt_${index}`, item.alt.trim())
      })

      try {
        setSaving(true)
        const res = await api('/api/admin/gallery', { method: 'POST', body: fd })
        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao enviar imagens.')
          return
        }
        showToast(
          'success',
          pending.length === 1 ? 'Imagem adicionada!' : `${pending.length} imagens adicionadas!`
        )
        await loadImages()
        closeCreate()
      } catch (error) {
        console.error('Save gallery error:', error)
        setFormError('Erro ao enviar imagens. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [createProjectId, pending, loadImages, closeCreate, showToast]
  )

  // ─── Edição (uma imagem por vez) ───────────────────────────────────────────
  const openEdit = useCallback((img: GalleryImage) => {
    setEditing(img)
    setEditProjectId(String(img.projectId))
    setEditAlt(img.alt)
    setEditFile(null)
    setEditPreview(null)
    setFormError('')
  }, [])

  const closeEdit = useCallback(() => {
    if (saving) return
    setEditing(null)
    setEditFile(null)
    setEditPreview(null)
    setFormError('')
    revokeAllUrls()
  }, [saving, revokeAllUrls])

  const handleEditFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return
      const err = validateFile(file)
      if (err) {
        setFormError(err)
        return
      }
      setFormError('')
      setEditFile(file)
      setEditPreview(trackUrl(URL.createObjectURL(file)))
    },
    [validateFile, trackUrl]
  )

  const submitEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editing) return
      setFormError('')

      const fd = new FormData()
      fd.append('projectId', editProjectId)
      fd.append('alt', editAlt.trim())
      if (editFile) fd.append('image', editFile)

      try {
        setSaving(true)
        const res = await api(`/api/admin/gallery/${editing.id}`, { method: 'PUT', body: fd })
        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar imagem.')
          return
        }
        showToast('success', 'Imagem atualizada!')
        await loadImages()
        closeEdit()
      } catch (error) {
        console.error('Update gallery error:', error)
        setFormError('Erro ao salvar imagem. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [editing, editProjectId, editAlt, editFile, loadImages, closeEdit, showToast]
  )

  // ─── Exclusão ──────────────────────────────────────────────────────────────
  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/gallery/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao excluir imagem.')
        return
      }
      showToast('success', 'Imagem excluída!')
      setConfirmDelete(null)
      await loadImages()
    } catch (error) {
      console.error('Delete gallery error:', error)
      showToast('error', 'Erro ao excluir imagem')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadImages, showToast])

  // ─── Agrupamento por projeto (mesma leitura da galeria pública) ────────────
  const groups = useMemo(() => {
    const filtered =
      filterProject === 'all'
        ? images
        : images.filter((img) => String(img.projectId) === filterProject)

    const map = new Map<number, { project: string; categoryLabel: string; active: boolean; items: GalleryImage[] }>()
    filtered.forEach((img) => {
      if (!map.has(img.projectId)) {
        map.set(img.projectId, {
          project: img.projectName || 'Projeto sem nome',
          categoryLabel: img.projectCategoryLabel,
          active: img.projectActive,
          items: [],
        })
      }
      map.get(img.projectId)!.items.push(img)
    })
    return Array.from(map.entries()).map(([projectId, group]) => ({ projectId, ...group }))
  }, [images, filterProject])

  const hasProjects = projects.length > 0

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Galeria</h1>
        </div>
        <button
          className={styles.btnAdd}
          onClick={openCreate}
          disabled={!hasProjects}
          title={hasProjects ? undefined : 'Cadastre um projeto antes de adicionar imagens'}
          data-testid="add-gallery-image"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar imagens
        </button>
      </div>

      <div className={styles.dashboardMain}>
        {images.length > 0 && (
          <div className={styles.toolbar}>
            <select
              className={styles.input}
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              aria-label="Filtrar por projeto"
              data-testid="gallery-filter"
            >
              <option value="all">Todos os projetos</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {listError ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Não foi possível carregar a galeria</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadImages}>Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando galeria…</div>
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15L16 10L5 21" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>
              {images.length === 0 ? 'Nenhuma imagem na galeria' : 'Nenhuma imagem neste projeto'}
            </div>
            <div className={styles.emptyDesc}>
              {hasProjects
                ? 'Adicione imagens a um projeto para elas aparecerem na página Galeria do site.'
                : 'Cadastre um projeto antes de montar a galeria.'}
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.projectId} style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '17px', fontWeight: 600, color: 'var(--clr-text-strong, #1a1a18)', margin: 0 }}>
                  {group.project}
                </h2>
                {group.categoryLabel && <span className={styles.badge}>{group.categoryLabel}</span>}
                {!group.active && <span className={`${styles.badge} ${styles.badgeInactive}`}>Projeto inativo</span>}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#888882' }}>
                  {group.items.length} {group.items.length === 1 ? 'imagem' : 'imagens'}
                </span>
              </div>

              <div className={styles.productsGrid}>
                {group.items.map((img) => (
                  <div className={styles.productCard} key={img.id} data-testid="gallery-row">
                    <div className={styles.productCardImage}>
                      {img.url ? (
                        <img src={img.url} alt={img.alt || group.project} loading="lazy" />
                      ) : (
                        <div className={styles.productCardPlaceholder}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.productCardBody}>
                      <div className={styles.productCardName}>
                        {img.alt || <span style={{ color: '#9a9a94' }}>Sem descrição</span>}
                      </div>
                      <div className={styles.productCardMeta}>
                        <span>{group.project}</span>
                        <span>#{img.sortOrder + 1}</span>
                      </div>
                      <div className={styles.productCardActions}>
                        <button className={styles.btnEdit} onClick={() => openEdit(img)} data-testid="edit-gallery-image">Editar</button>
                        <button className={styles.btnDelete} onClick={() => setConfirmDelete(img)} data-testid="delete-gallery-image">Excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {createOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeCreate() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Adicionar imagens à galeria">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>Novo envio</div>
                <div className={styles.modalTitle}>Adicionar imagens</div>
              </div>
              <button className={styles.modalClose} onClick={closeCreate} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={submitCreate} noValidate data-testid="gallery-form">
              {formError && <div className={styles.alertError} role="alert" data-testid="form-error">{formError}</div>}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-project">Projeto</label>
                <select
                  id="g-project"
                  className={styles.input}
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  data-testid="f-project"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}{p.active ? '' : ' (inativo)'}
                    </option>
                  ))}
                </select>
                <div className={styles.inputHint}>As imagens aparecem agrupadas por projeto na página Galeria.</div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-images">Imagens</label>
                <div className={styles.uploadArea}>
                  <div className={styles.uploadPlaceholder}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>
                      {pending.length === 0
                        ? 'Nenhuma imagem selecionada'
                        : `${pending.length} ${pending.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}`}
                    </span>
                  </div>
                  <div className={styles.uploadControls}>
                    <label className={styles.btnUpload} htmlFor="g-images">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      {pending.length > 0 ? 'Adicionar mais' : 'Selecionar imagens'}
                    </label>
                    <input
                      id="g-images"
                      className={styles.fileInput}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFilesSelect}
                      data-testid="f-images"
                    />
                    {pending.length > 0 && (
                      <button type="button" className={styles.linkBtn} onClick={() => setPending([])}>
                        Limpar seleção
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.inputHint}>
                  JPG, PNG ou WEBP · máximo 5 MB por imagem · até {MAX_IMAGES_PER_UPLOAD} por envio
                </div>
              </div>

              {pending.length > 0 && (
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '12px' }}>
                  {pending.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: '12px', alignItems: 'center' }}
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Pré-visualização ${index + 1}`}
                        style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                      />
                      <input
                        className={styles.input}
                        type="text"
                        value={item.alt}
                        onChange={(e) => setPendingAlt(index, e.target.value)}
                        placeholder="Descrição da imagem (ex.: Plantio inicial)"
                        data-testid="f-alt"
                      />
                      <button type="button" className={styles.linkBtn} onClick={() => removePending(index)} aria-label="Remover imagem">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeCreate} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="form-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Enviando…' : 'Salvar imagens'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Editar imagem da galeria">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>Atualizar</div>
                <div className={styles.modalTitle}>Editar imagem</div>
              </div>
              <button className={styles.modalClose} onClick={closeEdit} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={submitEdit} noValidate data-testid="gallery-edit-form">
              {formError && <div className={styles.alertError} role="alert">{formError}</div>}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-edit-project">Projeto</label>
                <select
                  id="g-edit-project"
                  className={styles.input}
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}{p.active ? '' : ' (inativo)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-edit-alt">Descrição</label>
                <textarea
                  id="g-edit-alt"
                  className={styles.input}
                  rows={2}
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="Descrição exibida na galeria"
                  data-testid="f-edit-alt"
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-edit-image">Imagem</label>
                <div className={styles.uploadArea}>
                  {editPreview || editing.url ? (
                    <img className={styles.uploadPreview} src={editPreview || editing.url} alt="Pré-visualização" />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <span>Nenhuma imagem</span>
                    </div>
                  )}
                  <div className={styles.uploadControls}>
                    <label className={styles.btnUpload} htmlFor="g-edit-image">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      {editFile ? 'Trocar imagem' : 'Enviar nova imagem'}
                    </label>
                    <input
                      id="g-edit-image"
                      className={styles.fileInput}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleEditFileSelect}
                    />
                    {editFile && (
                      <button type="button" className={styles.linkBtn} onClick={() => { setEditFile(null); setEditPreview(null) }}>
                        Descartar troca
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.inputHint}>Deixe em branco para manter a imagem atual.</div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeEdit} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="edit-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar imagem'}
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
                <div className={styles.modalTitle}>Excluir imagem</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Tem certeza de que deseja excluir esta imagem
                {confirmDelete.alt ? <> (<strong>{confirmDelete.alt}</strong>)</> : null}? Esta ação não pode ser desfeita.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting}>
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir imagem'}
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

export default AdminGalleryView
