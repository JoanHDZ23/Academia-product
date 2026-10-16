import { NavLink, Outlet } from 'react-router-dom'
import { KlockLogo } from '../components'

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-layout__hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <KlockLogo size={56} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Klock Academia</h2>
            <span style={{ opacity: 0.8 }}>Planificación de clases y asistencia</span>
          </div>
        </div>
        <h1 style={{ marginTop: 0 }}>Organiza clases, cursos, alumnos y profesores.</h1>
        <p>
          Arma horarios semanales por grupo, registra la asistencia de estudiantes
          y docentes, y lleva el control académico en un solo lugar.
        </p>

        <div className="auth-layout__tips">
          <article>
            <strong>Horarios inteligentes</strong>
            <span>Franjas por día, docente y asignatura; sesiones generadas solas.</span>
          </article>
          <article>
            <strong>Asistencia simple</strong>
            <span>Ingreso por QR o biometría facial, con tolerancia configurable.</span>
          </article>
          <article>
            <strong>Reportes al día</strong>
            <span>Porcentajes de asistencia, justificaciones y alertas automáticas.</span>
          </article>
        </div>
      </section>

      <section className="auth-layout__panel">
        <nav className="auth-tabs" aria-label="Navegación de autenticación">
          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? 'auth-tabs__link auth-tabs__link--active' : 'auth-tabs__link')}
          >
            Ingresar
          </NavLink>
        </nav>
        <Outlet />
      </section>
    </main>
  )
}
