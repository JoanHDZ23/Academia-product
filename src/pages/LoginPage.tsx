import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CustomForm, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest, type LoginResponse } from '../lib/api'
import {
  getCurrentToken,
  getCurrentUser,
  isOfflineSessionValid,
  setCurrentToken,
  setCurrentUser,
} from '../lib/auth-storage'
import { isEmbedded } from '../lib/embed-context'

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

  // Si está embebido o ya hay sesión válida, entra directo al home (el
  // auto-ingreso embebido lo resuelve RequireAuth en /dashboard).
  useEffect(() => {
    if (embedded) {
      navigate('/dashboard', { replace: true })
      return
    }
    const user = getCurrentUser()
    const token = getCurrentToken()
    if (user && token && isOfflineSessionValid()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, embedded])

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
