import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar, { type AdminView } from './AdminSidebar'
import AdminSalesView from './AdminSalesView'
import AdminCategoriesView from './AdminCategoriesView'
import AdminGalleryView from './AdminGalleryView'
import styles from './Admin.module.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<AdminView>('sales')
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const loggingOutRef = useRef(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let mounted = true
    const currentRequestId = ++requestIdRef.current

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted || currentRequestId !== requestIdRef.current || loggingOutRef.current) return

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
        if (!mounted || currentRequestId !== requestIdRef.current || loggingOutRef.current) return

        if (profile?.must_change_password) {
          navigate('/admin/change-password', { replace: true })
          return
        }

        setAuthChecked(true)
      } catch (error) {
        console.error('Session check error:', error)
        if (mounted && currentRequestId === requestIdRef.current) {
          navigate('/admin', { replace: true })
        }
      }
    }

    checkSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  // Reage a expiração/encerramento de sessão em tempo real (ex.: logout feito
  // em outra aba, ou token de refresh inválido).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !loggingOutRef.current) {
        navigate('/admin', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    setIsLoggingOut(true)

    let logoutCompleted = false
    const timeoutId = window.setTimeout(() => {
      if (!logoutCompleted) {
        console.warn('[logout] timeout aguardando resposta do Supabase')
        window.location.replace('/admin')
      }
    }, 5000)

    try {
      await supabase.auth.signOut()
      logoutCompleted = true
      window.clearTimeout(timeoutId)
      window.location.replace('/admin')
      return
    } catch (e) {
      console.error('[logout] erro na requisição:', (e as Error).message)
    }

    window.location.replace('/admin')
  }, [])

  if (!authChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>
          <div className={styles.loadingSpin} />
          <div className={styles.loadingText}>Verificando sessão…</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardLayout}>
      <AdminSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={logout}
        isLoggingOut={isLoggingOut}
      />
      <div className={styles.dashboardContent}>
        {currentView === 'sales' && <AdminSalesView />}
        {currentView === 'categories' && <AdminCategoriesView />}
        {currentView === 'gallery' && <AdminGalleryView />}
      </div>
    </div>
  )
}

export default AdminDashboard
