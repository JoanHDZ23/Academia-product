/**
 * Registro de microfrontends dinámicos configurables desde /root-panel.
 *
 * Un MFE puede integrarse de dos formas (sin recompilar el Host):
 *  - `webcomponent`: un bundle .js que registra un Custom Element (tag).
 *  - `iframe`: una app completa embebida por URL (p. ej. trazabilidad/academia).
 *
 * Cada MFE define un `configSchema` (campos de configuración) y guarda sus
 * valores POR COMPAÑÍA en `configByCompany`. Esa config se "migra" a la app
 * embebida (iframe: query params/postMessage; web component: props/atributos).
 *
 * Persistencia: por ahora en localStorage. El modelo está listo para moverse a
 * una API/BD sin cambiar los consumidores.
 */

export type MfeType = 'iframe' | 'webcomponent'

/** Tipo de campo de configuración de un MFE. */
export type MfeFieldType = 'boolean' | 'text' | 'number' | 'select'

export interface MfeConfigField {
  key: string
  label: string
  type: MfeFieldType
  /** Valor por defecto si la compañía no lo definió. */
  default?: string | number | boolean
  /** Opciones para `type: 'select'`. */
  options?: Array<{ label: string; value: string }>
  hint?: string
}

/** Valores de configuración de un MFE para una compañía: clave → valor. */
export type MfeConfigValues = Record<string, string | number | boolean>

export interface MfeEntry {
  id: string
  /** Nombre visible. */
  name: string
  /** Forma de integración. */
  type: MfeType
  /** URL del bundle .js (webcomponent) o de la app (iframe). */
  url: string
  /** Tag del Custom Element (solo webcomponent). */
  tag?: string
  /** Activo/inactivo sin borrarlo. */
  enabled: boolean
  /** Campos de configuración que ofrece este MFE. */
  configSchema: MfeConfigField[]
  /** Configuración guardada por compañía (companyId → valores). */
  configByCompany: Record<string, MfeConfigValues>
  /** Marca los presets integrados (trazabilidad/academia) para la UI. */
  builtin?: boolean
  createdAt: string
}

const KEY = 'ommex_mfe_registry'

// ── Presets de los productos actuales como MFE tipo iframe ──────────────────
const TRACER_URL = (import.meta.env.VITE_TRACER_URL as string) || 'https://ommex-tracer.vercel.app'
const ACADEMIA_URL = (import.meta.env.VITE_ACADEMIA_URL as string) || 'https://ommex-academia.vercel.app'

export const BUILTIN_MFES: MfeEntry[] = [
  {
    id: 'builtin-trazabilidad',
    name: 'Trazabilidad',
    type: 'iframe',
    url: TRACER_URL,
    enabled: true,
    builtin: true,
    createdAt: new Date(0).toISOString(),
    configSchema: [
      { key: 'watermark', label: 'Marca de agua en fotos', type: 'boolean', default: true, hint: 'Estampar fecha, hora y ubicación.' },
      { key: 'activityLog', label: 'Registro de actividades', type: 'boolean', default: false },
      { key: 'sendEmail', label: 'Enviar registros por correo', type: 'boolean', default: false },
      { key: 'emailTo', label: 'Correo(s) destinatario(s)', type: 'text', default: '', hint: 'Separados por coma.' },
      { key: 'whatsappAudio', label: 'Notas de voz', type: 'boolean', default: false },
      { key: 'whatsappDocument', label: 'Adjuntar documentos', type: 'boolean', default: false },
      { key: 'markerEditor', label: 'Editor de imágenes', type: 'boolean', default: false },
    ],
    configByCompany: {},
  },
  {
    id: 'builtin-academia',
    name: 'Academia',
    type: 'iframe',
    url: ACADEMIA_URL,
    enabled: true,
    builtin: true,
    createdAt: new Date(0).toISOString(),
    configSchema: [
      { key: 'attendanceMode', label: 'Modo de asistencia', type: 'select', default: 'qr',
        options: [{ label: 'Código QR', value: 'qr' }, { label: 'Reconocimiento facial', value: 'face' }, { label: 'Manual', value: 'manual' }] },
      { key: 'allowVirtual', label: 'Permitir clases virtuales', type: 'boolean', default: true },
      { key: 'gracePeriodMin', label: 'Tolerancia de ingreso (min)', type: 'number', default: 10 },
      { key: 'notifyGuardians', label: 'Notificar a acudientes', type: 'boolean', default: false },
    ],
    configByCompany: {},
  },
]

/** Normaliza entradas antiguas (sin `type`/schema) para retrocompatibilidad. */
function normalize(entry: Partial<MfeEntry>): MfeEntry {
  return {
    id: entry.id ?? `mfe-${Date.now()}`,
    name: entry.name ?? 'Módulo',
    type: entry.type ?? 'webcomponent',
    url: entry.url ?? '',
    tag: entry.tag,
    enabled: entry.enabled ?? true,
    configSchema: entry.configSchema ?? [],
    configByCompany: entry.configByCompany ?? {},
    builtin: entry.builtin,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  }
}

/** Lista completa: presets integrados fusionados con los del usuario. */
export function getMfes(): MfeEntry[] {
  let stored: MfeEntry[] = []
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as Partial<MfeEntry>[]) : []
    stored = Array.isArray(list) ? list.map(normalize) : []
  } catch { stored = [] }

  // Fusiona presets: si el usuario guardó overrides de un builtin, se respetan;
  // si no, se muestra el preset por defecto. Primero los builtins, luego el resto.
  const merged: MfeEntry[] = BUILTIN_MFES.map((b) => {
    const override = stored.find((s) => s.id === b.id)
    return override ? { ...b, ...override, builtin: true, configSchema: b.configSchema } : b
  })
  for (const s of stored) {
    if (!BUILTIN_MFES.some((b) => b.id === s.id)) merged.push(s)
  }
  return merged
}

export function saveMfes(list: MfeEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* cuota/privado */ }
}

export function validateMfe(input: { name: string; type: MfeType; url: string; tag?: string }): string | null {
  if (!input.name.trim()) return 'Escribe un nombre para el módulo.'
  if (input.type === 'webcomponent') {
    if (!/^https?:\/\/.+\.js(\?.*)?$/i.test(input.url.trim())) return 'La URL debe ser un archivo .js válido (http/https).'
    if (!input.tag || !/^[a-z][a-z0-9]*-[a-z0-9-]+$/.test(input.tag.trim())) {
      return 'El tag debe ser un Custom Element válido con guion (ej. mfe-ventas).'
    }
  } else {
    if (!/^https?:\/\/.+/i.test(input.url.trim())) return 'La URL del módulo (iframe) debe ser http/https.'
  }
  return null
}

export function addMfe(input: { name: string; type: MfeType; url: string; tag?: string }): MfeEntry {
  const entry: MfeEntry = {
    id: `mfe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    type: input.type,
    url: input.url.trim(),
    tag: input.type === 'webcomponent' ? input.tag?.trim() : undefined,
    enabled: true,
    configSchema: [],
    configByCompany: {},
    createdAt: new Date().toISOString(),
  }
  // Para persistir, guardamos solo los NO-builtin + overrides de builtins.
  const stored = readStored()
  saveMfes([...stored, entry])
  return entry
}

export function removeMfe(id: string): void {
  // Los builtins no se borran del todo: se desactivan (override enabled=false).
  const builtin = BUILTIN_MFES.find((b) => b.id === id)
  if (builtin) { toggleMfe(id, false); return }
  saveMfes(readStored().filter((m) => m.id !== id))
}

export function toggleMfe(id: string, value?: boolean): void {
  const stored = readStored()
  const current = getMfes().find((m) => m.id === id)
  const next = value ?? !(current?.enabled ?? true)
  const existing = stored.find((m) => m.id === id)
  if (existing) {
    saveMfes(stored.map((m) => (m.id === id ? { ...m, enabled: next } : m)))
  } else {
    // Primer override de un builtin: lo materializamos en el store.
    const base = BUILTIN_MFES.find((b) => b.id === id)
    if (base) saveMfes([...stored, { ...base, enabled: next }])
  }
}

/** Guarda la configuración de un MFE para una compañía. */
export function setMfeConfig(id: string, companyId: string, values: MfeConfigValues): void {
  const stored = readStored()
  const existing = stored.find((m) => m.id === id)
  if (existing) {
    existing.configByCompany = { ...existing.configByCompany, [companyId]: values }
    saveMfes(stored.map((m) => (m.id === id ? existing : m)))
    return
  }
  // Override inicial de un builtin.
  const base = BUILTIN_MFES.find((b) => b.id === id)
  if (base) saveMfes([...stored, { ...base, configByCompany: { [companyId]: values } }])
}

/** Config efectiva de un MFE para una compañía (defaults del schema + overrides). */
export function getMfeConfig(mfe: MfeEntry, companyId: string): MfeConfigValues {
  const base: MfeConfigValues = {}
  for (const f of mfe.configSchema) if (f.default !== undefined) base[f.key] = f.default
  return { ...base, ...(mfe.configByCompany[companyId] ?? {}) }
}

function readStored(): MfeEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as Partial<MfeEntry>[]) : []
    return Array.isArray(list) ? list.map(normalize) : []
  } catch { return [] }
}
