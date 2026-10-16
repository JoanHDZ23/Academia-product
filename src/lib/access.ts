export type AccessModule =
  | 'dashboard'
  | 'asistencia-clase'
  | 'codigo-qr'
  | 'asistencia-docente'
  | 'porcentaje-asistencia'
  | 'justificaciones'
  | 'alertas-inasistencia'
  | 'eventos-talleres'
  | 'gestionar-cursos'
  | 'gestionar-asignaturas'
  | 'gestionar-grupos-academicos'
  | 'confirmar-asistencia-clase'
  | 'registrar-ingreso'
  | 'validar-ingresos'
  | 'informes'
  | 'configuracion'

export const allAccessModules: AccessModule[] = [
  'dashboard',
  'asistencia-clase',
  'codigo-qr',
  'asistencia-docente',
  'porcentaje-asistencia',
  'justificaciones',
  'alertas-inasistencia',
  'eventos-talleres',
  'gestionar-cursos',
  'gestionar-asignaturas',
  'gestionar-grupos-academicos',
  'confirmar-asistencia-clase',
  'registrar-ingreso',
  'validar-ingresos',
  'informes',
  'configuracion',
]

export function getDefaultAllowedModules(role: string): AccessModule[] {
  if (role === 'admin') return allAccessModules
  if (role === 'supervisor') return ['dashboard', 'asistencia-clase', 'asistencia-docente', 'informes', 'validar-ingresos']
  if (role === 'docente') return ['dashboard', 'asistencia-clase', 'codigo-qr', 'porcentaje-asistencia', 'justificaciones', 'eventos-talleres', 'confirmar-asistencia-clase']
  if (role === 'estudiante') return ['dashboard', 'codigo-qr', 'porcentaje-asistencia', 'justificaciones', 'registrar-ingreso']
  return ['dashboard']
}

/** Catálogo de funciones que el panel root puede activar/quitar a una institución. */
export type AssignableFeature = {
  key: AccessModule
  label: string
  icon: string
  description?: string
  /** Si es true, el módulo no se puede quitar (siempre activo). */
  locked?: boolean
}

export const assignableFeatures: AssignableFeature[] = [
  { key: 'dashboard', label: 'Panel de inicio', icon: '🏠', description: 'Resumen e indicadores de la institución.', locked: true },
  { key: 'gestionar-asignaturas', label: 'Asignaturas', icon: '📚', description: 'Crear y administrar asignaturas y categorías.' },
  { key: 'gestionar-cursos', label: 'Cursos / Programas', icon: '🎓', description: 'Administrar cursos o programas académicos.' },
  { key: 'gestionar-grupos-academicos', label: 'Grupos / Salones', icon: '🏫', description: 'Crear grupos, asignar docentes y horarios.' },
  { key: 'asistencia-clase', label: 'Asistencia a clase', icon: '📝', description: 'Registro de asistencia de estudiantes.' },
  { key: 'codigo-qr', label: 'Código QR', icon: '🔳', description: 'Ingreso a clase por código QR.' },
  { key: 'asistencia-docente', label: 'Asistencia docente', icon: '👩‍🏫', description: 'Confirmación de asistencia del docente.' },
  { key: 'confirmar-asistencia-clase', label: 'Confirmar asistencia', icon: '✅', description: 'El docente confirma la lista de la clase.' },
  { key: 'registrar-ingreso', label: 'Registrar ingreso', icon: '🙋', description: 'El estudiante marca su propio ingreso.' },
  { key: 'validar-ingresos', label: 'Validar ingresos', icon: '🛂', description: 'Coordinación valida los ingresos.' },
  { key: 'porcentaje-asistencia', label: 'Porcentaje de asistencia', icon: '📊', description: 'Reportes de asistencia por estudiante y materia.' },
  { key: 'justificaciones', label: 'Justificaciones', icon: '🩺', description: 'Gestión de excusas e inasistencias justificadas.' },
  { key: 'alertas-inasistencia', label: 'Alertas de inasistencia', icon: '🚨', description: 'Alertas automáticas por faltas consecutivas.' },
  { key: 'eventos-talleres', label: 'Eventos y talleres', icon: '🎪', description: 'Actividades fuera de las clases regulares.' },
  { key: 'informes', label: 'Informes', icon: '📈', description: 'Reportes y estadísticas.' },
  { key: 'configuracion', label: 'Configuración', icon: '⚙️', description: 'Ajustes de la institución (tolerancia, QR, etc.).' },
]
