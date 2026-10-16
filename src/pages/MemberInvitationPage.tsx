import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CustomForm, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest, type UserInvitationDetailResponse } from '../lib/api'

type InvitationStatusState = {
  kind: 'loading' | 'ready' | 'success' | 'error'
  message?: string
}

export default function MemberInvitationPage() {
  const { token } = useParams()
  const [invitation, setInvitation] = useState<UserInvitationDetailResponse | null>(null)
  const [status, setStatus] = useState<InvitationStatusState>({ kind: 'loading' })

  useEffect(() => {
    if (!token) return
    void apiRequest<UserInvitationDetailResponse>(`/auth/member-invitations/${token}`)
      .then((response) => {
        setInvitation(response)
        setStatus({ kind: 'ready' })
      })
      .catch((error: unknown) => {
        setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'No fue posible validar el enlace.' })
      })
  }, [token])

  const fields = useMemo<CustomFormField[]>(() => {
    if (!invitation) return []
    return [
      {
        name: 'grupo',
        label: 'Grupo / salón',
        defaultValue: invitation.academicGroup?.nombre ?? '',
        disabled: true,
        fullWidth: true,
      },
      { name: 'nombreCompleto', label: 'Nombre completo', placeholder: 'Ingresa tu nombre completo', required: true, fullWidth: true },
      {
        name: 'tipoDocumento',
        label: 'Tipo de documento',
        type: 'select',
        required: true,
        options: [
          { label: 'Cédula de ciudadanía', value: 'CC' },
          { label: 'Tarjeta de identidad', value: 'TI' },
          { label: 'Cédula de extranjería', value: 'CE' },
          { label: 'Pasaporte', value: 'PA' },
        ],
      },
      { name: 'numeroDocumento', label: 'Número de documento', placeholder: 'Ingresa tu número de documento', required: true },
      { name: 'correo', label: 'Correo', type: 'email', placeholder: 'correo@ejemplo.com', required: true },
      { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '3001234567' },
    ]
  }, [invitation])

  const handleSubmit = async (values: CustomFormValues) => {
    if (!token) return
    try {
      await apiRequest<{ message: string }>(`/auth/member-invitations/${token}/complete`, {
        method: 'POST',
        body: {
          nombreCompleto: values.nombreCompleto ?? '',
          tipoDocumento: values.tipoDocumento ?? '',
          numeroDocumento: values.numeroDocumento ?? '',
          correo: values.correo ?? '',
          telefono: values.telefono ?? '',
        },
      })
      setStatus({ kind: 'success', message: 'Registro completado. Ya puedes ingresar con tu número de documento.' })
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'No fue posible completar el registro.' })
    }
  }

  return (
    <div className="auth-page">
      {!token ? (
        <div className="auth-feedback auth-feedback--error"><p>El enlace de registro no es válido.</p></div>
      ) : status.kind === 'loading' ? (
        <div className="auth-feedback"><p>Validando enlace de registro…</p></div>
      ) : null}

      {status.kind === 'ready' && invitation ? (
        <>
          <CustomForm
            title="Registro de estudiante"
            description={`Te unirás al grupo "${invitation.academicGroup?.nombre ?? ''}" de ${invitation.company?.nombre ?? 'la institución'}.`}
            fields={fields}
            submitLabel="Unirme al grupo"
            showReset={false}
            onSubmit={handleSubmit}
          />
          <div className="auth-feedback">
            <p>Completa tus datos para quedar registrado y asignado automáticamente al grupo.</p>
          </div>
        </>
      ) : null}

      {status.kind === 'success' ? (
        <div className="auth-feedback auth-feedback--success">
          <p>{status.message}</p>
          <Link className="auth-feedback__link" to="/login">Ir al ingreso</Link>
        </div>
      ) : null}

      {status.kind === 'error' ? (
        <div className="auth-feedback auth-feedback--error"><p>{status.message}</p></div>
      ) : null}
    </div>
  )
}
