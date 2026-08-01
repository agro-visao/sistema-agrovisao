import { useEffect, useState, useCallback } from 'react'
import { adminApi as api } from '../../lib/adminApi'
import styles from './Admin.module.css'

interface AdminUser {
  id: string
  email: string
  createdAt: string | null
  lastSignInAt: string | null
  /** Senha definida por outra pessoa: será trocada no primeiro acesso. */
  mustChangePassword: boolean
  /** Conta do ADMIN_EMAIL — não pode ser excluída nem ter o e-mail trocado. */
  isOwner: boolean
}

interface FormState {
  email: string
  password: string
}

const EMPTY_FORM: FormState = { email: '', password: '' }

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setListError(false)
      const res = await api('/api/admin/users')
      if (res.ok) {
        setUsers((res.payload?.data as AdminUser[]) || [])
      } else {
        setListError(true)
      }
    } catch (error) {
      console.error('Load users error:', error)
      setListError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    // A senha sempre começa oculta: o modal pode abrir com alguém do lado.
    setShowPassword(false)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((user: AdminUser) => {
    setEditing(user)
    setForm({ email: user.email, password: '' })
    setFormError('')
    setShowPassword(false)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowPassword(false)
  }, [saving])

  const submitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')

      const email = form.email.trim()
      if (!email) {
        setFormError('Informe o e-mail.')
        return
      }
      // Na edição, senha em branco significa "manter a senha atual".
      if (!editing && !form.password) {
        setFormError('Informe a senha.')
        return
      }

      try {
        setSaving(true)
        const endpoint = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users'
        const res = await api(endpoint, {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({ email, password: form.password }),
        })

        if (!res.ok) {
          setFormError(res.payload?.error || 'Erro ao salvar usuário.')
          return
        }

        showToast('success', editing ? 'Usuário atualizado!' : 'Usuário criado!')
        await loadUsers()
        setModalOpen(false)
        setEditing(null)
        setForm(EMPTY_FORM)
      } catch (error) {
        console.error('Save user error:', error)
        setFormError('Erro ao salvar usuário. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [editing, form, loadUsers, showToast]
  )

  const confirmRemove = useCallback(async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      const res = await api(`/api/admin/users/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('error', res.payload?.error || 'Erro ao excluir.')
        return
      }
      showToast('success', 'Usuário excluído!')
      setConfirmDelete(null)
      await loadUsers()
    } catch (error) {
      console.error('Delete user error:', error)
      showToast('error', 'Erro ao excluir usuário')
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete, loadUsers, showToast])

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Usuários</h1>
        </div>
        <button className={styles.btnAdd} onClick={openCreate} data-testid="add-user">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar usuário
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
            <div className={styles.emptyTitle}>Não foi possível carregar os usuários</div>
            <div className={styles.emptyDesc}>Tente novamente em instantes.</div>
            <button className={styles.btnAdd} onClick={loadUsers} data-testid="reload-users">Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpin} />
            <div className={styles.loadingText}>Carregando usuários…</div>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Nenhum usuário cadastrado</div>
            <div className={styles.emptyDesc}>Adicione quem deve ter acesso ao painel.</div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable} data-testid="users-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Criado em</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} data-testid="user-row" data-user-email={u.email}>
                    <td>
                      <span className={styles.tableStrong}>{u.email}</span>
                      {u.isOwner && <span className={styles.tableTag}>Conta principal</span>}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{formatDate(u.lastSignInAt)}</td>
                    <td>
                      {u.mustChangePassword ? (
                        <span className={`${styles.productCardBadge} ${styles.badgeNew}`}>Trocar senha</span>
                      ) : (
                        <span className={`${styles.productCardBadge} ${styles.badgeFeatured}`}>Ativo</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.btnEdit} onClick={() => openEdit(u)} data-testid="edit-user">Editar</button>
                        <button
                          className={styles.btnDelete}
                          onClick={() => setConfirmDelete(u)}
                          disabled={u.isOwner}
                          title={u.isOwner ? 'A conta principal não pode ser excluída.' : undefined}
                          data-testid="delete-user"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editing ? 'Editar usuário' : 'Adicionar usuário'}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalEyebrow}>{editing ? 'Atualizar' : 'Novo acesso'}</div>
                <div className={styles.modalTitle}>{editing ? 'Editar usuário' : 'Adicionar usuário'}</div>
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={submitForm} noValidate data-testid="user-form">
              {formError && <div className={styles.alertError} role="alert" data-testid="user-form-error">{formError}</div>}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="u-email">E-mail</label>
                <input
                  id="u-email"
                  className={styles.input}
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="pessoa@agrovisaopara.com.br"
                  disabled={Boolean(editing?.isOwner)}
                  data-testid="u-email"
                />
                {editing?.isOwner && (
                  <div className={styles.inputHint}>
                    O e-mail da conta principal é definido pela variável ADMIN_EMAIL.
                  </div>
                )}
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="u-password">
                  {editing ? 'Nova senha (opcional)' : 'Senha'}
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="u-password"
                    className={styles.input}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={editing ? 'Deixe em branco para manter a atual' : 'Mínimo de 8 caracteres, com letras e números'}
                    data-testid="u-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    data-testid="u-password-toggle"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
                        <path d="M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className={styles.inputHint}>
                  Mínimo de 8 caracteres, com letras e números. Quem receber a senha vai
                  trocá-la no primeiro acesso.
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={closeModal} data-testid="user-form-cancel">Cancelar</button>
                <button type="submit" className={styles.btnSave} disabled={saving} data-testid="user-form-submit">
                  {saving ? <span className={styles.spinner} aria-hidden="true" /> : null}
                  {saving ? 'Salvando…' : 'Salvar usuário'}
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
                <div className={styles.modalTitle}>Excluir usuário</div>
              </div>
              <button className={styles.modalClose} onClick={() => { if (!deleting) setConfirmDelete(null) }} aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4L16 16M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className={styles.form}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--clr-text-body)', lineHeight: 1.7 }}>
                Tem certeza de que deseja excluir <strong>{confirmDelete.email}</strong>? A pessoa perde
                o acesso ao painel imediatamente e esta ação não pode ser desfeita.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { if (!deleting) setConfirmDelete(null) }} disabled={deleting} data-testid="user-delete-cancel">
                  Cancelar
                </button>
                <button type="button" className={styles.btnDelete} onClick={confirmRemove} disabled={deleting} data-testid="user-delete-confirm">
                  {deleting ? 'Excluindo…' : 'Excluir usuário'}
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

export default AdminUsersView
