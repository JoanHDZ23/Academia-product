import { useCallback, useEffect, useState } from 'react'
import { Button, CustomForm, Modal, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest } from '../lib/api'
import { assignableFeatures } from '../lib/access'

type RootCompany = {
  id: string
  nombre: string
  nit: string
  correo: string
  telefono?: string
  direccion?: string
  ciudad?: string
  tipo: 'academia'
  activa: boolean
  enabledModules?: string[]
  adminCount: number
  docenteCount: number
  estudianteCount: number
  createdAt: string
}

type RootLoginResponse = { token: string; user: { role: 'root'; username: string } }

const ROOT_TOKEN_KEY = 'ommex_academia_root_token'
const getRootToken = () => localStorage.getItem(ROOT_TOKEN_KEY)
const setRootToken = (t: string) => localStorage.setItem(ROOT_TOKEN_KEY, t)
const clearRootToken = () => localStorage.removeItem(ROOT_TOKEN_KEY)

const newCompanyFields: CustomFormField[] = [
  { name: 'nombre', label: 'Nombre de la institución', required: true, fullWidth: true, placeholder: 'Ej. Instituto Klock' },
  { name: 'nit', label: 'NIT', required: true, placeholder: '900123456-7' },
  { name: 'correo', label: 'Correo', type: 'email', required: true, placeholder: 'contacto@institucion.edu.co' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '6011234567' },
  { name: 'ciudad', label: 'Ciudad', placeholder: 'Bogotá' },
  { name: 'direccion', label: 'Dirección', fullWidth: true, placeholder: 'Calle 1 # 2-3' },
]

export default function RootPanelPage() {
  const [token, setToken] = useState<string | null>(getRootToken)
  const [companies, setCompanies] = useState<RootCompany[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Modal de funciones (módulos)
  const [featuresCompany, setFeaturesCompany] = useState<RootCompany | null>(null)
  const [featuresDraft, setFeaturesDraft] = useState<string[]>([])
  const [savingFeatures, setSavingFeatures] = useState(false)

  // Eliminar institución
  const [deleteTarget, setDeleteTarget] = useState<RootCompany | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Login
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const notify = (kind: 'success' | 'error', message: string) => {
    setFeedback({ kind, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const fetchCompanies = useCallback(async (authToken: string) => {
    setLoading(true)
    try {
      const data = await apiRequest<RootCompany[]>('/root/companies', { token: authToken })
      setCompanies(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando instituciones'
      if (message.includes('401') || message.toLowerCase().includes('token') || message.toLowerCase().includes('root')) {
        clearRootToken()
        setToken(null)
      }
      notify('error', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) void fetchCompanies(token)
  }, [token, fetchCompanies])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res = await apiRequest<RootLoginResponse>('/root/login', {
        method: 'POST',
        body: { username: loginUsername, password: loginPassword },
      })
      setRootToken(res.token)
      setToken(res.token)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    clearRootToken()
    setToken(null)
    setCompanies([])
  }

  const handleCreate = async (values: CustomFormValues) => {
    if (!token) return
    setCreating(true)
    try {
      await apiRequest('/root/companies', { method: 'POST', token, body: values })
      notify('success', 'Institución creada.')
      setShowCreate(false)
      await fetchCompanies(token)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error al crear la institución.')
    } finally {
      setCreating(false)
    }
  }

  const toggleActiva = async (c: RootCompany) => {
    if (!token) return
    try {
      await apiRequest(`/root/companies/${c.id}`, { method: 'PATCH', token, body: { activa: !c.activa } })
      notify('success', `Institución ${!c.activa ? 'activada' : 'desactivada'}.`)
      await fetchCompanies(token)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error.')
    }
  }

  const openFeatures = (c: RootCompany) => {
    setFeaturesCompany(c)
    setFeaturesDraft(c.enabledModules ?? ['dashboard'])
  }

  const toggleFeatureDraft = (key: string) => {
    setFeaturesDraft((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const saveFeatures = async () => {
    if (!token || !featuresCompany) return
    setSavingFeatures(true)
    try {
      await apiRequest(`/root/companies/${featuresCompany.id}/modules`, {
        method: 'PATCH', token, body: { enabledModules: featuresDraft },
      })
      notify('success', 'Funciones actualizadas.')
      setFeaturesCompany(null)
      await fetchCompanies(token)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error al guardar funciones.')
    } finally {
      setSavingFeatures(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setDeleting(true)
    try {
      await apiRequest(`/root/companies/${deleteTarget.id}`, { method: 'DELETE', token })
      notify('success', 'Institución eliminada.')
      setDeleteTarget(null)
      await fetchCompanies(token)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error al eliminar.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="root-login">
        <form className="root-login__card" onSubmit={(e) => void handleLogin(e)}>
          <h1>Panel Root · Academia</h1>
          <p>Gestión de instituciones y funciones.</p>
          {loginError && <p className="turn-table__error">{loginError}</p>}
          <label>
            Usuario
            <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Contraseña
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" />
          </label>
          <Button type="submit" variant="primary" disabled={loginLoading}>
            {loginLoading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    )
  }

  // ── Panel ────────────────────────────────────────────────────────────────────
  return (
    <div className="root-panel">
      <header className="root-panel__header">
        <div>
          <h1>Instituciones</h1>
          <p>Crea instituciones y activa o quita sus funciones.</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Button icon="icon-plus" variant="primary" onClick={() => setShowCreate(true)}>Nueva institución</Button>
          <Button variant="ghost" onClick={handleLogout}>Salir</Button>
        </div>
      </header>

      {feedback && (
        <div className={`feedback-banner feedback-banner--${feedback.kind}`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p className="academic-empty">Cargando…</p>
      ) : companies.length === 0 ? (
        <p className="academic-empty">No hay instituciones. Crea la primera.</p>
      ) : (
        <div className="root-companies">
          {companies.map((c) => (
            <article key={c.id} className={`root-company ${c.activa ? '' : 'root-company--off'}`}>
              <div className="root-company__main">
                <h3>{c.nombre}</h3>
                <small>NIT {c.nit} · {c.correo}</small>
                <small>
                  👩‍🏫 {c.docenteCount} docentes · 🎓 {c.estudianteCount} estudiantes · 🛡 {c.adminCount} admin
                </small>
                <small>{(c.enabledModules?.length ?? 0)} funciones activas · {c.activa ? 'Activa' : 'Inactiva'}</small>
              </div>
              <div className="root-company__actions">
                <Button size="sm" variant="ghost" icon="icon-clipboard" onClick={() => openFeatures(c)}>Funciones</Button>
                <Button size="sm" variant="ghost" onClick={() => void toggleActiva(c)}>
                  {c.activa ? 'Desactivar' : 'Activar'}
                </Button>
                <button className="academic-icon-btn" title="Eliminar" style={{ color: '#dc2626' }} onClick={() => setDeleteTarget(c)}>🗑</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Crear institución */}
      <Modal open={showCreate} title="Nueva institución" onClose={() => setShowCreate(false)}>
        <CustomForm
          title=""
          fields={newCompanyFields}
          showReset={false}
          submitLabel={creating ? 'Creando…' : 'Crear institución'}
          onSubmit={(v) => void handleCreate(v)}
        />
      </Modal>

      {/* Funciones (módulos) */}
      <Modal
        open={featuresCompany !== null}
        title={`Funciones · ${featuresCompany?.nombre ?? ''}`}
        description="Activa o quita las funciones disponibles para esta institución."
        onClose={() => setFeaturesCompany(null)}
      >
        <div className="root-features__list">
          {assignableFeatures.map((f) => {
            const checked = featuresDraft.includes(f.key) || Boolean(f.locked)
            return (
              <label key={f.key} className={`root-feature ${checked ? 'root-feature--on' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={Boolean(f.locked)}
                  onChange={() => toggleFeatureDraft(f.key)}
                />
                <span className="root-feature__icon">{f.icon}</span>
                <span className="root-feature__text">
                  <strong>{f.label}</strong>
                  {f.description && <small>{f.description}</small>}
                </span>
              </label>
            )
          })}
        </div>
        <div className="academic-actions-end" style={{ marginTop: '1rem' }}>
          <Button variant="ghost" onClick={() => setFeaturesCompany(null)}>Cancelar</Button>
          <Button variant="primary" disabled={savingFeatures} onClick={() => void saveFeatures()}>
            {savingFeatures ? 'Guardando…' : 'Guardar funciones'}
          </Button>
        </div>
      </Modal>

      {/* Eliminar */}
      <Modal open={deleteTarget !== null} title="Eliminar institución" onClose={() => setDeleteTarget(null)}>
        <div className="academic-confirm">
          <p>¿Eliminar <strong>{deleteTarget?.nombre}</strong> y todos sus datos (usuarios, grupos, clases)? Esta acción no se puede deshacer.</p>
          <div className="academic-actions-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" disabled={deleting} style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => void handleDelete()}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
