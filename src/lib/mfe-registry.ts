/**
 * Registro de microfrontends dinámicos configurables desde /root-panel.
 *
 * Cada entrada describe un módulo externo que se integra sin recompilar el Host:
 * basta la URL de su bundle .js y el nombre de su Web Component (tag).
 *
 * Persistencia: por ahora en localStorage (sin backend). La forma del dato está
 * lista para moverse a una API/BD más adelante sin cambiar los consumidores.
 */

export interface MfeEntry {
  id: string
  /** Nombre visible en el menú/listado. */
  name: string
  /** URL absoluta del bundle .js del microfrontend. */
  url: string
  /** Nombre del Custom Element que registra el bundle (p. ej. `mfe-ventas`). */
  tag: string
  /** Activo/inactivo sin borrarlo. */
  enabled: boolean
  createdAt: string
}

const KEY = 'ommex_mfe_registry'

export function getMfes(): MfeEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as MfeEntry[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveMfes(list: MfeEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* cuota/privado */ }
}

/** Valida los campos mínimos de una entrada antes de agregarla. */
export function validateMfe(input: { name: string; url: string; tag: string }): string | null {
  if (!input.name.trim()) return 'Escribe un nombre para el módulo.'
  if (!/^https?:\/\/.+\.js(\?.*)?$/i.test(input.url.trim())) return 'La URL debe ser un archivo .js válido (http/https).'
  if (!/^[a-z][a-z0-9]*-[a-z0-9-]+$/.test(input.tag.trim())) {
    return 'El tag debe ser un Custom Element válido con guion (ej. mfe-ventas).'
  }
  return null
}

export function addMfe(input: { name: string; url: string; tag: string }): MfeEntry {
  const entry: MfeEntry = {
    id: `mfe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    url: input.url.trim(),
    tag: input.tag.trim(),
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  saveMfes([...getMfes(), entry])
  return entry
}

export function removeMfe(id: string): void {
  saveMfes(getMfes().filter((m) => m.id !== id))
}

export function toggleMfe(id: string): void {
  saveMfes(getMfes().map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)))
}
