import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import {
  processImage,
  ImageProcessingError,
  GALLERY_IMAGE_PROFILE,
  PROJECT_LOGO_PROFILE,
} from '../../lib/imageProcessor'
import styles from './Admin.module.css'

/**
 * Cadastro único de projeto. O mesmo registro alimenta o Grid público
 * (/projetos) e a Galeria (/galeria); cada um é ligado por um checkbox
 * independente, e nenhum dos dois marcado significa "salvo só no painel".
 */
interface ProjectGalleryExtra {
  id: number
  alt: string
  url: string
}

interface ProjectGallery {
  recordId: number
  alt: string
  description: string
  coverUrl: string
  imageCount: number
  extras: ProjectGalleryExtra[]
}

interface Project {
  id: number
  slug: string
  name: string
  category: string
  categoryLabel: string
  description: string
  logoUrl: string
  active: boolean
  showInGallery: boolean
  showInProjects: boolean
  gallery: ProjectGallery | null
}

interface PendingImage {
  file: File
  previewUrl: string
  alt: string
}

const MAX_GALLERY_IMAGES = 12
const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

// Por padrão, um novo cadastro entra só na Galeria: ela também recebe fotos
// que não são "projetos" (ex.: registros de atividades avulsas), então o
// Grid de Projetos não deve ser marcado automaticamente — só quando o
// usuário confirma que aquilo é, de fato, um projeto.
const EMPTY_FORM = {
  name: '',
  categoryLabel: '',
  description: '',
  alt: '',
  showInGallery: true,
  showInProjects: false,
}

function AdminProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [filterVisibility, setFilterVisibility] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Logo: arquivo novo, preview e flag de remoção da atual.
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // Capa da galeria: substituição do arquivo já salvo.
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Fotos: as já salvas (com remoção marcada) e as novas a enviar.
  const [savedExtras, setSavedExtras] = useState<ProjectGalleryExtra[]>([])
  const [removedExtras, setRemovedExtras] = useState<number[]>([])
  const [newImages, setNewImages] = useState<PendingImage[]>([])

  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(0)

  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

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

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setListError(false)
      const res = await api('/api/admin/projects')
      if (res.ok) setProjects((res.payload?.data as Project[]) || [])
      else setListError(true)
    } catch (error) {
      console.error('Load projects error:', error)
      setListError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Sugestões de categoria (datalist): rótulos já usados em outros projetos,
  // para manter consistência sem travar o campo numa lista fixa.
  const categorySuggestions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.categoryLabel).filter(Boolean))).sort(),
    [projects]
  )

  const describeError = useCallback((file: File, err: unknown): string => {
    const detail = err instanceof ImageProcessingError ? err.message : 'falha ao processar a imagem.'
    return `${file.name}: ${detail}`
  }, [])

  // ─── Seleção de arquivos (tudo convertido para WEBP antes de ir ao estado) ──
  const handleLogoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return
      setFormError('')
      setProcessing((n) => n + 1)
      try {
        const processed = await processImage(file, PROJECT_LOGO_PROFILE)
        setLogoFile(processed.file)
        setLogoPreview(trackUrl(URL.createObjectURL(processed.file)))
        setRemoveLogo(false)
      } catch (err) {
        setFormError(describeError(file, err))
      } finally {
        setProcessing((n) => n - 1)
      }
    },
    [trackUrl, describeError]
  )

  const handleCoverSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return
      setFormError('')
      setProcessing((n) => n + 1)
      try {
        const processed = await processImage(file, GALLERY_IMAGE_PROFILE)
        setCoverFile(processed.file)
        setCoverPreview(trackUrl(URL.createObjectURL(processed.file)))
      } catch (err) {
        setFormError(describeError(file, err))
      } finally {
        setProcessing((n) => n - 1)
      }
    },
    [trackUrl, describeError]
  )

  const handleImagesSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      e.target.value = ''
      if (files.length === 0) return

      setFormError('')
      setProcessing((n) => n + 1)
      const accepted: PendingImage[] = []
      try {
        for (const file of files) {
          try {
            const processed = await processImage(file, GALLERY_IMAGE_PROFILE)
            accepted.push({
              file: processed.file,
              previewUrl: trackUrl(URL.createObjectURL(processed.file)),
              alt: '',
            })
          } catch (err) {
            setFormError(describeError(file, err))
          }
        }
      } finally {
        setProcessing((n) => n - 1)
      }
      if (accepted.length === 0) return

      setNewImages((prev) => {
        const next = [...prev, ...accepted]
        if (next.length > MAX_GALLERY_IMAGES) {
          setFormError(`Envie no máximo ${MAX_GALLERY_IMAGES} imagens por vez.`)
          return next.slice(0, MAX_GALLERY_IMAGES)
        }
        return next
      })
    },
    [trackUrl, describeError]
  )

  // ─── Abrir/fechar o modal ──────────────────────────────────────────────────
  const resetMedia = useCallback(() => {
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(false)
    setCoverFile(null)
    setCoverPreview(null)
    setSavedExtras([])
    setRemovedExtras([])
    setNewImages([])
  }, [])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    resetMedia()
    setFormError('')
    setModalOpen(true)
  }, [resetMedia])

  const openEdit = useCallback(
    (project: Project) => {
      setEditing(project)
      setForm({
        name: project.name,
        categoryLabel: project.categoryLabel,
        description: project.gallery?.description || project.description || '',
        alt: project.gallery?.alt || '',
        showInGallery: project.showInGallery,
        showInProjects: project.showInProjects,
      })
      resetMedia()
      setSavedExtras(project.gallery?.extras || [])
      setFormError('')
      setModalOpen(true)
    },
    [resetMedia]
  )

  const closeModal = useCallback(() => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    resetMedia()
    setFormError('')
    revokeAllUrls()
  }, [saving, resetMedia, revokeAllUrls])

  // ─── Salvar (cria ou edita) ────────────────────────────────────────────────
  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')

      if (processing > 0) {
        setFormError('Aguarde a conversão das imagens.')
        return
      }
      if (!form.name.trim()) {
        setFormError('Informe o título do projeto.')
        return
      }
      if (!form.categoryLabel.trim()) {
        setFormError('Informe a categoria do projeto.')
        return
      }

      const hasCover = Boolean(editing?.gallery) || Boolean(coverFile) || newImages.length > 0
      if (form.showInGallery && !hasCover) {
        setFormError('Para exibir na Galeria, envie ao menos uma imagem do projeto.')
        return
      }

      const hasLogo = Boolean(logoFile) || (!removeLogo && Boolean(editing?.logoUrl))
      if (form.showInProjects && !hasLogo) {
        setFormError('Para exibir no Grid de Projetos, envie a imagem de capa.')
        return
      }

      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('categoryLabel', form.categoryLabel.trim())
      fd.append('description', form.description.trim())
      fd.append('alt', form.alt.trim())
      fd.append('showInGallery', String(form.showInGallery))
      fd.append('showInProjects', String(form.showInProjects))
      if (logoFile) fd.append('logo', logoFile)
      if (removeLogo && !logoFile) fd.append('removeLogo', 'true')
      if (coverFile) fd.append('coverImage', coverFile)
      newImages.forEach((item, index) => {
        fd.append('images', item.file)
        fd.append(`extraAlt_${index}`, item.alt.trim())
      })
      if (removedExtras.length > 0) {
        fd.append('removeExtraIds', JSON.stringify(removedExtras))
      }

      try {
        setSaving(true)
        const res = editing
          ? await api(`/api/admin/projects/${editing.id}`, { method: 'PUT', body: fd })
          : await api('/api/admin/projects', { method: 'POST', body: fd })

        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar o projeto.')
          return
        }

        // A breve descrição das fotos já salvas é atualizada uma a uma.
        for (const extra of savedExtras) {
          if (removedExtras.includes(extra.id)) continue
          const original = editing?.gallery?.extras.find((x) => x.id === extra.id)
          if (original && original.alt === extra.alt) continue
          await api(`/api/admin/gallery/${extra.id}`, {
            method: 'PUT',
            body: JSON.stringify({ alt: extra.alt.trim() }),
          })
        }

        showToast('success', editing ? 'Projeto atualizado!' : 'Projeto criado!')
        await loadProjects()
        closeModal()
      } catch (error) {
        console.error('Save project error:', error)
        setFormError('Erro ao salvar o projeto. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [processing, form, editing, logoFile, removeLogo, coverFile, newImages, removedExtras, savedExtras, loadProjects, closeModal, showToast]
  )

  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/projects/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao excluir o projeto.')
        return
      }
      showToast('success', 'Projeto excluído!')
      setConfirmDelete(null)
      await loadProjects()
    } catch (error) {
      console.error('Delete project error:', error)
      showToast('error', 'Erro ao excluir o projeto')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadProjects, showToast])

  const filtered = useMemo(() => {
    if (filterVisibility === 'gallery') return projects.filter((p) => p.showInGallery)
    if (filterVisibility === 'grid') return projects.filter((p) => p.showInProjects)
    if (filterVisibility === 'hidden') return projects.filter((p) => !p.showInGallery && !p.showInProjects)
    return projects
  }, [projects, filterVisibility])

  const currentCover = coverPreview || editing?.gallery?.coverUrl || ''
  const currentLogo = removeLogo ? '' : logoPreview || editing?.logoUrl || ''

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Projetos</h1>
        </div>
        <button className={styles.btnAdd} onClick={openCreate} data-testid="add-project">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar projeto
        </button>
      </div>

      <div className={styles.dashboardMain}>
        {projects.length > 0 && (
          <div className={styles.toolbar}>
            <select
              className={styles.input}
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              aria-label="Filtrar por exibição"
              data-testid="project-filter"
            >
              <option value="all">Todos os projetos</option>
              <option value="grid">Exibidos no Grid de Projetos</option>
              <option value="gallery">Exibidos na Galeria</option>
              <option value="hidden">Não exibidos publicamente</option>
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
            <div className={styles.emptyTitle}>Não foi possível carregar os projetos</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadProjects}>Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando projetos…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 8v13h6v-7h8v7h6V8L12 2z" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>
              {projects.length === 0 ? 'Nenhum projeto cadastrado' : 'Nenhum projeto neste filtro'}
            </div>
            <div className={styles.emptyDesc}>
              Cada projeto pode aparecer no Grid de Projetos, na Galeria, nos dois, ou em nenhum.
            </div>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filtered.map((project) => (
              <div className={styles.productCard} key={project.id} data-testid="project-row">
                <div className={styles.productCardImage}>
                  {project.gallery?.coverUrl || project.logoUrl ? (
                    <img
                      src={project.gallery?.coverUrl || project.logoUrl}
                      alt={project.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.productCardPlaceholder}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M12 2L2 8v13h6v-7h8v7h6V8L12 2z" />
                      </svg>
                    </div>
                  )}
                  <div className={styles.productCardBadges}>
                    {project.showInProjects && (
                      <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Grid</span>
                    )}
                    {project.showInGallery && (
                      <span className={`${styles.productCardBadge} ${styles.badgeNew}`}>Galeria</span>
                    )}
                  </div>
                </div>
                <div className={styles.productCardBody}>
                  <div className={styles.productCardName}>{project.name}</div>
                  <div className={styles.productCardMeta}>
                    <span>{project.categoryLabel}</span>
                    <span>
                      {project.gallery
                        ? `${project.gallery.imageCount} ${project.gallery.imageCount === 1 ? 'foto' : 'fotos'}`
                        : 'Sem fotos'}
                    </span>
                  </div>
                  {!project.showInGallery && !project.showInProjects && (
                    <div className={styles.productCardMeta}>
                      <span className={`${styles.badge} ${styles.badgeInactive}`}>Não exibido publicamente</span>
                    </div>
                  )}
                  <div className={styles.productCardActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(project)} data-testid="edit-project">Editar</button>
                    <button className={styles.btnDelete} onClick={() => setConfirmDelete(project)} data-testid="delete-project">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Cadastro de projeto">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{editing ? 'Atualizar' : 'Novo'}</div>
                <div className={styles.modalTitle}>Projeto</div>
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>

            <form className={styles.form} onSubmit={submit} noValidate data-testid="project-form">
              {formError && <div className={styles.alertError} role="alert" data-testid="form-error">{formError}</div>}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-name">Título</label>
                <input
                  id="p-name"
                  className={styles.input}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex.: Horta Comunitária 2026"
                  maxLength={120}
                  data-testid="f-name"
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-category">Categoria</label>
                <input
                  id="p-category"
                  className={styles.input}
                  type="text"
                  list="p-category-suggestions"
                  value={form.categoryLabel}
                  onChange={(e) => setForm((f) => ({ ...f, categoryLabel: e.target.value }))}
                  placeholder="Ex.: Agricultura Familiar"
                  maxLength={60}
                  data-testid="f-category"
                />
                <datalist id="p-category-suggestions">
                  {categorySuggestions.map((label) => (
                    <option key={label} value={label} />
                  ))}
                </datalist>
                <div className={styles.inputHint}>
                  Editar a categoria de um projeto já existente não afeta os demais.
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Onde exibir</label>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.showInGallery}
                    onChange={(e) => setForm((f) => ({ ...f, showInGallery: e.target.checked }))}
                    data-testid="f-show-gallery"
                  />
                  <span className={styles.checkboxLabel}>Exibir na Galeria</span>
                </label>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.showInProjects}
                    onChange={(e) => setForm((f) => ({ ...f, showInProjects: e.target.checked }))}
                    data-testid="f-show-projects"
                  />
                  <span className={styles.checkboxLabel}>Exibir no Grid de Projetos</span>
                </label>
                <div className={styles.inputHint}>
                  Os dois são independentes: a Galeria também recebe fotos que não são projetos,
                  então marcar "Exibir na Galeria" não coloca o item no Grid automaticamente
                  (e vice-versa). Sem nenhum marcado, fica salvo aqui no painel mas não aparece no site.
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-logo">Logo / imagem principal</label>
                <div className={styles.photoRow}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {currentLogo ? (
                      <div className={styles.photoTile}>
                        <img src={currentLogo} alt="Logo do projeto" />
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholder} style={{ maxWidth: '170px', height: '140px' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                          <path d="M12 2L2 8v13h6v-7h8v7h6V8L12 2z" />
                        </svg>
                      </div>
                    )}
                    <label className={styles.linkBtn} style={{ padding: '4px 0', cursor: 'pointer' }} htmlFor="p-logo">
                      {currentLogo ? 'Trocar logo' : 'Selecionar logo'}
                    </label>
                    <input
                      id="p-logo"
                      className={styles.fileInput}
                      type="file"
                      accept={FILE_ACCEPT}
                      onChange={handleLogoSelect}
                      data-testid="f-logo"
                    />
                    {currentLogo && (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        style={{ padding: '4px 0' }}
                        onClick={() => { setLogoFile(null); setLogoPreview(null); setRemoveLogo(true) }}
                      >
                        Remover logo
                      </button>
                    )}
                  </div>
                  <div className={styles.photoRowFields}>
                    <div className={styles.inputHint}>
                      {form.showInProjects
                        ? 'Obrigatória: é a capa exibida no card do Grid de Projetos.'
                        : 'Exibida no card do Grid de Projetos, se marcado acima.'}{' '}
                      JPG, PNG ou WEBP · máximo 5 MB · convertida automaticamente para WEBP (até 1000 px).
                    </div>
                  </div>
                </div>
              </div>

              {editing?.gallery && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Capa da galeria</label>
                  <div className={styles.photoRow}>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <div className={styles.photoTile}>
                        <img src={currentCover} alt="Capa da galeria" />
                      </div>
                      <label className={styles.linkBtn} style={{ padding: '4px 0', cursor: 'pointer' }} htmlFor="p-cover">
                        Substituir a capa
                      </label>
                      <input
                        id="p-cover"
                        className={styles.fileInput}
                        type="file"
                        accept={FILE_ACCEPT}
                        onChange={handleCoverSelect}
                        data-testid="f-cover"
                      />
                      {coverFile && (
                        <button
                          type="button"
                          className={styles.linkBtn}
                          style={{ padding: '4px 0' }}
                          onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                        >
                          Descartar troca
                        </button>
                      )}
                    </div>
                    <div className={styles.photoRowFields}>
                      <div>
                        <label className={styles.label} htmlFor="p-alt">Breve descrição</label>
                        <input
                          id="p-alt"
                          className={styles.input}
                          type="text"
                          value={form.alt}
                          onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                          placeholder="Ex.: Plantio inicial da safra"
                          maxLength={300}
                          data-testid="f-alt"
                        />
                        <div className={styles.inputHint}>Aparece ao lado da foto na página da galeria.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!editing?.gallery && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="p-alt-new">Breve descrição da capa</label>
                  <input
                    id="p-alt-new"
                    className={styles.input}
                    type="text"
                    value={form.alt}
                    onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                    placeholder="Ex.: Plantio inicial da safra"
                    maxLength={300}
                    data-testid="f-alt"
                  />
                  <div className={styles.inputHint}>
                    A primeira imagem enviada abaixo vira a capa na página da Galeria.
                  </div>
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-images">Imagens do projeto</label>
                <div className={styles.uploadControls}>
                  <label className={styles.btnUpload} htmlFor="p-images">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar imagens
                  </label>
                  <input
                    id="p-images"
                    className={styles.fileInput}
                    type="file"
                    multiple
                    accept={FILE_ACCEPT}
                    onChange={handleImagesSelect}
                    data-testid="f-images"
                  />
                  {newImages.length > 0 && (
                    <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: 0 }} onClick={() => setNewImages([])}>
                      Limpar seleção
                    </button>
                  )}
                </div>
                <div className={styles.inputHint}>
                  Exibidas na página da Galeria. Convertidas automaticamente para WEBP (até 1800 px).
                </div>
              </div>

              {(savedExtras.length > 0 || newImages.length > 0) && (
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '18px' }}>
                  {savedExtras.map((item) => {
                    const removed = removedExtras.includes(item.id)
                    return (
                      <div className={styles.photoRow} key={item.id} style={{ opacity: removed ? 0.45 : 1 }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div className={styles.photoTile}>
                            <img src={item.url} alt={item.alt || 'Foto do projeto'} />
                          </div>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            style={{ padding: '4px 0' }}
                            onClick={() =>
                              setRemovedExtras((prev) =>
                                removed ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                              )
                            }
                          >
                            {removed ? 'Desfazer' : 'Remover'}
                          </button>
                        </div>
                        <div className={styles.photoRowFields}>
                          <input
                            className={styles.input}
                            type="text"
                            value={item.alt}
                            disabled={removed}
                            onChange={(e) =>
                              setSavedExtras((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, alt: e.target.value } : p))
                              )
                            }
                            placeholder="Breve descrição desta foto (opcional)"
                            maxLength={300}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {newImages.map((item, index) => {
                    // Sem galeria ainda, a 1ª foto enviada vira a capa — a
                    // legenda dela já é a "Breve descrição da capa" acima, então
                    // não repete o campo aqui (evita dois lugares para o mesmo texto).
                    const isNewCover = !editing?.gallery && index === 0
                    return (
                    <div className={styles.photoRow} key={`${item.file.name}-${index}`}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <div className={styles.photoTile}>
                          <img src={item.previewUrl} alt={isNewCover ? 'Capa do projeto' : `Foto ${index + 1}`} />
                        </div>
                        {isNewCover && (
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#6F8F3A', fontWeight: 600 }}>
                            Capa do projeto
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.linkBtn}
                          style={{ padding: '4px 0' }}
                          onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remover
                        </button>
                      </div>
                      <div className={styles.photoRowFields}>
                        {isNewCover ? (
                          <div className={styles.inputHint}>Use o campo “Breve descrição da capa” acima.</div>
                        ) : (
                        <input
                          className={styles.input}
                          type="text"
                          value={item.alt}
                          onChange={(e) =>
                            setNewImages((prev) => prev.map((p, i) => (i === index ? { ...p, alt: e.target.value } : p)))
                          }
                          placeholder="Breve descrição desta foto (opcional)"
                          maxLength={300}
                        />
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="p-description">Descrição</label>
                <textarea
                  id="p-description"
                  className={styles.input}
                  rows={6}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Texto completo exibido na página do projeto"
                  data-testid="f-description"
                />
                <div className={styles.inputHint}>Use uma linha em branco para separar parágrafos.</div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="form-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar projeto'}
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
                <div className={styles.modalTitle}>Excluir projeto</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Excluir <strong>{confirmDelete.name}</strong> remove também a logo e todas as fotos
                do projeto, no Grid e na Galeria. Esta ação não pode ser desfeita.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting}>
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir projeto'}
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

export default AdminProjectsView
