import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CustomForm, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest, type EmbedLoginResponse, type LoginResponse } from '../lib/api'
import {
  getCurrentToken,
  getCurrentUser,
  isOfflineSessionValid,
  setCurrentToken,
  setCurrentUser,
} from '../lib/auth-storage'
import { getEmbedCompanyId, getEmbedCompanyName, getEmbedRole, getEmbedUser, isEmbedded } from '../lib/embed-context'

const loginFields: CustomFormField[] = [
  {
    name: 'numeroDocumento',
    label: 'Número de documento',
    required: true,
    fullWidth: true,
    placeholder: 'Ingresa tu documento',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const embedded = isEmbedded()

  // Si ya hay sesión válida (incluso offline), entra directo sin tocar la red.
  useEffect(() => {
    const user = getCurrentUser()
    const token = getCurrentToken()
    if (user && token && isOfflineSessionValid()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  // Modo embebido (dentro de turnos): auto-ingreso con el contexto recibido,
  // SIN mostrar formulario de login.
  useEffect(() => {
    if (!embedded) return
    let cancelled = false
    const run = async () => {
      try {
        const res = await apiRequest<EmbedLoginResponse>('/auth/embed', {
          method: 'POST',
          body: {
            companyId: getEmbedCompanyId(),
            companyName: getEmbedCompanyName(),
            user: getEmbedUser(),
            role: getEmbedRole(),
          },
        })
        if (cancelled) return
        setCurrentToken(res.token)
        setCurrentUser({
          id: res.user.id,
          companyId: res.user.companyId,
          nombreCompleto: res.user.nombreCompleto,
          correo: res.user.correo,
          cargo: res.user.cargo,
          role: res.user.role,
          allowedModules: res.user.allowedModules as never,
          permissionLevels: res.user.permissionLevels,
        })
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No fue posible abrir Academia.')
      }
    }
    void run()
    return () => { cancelled = true }
  }, [embedded, navigate])

  const handleLogin = async (values: CustomFormValues) => {
    setBusy(true)
    setError(null)
    try {
      const numeroDocumento = String(values.numeroDocumento ?? '').trim()
      if (!numeroDocumento) {
        setError('Ingresa tu número de documento.')
        return
      }
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { numeroDocumento },
      })
      setCurrentToken(result.token)
      setCurrentUser({
        id: result.user.id,
        companyId: result.user.companyId,
        nombreCompleto: result.user.nombreCompleto,
        correo: result.user.correo,
        cargo: result.user.cargo,
        role: result.user.role,
        positionId: result.user.positionId,
        allowedModules: result.user.allowedModules as never,
        permissionLevels: result.user.permissionLevels,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  // En modo embebido no se muestra el formulario: se abre la sesión sola.
  if (embedded) {
    return (
      <div className="auth-page" style={{ textAlign: 'center', padding: '2rem' }}>
        {error ? (
          <p className="turn-table__error">{error}</p>
        ) : (
          <p style={{ color: 'var(--klock-text-3, #64748b)' }}>Abriendo Academia…</p>
        )}
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="custom-form__header" style={{ marginBottom: '1rem' }}>
        <h2>Ingresa a tu cuenta</h2>
        <p>Usa el número de documento registrado por tu institución.</p>
      </div>

      {error && <p className="turn-table__error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

      <CustomForm
        title=""
        fields={loginFields}
        showReset={false}
        submitLabel={busy ? 'Ingresando…' : 'Ingresar'}
        onSubmit={(v) => void handleLogin(v)}
      />

      <p style={{ marginTop: '1.25rem', fontSize: 13, opacity: 0.75, textAlign: 'center' }}>
        ¿Eres alumno con un enlace de invitación? Ábrelo para registrarte.
      </p>

      <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <Button type="button" variant="ghost" onClick={() => navigate('/registro-institucion')}>
          Registrar institución
        </Button>
      </div>
    </div>
  )
}
