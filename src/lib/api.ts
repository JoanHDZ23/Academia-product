export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100/api'

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  token?: string
  body?: unknown
}

/** Dispara un evento global cuando el servidor devuelve 401. */
function dispatchSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ommex:session-expired'))
  }
}

export type SessionRole = 'admin' | 'supervisor' | 'docente' | 'estudiante'

export type LoginResponse = {
  token: string
  user: {
    id: string
    companyId: string
    nombreCompleto: string
    correo: string
    cargo: string
    role: SessionRole
    positionId?: string
    allowedModules: string[]
    permissionLevels?: Record<string, 'view' | 'edit' | 'full'>
  }
}

export type CompanyResponse = {
  id: string
  nombre: string
  nit: string
  correo: string
  telefono?: string
  direccion?: string
  ciudad?: string
  tipo: 'academia'
  enabledModules?: string[]
  settings?: Record<string, unknown>
  activa: boolean
  createdAt: string
}

export type LocationResponse = {
  id: string
  companyId: string
  nombre: string
  direccion?: string
  latitud?: string
  longitud?: string
  radioTolerancia?: string
  descripcion?: string
  createdAt: string
}

// ── Tipos académicos ─────────────────────────────────────────────────────────

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export type AcademicPerson = {
  id: string
  nombreCompleto: string
  tipoDocumento: string
  numeroDocumento: string
  correo: string
  telefono?: string
  role: 'docente' | 'estudiante' | 'admin'
  activa: boolean
  docente?: { codigo?: string; titulo?: string; especialidad?: string }
  estudiante?: { codigo?: string; cursoId?: string; fechaIngreso?: string }
  createdAt: string
}

export type SubjectResponse = {
  id: string
  companyId: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria?: string
  creditos?: number
  horasAcademicas?: number
  activa: boolean
  createdAt: string
}

export type AcademicGroupTeacher = {
  docenteUserId: string
  docenteNombre: string
  subjectId: string
  subjectNombre: string
  categoria?: string
}

export type HorarioFranja = {
  dia: DiaSemana
  horaInicio: string
  horaFin: string
  docenteUserId: string
  docenteNombre?: string
  subjectId: string
  subjectNombre?: string
  categoria?: string
  ubicacionId?: string
  ubicacionNombre?: string
}

export type AcademicGroupResponse = {
  id: string
  companyId: string
  nombre: string
  codigo: string
  subjectId: string
  subjectNombre: string
  docenteUserId: string
  docenteNombre: string
  docentes?: AcademicGroupTeacher[]
  horario?: HorarioFranja[]
  estudianteUserIds: string[]
  ubicacionId?: string
  ubicacionNombre?: string
  diasSemana: DiaSemana[]
  horaInicio: string
  horaFin: string
  fechaInicio?: string
  fechaFin?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export type ClassSessionResponse = {
  id: string
  companyId: string
  academicGroupId: string
  academicGroupNombre?: string
  subjectId: string
  subjectNombre?: string
  docenteUserId: string
  docenteNombre?: string
  fecha: string
  horaInicio: string
  horaFin?: string
  tema?: string
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada'
  esVirtual?: boolean
  asistenciaResumen?: {
    totalEstudiantes: number
    presentes: number
    ausentes: number
    tardanzas: number
    justificados: number
    porcentajeConfirmado: number
  }
  createdAt: string
}

export type StudentAttendanceLite = {
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado' | 'excusa_pendiente'
  horaIngreso?: string
  metodo?: string
  confirmadoPorDocente?: boolean
} | null

export type SessionDetailResponse = ClassSessionResponse & {
  estudiantes: Array<{
    userId: string
    nombreCompleto?: string
    codigo?: string
    asistencia: StudentAttendanceLite
  }>
}

export type InstructorSessionToday = {
  session: ClassSessionResponse
  instructorAttendance: unknown | null
  estudianteCount: number
}

export type AcademicNotification = {
  id: string
  tipo: 'clase_hoy' | 'clase_proxima' | 'por_confirmar' | 'alerta'
  nivel: 'info' | 'warning' | 'critical'
  titulo: string
  detalle: string
  fecha?: string
  hora?: string
  sessionId?: string
  createdAt: string
}

export type StudentTodaySession = {
  id: string
  subjectNombre?: string
  academicGroupNombre?: string
  docenteNombre?: string
  fecha: string
  horaInicio: string
  horaFin?: string
  estado: string
  esVirtual?: boolean
  sede: {
    id: string
    nombre: string
    direccion?: string
    latitud?: string
    longitud?: string
    radioTolerancia?: string
  } | null
  yaMarcoIngreso: boolean
  miEstado: string | null
}

export type UserInvitationDetailResponse = {
  token: string
  company: { id: string; nombre: string } | null
  academicGroup?: { id: string; nombre: string } | null
  cargo: string
  role: 'admin' | 'docente' | 'estudiante' | 'supervisor'
  status: 'pendiente' | 'completada' | 'cancelada'
  expiresAt?: string
}

export type DashboardSummaryResponse = {
  totalEstudiantes: number
  totalDocentes: number
  totalGrupos: number
  totalAsignaturas: number
  sesionesHoy: number
  alertasPendientes: number
  porcentajeAsistencia: number
}

type ApiErrorPayload = { message?: string }

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  let response: Response
  const doFetch = () => fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  try {
    response = await doFetch()
  } catch {
    await new Promise((r) => setTimeout(r, 3000))
    try {
      response = await doFetch()
    } catch {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
      throw new Error(isOffline
        ? 'Sin conexión a internet. Verifica tu red e intenta de nuevo.'
        : 'El servidor está iniciando, espera unos segundos e intenta de nuevo.')
    }
  }

  if (!response.ok) {
    let message = 'No fue posible completar la solicitud.'
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload
      if (errorPayload.message) message = errorPayload.message
    } catch {
      message = response.statusText || message
    }
    if (response.status === 401) dispatchSessionExpired()
    throw new Error(message)
  }

  if (response.status === 204) return null as T
  return (await response.json()) as T
}
