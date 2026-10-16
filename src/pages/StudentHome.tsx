import { useCallback, useEffect, useState } from 'react'
import { Button, Icon } from '../components'
import { FaceScan } from '../components/FaceScan'
import { apiRequest, type AcademicNotification, type StudentTodaySession } from '../lib/api'
import { getCurrentToken, getCurrentUser } from '../lib/auth-storage'

/** Obtiene coordenadas del navegador. */
function getCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Tu dispositivo no permite obtener la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Debes permitir la ubicación para marcar asistencia en la sede.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  })
}

export default function StudentHome() {
  const token = getCurrentToken() ?? ''
  const user = getCurrentUser()
  const [sesiones, setSesiones] = useState<StudentTodaySession[]>([])
  const [notifs, setNotifs] = useState<AcademicNotification[]>([])
  const [loading, setLoading] = useState(true)

  // Marcación — la cámara/escaneo lo gestiona el componente FaceScan.
  const [marking, setMarking] = useState<StudentTodaySession | null>(null)
  const [step, setStep] = useState<'idle' | 'camera' | 'sending'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [today, noti] = await Promise.all([
        apiRequest<{ sesiones: StudentTodaySession[] }>('/academic-attendance/student/my-today', { token }),
        apiRequest<{ notifications: AcademicNotification[] }>('/academic/notifications', { token }),
      ])
      setSesiones(today.sesiones)
      setNotifs(noti.notifications)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { void load() }, [load])

  const startMark = (s: StudentTodaySession) => {
    setMarking(s); setError(null); setStep('camera'); setRetryKey((k) => k + 1)
  }

  const cancelMark = () => { setMarking(null); setStep('idle'); setError(null) }

  /** Recibe la selfie capturada por FaceScan, resuelve ubicación y marca asistencia. */
  const handleCapture = async (dataUrl: string) => {
    if (!marking) return
    setStep('sending'); setError(null)
    try {
      const imageBase64 = dataUrl // ya es un dataURL JPEG

      // Ubicación: obligatoria para clases presenciales; opcional si es virtual.
      let coords: { latitude: number; longitude: number } | null = null
      if (marking.esVirtual) {
        try { coords = await getCoords() } catch { coords = null }
      } else {
        coords = await getCoords()
      }

      await apiRequest('/academic-attendance/student/ingreso-biometrico', {
        method: 'POST', token,
        body: { imageBase64, latitude: coords?.latitude, longitude: coords?.longitude, sessionId: marking.id },
      })
      setMarking(null); setStep('idle')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar la asistencia.')
      setStep('camera')
      setRetryKey((k) => k + 1) // reinicia el escáner para reintentar
    }
  }

  const proxima = sesiones.find((s) => !s.yaMarcoIngreso) ?? sesiones[0]

  return (
    <div className="student-home">
      <header className="student-home__header">
        <h1>Hola, {user?.nombreCompleto?.split(' ')[0] ?? 'estudiante'} 👋</h1>
        <p>Estas son tus clases de hoy.</p>
      </header>

      {loading && <p className="academic-empty">Cargando...</p>}

      {/* Notificación de clase próxima */}
      {!loading && proxima && (
        <div className="student-next-card">
          <div className="student-next-card__badge">Próxima clase</div>
          <h2>{proxima.subjectNombre}</h2>
          <p className="student-next-card__meta">
            🕒 {proxima.horaInicio}{proxima.horaFin ? `–${proxima.horaFin}` : ''} · 🏫 {proxima.academicGroupNombre}
          </p>
          {proxima.docenteNombre && <p className="student-next-card__meta">🧑‍🏫 {proxima.docenteNombre}</p>}
          {proxima.esVirtual ? (
            <p className="student-next-card__sede">💻 Clase virtual · se marca sin validar ubicación.</p>
          ) : proxima.sede ? (
            <p className="student-next-card__sede">
              📍 {proxima.sede.nombre}{proxima.sede.direccion ? ` · ${proxima.sede.direccion}` : ''}
              {proxima.sede.latitud && proxima.sede.longitud && (
                <a className="student-sede-link" href={`https://www.google.com/maps/search/?api=1&query=${proxima.sede.latitud},${proxima.sede.longitud}`} target="_blank" rel="noreferrer"> Ver ubicación</a>
              )}
            </p>
          ) : (
            <p className="student-next-card__sede">📍 Esta clase no tiene sede asignada.</p>
          )}

          {proxima.estado === 'finalizada' ? (
            <div className="student-marked">🔒 Clase finalizada{proxima.miEstado ? ` · tu estado: ${proxima.miEstado}` : ''}</div>
          ) : proxima.yaMarcoIngreso ? (
            <div className="student-marked">✅ Ya marcaste tu ingreso ({proxima.miEstado})</div>
          ) : (
            <Button variant="primary" onClick={() => startMark(proxima)}>
              <Icon name="icon-user" size={16} /> Marcar asistencia en la sede
            </Button>
          )}
        </div>
      )}

      {!loading && sesiones.length === 0 && (
        <div className="student-empty-card">
          <p>No tienes clases programadas para hoy. 🎉</p>
          <small>Solo puedes marcar asistencia los días con clase, dentro de la sede correspondiente.</small>
        </div>
      )}

      {/* Resto de clases del día */}
      {sesiones.length > 1 && (
        <section className="student-list">
          <h3>Todas tus clases de hoy</h3>
          {sesiones.map((s) => (
            <div key={s.id} className="student-list__item">
              <div>
                <strong>{s.horaInicio}{s.horaFin ? `–${s.horaFin}` : ''} · {s.subjectNombre}</strong>
                <small>{s.academicGroupNombre}{s.sede ? ` · 📍 ${s.sede.nombre}` : ''}</small>
              </div>
              {s.estado === 'finalizada'
                ? <span className="student-badge">🔒 {s.miEstado ?? 'finalizada'}</span>
                : s.yaMarcoIngreso
                  ? <span className="student-badge student-badge--ok">✅ {s.miEstado}</span>
                  : <Button size="sm" variant="ghost" onClick={() => startMark(s)}>Marcar</Button>}
            </div>
          ))}
        </section>
      )}

      {/* Notificaciones */}
      {notifs.length > 0 && (
        <section className="student-list">
          <h3>🔔 Notificaciones</h3>
          {notifs.map((n) => (
            <div key={n.id} className={`student-notif student-notif--${n.nivel}`}>
              <strong>{n.titulo}</strong>
              <small>{n.detalle}</small>
            </div>
          ))}
        </section>
      )}

      {/* Modal cámara — selfie guiada estilo Nequi */}
      {marking && (
        <div className="student-cam-overlay" onClick={(e) => { if (e.target === e.currentTarget && step !== 'sending') cancelMark() }}>
          <div className="student-cam">
            <p className="student-cam__hint">
              {marking.esVirtual
                ? 'Clase virtual: mira a la cámara (no se valida tu ubicación).'
                : `Debes estar dentro de la sede ${marking.sede?.nombre ? `"${marking.sede.nombre}"` : ''}.`}
            </p>
            {step === 'sending' ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>Verificando tu rostro…</p>
            ) : (
              <FaceScan
                key={retryKey}
                title={`Marcar asistencia · ${marking.subjectNombre}`}
                subtitle="Mira a la cámara con expresión neutra. La foto se tomará automáticamente."
                captureLabel="Capturar y marcar"
                onCapture={(dataUrl) => void handleCapture(dataUrl)}
                onCancel={cancelMark}
              />
            )}
            {error && <p className="student-cam__error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
