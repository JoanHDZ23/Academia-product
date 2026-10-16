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
