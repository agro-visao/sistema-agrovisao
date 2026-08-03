import styles from './Admin.module.css'

export type AdminView = 'sales' | 'projects' | 'categories' | 'projectCategories' | 'users'

interface AdminSidebarProps {
  currentView: AdminView
  onNavigate: (view: AdminView) => void
  onLogout: () => void
  isLoggingOut: boolean
}

function AdminSidebar({ currentView, onNavigate, onLogout, isLoggingOut }: AdminSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarBrandName}>AgroVisão</div>
          <div className={styles.sidebarBrandTagline}>Admin</div>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <button
          className={`${styles.sidebarItem} ${currentView === 'projects' ? styles.sidebarItemActive : ''}`}
          onClick={() => onNavigate('projects')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15L16 10L5 21" />
          </svg>
          <span>Projetos</span>
        </button>

        <button
          className={`${styles.sidebarItem} ${currentView === 'sales' ? styles.sidebarItemActive : ''}`}
          onClick={() => onNavigate('sales')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>Vendas</span>
        </button>

        <button
          className={`${styles.sidebarItem} ${currentView === 'categories' ? styles.sidebarItemActive : ''}`}
          onClick={() => onNavigate('categories')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Categorias</span>
        </button>

        <button
          className={`${styles.sidebarItem} ${currentView === 'projectCategories' ? styles.sidebarItemActive : ''}`}
          onClick={() => onNavigate('projectCategories')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2L2 8v13h6v-7h8v7h6V8L12 2z" />
          </svg>
          <span>Cat. de Projetos</span>
        </button>

        <button
          className={`${styles.sidebarItem} ${currentView === 'users' ? styles.sidebarItemActive : ''}`}
          onClick={() => onNavigate('users')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span>Usuários</span>
        </button>
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          className={styles.sidebarLogout}
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
