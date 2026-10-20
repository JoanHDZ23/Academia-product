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
import { useState as reactUseState, useEffect as reactUseEffect } from 'react'

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
  /** URL base del backend del MFE, para descubrir su esquema de config (opcional). */
  apiUrl?: string
  /** Tag del Custom Element (solo webcomponent). */
  tag?: string
  /** Activo/inactivo sin borrarlo. */
  enabled: boolean
  /** Vincula este MFE a una "función" del panel (enabledModules). Si está
   *  definido, su configuración aparece integrada en esa función cuando está activa. */
  featureKey?: string
  /** Campos de configuración que ofrece este MFE. */
  configSchema: MfeConfigField[]
  /** Configuración guardada por compañía (companyId → valores). */
  configByCompany: Record<string, MfeConfigValues>
  /** Marca los presets integrados (trazabilidad/academia) para la UI. */
  builtin?: boolean
  createdAt: string
}

const KEY = 'ommex_mfe_registry'

// ── Notificación de cambios (para que toda la UI reaccione al vuelo) ────────
const listeners = new Set<() => void>()
/** Suscribe un callback que se invoca cuando el registro cambia. Devuelve unsub. */
export function subscribeMfes(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
function notifyMfes(): void {
  for (const cb of listeners) { try { cb() } catch { /* noop */ } }
}

// ── Presets de los productos actuales como MFE tipo iframe ──────────────────
const TRACER_URL = (import.meta.env.VITE_TRACER_URL as string) || 'https://ommex-tracer.vercel.app'
const ACADEMIA_URL = (import.meta.env.VITE_ACADEMIA_URL as string) || 'https://academia-product-mdw3.vercel.app'
// URLs de los backends de cada MFE (para descubrir su esquema de configuración).
const TRACER_API = (import.meta.env.VITE_TRACER_API_URL as string) || 'https://micro-ommex-traser.onrender.com/api'
const ACADEMIA_API = (import.meta.env.VITE_ACADEMIA_API_URL as string) || 'https://ommex-academia-backend.onrender.com/api'

export const BUILTIN_MFES: MfeEntry[] = [
  {
    id: 'builtin-trazabilidad',
    name: 'Trazabilidad',
    type: 'iframe',
    url: TRACER_URL,
    apiUrl: TRACER_API,
    featureKey: 'trazabilidad',
    enabled: true,
    builtin: true,
    createdAt: new Date(0).toISOString(),
    // Trazabilidad usa su propio modal de ajustes (trazabilidadSettings), que ya
    // se sincroniza con su backend. Por eso NO duplica aquí su configSchema: su
    // configuración es la única fuente de verdad del canal existente.
    configSchema: [],
    configByCompany: {},
  },
  {
    id: 'builtin-academia',
    name: 'Academia',
    type: 'iframe',
    url: ACADEMIA_URL,
    apiUrl: ACADEMIA_API,
    featureKey: 'academia',
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
    apiUrl: entry.apiUrl,
    featureKey: entry.featureKey,
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
    return override ? { ...b, ...override, builtin: true, configSchema: b.configSchema, featureKey: b.featureKey } : b
  })
  for (const s of stored) {
    if (!BUILTIN_MFES.some((b) => b.id === s.id)) merged.push(s)
  }
  return merged
}

export function saveMfes(list: MfeEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* cuota/privado */ }
  notifyMfes()
}

/** Hook de React: devuelve los MFEs y re-renderiza cuando el registro cambia. */
export function useMfes(): MfeEntry[] {
  const [list, setList] = reactUseState(getMfes())
  reactUseEffect(() => {
    const unsub = subscribeMfes(() => setList(getMfes()))
    return unsub
  }, [])
  return list
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

/** MFE activo vinculado a una "función" (featureKey), si existe. */
export function getMfeForFeature(featureKey: string): MfeEntry | undefined {
  return getMfes().find((m) => m.enabled && m.featureKey === featureKey)
}

/**
 * ¿La función `featureKey` está disponible?
 * - Si NINGÚN MFE la provee (no hay MFE con ese featureKey) → siempre disponible
 *   (funciones nativas del portal: WhatsApp, Turnos, etc.).
 * - Si la provee un MFE → disponible solo si ese MFE está activo.
 * Así, al desactivar/eliminar el MFE, su función desaparece del panel.
 */
export function isFeatureAvailable(featureKey: string): boolean {
  const providers = getMfes().filter((m) => m.featureKey === featureKey)
  if (providers.length === 0) return true
  return providers.some((m) => m.enabled)
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

// ── Sincronización con el backend del Host (turnos) ─────────────────────────
// El registro vive en el backend del portal para compartirse entre usuarios.
// localStorage actúa como caché local para arranque instantáneo/offline.

/** Carga el registro desde el backend y lo cachea en localStorage. */
export async function loadMfesFromServer(authToken: string): Promise<void> {
  const { apiRequest } = await import('./api')
  try {
    const r = await apiRequest<{ mfes: Partial<MfeEntry>[] }>('/root/mfe-config', { token: authToken })
    const list = Array.isArray(r.mfes) ? r.mfes.map(normalize) : []
    // Guardamos solo los overrides/no-builtins (igual que readStored espera).
    saveMfes(list)
  } catch {
    /* sin red o sin permiso: se usa la caché local */
  }
}

/**
 * Descubre el esquema de configuración REAL de un MFE consultando su backend
 * (`GET {apiUrl}/mfe/config-schema`). Así las opciones salen del propio
 * microfrontend, no duplicadas en el portal. Devuelve null si no responde.
 */
export async function fetchMfeSchema(apiUrl: string): Promise<MfeConfigField[] | null> {
  try {
    const base = apiUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/mfe/config-schema`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = (await res.json()) as { fields?: MfeConfigField[] }
    return Array.isArray(data.fields) ? data.fields : null
  } catch {
    return null
  }
}

/** Persiste el registro actual (overrides + MFEs del usuario) en el backend. */
export async function saveMfesToServer(authToken: string): Promise<void> {
  const { apiRequest } = await import('./api')
  try {
    await apiRequest('/root/mfe-config', { method: 'PUT', token: authToken, body: { mfes: readStored() } })
  } catch {
    /* si falla, queda la caché local; se reintenta en el próximo guardado */
  }
}
