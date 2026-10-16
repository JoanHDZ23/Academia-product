import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, KlockLogo } from '../components'
import { clearCurrentUser, getCurrentToken, getCurrentUser } from '../lib/auth-storage'
import { apiRequest, type CompanyResponse } from '../lib/api'

function readInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('klock-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  try { localStorage.setItem('klock-theme', theme) } catch { /* ignore */ }
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (meta) meta.content = theme === 'dark' ? '#111827' : '#F4F6FB'
}

type NavigationItem = {
  to: string
  label: string
  end?: boolean
  icon: 'icon-home' | 'icon-calendar' | 'icon-clipboard'
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const token = getCurrentToken()
  const isAdmin = user?.role === 'admin'
  const isSupervisor = user?.role === 'supervisor'
  const isDocente = user?.role === 'docente'
  const isEstudiante = user?.role === 'estudiante'

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readInitialTheme())

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { to: '/dashboard', label: 'Inicio', end: true, icon: 'icon-home' },
    ]
    // Gestión académica: admin, supervisor y docente.
    if (isAdmin || isSupervisor || isDocente) {
      items.push({ to: '/dashboard/academico', label: 'Gestión académica', icon: 'icon-clipboard' })
    }
    return items
  }, [isAdmin, isSupervisor, isDocente])

  const handleLogout = () => {
    clearCurrentUser()
    navigate('/login', { replace: true })
  }

  const handleNavigate = () => setIsSidebarOpen(false)

  // Redirige al login cuando una llamada API devuelve 401.
  useEffect(() => {
    const onSessionExpired = () => {
      clearCurrentUser()
      navigate('/login', { replace: true })
    }
    window.addEventListener('ommex:session-expired', onSessionExpired)
    return () => window.removeEventListener('ommex:session-expired', onSessionExpired)
  }, [navigate])

  useEffect(() => {
    if (!token) return
    void apiRequest<CompanyResponse>('/companies/me', { token })
      .then((c) => setCompanyName(c.nombre))
      .catch(() => setCompanyName(''))
  }, [token])

  const initials = useMemo(() => {
    const source = user?.nombreCompleto?.trim()
    if (!source) return 'AC'
    return source.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  }, [user?.nombreCompleto])

  const currentDateLabel = useMemo(
    () => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
    [],
  )

  const currentTabLabel = useMemo(() => {
    const path = location.pathname
    const match = navigationItems.slice().sort((a, b) => b.to.length - a.to.length)
      .find((item) => path === item.to || path.startsWith(`${item.to}/`))
    return match?.label ?? 'Inicio'
  }, [location.pathname, navigationItems])

  const companyLabel = companyName || 'Institución'
  const companyBadge = useMemo(() => {
    const source = companyName || 'AC'
    return source.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2)
  }, [companyName])

  const roleLabel = isAdmin ? 'Administrador' : isSupervisor ? 'Coordinador' : isDocente ? 'Docente' : isEstudiante ? 'Estudiante' : 'Usuario'

  return (
    <main className="app-layout">
      <button
        aria-hidden={!isSidebarOpen}
        className={`sidebar-overlay${isSidebarOpen ? ' sidebar-overlay--visible' : ''}`}
        type="button"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`sidebar${isSidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <KlockLogo size={36} className="sidebar-logo__icon" />
          <div className="sidebar-logo__text">
            <span className="sidebar-logo__title">Klock Academia</span>
            <span className="sidebar-logo__sub">Clases · Horarios</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav__group">
            <span className="sidebar-nav__label">General</span>
            <ul className="sidebar-nav__list" aria-label="General">
              {navigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `sidebar-nav__link${isActive ? ' sidebar-nav__link--active' : ''}`}
                    onClick={handleNavigate}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-profile__company">
              <div className="profile-badge profile-badge--blue">{companyBadge}</div>
              <div className="profile-meta">
                <span className="profile-meta__name">{companyLabel}</span>
                <span className="profile-meta__sub">{user?.cargo ?? roleLabel}</span>
              </div>
            </div>
            <div className="sidebar-profile__user">
              <div className="profile-badge profile-badge--purple">{initials}</div>
              <div className="profile-meta">
                <span className="profile-meta__name">{user?.nombreCompleto ?? 'Usuario'}</span>
                <span className="profile-meta__sub">{user?.correo ?? ''}</span>
              </div>
            </div>
          </div>

          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            <Icon name="icon-logout" size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar__search" style={{ visibility: 'hidden' }} />
          <div className="top-bar__right">
            <button
              type="button"
              className="klock-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            <span className="top-bar__date">{currentDateLabel}</span>
            <div className="top-bar__avatar" aria-hidden="true">{initials}</div>
          </div>
        </header>

        <header className="mobile-bar">
          <button className="mobile-bar__menu" type="button" aria-label="Abrir menú" onClick={() => setIsSidebarOpen(true)}>
            <Icon name="icon-menu" size={20} />
          </button>
          <span className="mobile-bar__title">{currentTabLabel}</span>
          <div className="mobile-bar__avatar" aria-hidden="true">{initials}</div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
