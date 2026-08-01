import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import styles from './Admin.module.css'

interface GalleryImage {
  id: number
  projectId: number
  url: string
  imagePath: string
  /** Breve descrição, exibida ao lado da foto na página pública. */
  alt: string
  /** Descrição completa, exibida abaixo das fotos. */
  description: string
  featured: boolean
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
  description: string
}

/**
 * Qual foto é a capa da galeria: `'current'` = a foto que está sendo editada,
 * um número = índice dentro das fotos novas, `null` = mantém o destaque atual
 * do projeto.
 */
type FeaturedChoice = 'current' | number | null

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGES_PER_UPLOAD = 12
const NEW_PROJECT = '__new__'

/** Foto com o seletor de destaque sobreposto — é ali que se escolhe a capa. */
function FeaturedPhoto({
  src,
  label,
  name,
  checked,
  onSelect,
}: {
  src: string
  label: string
  name: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <div className={styles.photoTile}>
      <img src={src} alt={label} />
      <label className={`${styles.photoFeatured} ${checked ? styles.photoFeaturedOn : ''}`}>
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onSelect}
          data-testid="f-featured"
        />
        {checked ? 'Capa da galeria' : 'Destaque'}
      </label>
    </div>
  )
}

/**
 * Seletor do projeto ao qual a imagem pertence, com a opção de escrever o nome
 * de um projeto novo e salvá-lo sem sair do formulário da galeria.
 */
function ProjectField({
  id,
  projects,
  value,
  onChange,
  onCreated,
  hint,
}: {
  id: string
  projects: Project[]
  value: string
  onChange: (projectId: string) => void
  onCreated: (project: Project) => void
  hint?: string
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Sem nenhum projeto cadastrado não há o que selecionar: o formulário de
  // criação já abre aberto.
  useEffect(() => {
    if (projects.length === 0) setCreating(true)
  }, [projects.length])

  const cancel = () => {
    setCreating(false)
    setName('')
    setCategoryLabel('')
    setErr('')
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Escreva o nome do projeto.')
      return
    }
    try {
      setBusy(true)
      setErr('')
      const res = await api('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed, categoryLabel: categoryLabel.trim() }),
      })
      if (!res.ok) {
        setErr(res.payload?.error || 'Erro ao criar o projeto.')
        return
      }
      const created = res.payload?.data as Project | undefined
      if (!created?.id) {
        setErr('Resposta inesperada do servidor.')
        return
      }
      onCreated(created)
      onChange(String(created.id))
      cancel()
    } catch (error) {
      console.error('Create project error:', error)
      setErr('Erro ao criar o projeto. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${styles.field} ${styles.fieldFull}`}>
      <label className={styles.label} htmlFor={id}>Projeto</label>
      <select
        id={id}
        className={styles.input}
        value={creating ? NEW_PROJECT : value}
        onChange={(e) => {
          if (e.target.value === NEW_PROJECT) {
            setCreating(true)
            setErr('')
          } else {
            setCreating(false)
            onChange(e.target.value)
          }
        }}
        data-testid="f-project"
      >
        {projects.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name}{p.active ? '' : ' (inativo)'}
          </option>
        ))}
        <option value={NEW_PROJECT}>+ Criar novo projeto…</option>
      </select>

      {creating && (
        <div
          style={{
            display: 'grid',
            gap: '10px',
            marginTop: '12px',
            padding: '14px',
            border: '1px solid rgba(49,91,44,0.16)',
            borderRadius: '8px',
          }}
        >
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do projeto (ex.: Horta Comunitária 2026)"
            maxLength={120}
            autoFocus
            data-testid="f-new-project-name"
          />
          <input
            className={styles.input}
            type="text"
            value={categoryLabel}
            onChange={(e) => setCategoryLabel(e.target.value)}
            placeholder="Categoria (ex.: Agricultura) — opcional"
            maxLength={60}
            data-testid="f-new-project-category"
          />
          {err && <div className={styles.fieldError}>{err}</div>}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className={styles.btnUpload}
              onClick={save}
              disabled={busy}
              data-testid="f-new-project-save"
            >
              {busy ? 'Salvando…' : 'Salvar projeto'}
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              style={{ width: 'auto', padding: 0 }}
              onClick={cancel}
              disabled={busy}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {hint && !creating && <div className={styles.inputHint}>{hint}</div>}
    </div>
  )
}

function AdminGalleryView() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [filterProject, setFilterProject] = useState('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [pending, setPending] = useState<PendingImage[]>([])
  // Índice, dentro do lote, da imagem escolhida como destaque (capa) da
  // galeria. null = mantém o destaque atual do projeto.
  const [featuredIndex, setFeaturedIndex] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [editProjectId, setEditProjectId] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFeatured, setEditFeatured] = useState<FeaturedChoice>(null)
  // Fotos novas que entram no MESMO projeto junto com a edição.
  const [editPending, setEditPending] = useState<PendingImage[]>([])
  // Substituição (opcional) do arquivo da foto que está sendo editada.
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

  const addProject = useCallback((project: Project) => {
    setProjects((prev) => (prev.some((p) => p.id === project.id) ? prev : [...prev, project]))
  }, [])

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

  // ─── Seleção de arquivos (mesma lógica nos dois modais) ────────────────────
  const handleFilesSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
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
        accepted.push({
          file,
          previewUrl: trackUrl(URL.createObjectURL(file)),
          alt: '',
          description: '',
        })
      }
      if (accepted.length === 0) return

      const setter = target === 'create' ? setPending : setEditPending
      setter((prev) => {
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

  const setPendingField = useCallback(
    (target: 'create' | 'edit', index: number, patch: Partial<PendingImage>) => {
      const setter = target === 'create' ? setPending : setEditPending
      setter((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
    },
    []
  )

  // O destaque acompanha a remoção: some quem estava marcado, some o destaque.
  const shiftFeatured = (prev: FeaturedChoice, removed: number): FeaturedChoice => {
    if (typeof prev !== 'number') return prev
    if (removed === prev) return null
    return removed < prev ? prev - 1 : prev
  }

  const removePending = useCallback((target: 'create' | 'edit', index: number) => {
    if (target === 'create') {
      setPending((prev) => prev.filter((_, i) => i !== index))
      setFeaturedIndex((prev) => shiftFeatured(prev, index) as number | null)
    } else {
      setEditPending((prev) => prev.filter((_, i) => i !== index))
      setEditFeatured((prev) => shiftFeatured(prev, index))
    }
  }, [])

  // ─── Criação (envio em lote) ───────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setCreateProjectId((prev) => prev || String(projects[0]?.id || ''))
    setPending([])
    setFeaturedIndex(null)
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
        fd.append(`description_${index}`, item.description.trim())
      })
      if (featuredIndex !== null && featuredIndex < pending.length) {
        fd.append('featuredIndex', String(featuredIndex))
      }

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
    [createProjectId, pending, featuredIndex, loadImages, closeCreate, showToast]
  )

  // ─── Edição (a foto atual + novas fotos do mesmo projeto) ──────────────────
  const openEdit = useCallback((img: GalleryImage) => {
    setEditing(img)
    setEditProjectId(String(img.projectId))
    setEditAlt(img.alt)
    setEditDescription(img.description)
    setEditFeatured(img.featured ? 'current' : null)
    setEditPending([])
    setEditFile(null)
    setEditPreview(null)
    setFormError('')
  }, [])

  const closeEdit = useCallback(() => {
    if (saving) return
    setEditing(null)
    setEditPending([])
    setEditFile(null)
    setEditPreview(null)
    setFormError('')
    revokeAllUrls()
  }, [saving, revokeAllUrls])

  const handleReplaceSelect = useCallback(
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
      fd.append('description', editDescription.trim())
      fd.append('featured', String(editFeatured === 'current'))
      if (editFile) fd.append('image', editFile)

      try {
        setSaving(true)
        const res = await api(`/api/admin/gallery/${editing.id}`, { method: 'PUT', body: fd })
        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar imagem.')
          return
        }

        // As fotos novas entram como imagens adicionais do mesmo projeto. Vão
        // depois do PUT para que o destaque escolhido aqui seja o último a
        // valer (só existe uma capa por projeto).
        if (editPending.length > 0) {
          const batch = new FormData()
          batch.append('projectId', editProjectId)
          editPending.forEach((item, index) => {
            batch.append('images', item.file)
            batch.append(`alt_${index}`, item.alt.trim())
            batch.append(`description_${index}`, item.description.trim())
          })
          if (typeof editFeatured === 'number' && editFeatured < editPending.length) {
            batch.append('featuredIndex', String(editFeatured))
          }
          const batchRes = await api('/api/admin/gallery', { method: 'POST', body: batch })
          if (!batchRes.ok) {
            await loadImages()
            setFormError(
              batchRes.payload?.error ||
                'A imagem foi salva, mas as fotos novas não foram enviadas. Tente de novo.'
            )
            return
          }
        }

        showToast(
          'success',
          editPending.length > 0
            ? `Imagem atualizada e ${editPending.length} ${editPending.length === 1 ? 'foto adicionada' : 'fotos adicionadas'}!`
            : 'Imagem atualizada!'
        )
        await loadImages()
        closeEdit()
      } catch (error) {
        console.error('Update gallery error:', error)
        setFormError('Erro ao salvar imagem. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [
      editing,
      editProjectId,
      editAlt,
      editDescription,
      editFeatured,
      editFile,
      editPending,
      loadImages,
      closeEdit,
      showToast,
    ]
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

  const renderPendingRows = (target: 'create' | 'edit', items: PendingImage[], featured: FeaturedChoice) =>
    items.map((item, index) => (
      <div className={styles.photoRow} key={`${item.file.name}-${index}`}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <FeaturedPhoto
            src={item.previewUrl}
            label={`Pré-visualização ${index + 1}`}
            name={`gallery-featured-${target}`}
            checked={featured === index}
            onSelect={() =>
              target === 'create' ? setFeaturedIndex(index) : setEditFeatured(index)
            }
          />
          <button
            type="button"
            className={styles.linkBtn}
            style={{ padding: '4px 0' }}
            onClick={() => removePending(target, index)}
          >
            Remover
          </button>
        </div>
        <div className={styles.photoRowFields}>
          <input
            className={styles.input}
            type="text"
            value={item.alt}
            onChange={(e) => setPendingField(target, index, { alt: e.target.value })}
            placeholder="Breve descrição (ex.: Plantio inicial)"
            maxLength={300}
            data-testid="f-alt"
          />
          <textarea
            className={styles.input}
            rows={3}
            value={item.description}
            onChange={(e) => setPendingField(target, index, { description: e.target.value })}
            placeholder="Descrição completa — texto exibido abaixo das fotos"
            data-testid="f-description"
          />
        </div>
      </div>
    ))

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Galeria</h1>
        </div>
        <button
          className={styles.btnAdd}
          onClick={openCreate}
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
                : 'Clique em “Adicionar imagens” para criar o primeiro projeto e montar a galeria.'}
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
                      {img.featured && (
                        <div className={styles.productCardBadges}>
                          <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Destaque</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.productCardBody}>
                      <div className={styles.productCardName}>
                        {img.alt || <span style={{ color: '#9a9a94' }}>Sem descrição</span>}
                      </div>
                      <div className={styles.productCardMeta}>
                        <span>{group.project}</span>
                        <span>{img.description ? 'Com descrição completa' : 'Sem descrição completa'}</span>
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

              <ProjectField
                id="g-project"
                projects={projects}
                value={createProjectId}
                onChange={setCreateProjectId}
                onCreated={addProject}
                hint="As imagens aparecem agrupadas por projeto na página Galeria."
              />

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
                      onChange={(e) => handleFilesSelect(e, 'create')}
                      data-testid="f-images"
                    />
                    {pending.length > 0 && (
                      <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: 0 }} onClick={() => { setPending([]); setFeaturedIndex(null) }}>
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
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '18px' }}>
                  <div className={styles.inputHint} style={{ margin: 0 }}>
                    Clique em “Destaque” sobre uma foto para ela virar a capa da galeria e abrir
                    primeiro na tela de detalhes. Sem marcar, a capa atual do projeto é mantida.
                  </div>
                  {renderPendingRows('create', pending, featuredIndex)}
                  {featuredIndex !== null && (
                    <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: 0, justifySelf: 'start' }} onClick={() => setFeaturedIndex(null)}>
                      Não alterar o destaque
                    </button>
                  )}
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

              <ProjectField
                id="g-edit-project"
                projects={projects}
                value={editProjectId}
                onChange={setEditProjectId}
                onCreated={addProject}
                hint="Projeto ao qual esta imagem pertence na página Galeria."
              />

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Foto atual</label>
                <div className={styles.photoRow}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <FeaturedPhoto
                      src={editPreview || editing.url}
                      label={editAlt || 'Foto da galeria'}
                      name="gallery-featured-edit"
                      checked={editFeatured === 'current'}
                      onSelect={() => setEditFeatured('current')}
                    />
                    <label className={styles.linkBtn} style={{ padding: '4px 0', cursor: 'pointer' }} htmlFor="g-edit-image">
                      {editFile ? 'Trocar outro arquivo' : 'Substituir esta foto'}
                    </label>
                    <input
                      id="g-edit-image"
                      className={styles.fileInput}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleReplaceSelect}
                    />
                    {editFile && (
                      <button type="button" className={styles.linkBtn} style={{ padding: '4px 0' }} onClick={() => { setEditFile(null); setEditPreview(null) }}>
                        Descartar troca
                      </button>
                    )}
                  </div>
                  <div className={styles.photoRowFields}>
                    <div>
                      <label className={styles.label} htmlFor="g-edit-alt">Breve descrição</label>
                      <input
                        id="g-edit-alt"
                        className={styles.input}
                        type="text"
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        placeholder="Ex.: Plantio inicial"
                        maxLength={300}
                        data-testid="f-edit-alt"
                      />
                      <div className={styles.inputHint}>Aparece ao lado da foto na página da galeria.</div>
                    </div>
                    <div>
                      <label className={styles.label} htmlFor="g-edit-description">Descrição completa</label>
                      <textarea
                        id="g-edit-description"
                        className={styles.input}
                        rows={6}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Texto completo exibido abaixo das fotos"
                        data-testid="f-edit-description"
                      />
                      <div className={styles.inputHint}>Use uma linha em branco para separar parágrafos.</div>
                    </div>
                  </div>
                </div>
                <div className={styles.inputHint}>
                  “Substituir esta foto” troca o arquivo desta imagem. Para ter mais de uma foto no
                  projeto, use “Adicionar fotos” abaixo.
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-edit-more">Adicionar fotos a este projeto</label>
                <div className={styles.uploadControls}>
                  <label className={styles.btnUpload} htmlFor="g-edit-more">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {editPending.length > 0 ? 'Adicionar mais' : 'Adicionar fotos'}
                  </label>
                  <input
                    id="g-edit-more"
                    className={styles.fileInput}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFilesSelect(e, 'edit')}
                    data-testid="f-edit-images"
                  />
                  {editPending.length > 0 && (
                    <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: 0 }} onClick={() => { setEditPending([]); setEditFeatured((prev) => (typeof prev === 'number' ? null : prev)) }}>
                      Limpar seleção
                    </button>
                  )}
                </div>
                <div className={styles.inputHint}>
                  Cada foto nova vira uma imagem do mesmo projeto, com sua própria descrição.
                  JPG, PNG ou WEBP · máximo 5 MB por imagem.
                </div>
              </div>

              {editPending.length > 0 && (
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '18px' }}>
                  {renderPendingRows('edit', editPending, editFeatured)}
                </div>
              )}

              {editFeatured !== null && (
                <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: '10px 0 0', justifySelf: 'start' }} onClick={() => setEditFeatured(null)}>
                  {editing.featured && editFeatured === 'current'
                    ? 'Remover o destaque desta foto'
                    : 'Não alterar o destaque'}
                </button>
              )}

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
