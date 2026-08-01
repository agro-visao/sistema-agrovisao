import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import styles from './Admin.module.css'

type View = 'login' | 'recover' | 'reset' | 'resetDone'

/**
 * Detecta se a URL atual corresponde a um link de recuperação de senha
 * vindo do e-mail do Supabase. Pode chegar como `?code=...` (fluxo PKCE)
 * ou como `#access_token=...&type=recovery` (fluxo implícito). Em ambos os
 * casos o client (`detectSessionInUrl: true`) processa a URL sozinho e
 * dispara o evento `PASSWORD_RECOVERY`; aqui só usamos isso como um sinal
 * inicial (síncrono) para já renderizar o formulário certo sem esperar o
 * evento assíncrono.
 */
function isRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  if (query.has('code')) return true
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hashParams.get('type') === 'recovery'
}

function mapLoginError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
  }
  return 'Falha ao entrar. Tente novamente.'
}

function AdminLogin() {
  const navigate = useNavigate()
  const initialRecovery = useRef(isRecoveryUrl()).current

  const [view, setView] = useState<View>(initialRecovery ? 'reset' : 'login')
  const [checking, setChecking] = useState(!initialRecovery)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [busy, setBusy] = useState(false)

  // Remove o token/hash de recuperação da URL assim que detectado, para não
  // deixá-lo exposto na barra de endereço nem reaproveitável via histórico.
  useEffect(() => {
    if (initialRecovery) {
      window.history.replaceState({}, '', '/admin')
    }
  }, [initialRecovery])

  // Fonte de verdade assíncrona: o Supabase dispara PASSWORD_RECOVERY depois
  // de processar o link do e-mail. Serve como reforço/fallback do heurístico
  // síncrono acima.
  useEffect(() => {
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') {
        setErrorMsg('')
        setInfoMsg('')
        setView('reset')
        setChecking(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (initialRecovery) return
    let mounted = true

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        const session = data.session
        if (!session) {
          setChecking(false)
          return
        }
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('must_change_password')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (!mounted) return
        navigate(profile?.must_change_password ? '/admin/change-password' : '/admin/dashboard', { replace: true })
      } catch (e) {
        console.error('[login] erro ao verificar sessão:', (e as Error).message)
        if (mounted) setChecking(false)
      }
    }

    checkSession()

    return () => {
      mounted = false
    }
  }, [navigate, initialRecovery])

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setErrorMsg(mapLoginError(error.message))
          return
        }
        const userId = data.user?.id
        let mustChangePassword = false
        if (userId) {
          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('must_change_password')
            .eq('user_id', userId)
            .maybeSingle()
          mustChangePassword = Boolean(profile?.must_change_password)
        }
        navigate(mustChangePassword ? '/admin/change-password' : '/admin/dashboard', { replace: true })
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
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/admin`,
        })
        if (error) {
          setErrorMsg('Falha ao solicitar recuperação. Tente novamente.')
          return
        }
        setInfoMsg('Se o e-mail estiver cadastrado, você receberá um link de recuperação.')
        setView('login')
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
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          setErrorMsg('Não foi possível redefinir a senha.')
          return
        }
        setPassword('')
        setConfirm('')
        setView('resetDone')
        window.setTimeout(() => navigate('/admin/dashboard', { replace: true }), 900)
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.')
      } finally {
        setBusy(false)
      }
    },
    [password, confirm, navigate]
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
              Sua senha foi redefinida com sucesso. Você já está conectado.
            </p>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate('/admin/dashboard', { replace: true })}
              data-testid="reset-done"
            >
              Acessar painel
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
