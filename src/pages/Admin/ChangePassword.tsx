import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import styles from './Admin.module.css'

function ChangePassword() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const loggingOutRef = useRef(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted || loggingOutRef.current) return
      const session = data.session
      if (!session) {
        navigate('/admin', { replace: true })
        return
      }
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('must_change_password')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!mounted || loggingOutRef.current) return
      if (!profile?.must_change_password) {
        navigate('/admin/dashboard', { replace: true })
        return
      }
      setChecking(false)
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } catch {
      // Navega mesmo assim: uma sessão inválida/expirada já não permite acesso ao painel.
    }
    window.location.replace('/admin')
  }, [])

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMsg('')
      setInfoMsg('')
      if (!currentPassword) {
        setErrorMsg('Informe a senha atual.')
        return
      }
      if (newPassword.length < 8) {
        setErrorMsg('A nova senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        setErrorMsg('A nova senha deve conter letras e números.')
        return
      }
      if (newPassword !== confirm) {
        setErrorMsg('As senhas não coincidem.')
        return
      }
      setBusy(true)
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user?.email) {
          setErrorMsg('Sessão expirada. Faça login novamente.')
          return
        }

        // Reautentica com a senha atual antes de trocar, como camada extra de
        // segurança (o updateUser do Supabase não exige a senha atual).
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: userData.user.email,
          password: currentPassword,
        })
        if (reauthError) {
          setErrorMsg('Senha atual incorreta.')
          return
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        if (updateError) {
          setErrorMsg('Não foi possível atualizar a senha.')
          return
        }

        await supabase
          .from('admin_profiles')
          .update({ must_change_password: false })
          .eq('user_id', userData.user.id)

        setInfoMsg('Senha atualizada com sucesso. Acessando o painel…')
        window.setTimeout(() => navigate('/admin/dashboard', { replace: true }), 600)
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.')
      } finally {
        setBusy(false)
      }
    },
    [currentPassword, newPassword, confirm, navigate]
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

        <h1 className={styles.loginTitle}>Alterar senha</h1>
        <p className={styles.loginSubtitle}>
          Por segurança, defina uma nova senha para continuar usando o painel.
        </p>
        <form onSubmit={submit} noValidate data-testid="change-form">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cp-current">Senha atual</label>
            <div className={styles.passwordWrap}>
              <input
                id="cp-current"
                className={styles.input}
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha inicial"
                autoComplete="current-password"
                data-testid="change-current"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                data-testid="toggle-current"
              >
                {showCurrent ? (
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
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cp-new">Nova senha</label>
            <div className={styles.passwordWrap}>
              <input
                id="cp-new"
                className={styles.input}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres, com letras e números"
                autoComplete="new-password"
                data-testid="change-new"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                data-testid="toggle-new"
              >
                {showNew ? (
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
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cp-confirm">Confirmar nova senha</label>
            <div className={styles.passwordWrap}>
              <input
                id="cp-confirm"
                className={styles.input}
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                data-testid="change-confirm"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                data-testid="toggle-confirm"
              >
                {showConfirm ? (
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
          <button className={styles.btnPrimary} type="submit" disabled={busy} data-testid="change-submit">
            {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
            {busy ? 'Salvando…' : 'Salvar nova senha'}
          </button>
          <button type="button" className={styles.linkBtn} onClick={logout} disabled={isLoggingOut} data-testid="change-logout">
            {isLoggingOut ? 'Saindo…' : 'Sair'}
          </button>
        </form>

        <div className={styles.loginFoot}>
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/' }}>← Voltar ao site</a>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
