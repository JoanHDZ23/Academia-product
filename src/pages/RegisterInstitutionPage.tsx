import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CustomForm, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest } from '../lib/api'

const fields: CustomFormField[] = [
  { name: 'institucion', label: 'Nombre de la institución', required: true, fullWidth: true, placeholder: 'Ej. Instituto Klock' },
  { name: 'nit', label: 'NIT', required: true, placeholder: '900123456-7' },
  { name: 'correoInstitucion', label: 'Correo institucional', type: 'email', required: true, placeholder: 'contacto@institucion.edu.co' },
  { name: 'telefonoInstitucion', label: 'Teléfono', type: 'tel', placeholder: '6011234567' },
  { name: 'ciudadInstitucion', label: 'Ciudad', placeholder: 'Bogotá' },
  { name: 'direccionInstitucion', label: 'Dirección', fullWidth: true, placeholder: 'Calle 1 # 2-3' },
  { name: 'adminNombreCompleto', label: 'Administrador — nombre completo', required: true, fullWidth: true, placeholder: 'Nombre y apellidos' },
  {
    name: 'adminTipoDocumento', label: 'Tipo de documento', type: 'select', required: true, defaultValue: 'CC',
    options: [
      { label: 'Cédula de ciudadanía', value: 'CC' },
      { label: 'Cédula de extranjería', value: 'CE' },
      { label: 'Pasaporte', value: 'PA' },
    ],
  },
  { name: 'adminNumeroDocumento', label: 'Documento del administrador', required: true, placeholder: '1234567890' },
  { name: 'adminCorreo', label: 'Correo del administrador', type: 'email', required: true, placeholder: 'admin@institucion.edu.co' },
  { name: 'adminTelefono', label: 'Teléfono del administrador', type: 'tel', placeholder: '3001234567' },
]

export default function RegisterInstitutionPage() {
  const [status, setStatus] = useState<{ kind: 'idle' | 'success' | 'error'; message?: string }>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (values: CustomFormValues) => {
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      await apiRequest<{ message: string }>('/auth/register-institution', { method: 'POST', body: values })
      setStatus({ kind: 'success', message: 'Institución registrada. Ya puedes ingresar con el documento del administrador.' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'No fue posible registrar la institución.' })
    } finally {
      setBusy(false)
    }
  }

  if (status.kind === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-feedback auth-feedback--success">
          <p>{status.message}</p>
          <Link className="auth-feedback__link" to="/login">Ir al ingreso</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      {status.kind === 'error' && <p className="turn-table__error" style={{ marginBottom: '0.75rem' }}>{status.message}</p>}
      <CustomForm
        title="Registrar institución"
        description="Crea tu institución educativa y la cuenta del administrador principal."
        fields={fields}
        submitLabel={busy ? 'Registrando…' : 'Registrar institución'}
        showReset={false}
        onSubmit={(v) => void handleSubmit(v)}
      />
      <div className="auth-feedback">
        <p>¿Ya tienes cuenta? <Link className="auth-feedback__link" to="/login">Inicia sesión</Link>.</p>
      </div>
    </div>
  )
}
