import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, CustomForm, Modal, type CustomFormField, type CustomFormValues } from '../components'
import { apiRequest, type AcademicGroupResponse, type AcademicGroupTeacher, type AcademicNotification, type AcademicPerson, type ClassSessionResponse, type DiaSemana, type HorarioFranja, type LocationResponse, type SessionDetailResponse, type SubjectResponse } from '../lib/api'
import { getCurrentToken, getCurrentUser } from '../lib/auth-storage'

// ── Constantes ────────────────────────────────────────────────────────────────
type Tab = 'personas' | 'asignaturas' | 'sedes' | 'grupos' | 'horarios' | 'misclases' | 'misgrupos'

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'lunes', label: 'Lun' },
  { value: 'martes', label: 'Mar' },
  { value: 'miercoles', label: 'Mié' },
  { value: 'jueves', label: 'Jue' },
  { value: 'viernes', label: 'Vie' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

const TIPO_DOC_OPTS = [
  { label: 'Cédula de ciudadanía', value: 'CC' },
  { label: 'Tarjeta de identidad', value: 'TI' },
  { label: 'Cédula de extranjería', value: 'CE' },
  { label: 'Pasaporte', value: 'PA' },
]

type Feedback = { kind: 'success' | 'error'; message: string } | null

// ── Componente principal ──────────────────────────────────────────────────────
export default function AcademicPage() {
  const token = getCurrentToken() ?? ''
  const user = getCurrentUser()
  const isAdmin = user?.role === 'admin'
  const isDocente = user?.role === 'docente'
  const [tab, setTab] = useState<Tab>(isDocente ? 'misclases' : 'personas')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<AcademicNotification[]>([])

  // Datos compartidos
  const [docentes, setDocentes] = useState<AcademicPerson[]>([])
  const [estudiantes, setEstudiantes] = useState<AcademicPerson[]>([])
  const [subjects, setSubjects] = useState<SubjectResponse[]>([])
  const [groups, setGroups] = useState<AcademicGroupResponse[]>([])
  const [locations, setLocations] = useState<LocationResponse[]>([])

  const notify = useCallback((kind: 'success' | 'error', message: string) => {
    setFeedback({ kind, message })
    setTimeout(() => setFeedback(null), 4000)
  }, [])

  const loadPeople = useCallback(async () => {
    try {
      const [docs, studs] = await Promise.all([
        apiRequest<AcademicPerson[]>('/academic/people?role=docente', { token }),
        apiRequest<AcademicPerson[]>('/academic/people?role=estudiante', { token }),
      ])
      setDocentes(docs)
      setEstudiantes(studs)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error cargando personas')
    }
  }, [token, notify])

  const loadSubjects = useCallback(async () => {
    try {
      setSubjects(await apiRequest<SubjectResponse[]>('/academic/subjects', { token }))
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error cargando asignaturas')
    }
  }, [token, notify])

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await apiRequest<AcademicGroupResponse[]>('/academic/groups', { token }))
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error cargando grupos')
    }
  }, [token, notify])

  const loadLocations = useCallback(async () => {
    try {
      setLocations(await apiRequest<LocationResponse[]>('/locations', { token }))
    } catch { /* silencioso */ }
  }, [token])

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{ notifications: AcademicNotification[] }>('/academic/notifications', { token })
      setNotifications(res.notifications)
    } catch { /* silencioso */ }
  }, [token])

  useEffect(() => {
    // Docentes no gestionan personas/asignaturas
    if (!isDocente) { void loadPeople(); void loadSubjects(); void loadLocations() }
    void loadGroups()
    void loadNotifications()
  }, [loadPeople, loadSubjects, loadGroups, loadLocations, loadNotifications, isDocente])

  return (
    <div className="academic">
      <header className="academic__header">
        <div>
          <h1>Gestión académica</h1>
          <p>{isDocente ? 'Gestiona tus clases, confirma asistencia e invita a tus alumnos.' : 'Registra docentes y alumnos, crea asignaturas, grupos de salón y horarios de clase.'}</p>
        </div>
        <div className="academic__notif">
          <button className="academic__bell" onClick={() => { setShowNotifs((v) => !v); void loadNotifications() }} title="Notificaciones">
            🔔{notifications.length > 0 && <span className="academic__bell-badge">{notifications.length}</span>}
          </button>
          {showNotifs && (
            <div className="academic__notif-panel">
              <div className="academic__notif-head">
                <strong>Notificaciones</strong>
                <button onClick={() => setShowNotifs(false)}>✕</button>
              </div>
              {notifications.length === 0 ? (
                <p className="academic-empty" style={{ padding: '.75rem' }}>Sin notificaciones.</p>
              ) : (
                <ul className="academic__notif-list">
                  {notifications.map((n) => (
                    <li key={n.id} className={`academic__notif-item academic__notif-item--${n.nivel}`}>
                      <strong>{n.titulo}</strong>
                      <small>{n.detalle}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      {feedback && (
        <div className={`feedback-banner feedback-banner--${feedback.kind}`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <nav className="academic__tabs">
        {(isDocente || isAdmin) && <button className={tab === 'misclases' ? 'is-active' : ''} onClick={() => setTab('misclases')}>🧑‍🏫 Mis clases</button>}
        {isDocente && <button className={tab === 'misgrupos' ? 'is-active' : ''} onClick={() => setTab('misgrupos')}>🏫 Mis salones</button>}
        {!isDocente && <button className={tab === 'personas' ? 'is-active' : ''} onClick={() => setTab('personas')}>👥 Personas</button>}
        {!isDocente && <button className={tab === 'asignaturas' ? 'is-active' : ''} onClick={() => setTab('asignaturas')}>📚 Asignaturas</button>}
        {!isDocente && <button className={tab === 'sedes' ? 'is-active' : ''} onClick={() => setTab('sedes')}>📍 Sedes</button>}
        {!isDocente && <button className={tab === 'grupos' ? 'is-active' : ''} onClick={() => setTab('grupos')}>🏫 Grupos / Salones</button>}
        {!isDocente && <button className={tab === 'horarios' ? 'is-active' : ''} onClick={() => setTab('horarios')}>🗓️ Horarios</button>}
      </nav>

      <div className="academic__body">
        {tab === 'misclases' && (
          <MyClassesTab token={token} notify={notify} onChange={loadNotifications} />
        )}
        {tab === 'misgrupos' && isDocente && (
          <TeacherGroupsTab token={token} groups={groups} notify={notify} />
        )}
        {tab === 'personas' && !isDocente && (
          <PeopleTab
            token={token} isAdmin={isAdmin} docentes={docentes} estudiantes={estudiantes}
            reload={loadPeople} notify={notify}
          />
        )}
        {tab === 'asignaturas' && !isDocente && (
          <SubjectsTab token={token} isAdmin={isAdmin} subjects={subjects} reload={loadSubjects} notify={notify} />
        )}
        {tab === 'sedes' && !isDocente && (
          <SedesTab token={token} isAdmin={isAdmin} locations={locations} reload={loadLocations} notify={notify} />
        )}
        {tab === 'grupos' && (
          <GroupsTab
            token={token} isAdmin={isAdmin} groups={groups} subjects={subjects} docentes={docentes} estudiantes={estudiantes}
            locations={locations} reload={loadGroups} notify={notify}
          />
        )}
        {tab === 'horarios' && (
          <SchedulesTab token={token} isAdmin={isAdmin} groups={groups} notify={notify} />
        )}
      </div>
    </div>
  )
}

// ── Pestaña: Personas (docentes y alumnos) ────────────────────────────────────
function PeopleTab({ token, isAdmin, docentes, estudiantes, reload, notify }: {
  token: string; isAdmin: boolean; docentes: AcademicPerson[]; estudiantes: AcademicPerson[]
  reload: () => Promise<void>; notify: (k: 'success' | 'error', m: string) => void
}) {
  const [modalRole, setModalRole] = useState<'docente' | 'estudiante' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicPerson | null>(null)
  const [busy, setBusy] = useState(false)

  const personFields = (role: 'docente' | 'estudiante'): CustomFormField[] => [
    { name: 'nombreCompleto', label: 'Nombre completo', required: true, fullWidth: true, placeholder: 'Nombre y apellidos' },
    { name: 'tipoDocumento', label: 'Tipo de documento', type: 'select', required: true, defaultValue: 'CC', options: TIPO_DOC_OPTS },
    { name: 'numeroDocumento', label: 'Número de documento', required: true, placeholder: '1234567890' },
    { name: 'correo', label: 'Correo', type: 'email', required: true, placeholder: 'correo@ejemplo.com' },
    { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '3001234567' },
    ...(role === 'docente'
      ? [
          { name: 'especialidad', label: 'Especialidad / área', placeholder: 'Ej. Matemáticas', fullWidth: true } as CustomFormField,
          { name: 'titulo', label: 'Título', placeholder: 'Ej. Licenciado en...' } as CustomFormField,
          { name: 'codigo', label: 'Código docente', placeholder: 'Opcional' } as CustomFormField,
        ]
      : [
          { name: 'codigo', label: 'Código estudiante', placeholder: 'Opcional', fullWidth: true } as CustomFormField,
        ]),
  ]

  const handleCreate = async (role: 'docente' | 'estudiante', values: CustomFormValues) => {
    setBusy(true)
    try {
      const body: Record<string, unknown> = {
        role,
        nombreCompleto: values.nombreCompleto,
        tipoDocumento: values.tipoDocumento,
        numeroDocumento: values.numeroDocumento,
        correo: values.correo,
        telefono: values.telefono || undefined,
      }
      if (role === 'docente') {
        body.docente = { especialidad: values.especialidad || undefined, titulo: values.titulo || undefined, codigo: values.codigo || undefined }
      } else {
        body.estudiante = { codigo: values.codigo || undefined }
      }
      await apiRequest('/academic/people', { method: 'POST', token, body })
      notify('success', `${role === 'docente' ? 'Docente' : 'Estudiante'} registrado.`)
      setModalRole(null)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await apiRequest(`/academic/people/${deleteTarget.id}`, { method: 'DELETE', token })
      notify('success', 'Persona eliminada.')
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="academic-grid-2">
      <PeopleColumn
        title="Docentes" icon="🧑‍🏫" people={docentes} isAdmin={isAdmin}
        onAdd={() => setModalRole('docente')} onDelete={setDeleteTarget}
        subtitle={(p) => p.docente?.especialidad || 'Sin especialidad'}
      />
      <PeopleColumn
        title="Alumnos" icon="🎓" people={estudiantes} isAdmin={isAdmin}
        onAdd={() => setModalRole('estudiante')} onDelete={setDeleteTarget}
        subtitle={(p) => p.estudiante?.codigo ? `Código: ${p.estudiante.codigo}` : p.numeroDocumento}
      />

      <Modal open={modalRole !== null} title={`Registrar ${modalRole === 'docente' ? 'docente' : 'alumno'}`} onClose={() => setModalRole(null)}>
        {modalRole && (
          <CustomForm
            title="" fields={personFields(modalRole)} showReset={false}
            submitLabel={busy ? 'Guardando...' : 'Registrar'}
            onSubmit={(v) => void handleCreate(modalRole, v)}
          />
        )}
      </Modal>

      <Modal open={deleteTarget !== null} title="Eliminar persona" onClose={() => setDeleteTarget(null)}>
        <div className="academic-confirm">
          <p>¿Eliminar a <strong>{deleteTarget?.nombreCompleto}</strong>? Esta acción no se puede deshacer.</p>
          <div className="academic-actions-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" disabled={busy} style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>
              {busy ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PeopleColumn({ title, icon, people, isAdmin, onAdd, onDelete, subtitle }: {
  title: string; icon: string; people: AcademicPerson[]; isAdmin: boolean
  onAdd: () => void; onDelete: (p: AcademicPerson) => void; subtitle: (p: AcademicPerson) => string
}) {
  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>{icon} {title} <span className="academic-count">{people.length}</span></h3>
        {isAdmin && <Button size="sm" variant="primary" onClick={onAdd}>+ Agregar</Button>}
      </div>
      {people.length === 0 ? (
        <p className="academic-empty">Aún no hay {title.toLowerCase()}.</p>
      ) : (
        <ul className="academic-list">
          {people.map((p) => (
            <li key={p.id} className="academic-list__item">
              <div className="academic-list__info">
                <strong>{p.nombreCompleto}</strong>
                <small>{subtitle(p)} · {p.correo}</small>
              </div>
              {isAdmin && (
                <button className="academic-icon-btn" title="Eliminar" onClick={() => onDelete(p)} style={{ color: '#dc2626' }}>🗑</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Pestaña: Asignaturas (con categoría) ──────────────────────────────────────
function SubjectsTab({ token, isAdmin, subjects, reload, notify }: {
  token: string; isAdmin: boolean; subjects: SubjectResponse[]
  reload: () => Promise<void>; notify: (k: 'success' | 'error', m: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SubjectResponse | null>(null)
  const [busy, setBusy] = useState(false)

  const fields: CustomFormField[] = [
    { name: 'codigo', label: 'Código', required: true, placeholder: 'Ej. MAT-101' },
    { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej. Matemáticas I' },
    { name: 'categoria', label: 'Categoría / área', fullWidth: true, placeholder: 'Ej. Ciencias exactas', helperText: 'Permite agrupar docentes por especialidad.' },
    { name: 'creditos', label: 'Créditos', type: 'number', placeholder: '0' },
    { name: 'horasAcademicas', label: 'Horas académicas', type: 'number', placeholder: '0' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true, rows: 2 },
  ]

  const handleCreate = async (values: CustomFormValues) => {
    setBusy(true)
    try {
      await apiRequest('/academic/subjects', {
        method: 'POST', token,
        body: {
          codigo: values.codigo, nombre: values.nombre,
          categoria: values.categoria || undefined,
          descripcion: values.descripcion || undefined,
          creditos: values.creditos ? Number(values.creditos) : undefined,
          horasAcademicas: values.horasAcademicas ? Number(values.horasAcademicas) : undefined,
        },
      })
      notify('success', 'Asignatura creada.')
      setShowModal(false)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await apiRequest(`/academic/subjects/${deleteTarget.id}`, { method: 'DELETE', token })
      notify('success', 'Asignatura eliminada.')
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  // Agrupa por categoría
  const byCategory = useMemo(() => {
    const map = new Map<string, SubjectResponse[]>()
    for (const s of subjects) {
      const cat = s.categoria?.trim() || 'Sin categoría'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(s)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [subjects])

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>📚 Asignaturas <span className="academic-count">{subjects.length}</span></h3>
        {isAdmin && <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>+ Nueva asignatura</Button>}
      </div>
      {subjects.length === 0 ? (
        <p className="academic-empty">Aún no hay asignaturas. Crea la primera para poder armar grupos.</p>
      ) : (
        byCategory.map(([cat, items]) => (
          <div key={cat} className="academic-cat-group">
            <h4 className="academic-cat-title">{cat}</h4>
            <ul className="academic-list">
              {items.map((s) => (
                <li key={s.id} className="academic-list__item">
                  <div className="academic-list__info">
                    <strong>{s.codigo} · {s.nombre}</strong>
                    <small>{s.creditos ? `${s.creditos} créditos` : ''} {s.horasAcademicas ? `· ${s.horasAcademicas}h` : ''}</small>
                  </div>
                  {isAdmin && <button className="academic-icon-btn" onClick={() => setDeleteTarget(s)} style={{ color: '#dc2626' }}>🗑</button>}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <Modal open={showModal} title="Nueva asignatura" onClose={() => setShowModal(false)}>
        <CustomForm title="" fields={fields} showReset={false} submitLabel={busy ? 'Guardando...' : 'Crear'} onSubmit={(v) => void handleCreate(v)} />
      </Modal>

      <Modal open={deleteTarget !== null} title="Eliminar asignatura" onClose={() => setDeleteTarget(null)}>
        <div className="academic-confirm">
          <p>¿Eliminar <strong>{deleteTarget?.nombre}</strong>?</p>
          <div className="academic-actions-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" disabled={busy} style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ── Pestaña: Grupos / Salones ─────────────────────────────────────────────────
function GroupsTab({ token, isAdmin, groups, subjects, docentes, estudiantes, locations, reload, notify }: {
  token: string; isAdmin: boolean; groups: AcademicGroupResponse[]; subjects: SubjectResponse[]
  docentes: AcademicPerson[]; estudiantes: AcademicPerson[]; locations: LocationResponse[]
  reload: () => Promise<void>; notify: (k: 'success' | 'error', m: string) => void
}) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicGroupResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicGroupResponse | null>(null)
  const [busy, setBusy] = useState(false)

  const openNew = () => { setEditing(null); setEditorOpen(true) }
  const openEdit = (g: AcademicGroupResponse) => { setEditing(g); setEditorOpen(true) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await apiRequest(`/academic/groups/${deleteTarget.id}`, { method: 'DELETE', token })
      notify('success', 'Grupo eliminado.')
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>🏫 Grupos / Salones <span className="academic-count">{groups.length}</span></h3>
        {isAdmin && <Button size="sm" variant="primary" onClick={openNew}>+ Nuevo grupo</Button>}
      </div>
      {groups.length === 0 ? (
        <p className="academic-empty">Aún no hay grupos. Crea uno, asigna sus docentes y arma el horario semanal.</p>
      ) : (
        <ul className="academic-list">
          {groups.map((g) => {
            const docs = g.docentes && g.docentes.length > 0 ? g.docentes : [{ docenteUserId: g.docenteUserId, docenteNombre: g.docenteNombre, subjectId: g.subjectId, subjectNombre: g.subjectNombre }]
            return (
              <li key={g.id} className="academic-list__item">
                <div className="academic-list__info">
                  <strong>{g.nombre}</strong>
                  <small>
                    🧑‍🏫 {docs.map((d) => `${d.docenteNombre} (${d.subjectNombre})`).join(', ')}
                  </small>
                  <small>
                    {g.horario && g.horario.length > 0
                      ? `🗓️ ${g.horario.length} franja(s) · ${[...new Set(g.horario.map((f) => f.dia))].map((d) => d.slice(0, 3)).join(', ')}`
                      : `${g.diasSemana.map((d) => d.slice(0, 3)).join(', ')} ${g.horaInicio}–${g.horaFin}`}
                    {' · '}👥 {g.estudianteUserIds.length}
                    {g.fechaInicio ? ` · ${g.fechaInicio}${g.fechaFin ? ` → ${g.fechaFin}` : ''}` : ''}
                  </small>
                </div>
                {isAdmin && (
                  <div className="academic-list__actions">
                    <button className="academic-icon-btn" title="Editar" onClick={() => openEdit(g)}>✏️</button>
                    <button className="academic-icon-btn" title="Eliminar" onClick={() => setDeleteTarget(g)} style={{ color: '#dc2626' }}>🗑</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editorOpen && (
        <GroupEditor
          token={token} group={editing} subjects={subjects} docentes={docentes} estudiantes={estudiantes} locations={locations}
          onClose={() => setEditorOpen(false)}
          onSaved={async () => { setEditorOpen(false); await reload() }}
          notify={notify}
        />
      )}

      <Modal open={deleteTarget !== null} title="Eliminar grupo" onClose={() => setDeleteTarget(null)}>
        <div className="academic-confirm">
          <p>¿Eliminar el grupo <strong>{deleteTarget?.nombre}</strong>?</p>
          <div className="academic-actions-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" disabled={busy} style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ── Editor de grupo: multi-docente + horario semanal (crear y editar) ─────────
function GroupEditor({ token, group, subjects, docentes, estudiantes, locations, onClose, onSaved, notify }: {
  token: string; group: AcademicGroupResponse | null; subjects: SubjectResponse[]
  docentes: AcademicPerson[]; estudiantes: AcademicPerson[]; locations: LocationResponse[]
  onClose: () => void; onSaved: () => Promise<void>; notify: (k: 'success' | 'error', m: string) => void
}) {
  const isEdit = group !== null
  const [busy, setBusy] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [sendingWa, setSendingWa] = useState(false)

  const [nombre, setNombre] = useState(group?.nombre ?? '')
  const [ubicacionId, setUbicacionId] = useState(group?.ubicacionId ?? '')
  const [selectedStudents, setSelectedStudents] = useState<string[]>(group?.estudianteUserIds ?? [])
  const [fechaInicio, setFechaInicio] = useState(group?.fechaInicio ?? '')
  const [fechaFin, setFechaFin] = useState(group?.fechaFin ?? '')

  // Docentes asignados al grupo (con su materia)
  const initTeachers: AcademicGroupTeacher[] = group?.docentes && group.docentes.length > 0
    ? group.docentes
    : (group ? [{ docenteUserId: group.docenteUserId, docenteNombre: group.docenteNombre, subjectId: group.subjectId, subjectNombre: group.subjectNombre }] : [])
  const [teachers, setTeachers] = useState<AcademicGroupTeacher[]>(initTeachers)
  const [horario, setHorario] = useState<HorarioFranja[]>(group?.horario ?? [])

  // Fila de "agregar docente"
  const [addCategoria, setAddCategoria] = useState('')
  const [addSubjectId, setAddSubjectId] = useState('')
  const [addDocenteId, setAddDocenteId] = useState('')

  const categorias = useMemo(() => {
    const set = new Set<string>()
    for (const s of subjects) if (s.categoria?.trim()) set.add(s.categoria.trim())
    return [...set].sort()
  }, [subjects])

  const subjectsFiltered = useMemo(
    () => (addCategoria ? subjects.filter((s) => (s.categoria?.trim() || '') === addCategoria) : subjects),
    [subjects, addCategoria],
  )
  const docentesFiltered = useMemo(() => {
    if (!addCategoria) return docentes
    const match = docentes.filter((d) => (d.docente?.especialidad?.trim() || '').toLowerCase() === addCategoria.toLowerCase())
    return match.length > 0 ? match : docentes
  }, [docentes, addCategoria])

  const addTeacher = () => {
    if (!addSubjectId || !addDocenteId) { notify('error', 'Elige asignatura y docente.'); return }
    const subject = subjects.find((s) => s.id === addSubjectId)
    const docente = docentes.find((d) => d.id === addDocenteId)
    if (!subject || !docente) return
    if (teachers.some((t) => t.docenteUserId === docente.id && t.subjectId === subject.id)) {
      notify('error', 'Ese docente ya está asignado a esa materia.')
      return
    }
    setTeachers((prev) => [...prev, {
      docenteUserId: docente.id, docenteNombre: docente.nombreCompleto,
      subjectId: subject.id, subjectNombre: subject.nombre, categoria: subject.categoria,
    }])
    setAddSubjectId(''); setAddDocenteId('')
  }

  const removeTeacher = (docenteUserId: string, subjectId: string) => {
    setTeachers((prev) => prev.filter((t) => !(t.docenteUserId === docenteUserId && t.subjectId === subjectId)))
    // limpia franjas de horario que usaban ese docente/materia
    setHorario((prev) => prev.filter((f) => !(f.docenteUserId === docenteUserId && f.subjectId === subjectId)))
  }

  const toggleStudent = (id: string) => setSelectedStudents((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Franjas de horario
  const addFranja = (dia: DiaSemana) => {
    if (teachers.length === 0) { notify('error', 'Primero asigna docentes al grupo.'); return }
    const t = teachers[0]
    const sedeDef = locations.find((l) => l.id === ubicacionId)
    setHorario((prev) => [...prev, {
      dia, horaInicio: '07:00', horaFin: '09:00',
      docenteUserId: t.docenteUserId, docenteNombre: t.docenteNombre,
      subjectId: t.subjectId, subjectNombre: t.subjectNombre, categoria: t.categoria,
      ubicacionId: ubicacionId || undefined, ubicacionNombre: sedeDef?.nombre,
    }])
  }
  const updateFranja = (idx: number, patch: Partial<HorarioFranja>) => {
    setHorario((prev) => prev.map((f, i) => {
      if (i !== idx) return f
      const next = { ...f, ...patch }
      // Si cambió el docente+materia (key combinada), sincroniza nombres
      if (patch.docenteUserId !== undefined) {
        const t = teachers.find((x) => `${x.docenteUserId}::${x.subjectId}` === patch.docenteUserId)
        if (t) {
          next.docenteUserId = t.docenteUserId; next.docenteNombre = t.docenteNombre
          next.subjectId = t.subjectId; next.subjectNombre = t.subjectNombre; next.categoria = t.categoria
        }
      }
      return next
    }))
  }
  const setFranjaSede = (idx: number, sedeId: string) => {
    const sede = locations.find((l) => l.id === sedeId)
    setHorario((prev) => prev.map((f, i) => i === idx ? { ...f, ubicacionId: sedeId || undefined, ubicacionNombre: sede?.nombre } : f))
  }
  const removeFranja = (idx: number) => setHorario((prev) => prev.filter((_, i) => i !== idx))

  const handleInvite = async () => {
    if (!isEdit || !group) return
    setInviting(true)
    try {
      const res = await apiRequest<{ token: string; invitePath: string }>(`/academic/groups/${group.id}/invite`, { method: 'POST', token })
      const link = `${window.location.origin}${res.invitePath}`
      setInviteLink(link)
      try { await navigator.clipboard.writeText(link) ; notify('success', 'Link de invitación copiado al portapapeles.') }
      catch { notify('success', 'Link de invitación generado.') }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setInviting(false)
    }
  }

  // Envía el link de invitación por el WhatsApp vinculado de la empresa.
  const handleSendInviteWhatsApp = async () => {
    if (!inviteLink || !group) return
    const phone = invitePhone.trim()
    if (!phone) { notify('error', 'Escribe un número de teléfono.'); return }
    setSendingWa(true)
    try {
      await apiRequest('/whatsapp-turnos/send-invitation', {
        method: 'POST', token,
        body: { companyId: group.companyId, to: phone, url: inviteLink },
      })
      notify('success', 'Invitación enviada por WhatsApp.')
      setInvitePhone('')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'No se pudo enviar por WhatsApp.')
    } finally {
      setSendingWa(false)
    }
  }

  const handleSave = async () => {
    if (!nombre.trim()) { notify('error', 'El nombre del grupo es requerido.'); return }
    if (teachers.length === 0) { notify('error', 'Asigna al menos un docente con su materia.'); return }
    setBusy(true)
    try {
      const body = {
        nombre: nombre.trim(),
        ubicacionId: ubicacionId || undefined,
        docentes: teachers.map((t) => ({ docenteUserId: t.docenteUserId, subjectId: t.subjectId })),
        horario: horario.map((f) => ({ dia: f.dia, horaInicio: f.horaInicio, horaFin: f.horaFin, docenteUserId: f.docenteUserId, subjectId: f.subjectId, ubicacionId: f.ubicacionId })),
        estudianteUserIds: selectedStudents,
        fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined,
      }
      if (isEdit && group) {
        await apiRequest(`/academic/groups/${group.id}`, { method: 'PATCH', token, body })
        notify('success', 'Grupo actualizado.')
      } else {
        await apiRequest('/academic/groups', { method: 'POST', token, body })
        notify('success', 'Grupo creado.')
      }
      await onSaved()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  // Agrupa el horario por día para mostrarlo organizado
  const horarioByDay = useMemo(() => {
    return DIAS.map((d) => ({
      dia: d,
      franjas: horario.map((f, idx) => ({ f, idx })).filter((x) => x.f.dia === d.value),
    }))
  }, [horario])

  const teacherKey = (t: { docenteUserId: string; subjectId: string }) => `${t.docenteUserId}::${t.subjectId}`

  return (
    <Modal open title={isEdit ? `Editar grupo — ${group?.nombre}` : 'Nuevo grupo / salón'} onClose={onClose}>
      <div className="academic-form">
        <label className="academic-field">
          <span>Nombre del grupo</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Salón 101 - Mañana" />
        </label>

        <label className="academic-field">
          <span>Sede</span>
          <select value={ubicacionId} onChange={(e) => setUbicacionId(e.target.value)}>
            <option value="">Sin sede</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </label>

        {/* ── Docentes asignados ─────────────────────────────── */}
        <div className="academic-field academic-field--full">
          <span>Docentes del grupo (cada uno con su materia)</span>
          {teachers.length > 0 && (
            <ul className="academic-teacher-list">
              {teachers.map((t) => (
                <li key={teacherKey(t)}>
                  <span>🧑‍🏫 {t.docenteNombre} — <b>{t.subjectNombre}</b>{t.categoria ? ` · ${t.categoria}` : ''}</span>
                  <button type="button" className="academic-icon-btn" style={{ color: '#dc2626' }} onClick={() => removeTeacher(t.docenteUserId, t.subjectId)}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="academic-add-teacher">
            <select value={addCategoria} onChange={(e) => { setAddCategoria(e.target.value); setAddSubjectId(''); setAddDocenteId('') }}>
              <option value="">Categoría</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={addSubjectId} onChange={(e) => setAddSubjectId(e.target.value)}>
              <option value="">Materia</option>
              {subjectsFiltered.map((s) => <option key={s.id} value={s.id}>{s.codigo} · {s.nombre}</option>)}
            </select>
            <select value={addDocenteId} onChange={(e) => setAddDocenteId(e.target.value)}>
              <option value="">Docente</option>
              {docentesFiltered.map((d) => <option key={d.id} value={d.id}>{d.nombreCompleto}{d.docente?.especialidad ? ` — ${d.docente.especialidad}` : ''}</option>)}
            </select>
            <Button size="sm" variant="ghost" onClick={addTeacher}>+ Agregar</Button>
          </div>
        </div>

        {/* ── Horario semanal por día ────────────────────────── */}
        <div className="academic-field academic-field--full">
          <span>Horario semanal (asigna franjas por día con el docente/materia)</span>
          <div className="academic-week">
            {horarioByDay.map(({ dia, franjas }) => (
              <div key={dia.value} className="academic-week-day">
                <div className="academic-week-day__head">
                  <strong>{dia.label}</strong>
                  <button type="button" className="academic-icon-btn" title="Agregar clase" onClick={() => addFranja(dia.value)}>＋</button>
                </div>
                {franjas.length === 0 && <small className="academic-empty">—</small>}
                {franjas.map(({ f, idx }) => (
                  <div key={idx} className="academic-franja">
                    <select value={teacherKey(f)} onChange={(e) => updateFranja(idx, { docenteUserId: e.target.value })}>
                      {teachers.map((t) => (
                        <option key={teacherKey(t)} value={teacherKey(t)}>{t.subjectNombre} · {t.docenteNombre}</option>
                      ))}
                    </select>
                    <div className="academic-franja-row">
                      <input type="time" value={f.horaInicio} onChange={(e) => updateFranja(idx, { horaInicio: e.target.value })} />
                      <input type="time" value={f.horaFin} onChange={(e) => updateFranja(idx, { horaFin: e.target.value })} />
                    </div>
                    <select value={f.ubicacionId ?? ''} onChange={(e) => setFranjaSede(idx, e.target.value)}>
                      <option value="">📍 Sede del grupo</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>📍 {l.nombre}</option>)}
                    </select>
                    <button type="button" className="academic-icon-btn" style={{ color: '#dc2626', alignSelf: 'flex-end' }} onClick={() => removeFranja(idx)}>✕ Quitar</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <label className="academic-field"><span>Fecha inicio</span><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></label>
        <label className="academic-field"><span>Fecha fin</span><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></label>

        <div className="academic-field academic-field--full">
          <span>Estudiantes ({selectedStudents.length} seleccionados)</span>
          <div className="academic-students">
            {estudiantes.length === 0 && <small className="academic-empty">No hay alumnos registrados.</small>}
            {estudiantes.map((s) => (
              <label key={s.id} className="academic-student">
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                <span>{s.nombreCompleto}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Invitar alumnos ─────────────────────────────────── */}
        <div className="academic-field academic-field--full">
          <span>Invitar alumnos</span>
          {isEdit ? (
            <div className="academic-invite">
              <Button size="sm" variant="ghost" disabled={inviting} onClick={handleInvite}>
                {inviting ? 'Generando...' : '🔗 Generar link de invitación'}
              </Button>
              {inviteLink && (
                <div className="academic-invite-link">
                  <input readOnly value={inviteLink} onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(inviteLink); notify('success', 'Copiado.') }}>Copiar</Button>
                </div>
              )}
              {inviteLink && (
                <div className="academic-invite-link" style={{ marginTop: 8 }}>
                  <input
                    type="tel"
                    inputMode="tel"
                    aria-label="Teléfono para enviar la invitación por WhatsApp"
                    placeholder="WhatsApp (ej. 3001234567)"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                  />
                  <Button size="sm" variant="primary" disabled={sendingWa || !invitePhone.trim()} onClick={() => void handleSendInviteWhatsApp()}>
                    {sendingWa ? 'Enviando...' : 'Enviar por WhatsApp'}
                  </Button>
                </div>
              )}
              <small className="academic-empty">Los alumnos que abran el link se registran y quedan asignados a este grupo automáticamente.</small>
            </div>
          ) : (
            <small className="academic-empty">Guarda el grupo primero para generar el link de invitación.</small>
          )}
        </div>

        <div className="academic-actions-end academic-field--full">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={busy} onClick={handleSave}>{busy ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear grupo')}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Pestaña: Horarios (genera sesiones de clase entre fechas) ─────────────────
function SchedulesTab({ token, isAdmin, groups, notify }: {
  token: string; isAdmin: boolean; groups: AcademicGroupResponse[]
  notify: (k: 'success' | 'error', m: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sessions, setSessions] = useState<ClassSessionResponse[]>([])
  const [filterGroup, setFilterGroup] = useState('')

  // Form
  const [groupId, setGroupId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const loadSessions = useCallback(async () => {
    try {
      const q = filterGroup ? `?academicGroupId=${filterGroup}` : ''
      setSessions(await apiRequest<ClassSessionResponse[]>(`/academic/sessions${q}`, { token }))
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error cargando horarios')
    }
  }, [token, filterGroup, notify])

  useEffect(() => { void loadSessions() }, [loadSessions])

  const selectedGroup = groups.find((g) => g.id === groupId)

  const handleGenerate = async () => {
    if (!groupId || !fechaInicio || !fechaFin) {
      notify('error', 'Selecciona grupo, fecha de inicio y fecha de fin.')
      return
    }
    if (fechaFin < fechaInicio) {
      notify('error', 'La fecha de fin debe ser posterior a la de inicio.')
      return
    }
    setBusy(true)
    try {
      const res = await apiRequest<{ creadas: number }>('/academic/sessions/bulk-generate', {
        method: 'POST', token,
        body: { academicGroupId: groupId, fechaInicio, fechaFin },
      })
      notify('success', `${res.creadas} clase(s) programada(s).`)
      setShowModal(false)
      setGroupId(''); setFechaInicio(''); setFechaFin('')
      await loadSessions()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>🗓️ Horarios de clase <span className="academic-count">{sessions.length}</span></h3>
        {isAdmin && <Button size="sm" variant="primary" onClick={() => setShowModal(true)} disabled={groups.length === 0}>+ Generar horario</Button>}
      </div>

      <label className="academic-field academic-field--full">
        <span>Filtrar por grupo</span>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">Todos los grupos</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.nombre} · {g.subjectNombre}</option>)}
        </select>
      </label>

      {/* Tabla de horario del grupo seleccionado */}
      {filterGroup && (() => {
        const g = groups.find((x) => x.id === filterGroup)
        if (!g || !g.horario || g.horario.length === 0) {
          return <p className="academic-empty">Este grupo no tiene horario semanal definido. Edítalo para agregar franjas.</p>
        }
        return <HorarioTable horario={g.horario} />
      })()}

      {groups.length === 0 && <p className="academic-empty">Primero crea un grupo con su docente y días de clase.</p>}
      {groups.length > 0 && sessions.length === 0 && <p className="academic-empty">No hay clases programadas. Genera un horario indicando fechas de inicio y fin.</p>}

      {sessions.length > 0 && (
        <ul className="academic-list">
          {sessions.slice(0, 100).map((s) => (
            <li key={s.id} className="academic-list__item">
              <div className="academic-list__info">
                <strong>{s.fecha} · {s.horaInicio}{s.horaFin ? `–${s.horaFin}` : ''}</strong>
                <small>{s.subjectNombre} · 🧑‍🏫 {s.docenteNombre} · {s.academicGroupNombre}</small>
              </div>
              <span className={`academic-badge academic-badge--${s.estado}`}>{s.estado}</span>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showModal} title="Generar horario de clases" onClose={() => setShowModal(false)}>
        <div className="academic-form">
          <label className="academic-field academic-field--full">
            <span>Grupo (incluye docente y días)</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Selecciona...</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.nombre} · {g.subjectNombre}</option>)}
            </select>
          </label>
          {selectedGroup && (
            <div className="academic-hint academic-field--full">
              {selectedGroup.horario && selectedGroup.horario.length > 0 ? (
                <>
                  <strong>Horario semanal:</strong>
                  <ul style={{ margin: '.35rem 0 0', paddingLeft: '1rem' }}>
                    {[...selectedGroup.horario]
                      .sort((a, b) => a.dia.localeCompare(b.dia) || a.horaInicio.localeCompare(b.horaInicio))
                      .map((f, i) => (
                        <li key={i}>{f.dia} {f.horaInicio}–{f.horaFin} · {f.subjectNombre} ({f.docenteNombre})</li>
                      ))}
                  </ul>
                </>
              ) : (
                <span>🧑‍🏫 {selectedGroup.docenteNombre} · Días: {selectedGroup.diasSemana.map((d) => d.slice(0, 3)).join(', ')} · {selectedGroup.horaInicio}–{selectedGroup.horaFin}</span>
              )}
            </div>
          )}
          <label className="academic-field"><span>Fecha inicio</span><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></label>
          <label className="academic-field"><span>Fecha fin</span><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></label>
          <div className="academic-actions-end academic-field--full">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" disabled={busy} onClick={handleGenerate}>{busy ? 'Generando...' : 'Generar clases'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ── Tabla de horario semanal (materias × días × horas) ────────────────────────
function HorarioTable({ horario }: { horario: HorarioFranja[] }) {
  // Filas = franjas horarias únicas (ordenadas); columnas = días con clase
  const diasConClase = DIAS.filter((d) => horario.some((f) => f.dia === d.value))
  const horas = [...new Set(horario.map((f) => `${f.horaInicio}-${f.horaFin}`))]
    .sort((a, b) => a.localeCompare(b))

  const celda = (dia: DiaSemana, horaKey: string) => {
    const [hi, hf] = horaKey.split('-')
    return horario.find((f) => f.dia === dia && f.horaInicio === hi && f.horaFin === hf)
  }

  return (
    <div className="academic-horario-table-wrap">
      <table className="academic-horario-table">
        <thead>
          <tr>
            <th>Hora</th>
            {diasConClase.map((d) => <th key={d.value}>{d.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {horas.map((hk) => (
            <tr key={hk}>
              <td className="academic-horario-hora">{hk.replace('-', ' – ')}</td>
              {diasConClase.map((d) => {
                const f = celda(d.value, hk)
                return (
                  <td key={d.value} className={f ? 'has-class' : ''}>
                    {f ? (
                      <div className="academic-horario-cell">
                        <strong>{f.subjectNombre}</strong>
                        <small>🧑‍🏫 {f.docenteNombre}</small>
                        <small>🕒 {f.horaInicio}–{f.horaFin}</small>
                        {f.ubicacionNombre && <small>📍 {f.ubicacionNombre}</small>}
                        {f.categoria && <span className="academic-horario-cat">{f.categoria}</span>}
                      </div>
                    ) : <span className="academic-horario-empty">—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Pestaña: Mis clases (docente) — calendario + confirmar asistencia ─────────
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function MyClassesTab({ token, notify, onChange }: {
  token: string; notify: (k: 'success' | 'error', m: string) => void; onChange: () => Promise<void>
}) {
  const now = new Date()
  // Fecha local (no UTC) para que coincida con las celdas del calendario
  const hoyISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(hoyISO)
  const [monthSessions, setMonthSessions] = useState<ClassSessionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [marks, setMarks] = useState<Record<string, 'presente' | 'ausente' | 'tardanza'>>({})

  // Rango del mes visible (from/to en ISO)
  const monthRange = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const last = new Date(viewYear, viewMonth + 1, 0)
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { from: iso(first), to: iso(last) }
  }, [viewYear, viewMonth])

  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ from: monthRange.from, to: monthRange.to })
      const list = await apiRequest<ClassSessionResponse[]>(`/academic/sessions?${q.toString()}`, { token })
      setMonthSessions(list)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error cargando clases')
    } finally {
      setLoading(false)
    }
  }, [token, monthRange, notify])

  useEffect(() => { void loadMonth() }, [loadMonth])

  // Sesiones agrupadas por fecha (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSessionResponse[]>()
    for (const s of monthSessions) {
      if (!map.has(s.fecha)) map.set(s.fecha, [])
      map.get(s.fecha)!.push(s)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    return map
  }, [monthSessions])

  // Celdas del calendario (incluye días en blanco al inicio)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=dom
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: Array<{ date: string; day: number } | null> = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d })
    }
    return cells
  }, [viewYear, viewMonth])

  const prevMonth = () => { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
  const nextMonth = () => { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }

  const sessions = sessionsByDate.get(selectedDate) ?? []
  const loadSessions = loadMonth  // reutiliza para recargar tras confirmar

  const openDetail = async (s: ClassSessionResponse) => {
    try {
      const d = await apiRequest<SessionDetailResponse>(`/academic/sessions/${s.id}`, { token })
      setDetail(d)
      // Inicializa marcas con lo que ya tienen (ingreso biométrico = presente por defecto)
      const initial: Record<string, 'presente' | 'ausente' | 'tardanza'> = {}
      for (const e of d.estudiantes) {
        const est = e.asistencia?.estado
        initial[e.userId] = est === 'tardanza' ? 'tardanza' : (e.asistencia?.horaIngreso || est === 'presente' ? 'presente' : 'ausente')
      }
      setMarks(initial)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    }
  }

  const toggleVirtual = async (s: ClassSessionResponse) => {
    try {
      const res = await apiRequest<{ esVirtual: boolean }>(`/academic/sessions/${s.id}/toggle-virtual`, { method: 'POST', token, body: { esVirtual: !s.esVirtual } })
      notify('success', res.esVirtual ? 'Clase marcada como VIRTUAL (sin validación de ubicación hoy).' : 'Clase vuelve a ser presencial (valida ubicación).')
      await loadMonth()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    }
  }

  const generateQr = async (s: ClassSessionResponse) => {
    try {
      await apiRequest(`/academic/sessions/${s.id}/generate-qr`, { method: 'POST', token, body: { expiracionMin: 30 } })
      notify('success', 'QR de la clase generado (válido 30 min).')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    }
  }

  // Cancelar solo hasta 30 min antes del inicio (hora en zona America/Bogota, -05:00).
  const puedeCancelar = (s: ClassSessionResponse): boolean => {
    if (!s.fecha || !s.horaInicio) return false
    const inicioMs = new Date(`${s.fecha}T${s.horaInicio.padStart(5, '0')}:00-05:00`).getTime()
    if (Number.isNaN(inicioMs)) return false
    return Date.now() <= inicioMs - 30 * 60_000
  }

  const changeStatus = async (s: ClassSessionResponse, estado: 'programada' | 'finalizada' | 'cancelada') => {
    const labels = { programada: 'reabrir', finalizada: 'finalizar', cancelada: 'cancelar' } as const
    if (estado !== 'programada' && !window.confirm(`¿Seguro que deseas ${labels[estado]} esta clase?${estado === 'finalizada' ? ' Los alumnos sin ingreso quedarán como ausentes.' : ''}`)) return
    try {
      const res = await apiRequest<{ estado: string; ausentesMarcados?: number }>(`/academic/sessions/${s.id}/estado`, { method: 'POST', token, body: { estado } })
      const extra = res.ausentesMarcados ? ` (${res.ausentesMarcados} ausente(s) marcados)` : ''
      notify('success', `Clase ${res.estado}${extra}.`)
      await loadMonth()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    }
  }

  const confirmAsistencia = async () => {
    if (!detail) return
    setBusy(true)
    try {
      const confirmaciones = detail.estudiantes.map((e) => ({
        estudianteUserId: e.userId,
        estado: marks[e.userId] ?? 'ausente',
      }))
      await apiRequest('/academic-attendance/docente/confirmar-estudiantes', {
        method: 'POST', token,
        body: { sessionId: detail.id, confirmaciones },
      })
      notify('success', 'Asistencia confirmada.')
      setDetail(null)
      await loadSessions()
      await onChange()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const fmtFechaLarga = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return `${d} de ${MESES[m - 1]} de ${y}`
  }

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>🧑‍🏫 Mis clases</h3>
        <div className="academic-cal-nav">
          <button type="button" onClick={prevMonth} aria-label="Mes anterior">‹</button>
          <strong>{MESES[viewMonth]} {viewYear}</strong>
          <button type="button" onClick={nextMonth} aria-label="Mes siguiente">›</button>
        </div>
      </div>

      {loading && <p className="academic-empty">Cargando calendario...</p>}

      {/* Calendario mensual */}
      <div className="academic-calendar">
        <div className="academic-cal-grid academic-cal-head">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => <div key={d} className="academic-cal-dow">{d}</div>)}
        </div>
        <div className="academic-cal-grid">
          {calendarCells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} className="academic-cal-cell academic-cal-cell--empty" />
            const daySessions = sessionsByDate.get(cell.date) ?? []
            const isToday = cell.date === hoyISO
            const isSelected = cell.date === selectedDate
            return (
              <button
                key={cell.date}
                type="button"
                className={`academic-cal-cell${daySessions.length ? ' has-class' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span className="academic-cal-day">{cell.day}</span>
                {daySessions.length > 0 && (
                  <span className="academic-cal-tags">
                    {daySessions.slice(0, 2).map((s) => (
                      <span key={s.id} className="academic-cal-tag" title={`${s.horaInicio} · ${s.subjectNombre} · ${s.academicGroupNombre}`}>
                        {s.horaInicio} {s.subjectNombre}
                      </span>
                    ))}
                    {daySessions.length > 2 && <span className="academic-cal-more">+{daySessions.length - 2}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div className="academic-day-detail">
        <h4>Clases del {fmtFechaLarga(selectedDate)} <span className="academic-count">{sessions.length}</span></h4>
        {sessions.length === 0 ? (
          <p className="academic-empty">No hay clases este día.</p>
        ) : (
          <ul className="academic-list">
            {sessions.map((s) => (
              <li key={s.id} className="academic-list__item">
                <div className="academic-list__info">
                  <strong>{s.horaInicio}{s.horaFin ? `–${s.horaFin}` : ''} · {s.subjectNombre}</strong>
                  <small>
                    🏫 {s.academicGroupNombre}
                    {s.esVirtual && <span className="academic-badge academic-badge--virtual"> 💻 Virtual</span>}
                    {s.asistenciaResumen ? ` · ✅ ${s.asistenciaResumen.presentes}/${s.asistenciaResumen.totalEstudiantes}` : ''}
                    {' · '}<span className={`academic-badge academic-badge--${s.estado}`}>{s.estado}</span>
                  </small>
                </div>
                <div className="academic-list__actions">
                  {s.estado === 'programada' || s.estado === 'en_curso' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => toggleVirtual(s)}>{s.esVirtual ? '🏫 Presencial' : '💻 Virtual'}</Button>
                      <Button size="sm" variant="ghost" onClick={() => generateQr(s)}>QR</Button>
                      <Button size="sm" variant="primary" onClick={() => openDetail(s)}>Asistencia</Button>
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(s, 'finalizada')}>✅ Finalizar</Button>
                      {puedeCancelar(s) && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(s, 'cancelada')}>🚫 Cancelar</Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => openDetail(s)}>Ver asistencia</Button>
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(s, 'programada')}>↩️ Reabrir</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de asistencia */}
      <Modal open={detail !== null} title={detail ? `Asistencia — ${detail.subjectNombre} (${detail.fecha})` : 'Asistencia'} onClose={() => setDetail(null)}>
        {detail && (
          <div className="academic-attendance">
            <p className="academic-hint">
              Alumnos del grupo: {detail.estudiantes.length}. Los que marcaron ingreso biométrico aparecen con ✅ y hora.
            </p>
            <div className="academic-att-list">
              {detail.estudiantes.length === 0 && <p className="academic-empty">El grupo no tiene alumnos.</p>}
              {detail.estudiantes.map((e) => {
                const marcoIngreso = Boolean(e.asistencia?.horaIngreso)
                return (
                  <div key={e.userId} className="academic-att-row">
                    <div className="academic-att-info">
                      <strong>{e.nombreCompleto}</strong>
                      <small>
                        {marcoIngreso
                          ? `✅ Ingreso ${new Date(e.asistencia!.horaIngreso!).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} (${e.asistencia?.metodo ?? 'biométrico'})`
                          : '— sin ingreso registrado'}
                      </small>
                    </div>
                    <div className="academic-att-marks">
                      {(['presente', 'tardanza', 'ausente'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`academic-mark academic-mark--${m} ${marks[e.userId] === m ? 'is-on' : ''}`}
                          onClick={() => setMarks((prev) => ({ ...prev, [e.userId]: m }))}
                        >
                          {m === 'presente' ? 'P' : m === 'tardanza' ? 'T' : 'A'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="academic-actions-end">
              <Button variant="ghost" onClick={() => setDetail(null)}>Cancelar</Button>
              <Button variant="primary" disabled={busy || detail.estudiantes.length === 0} onClick={confirmAsistencia}>
                {busy ? 'Guardando...' : 'Confirmar asistencia'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

// ── Pestaña: Sedes (ubicaciones con geolocalización) ──────────────────────────
function SedesTab({ token, isAdmin, locations, reload, notify }: {
  token: string; isAdmin: boolean; locations: LocationResponse[]
  reload: () => Promise<void>; notify: (k: 'success' | 'error', m: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LocationResponse | null>(null)
  const [busy, setBusy] = useState(false)

  const fields: CustomFormField[] = [
    { name: 'nombre', label: 'Nombre de la sede', required: true, fullWidth: true, placeholder: 'Ej. Sede Norte' },
    { name: 'direccion', label: 'Dirección', required: true, fullWidth: true, placeholder: 'Dirección de la sede' },
    { name: 'googleMapsUrl', label: 'URL de Google Maps', required: true, fullWidth: true, placeholder: 'Pega el enlace de Google Maps con las coordenadas', helperText: 'De aquí se extraen la latitud y longitud automáticamente.' },
    { name: 'radioTolerancia', label: 'Radio de tolerancia (m)', type: 'number', placeholder: 'Ej. 100' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true, rows: 2 },
  ]

  const handleCreate = async (values: CustomFormValues) => {
    setBusy(true)
    try {
      await apiRequest('/locations', {
        method: 'POST', token,
        body: {
          nombre: values.nombre, direccion: values.direccion,
          googleMapsUrl: values.googleMapsUrl,
          radioTolerancia: values.radioTolerancia || undefined,
          descripcion: values.descripcion || undefined,
        },
      })
      notify('success', 'Sede registrada.')
      setShowModal(false)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await apiRequest(`/locations/${deleteTarget.id}`, { method: 'DELETE', token })
      notify('success', 'Sede eliminada.')
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>📍 Sedes <span className="academic-count">{locations.length}</span></h3>
        {isAdmin && <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>+ Nueva sede</Button>}
      </div>
      {locations.length === 0 ? (
        <p className="academic-empty">Aún no hay sedes. Registra una para asignarla a los grupos y validar el ingreso de los alumnos.</p>
      ) : (
        <ul className="academic-list">
          {locations.map((l) => (
            <li key={l.id} className="academic-list__item">
              <div className="academic-list__info">
                <strong>📍 {l.nombre}</strong>
                <small>{l.direccion}{l.radioTolerancia ? ` · radio ${l.radioTolerancia} m` : ''}{l.latitud && l.longitud ? ` · ${l.latitud}, ${l.longitud}` : ' · sin coordenadas'}</small>
              </div>
              {isAdmin && <button className="academic-icon-btn" onClick={() => setDeleteTarget(l)} style={{ color: '#dc2626' }}>🗑</button>}
            </li>
          ))}
        </ul>
      )}

      <Modal open={showModal} title="Nueva sede" onClose={() => setShowModal(false)}>
        <CustomForm title="" fields={fields} showReset={false} submitLabel={busy ? 'Guardando...' : 'Registrar sede'} onSubmit={(v) => void handleCreate(v)} />
      </Modal>

      <Modal open={deleteTarget !== null} title="Eliminar sede" onClose={() => setDeleteTarget(null)}>
        <div className="academic-confirm">
          <p>¿Eliminar la sede <strong>{deleteTarget?.nombre}</strong>?</p>
          <div className="academic-actions-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" disabled={busy} style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ── Pestaña: Mis salones (docente) — detalles + invitar alumnos ───────────────
function TeacherGroupsTab({ token, groups, notify }: {
  token: string; groups: AcademicGroupResponse[]; notify: (k: 'success' | 'error', m: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({})
  const [inviting, setInviting] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, AcademicGroupResponse>>({})

  const toggle = async (g: AcademicGroupResponse) => {
    if (openId === g.id) { setOpenId(null); return }
    setOpenId(g.id)
    // Carga detalle (incluye estudiantes enriquecidos)
    if (!detail[g.id]) {
      try {
        const d = await apiRequest<AcademicGroupResponse & { estudiantes?: Array<{ nombreCompleto?: string }> }>(`/academic/groups/${g.id}`, { token })
        setDetail((prev) => ({ ...prev, [g.id]: d }))
      } catch { /* usa el resumen */ }
    }
  }

  const invite = async (g: AcademicGroupResponse) => {
    setInviting(g.id)
    try {
      const res = await apiRequest<{ invitePath: string }>(`/academic/groups/${g.id}/invite`, { method: 'POST', token })
      const link = `${window.location.origin}${res.invitePath}`
      setInviteLinks((prev) => ({ ...prev, [g.id]: link }))
      try { await navigator.clipboard.writeText(link); notify('success', 'Link de invitación copiado.') }
      catch { notify('success', 'Link generado.') }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Error')
    } finally {
      setInviting(null)
    }
  }

  return (
    <section className="academic-card">
      <div className="academic-card__head">
        <h3>🏫 Mis salones <span className="academic-count">{groups.length}</span></h3>
      </div>
      {groups.length === 0 ? (
        <p className="academic-empty">No tienes salones asignados todavía.</p>
      ) : (
        <ul className="academic-list">
          {groups.map((g) => {
            const d = detail[g.id] ?? g
            const estudiantes = (d as AcademicGroupResponse & { estudiantes?: Array<{ nombreCompleto?: string }> }).estudiantes
            const isOpen = openId === g.id
            return (
              <li key={g.id} className="academic-group-item">
                <div className="academic-list__item" style={{ border: 'none', padding: 0 }}>
                  <div className="academic-list__info">
                    <strong>{g.nombre}</strong>
                    <small>
                      {g.ubicacionNombre ? `📍 ${g.ubicacionNombre} · ` : ''}
                      👥 {g.estudianteUserIds.length} alumno(s)
                      {g.horario?.length ? ` · 🗓️ ${g.horario.length} franja(s)` : ''}
                    </small>
                  </div>
                  <div className="academic-list__actions">
                    <Button size="sm" variant="ghost" onClick={() => toggle(g)}>{isOpen ? 'Ocultar' : 'Detalles'}</Button>
                    <Button size="sm" variant="primary" disabled={inviting === g.id} onClick={() => invite(g)}>
                      {inviting === g.id ? '...' : '🔗 Invitar'}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="academic-group-detail">
                    {g.horario && g.horario.length > 0 ? <HorarioTable horario={g.horario} /> : <p className="academic-empty">Sin horario definido.</p>}
                    <div className="academic-group-students">
                      <strong>Alumnos ({g.estudianteUserIds.length})</strong>
                      {estudiantes && estudiantes.length > 0 ? (
                        <ul>{estudiantes.map((e, i) => <li key={i}>{e.nombreCompleto}</li>)}</ul>
                      ) : <small className="academic-empty">Aún sin alumnos. Comparte el link de invitación.</small>}
                    </div>
                    {inviteLinks[g.id] && (
                      <div className="academic-invite-link">
                        <input readOnly value={inviteLinks[g.id]} onClick={(e) => (e.target as HTMLInputElement).select()} />
                        <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(inviteLinks[g.id]); notify('success', 'Copiado.') }}>Copiar</Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
