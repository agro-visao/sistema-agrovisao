import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  onOpenModal: () => void
}

function Header({ onOpenModal }: HeaderProps) {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path
  const isActivePrefix = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen)
  }, [drawerOpen])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  const navBg = '#FFFFFF'
  const navBorder = '1px solid rgba(49,91,44,0.08)'
  const navShadow = '0 2px 20px rgba(0,0,0,0.07)'
  const navColor = '#1a1a18'
  const navTextShadow = 'none'

  const navLinkStyle = (active: boolean) => ({
    fontFamily: 'var(--font-sans)',
    fontSize: '16px',
    fontWeight: 700,
    color: navColor,
    textDecoration: 'none',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    textShadow: navTextShadow,
    borderBottom: active ? '1px solid currentColor' : '1px solid transparent',
    paddingBottom: '2px',
  })

  return (
    <>
      <nav
        className="nav"
        style={{
          background: navBg,
          borderBottom: navBorder,
          boxShadow: navShadow,
        }}
      >
        <div className="nav-logo">
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: '#315B2C',
            }}
          >
            <img
              src="/assets/logos/agrovisao/logo-agro-visao-v1-2.svg"
              alt="AgroVisão"
              width="130"
              height="70"
              style={{ height: '58px', width: 'auto', display: 'block', maxWidth: 'none' }}
            />
          </a>
        </div>

        <button
          className="nav-hamburger"
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          style={{ color: navColor }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect y="3" width="22" height="2.5" rx="1.25" fill="currentColor" />
            <rect y="9.75" width="22" height="2.5" rx="1.25" fill="currentColor" />
            <rect y="16.5" width="22" height="2.5" rx="1.25" fill="currentColor" />
          </svg>
        </button>

        <div className="nav-right">
          <div className="nav-links">
            <a href="/" style={navLinkStyle(isActive('/'))}>
              Home
            </a>
            <a href="/sobre" style={navLinkStyle(isActive('/sobre'))}>
              Sobre
            </a>

            <a href="/servicos" style={navLinkStyle(isActive('/servicos'))}>
              Serviços
            </a>
            <a href="/projetos" style={navLinkStyle(isActivePrefix('/projetos'))}>
              Projetos
            </a>
            <a href="/galeria" style={navLinkStyle(isActive('/galeria'))}>
              Galeria
            </a>
            <a href="/vendas" style={navLinkStyle(isActivePrefix('/vendas'))}>
              Vendas
            </a>
            <a href="/contato" style={navLinkStyle(isActive('/contato'))}>
              Contato
            </a>
          </div>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onOpenModal() }}
            className="nav-cta"
          >
            Fale Conosco
          </a>

          <div className="nav-lang" aria-label="Seletor de idioma">
            <a href="#" className="nav-lang-item is-active" aria-label="Português" aria-current="true">
              PT<img src="/assets/icons/br-flag.png" alt="" className="nav-lang-flag" />
            </a>
            <a href="#" className="nav-lang-item" aria-label="English">
              EN<img src="/assets/icons/eua-flag.png" alt="" className="nav-lang-flag" />
            </a>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`drawer-overlay${drawerOpen ? ' is-open' : ''}`}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        className={`drawer${drawerOpen ? ' is-open' : ''}`}
        id="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer-header">
          <img
            src="/assets/logos/agrovisao/logo-agro-visao-v1-2.svg"
            alt="AgroVisão"
            width="130"
            height="42"
            className="drawer-logo"
          />
          <button className="drawer-close" aria-label="Fechar menu" onClick={closeDrawer}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Menu principal">
          <a href="/" className={`drawer-link${isActive('/') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Home</a>
          <a href="/sobre" className={`drawer-link${isActive('/sobre') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Sobre</a>
          <a href="/servicos" className={`drawer-link${isActive('/servicos') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Serviços</a>
          <a href="/projetos" className={`drawer-link${isActivePrefix('/projetos') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Projetos</a>
          <a href="/galeria" className={`drawer-link${isActive('/galeria') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Galeria</a>
          <a href="/vendas" className={`drawer-link${isActivePrefix('/vendas') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Vendas</a>
          <a href="/contato" className={`drawer-link${isActive('/contato') ? ' drawer-link--active' : ''}`} onClick={closeDrawer}>Contato</a>
        </nav>

        <div className="drawer-lang" aria-label="Seletor de idioma">
          <a href="#" className="drawer-lang-item is-active" aria-label="Português" aria-current="true">
            PT<img src="/assets/icons/br-flag.png" alt="" className="drawer-lang-flag" />
          </a>
          <a href="#" className="drawer-lang-item" aria-label="English">
            EN<img src="/assets/icons/eua-flag.png" alt="" className="drawer-lang-flag" />
          </a>
        </div>

        <div className="drawer-footer">
          <a href="#" className="drawer-cta" onClick={(e) => { e.preventDefault(); closeDrawer(); onOpenModal() }}>
            Fale Conosco
          </a>
        </div>
      </aside>
    </>
  )
}

export default Header
