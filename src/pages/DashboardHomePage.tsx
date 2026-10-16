import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon } from '../components'
import { apiRequest, type DashboardSummaryResponse } from '../lib/api'
import { getCurrentToken, getCurrentUser } from '../lib/auth-storage'
import StudentHome from './StudentHome'

export default function DashboardHomePage() {
  const user = getCurrentUser()
  const token = getCurrentToken()
  const isEstudiante = user?.role === 'estudiante'
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)

  useEffect(() => {
    if (!token || isEstudiante) return
    void apiRequest<DashboardSummaryResponse>('/academic/dashboard-summary', { token })
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [token, isEstudiante])

  // Dashboard dedicado para estudiantes.
  if (isEstudiante) {
    return <StudentHome />
  }

  const cards = summary
    ? [
        { title: 'Estudiantes', value: summary.totalEstudiantes, meta: 'Activos', accent: 'violet' as const },
        { title: 'Docentes', value: summary.totalDocentes, meta: 'Activos', accent: 'blue' as const },
        { title: 'Grupos', value: summary.totalGrupos, meta: 'Salones activos', accent: 'green' as const },
        { title: 'Asignaturas', value: summary.totalAsignaturas, meta: 'En catálogo', accent: 'violet' as const },
        { title: 'Clases hoy', value: summary.sesionesHoy, meta: 'Programadas', accent: 'blue' as const },
        { title: '% Asistencia', value: `${summary.porcentajeAsistencia}%`, meta: 'Últimas 2 semanas', accent: 'green' as const },
        { title: 'Alertas', value: summary.alertasPendientes, meta: 'Sin leer', accent: 'amber' as const },
      ]
    : []

  return (
    <div className="dashboard-page">
      <section className="page-header">
        <div>
          <h1>Panel académico</h1>
          <p className="page-subtitle">Resumen de clases, asistencia y población de tu institución.</p>
        </div>
        <Link to="/dashboard/academico" className="dashboard-page__cta">
          <Button icon="icon-clipboard" className="btn-primary">Gestión académica</Button>
        </Link>
      </section>

      {cards.length > 0 && (
        <section className="stats-grid">
          {cards.map((metric) => (
            <article className="stat-card" key={metric.title}>
              <div className={`stat-icon stat-icon--${metric.accent}`}>
                <Icon name="icon-bar-chart" size={18} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{metric.value}</div>
                <div className="stat-label">{metric.title}</div>
                <div className="stat-meta">{metric.meta}</div>
              </div>
            </article>
          ))}
        </section>
      )}

      {user && (
        <section className="content-card personal-info-card">
          <h3>Mi información</h3>
          <div className="personal-info-grid">
            <div className="personal-info-item">
              <span className="personal-info-label">Nombre completo</span>
              <strong>{user.nombreCompleto}</strong>
            </div>
            <div className="personal-info-item">
              <span className="personal-info-label">Cargo</span>
              <strong>{user.cargo ?? 'Sin cargo asignado'}</strong>
            </div>
            <div className="personal-info-item">
              <span className="personal-info-label">Rol</span>
              <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
            </div>
            <div className="personal-info-item">
              <span className="personal-info-label">Correo</span>
              <strong>{user.correo}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
