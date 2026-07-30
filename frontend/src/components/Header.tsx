import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  onOpenModal: () => void
}

function Header({ onOpenModal }: HeaderProps) {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path
  const [scrolled, setScrolled] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setTimeout(() => setEntered(true), 80)

    const onScroll = () => {
      const s = window.scrollY > 10
      setScrolled(s)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const navBg = scrolled ? '#FFFFFF' : 'transparent'
  const navBorder = scrolled ? '1px solid rgba(49,91,44,0.08)' : '1px solid transparent'
  const navShadow = scrolled ? '0 2px 20px rgba(0,0,0,0.07)' : 'none'
  const navColor = scrolled ? '#1a1a18' : '#FFFFFF'
  const navTextShadow = scrolled ? 'none' : '0 1px 6px rgba(0,0,0,0.5)'

  const transition = 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s'
  const navEntryStyle = entered
    ? { opacity: 1, transform: 'translateY(0)', transition }
    : { opacity: 0, transform: 'translateY(-10px)', transition }

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
        <div className="nav-logo" style={navEntryStyle}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: scrolled ? '#315B2C' : '#FFFFFF',
              transition: 'color 0.45s',
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
            <a
              href="/"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                borderBottom: isActive('/') ? '1px solid currentColor' : 'none',
                paddingBottom: '2px',
              }}
            >
              Home
            </a>
            <a
              href="/sobre"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                borderBottom: isActive('/sobre') ? '1px solid currentColor' : 'none',
                paddingBottom: '2px',
              }}
            >
              Sobre
            </a>

            <a
              href="/servicos"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                transition: 'opacity 0.2s',
              }}
            >
              Serviços
            </a>
            <a
              href="/projetos"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                transition: 'opacity 0.2s',
              }}
            >
              Projetos
            </a>
            <a
              href="/vendas"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                transition: 'opacity 0.2s',
              }}
            >
              Vendas
            </a>
            <a
              href="/contato"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: navColor,
                textDecoration: 'none',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: navTextShadow,
                transition: 'opacity 0.2s',
              }}
            >
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
          <a href="/servicos" className="drawer-link" onClick={closeDrawer}>Serviços</a>
          <a href="/projetos" className="drawer-link" onClick={closeDrawer}>Projetos</a>
          <a href="/vendas" className="drawer-link" onClick={closeDrawer}>Vendas</a>
          <a href="/contato" className="drawer-link" onClick={closeDrawer}>Contato</a>
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
