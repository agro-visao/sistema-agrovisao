import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import { processImage, ImageProcessingError, GALLERY_IMAGE_PROFILE } from '../../lib/imageProcessor'
import styles from './Admin.module.css'

/**
 * Um registro da galeria é: imagem de capa + breve descrição + fotos
 * complementares + descrição completa.
 *
 * No banco, o registro é a linha com `parentId` nulo (guarda os dois textos e o
 * destaque) e cada foto complementar é uma linha apontando para ela, com no
 * máximo uma breve descrição própria.
 */
interface GalleryImage {
  id: number
  projectId: number
  parentId: number | null
  url: string
  imagePath: string
  /** Breve descrição, exibida ao lado da foto na página pública. */
  alt: string
  /** Descrição completa, exibida abaixo das fotos (só no registro). */
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
  /** Breve descrição da foto (opcional nas complementares). */
  alt: string
}

const MAX_IMAGES_PER_UPLOAD = 12
const NEW_PROJECT = '__new__'

/** Capa com o seletor de destaque sobreposto à própria foto. */
function CoverPhoto({
  src,
  label,
  checked,
  onToggle,
}: {
  src: string
  label: string
  checked: boolean
  onToggle: (value: boolean) => void
}) {
  return (
    <div className={styles.photoTile}>
      <img src={src} alt={label} />
      <label className={`${styles.photoFeatured} ${checked ? styles.photoFeaturedOn : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          data-testid="f-featured"
        />
        {checked ? 'Capa da galeria' : 'Definir como capa'}
      </label>
    </div>
  )
}

/**
 * Seletor do projeto ao qual o registro pertence, com a opção de escrever o
 * nome de um projeto novo e salvá-lo sem sair do formulário da galeria.
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

  // ─── Novo registro ─────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [createCover, setCreateCover] = useState<PendingImage | null>(null)
  const [createAlt, setCreateAlt] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createFeatured, setCreateFeatured] = useState(false)
  const [createExtras, setCreateExtras] = useState<PendingImage[]>([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  // Conversões em andamento — o salvamento espera todas terminarem.
  const [processing, setProcessing] = useState(0)

  // ─── Edição de um registro ─────────────────────────────────────────────────
  const [editing, setEditing] = useState<GalleryImage | null>(null)
  const [editProjectId, setEditProjectId] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  // Fotos complementares já salvas (alt editável) e as marcadas para remoção.
  const [editExtras, setEditExtras] = useState<GalleryImage[]>([])
  const [removedExtras, setRemovedExtras] = useState<number[]>([])
  // Fotos complementares novas, que entram no mesmo registro ao salvar.
  const [newExtras, setNewExtras] = useState<PendingImage[]>([])

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

  // Redimensiona e converte para WEBP antes de virar item pendente: o que fica
  // no estado (e vai para a API) já é o arquivo final.
  const toPending = useCallback(
    async (file: File): Promise<PendingImage> => {
      const processed = await processImage(file, GALLERY_IMAGE_PROFILE)
      return {
        file: processed.file,
        previewUrl: trackUrl(URL.createObjectURL(processed.file)),
        alt: '',
      }
    },
    [trackUrl]
  )

  const describeError = useCallback((file: File, err: unknown): string => {
    const detail = err instanceof ImageProcessingError ? err.message : 'falha ao processar a imagem.'
    return `${file.name}: ${detail}`
  }, [])

  // ─── Seleção de arquivos ───────────────────────────────────────────────────
  const handleCoverSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return
      setFormError('')
      setProcessing((n) => n + 1)
      try {
        setCreateCover(await toPending(file))
      } catch (err) {
        setFormError(describeError(file, err))
      } finally {
        setProcessing((n) => n - 1)
      }
    },
    [toPending, describeError]
  )

  const handleExtrasSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
      const files = Array.from(e.target.files || [])
      e.target.value = ''
      if (files.length === 0) return

      setFormError('')
      setProcessing((n) => n + 1)
      const accepted: PendingImage[] = []
      try {
        for (const file of files) {
          try {
            accepted.push(await toPending(file))
          } catch (err) {
            setFormError(describeError(file, err))
          }
        }
      } finally {
        setProcessing((n) => n - 1)
      }
      if (accepted.length === 0) return

      const setter = target === 'create' ? setCreateExtras : setNewExtras
      setter((prev) => {
        const next = [...prev, ...accepted]
        if (next.length > MAX_IMAGES_PER_UPLOAD) {
          setFormError(`Envie no máximo ${MAX_IMAGES_PER_UPLOAD} fotos por vez.`)
          return next.slice(0, MAX_IMAGES_PER_UPLOAD)
        }
        return next
      })
    },
    [toPending, describeError]
  )

  const setExtraAlt = useCallback((target: 'create' | 'edit', index: number, alt: string) => {
    const setter = target === 'create' ? setCreateExtras : setNewExtras
    setter((prev) => prev.map((p, i) => (i === index ? { ...p, alt } : p)))
  }, [])

  const removeExtra = useCallback((target: 'create' | 'edit', index: number) => {
    const setter = target === 'create' ? setCreateExtras : setNewExtras
    setter((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ─── Criação ───────────────────────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setCreateProjectId((prev) => prev || String(projects[0]?.id || ''))
    setCreateCover(null)
    setCreateAlt('')
    setCreateDescription('')
    setCreateFeatured(false)
    setCreateExtras([])
    setFormError('')
    setCreateOpen(true)
  }, [projects])

  const closeCreate = useCallback(() => {
    if (saving) return
    setCreateOpen(false)
    setCreateCover(null)
    setCreateExtras([])
    setFormError('')
    revokeAllUrls()
  }, [saving, revokeAllUrls])

  const submitCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')
      if (processing > 0) {
        setFormError('Aguarde a conversão das imagens.')
        return
      }
      if (!createProjectId) {
        setFormError('Selecione o projeto da galeria.')
        return
      }
      if (!createCover) {
        setFormError('Selecione a imagem de capa do registro.')
        return
      }

      const fd = new FormData()
      fd.append('projectId', createProjectId)
      // O 1º arquivo é a capa; os demais entram como fotos do mesmo registro.
      fd.append('images', createCover.file)
      fd.append('alt_0', createAlt.trim())
      createExtras.forEach((item, index) => {
        fd.append('images', item.file)
        fd.append(`alt_${index + 1}`, item.alt.trim())
      })
      fd.append('description', createDescription.trim())
      fd.append('featured', String(createFeatured))

      try {
        setSaving(true)
        const res = await api('/api/admin/gallery', { method: 'POST', body: fd })
        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar o registro.')
          return
        }
        showToast(
          'success',
          createExtras.length > 0
            ? `Registro criado com ${createExtras.length + 1} fotos!`
            : 'Registro criado!'
        )
        await loadImages()
        closeCreate()
      } catch (error) {
        console.error('Save gallery error:', error)
        setFormError('Erro ao salvar o registro. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [processing, createProjectId, createCover, createAlt, createExtras, createDescription, createFeatured, loadImages, closeCreate, showToast]
  )

  // ─── Edição ────────────────────────────────────────────────────────────────
  const openEdit = useCallback(
    (record: GalleryImage, extras: GalleryImage[]) => {
      setEditing(record)
      setEditProjectId(String(record.projectId))
      setEditAlt(record.alt)
      setEditDescription(record.description)
      setEditFeatured(record.featured)
      setEditFile(null)
      setEditPreview(null)
      setEditExtras(extras)
      setRemovedExtras([])
      setNewExtras([])
      setFormError('')
    },
    []
  )

  const closeEdit = useCallback(() => {
    if (saving) return
    setEditing(null)
    setEditFile(null)
    setEditPreview(null)
    setEditExtras([])
    setRemovedExtras([])
    setNewExtras([])
    setFormError('')
    revokeAllUrls()
  }, [saving, revokeAllUrls])

  const handleReplaceSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      e.target.value = ''
      if (!file) return
      setFormError('')
      setProcessing((n) => n + 1)
      try {
        const processed = await processImage(file, GALLERY_IMAGE_PROFILE)
        setEditFile(processed.file)
        setEditPreview(trackUrl(URL.createObjectURL(processed.file)))
      } catch (err) {
        setFormError(describeError(file, err))
      } finally {
        setProcessing((n) => n - 1)
      }
    },
    [trackUrl, describeError]
  )

  const submitEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editing) return
      setFormError('')
      if (processing > 0) {
        setFormError('Aguarde a conversão das imagens.')
        return
      }

      const original = new Map(editExtras.map((item) => [item.id, item.alt]))

      try {
        setSaving(true)

        // 1. O registro em si (capa, textos, destaque e projeto).
        const fd = new FormData()
        fd.append('projectId', editProjectId)
        fd.append('alt', editAlt.trim())
        fd.append('description', editDescription.trim())
        fd.append('featured', String(editFeatured))
        if (editFile) fd.append('image', editFile)

        const res = await api(`/api/admin/gallery/${editing.id}`, { method: 'PUT', body: fd })
        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar o registro.')
          return
        }

        // 2. Fotos complementares removidas.
        for (const extraId of removedExtras) {
          await api(`/api/admin/gallery/${extraId}`, { method: 'DELETE' })
        }

        // 3. Breve descrição alterada nas fotos que ficaram.
        for (const item of editExtras) {
          if (removedExtras.includes(item.id)) continue
          if (item.alt === original.get(item.id)) continue
          await api(`/api/admin/gallery/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ alt: item.alt.trim() }),
          })
        }

        // 4. Fotos novas, anexadas ao MESMO registro (parentId).
        if (newExtras.length > 0) {
          const batch = new FormData()
          batch.append('parentId', String(editing.id))
          newExtras.forEach((item, index) => {
            batch.append('images', item.file)
            batch.append(`alt_${index}`, item.alt.trim())
          })
          const batchRes = await api('/api/admin/gallery', { method: 'POST', body: batch })
          if (!batchRes.ok) {
            await loadImages()
            setFormError(
              batchRes.payload?.error ||
                'O registro foi salvo, mas as fotos novas não foram enviadas. Tente de novo.'
            )
            return
          }
        }

        showToast('success', 'Registro atualizado!')
        await loadImages()
        closeEdit()
      } catch (error) {
        console.error('Update gallery error:', error)
        setFormError('Erro ao salvar o registro. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [processing, editing, editProjectId, editAlt, editDescription, editFeatured, editFile, editExtras, removedExtras, newExtras, loadImages, closeEdit, showToast]
  )

  // ─── Exclusão ──────────────────────────────────────────────────────────────
  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/gallery/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao excluir o registro.')
        return
      }
      showToast('success', 'Registro excluído!')
      setConfirmDelete(null)
      await loadImages()
    } catch (error) {
      console.error('Delete gallery error:', error)
      showToast('error', 'Erro ao excluir o registro')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadImages, showToast])

  // ─── Agrupamento: projeto → registros → fotos do registro ──────────────────
  const groups = useMemo(() => {
    const filtered =
      filterProject === 'all'
        ? images
        : images.filter((img) => String(img.projectId) === filterProject)

    const extrasByParent = new Map<number, GalleryImage[]>()
    filtered.forEach((img) => {
      if (!img.parentId) return
      const list = extrasByParent.get(img.parentId) || []
      list.push(img)
      extrasByParent.set(img.parentId, list)
    })

    const map = new Map<
      number,
      { project: string; categoryLabel: string; active: boolean; records: { record: GalleryImage; extras: GalleryImage[] }[] }
    >()
    filtered.forEach((img) => {
      if (img.parentId) return
      if (!map.has(img.projectId)) {
        map.set(img.projectId, {
          project: img.projectName || 'Projeto sem nome',
          categoryLabel: img.projectCategoryLabel,
          active: img.projectActive,
          records: [],
        })
      }
      map.get(img.projectId)!.records.push({ record: img, extras: extrasByParent.get(img.id) || [] })
    })
    return Array.from(map.entries()).map(([projectId, group]) => ({ projectId, ...group }))
  }, [images, filterProject])

  const hasProjects = projects.length > 0

  const renderPendingExtras = (target: 'create' | 'edit', items: PendingImage[]) =>
    items.map((item, index) => (
      <div className={styles.photoRow} key={`${item.file.name}-${index}`}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div className={styles.photoTile}>
            <img src={item.previewUrl} alt={`Foto ${index + 1}`} />
          </div>
          <button
            type="button"
            className={styles.linkBtn}
            style={{ padding: '4px 0' }}
            onClick={() => removeExtra(target, index)}
          >
            Remover
          </button>
        </div>
        <div className={styles.photoRowFields}>
          <input
            className={styles.input}
            type="text"
            value={item.alt}
            onChange={(e) => setExtraAlt(target, index, e.target.value)}
            placeholder="Breve descrição desta foto (opcional)"
            maxLength={300}
            data-testid="f-extra-alt"
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
        <button className={styles.btnAdd} onClick={openCreate} data-testid="add-gallery-image">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar registro
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
              {images.length === 0 ? 'Nenhum registro na galeria' : 'Nenhum registro neste projeto'}
            </div>
            <div className={styles.emptyDesc}>
              {hasProjects
                ? 'Cada registro tem uma imagem de capa, uma breve descrição, as fotos do projeto e a descrição completa.'
                : 'Clique em “Adicionar registro” para criar o primeiro projeto e montar a galeria.'}
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
                  {group.records.length} {group.records.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              <div className={styles.productsGrid}>
                {group.records.map(({ record, extras }) => (
                  <div className={styles.productCard} key={record.id} data-testid="gallery-row">
                    <div className={styles.productCardImage}>
                      {record.url ? (
                        <img src={record.url} alt={record.alt || group.project} loading="lazy" />
                      ) : (
                        <div className={styles.productCardPlaceholder}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      {record.featured && (
                        <div className={styles.productCardBadges}>
                          <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Capa</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.productCardBody}>
                      <div className={styles.productCardName}>
                        {record.alt || <span style={{ color: '#9a9a94' }}>Sem breve descrição</span>}
                      </div>
                      <div className={styles.productCardMeta}>
                        <span>{extras.length + 1} {extras.length === 0 ? 'foto' : 'fotos'}</span>
                        <span>{record.description ? 'Com descrição completa' : 'Sem descrição completa'}</span>
                      </div>
                      <div className={styles.productCardActions}>
                        <button className={styles.btnEdit} onClick={() => openEdit(record, extras)} data-testid="edit-gallery-image">Editar</button>
                        <button className={styles.btnDelete} onClick={() => setConfirmDelete(record)} data-testid="delete-gallery-image">Excluir</button>
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
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Novo registro da galeria">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>Novo</div>
                <div className={styles.modalTitle}>Registro da galeria</div>
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
                hint="Os registros aparecem agrupados por projeto na página Galeria."
              />

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-cover">Imagem de capa</label>
                <div className={styles.photoRow}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {createCover ? (
                      <CoverPhoto
                        src={createCover.previewUrl}
                        label="Capa do registro"
                        checked={createFeatured}
                        onToggle={setCreateFeatured}
                      />
                    ) : (
                      <div className={styles.uploadPlaceholder} style={{ maxWidth: '170px', height: '140px' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <label className={styles.linkBtn} style={{ padding: '4px 0', cursor: 'pointer' }} htmlFor="g-cover">
                      {createCover ? 'Trocar capa' : 'Selecionar capa'}
                    </label>
                    <input
                      id="g-cover"
                      className={styles.fileInput}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleCoverSelect}
                      data-testid="f-cover"
                    />
                  </div>
                  <div className={styles.photoRowFields}>
                    <div>
                      <label className={styles.label} htmlFor="g-alt">Breve descrição</label>
                      <input
                        id="g-alt"
                        className={styles.input}
                        type="text"
                        value={createAlt}
                        onChange={(e) => setCreateAlt(e.target.value)}
                        placeholder="Ex.: Plantio inicial da safra"
                        maxLength={300}
                        data-testid="f-alt"
                      />
                      <div className={styles.inputHint}>Aparece ao lado da foto na página da galeria.</div>
                    </div>
                  </div>
                </div>
                <div className={styles.inputHint}>
                  JPG, PNG ou WEBP · máximo 5 MB · convertida automaticamente para WEBP (até 1800 px). Marque “Definir como capa” sobre a foto para este
                  registro virar a capa do projeto na página Galeria.
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-extras">Fotos do registro</label>
                <div className={styles.uploadControls}>
                  <label className={styles.btnUpload} htmlFor="g-extras">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {createExtras.length > 0 ? 'Adicionar mais' : 'Adicionar fotos'}
                  </label>
                  <input
                    id="g-extras"
                    className={styles.fileInput}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleExtrasSelect(e, 'create')}
                    data-testid="f-images"
                  />
                  {createExtras.length > 0 && (
                    <button type="button" className={styles.linkBtn} style={{ width: 'auto', padding: 0 }} onClick={() => setCreateExtras([])}>
                      Limpar seleção
                    </button>
                  )}
                </div>
                <div className={styles.inputHint}>
                  Fotos extras deste mesmo registro. A breve descrição de cada uma é opcional.
                </div>
              </div>

              {createExtras.length > 0 && (
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '18px' }}>
                  {renderPendingExtras('create', createExtras)}
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-description">Descrição completa</label>
                <textarea
                  id="g-description"
                  className={styles.input}
                  rows={6}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Texto completo exibido abaixo das fotos"
                  data-testid="f-description"
                />
                <div className={styles.inputHint}>Use uma linha em branco para separar parágrafos.</div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeCreate} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="form-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Enviando…' : 'Salvar registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Editar registro da galeria">
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>Atualizar</div>
                <div className={styles.modalTitle}>Registro da galeria</div>
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
                hint="As fotos do registro acompanham a troca de projeto."
              />

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Imagem de capa</label>
                <div className={styles.photoRow}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <CoverPhoto
                      src={editPreview || editing.url}
                      label={editAlt || 'Capa do registro'}
                      checked={editFeatured}
                      onToggle={setEditFeatured}
                    />
                    <label className={styles.linkBtn} style={{ padding: '4px 0', cursor: 'pointer' }} htmlFor="g-edit-image">
                      {editFile ? 'Trocar outro arquivo' : 'Substituir a capa'}
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
                        placeholder="Ex.: Plantio inicial da safra"
                        maxLength={300}
                        data-testid="f-edit-alt"
                      />
                      <div className={styles.inputHint}>Aparece ao lado da foto na página da galeria.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="g-edit-extras">Fotos do registro</label>
                <div className={styles.uploadControls}>
                  <label className={styles.btnUpload} htmlFor="g-edit-extras">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar fotos
                  </label>
                  <input
                    id="g-edit-extras"
                    className={styles.fileInput}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleExtrasSelect(e, 'edit')}
                    data-testid="f-edit-images"
                  />
                </div>
                <div className={styles.inputHint}>
                  As fotos ficam neste mesmo registro — não viram registros novos na galeria.
                </div>
              </div>

              {(editExtras.length > 0 || newExtras.length > 0) && (
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'grid', gap: '18px' }}>
                  {editExtras.map((item) => {
                    const removed = removedExtras.includes(item.id)
                    return (
                      <div className={styles.photoRow} key={item.id} style={{ opacity: removed ? 0.45 : 1 }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div className={styles.photoTile}>
                            <img src={item.url} alt={item.alt || 'Foto do registro'} />
                          </div>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            style={{ padding: '4px 0' }}
                            onClick={() =>
                              setRemovedExtras((prev) =>
                                removed ? prev.filter((id) => id !== item.id) : [...prev, item.id]
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
                              setEditExtras((prev) =>
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
                  {renderPendingExtras('edit', newExtras)}
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`}>
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

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeEdit} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="edit-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar registro'}
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
                <div className={styles.modalTitle}>Excluir registro</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Excluir este registro
                {confirmDelete.alt ? <> (<strong>{confirmDelete.alt}</strong>)</> : null} apaga também
                as fotos complementares dele. Esta ação não pode ser desfeita.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting}>
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir registro'}
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
