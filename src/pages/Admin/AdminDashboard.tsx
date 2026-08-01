import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar, { type AdminView } from './AdminSidebar'
import AdminSalesView from './AdminSalesView'
import AdminCategoriesView from './AdminCategoriesView'
import AdminGalleryView from './AdminGalleryView'
import styles from './Admin.module.css'

async function api(path: string, options?: RequestInit) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: typeof options?.body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    })
    clearTimeout(timeout)
    let payload: { data?: unknown; error?: string } | null = null
    try {
      payload = await res.json()
    } catch {}
    return { ok: res.ok, status: res.status, payload }
  } catch (error) {
    console.error('API call failed:', path, error)
    return { ok: false, status: 0, payload: { error: 'Erro de conexão' } }
  }
}

function clearAuthStorage() {
  const patterns = /(agrovisao|admin|session|token|auth)/i
  for (const store of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = []
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)
      if (key && patterns.test(key)) keys.push(key)
    }
    for (const key of keys) store.removeItem(key)
  }
}

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
        const res = await api('/api/admin/session')
        if (!mounted || currentRequestId !== requestIdRef.current || loggingOutRef.current) return

        if (!res.ok) {
          if (mounted && currentRequestId === requestIdRef.current) {
            navigate('/admin', { replace: true })
          }
          return
        }

        const user = (res.payload?.data as { user?: { mustChangePassword?: boolean } } | undefined)?.user
        if (user?.mustChangePassword) {
          if (mounted && currentRequestId === requestIdRef.current) {
            navigate('/admin/change-password', { replace: true })
          }
          return
        }

        if (mounted && currentRequestId === requestIdRef.current) {
          setAuthChecked(true)
        }
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

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    setIsLoggingOut(true)
    clearAuthStorage()

    let logoutCompleted = false
    const timeoutId = window.setTimeout(() => {
      if (!logoutCompleted) {
        console.warn('[logout] timeout aguardando resposta do servidor')
        window.location.replace('/admin')
      }
    }, 5000)

    try {
      const res = await api('/api/admin/logout', { method: 'POST' })
      logoutCompleted = true
      window.clearTimeout(timeoutId)

      if (res.ok || res.status === 401 || res.status === 403) {
        window.location.replace('/admin')
        return
      }
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
