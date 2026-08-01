import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import styles from './Admin.module.css'

type View = 'login' | 'recover' | 'reset' | 'resetDone'

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })
  let payload: { data?: unknown; error?: string } | null = null
  try {
    payload = await res.json()
  } catch {}
  return { ok: res.ok, status: res.status, payload }
}

function AdminLogin() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resetToken = searchParams.get('resetToken') || ''

  const [view, setView] = useState<View>(resetToken ? 'reset' : 'login')
  const [checking, setChecking] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    let requestId = Math.random()

    const checkSession = async () => {
      const currentRequestId = requestId
      try {
        const res = await api('/api/admin/session')
        if (!mounted || currentRequestId !== requestId) return
        if (res.ok) {
          const user = (res.payload?.data as { user?: { mustChangePassword?: boolean } } | undefined)?.user
          navigate(user?.mustChangePassword ? '/admin/change-password' : '/admin/dashboard', { replace: true })
          return
        }
      } catch (e) {
        console.error('[login] erro ao verificar sessão:', (e as Error).message)
      }
      if (mounted && currentRequestId === requestId) {
        setChecking(false)
      }
    }

    checkSession()

    return () => {
      mounted = false
      requestId = -1
    }
  }, [navigate])

  const submitLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMsg('')
      setInfoMsg('')
      if (!email.trim() || !password) {
        setErrorMsg('Informe e-mail e senha.')
        return
      }
      setBusy(true)
      try {
        const res = await api('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        })
        if (res.ok) {
          const user = (res.payload?.data as { user?: { mustChangePassword?: boolean } } | undefined)?.user
          navigate(user?.mustChangePassword ? '/admin/change-password' : '/admin/dashboard', { replace: true })
          return
        }
        setErrorMsg(res.payload?.error || 'Falha ao entrar. Tente novamente.')
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.')
      } finally {
        setBusy(false)
      }
    },
    [email, password, navigate]
  )

  const submitRecover = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMsg('')
      setInfoMsg('')
      if (!email.trim()) {
        setErrorMsg('Informe o e-mail cadastrado.')
        return
      }
      setBusy(true)
      try {
        const res = await api('/api/admin/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() }),
        })
        if (res.ok) {
          setInfoMsg(
            (res.payload?.data as { message?: string } | undefined)?.message ||
              'Se o e-mail estiver cadastrado, você receberá um link de recuperação.'
          )
          setView('login')
        } else {
          setErrorMsg(res.payload?.error || 'Falha ao solicitar recuperação.')
        }
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.')
      } finally {
        setBusy(false)
      }
    },
    [email]
  )

  const submitReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMsg('')
      if (password.length < 8) {
        setErrorMsg('A senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (password !== confirm) {
        setErrorMsg('As senhas não coincidem.')
        return
      }
      setBusy(true)
      try {
        const res = await api('/api/admin/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password }),
        })
        if (res.ok) {
          setSearchParams({}, { replace: true })
          setPassword('')
          setConfirm('')
          setView('resetDone')
        } else {
          setErrorMsg(res.payload?.error || 'Não foi possível redefinir a senha.')
        }
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.')
      } finally {
        setBusy(false)
      }
    },
    [resetToken, password, confirm, setSearchParams]
  )

  if (checking) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loadingBox}>
          <div className={styles.loadingSpin} />
          <div className={styles.loadingText}>Verificando sessão…</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard} data-testid="login-card">
        <div className={styles.brand}>
          <img
            src="/assets/logos/agrovisao/logo-agro-visao-v1-2.svg"
            alt="AgroVisão"
            className={styles.brandLogo}
            data-testid="brand-logo"
          />
        </div>

        {errorMsg && <div className={styles.alertError} role="alert">{errorMsg}</div>}
        {infoMsg && <div className={styles.alertSuccess} role="status">{infoMsg}</div>}

        {view === 'login' && (
          <>
            <h1 className={styles.loginTitle}>Acesso administrativo</h1>
            <p className={styles.loginSubtitle}>
              Entre para gerenciar os produtos da página de vendas.
            </p>
            <form onSubmit={submitLogin} noValidate data-testid="login-form">
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-email">E-mail</label>
                <input
                  id="admin-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  autoComplete="email"
                  data-testid="login-email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-password">Senha</label>
                <div className={styles.passwordWrap}>
                  <input
                    id="admin-password"
                    className={styles.input}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    data-testid="toggle-password"
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
              </div>
              <button className={styles.btnPrimary} type="submit" disabled={busy} data-testid="login-submit">
                {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  setErrorMsg('')
                  setView('recover')
                }}
                data-testid="login-recover"
              >
                Esqueci minha senha
              </button>
            </form>
          </>
        )}

        {view === 'recover' && (
          <>
            <h1 className={styles.loginTitle}>Recuperar senha</h1>
            <p className={styles.loginSubtitle}>
              Informe o e-mail cadastrado e enviaremos um link de recuperação.
            </p>
            <form onSubmit={submitRecover} noValidate data-testid="recover-form">
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-recover-email">E-mail</label>
                <input
                  id="admin-recover-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  autoComplete="email"
                  data-testid="recover-email"
                />
              </div>
              <button className={styles.btnPrimary} type="submit" disabled={busy}>
                {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
                {busy ? 'Enviando…' : 'Enviar link de recuperação'}
              </button>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  setErrorMsg('')
                  setView('login')
                }}
              >
                Voltar para o login
              </button>
            </form>
          </>
        )}

        {view === 'reset' && (
          <>
            <h1 className={styles.loginTitle}>Definir nova senha</h1>
            <p className={styles.loginSubtitle}>
              Escolha uma nova senha para sua conta.
            </p>
            <form onSubmit={submitReset} noValidate data-testid="reset-form">
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-new-password">Nova senha</label>
                <input
                  id="admin-new-password"
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  data-testid="reset-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-confirm-password">Confirmar senha</label>
                <input
                  id="admin-confirm-password"
                  className={styles.input}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  data-testid="reset-confirm"
                />
              </div>
              <button className={styles.btnPrimary} type="submit" disabled={busy}>
                {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
                {busy ? 'Salvando…' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}

        {view === 'resetDone' && (
          <>
            <h1 className={styles.loginTitle}>Senha atualizada</h1>
            <p className={styles.loginSubtitle}>
              Sua senha foi redefinida com sucesso. Já é possível entrar com a nova senha.
            </p>
            <button className={styles.btnPrimary} onClick={() => setView('login')} data-testid="reset-done">
              Entrar
            </button>
          </>
        )}

        <div className={styles.loginFoot}>
          <Link to="/">← Voltar ao site</Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
