import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Cargador dinámico de microfrontends.
 *
 * Inyecta en el DOM el `<script type="module">` del microfrontend (si no estaba
 * ya cargado), espera a que registre su Web Component (`tagName`) y lo renderiza
 * pasándole props como atributos. No requiere recompilar el Host: basta con la
 * URL del `.js` y el nombre de la etiqueta (p. ej. desde /root-panel).
 */

export interface DynamicMicrofrontendProps {
  /** URL absoluta del bundle .js del microfrontend. */
  scriptUrl: string
  /** Nombre del Custom Element que el bundle registra (p. ej. `mfe-ventas`). */
  tagName: string
  /** Props/atributos a pasar al Web Component. Strings → atributos; objetos → propiedades. */
  props?: Record<string, unknown>
  /** Eventos personalizados del MFE a escuchar: { 'nombre-evento': handler }. */
  events?: Record<string, (detail: unknown) => void>
  /** Milisegundos antes de declarar timeout de carga. Por defecto 15000. */
  timeout?: number
  /** Altura del contenedor mientras no define la suya. */
  style?: React.CSSProperties
  className?: string
}

type Status = 'loading' | 'ready' | 'error'

// Caché global de scripts ya cargados/ en carga (compartida entre instancias).
const scriptCache = new Map<string, Promise<void>>()

function loadScript(url: string, timeout: number): Promise<void> {
  const cached = scriptCache.get(url)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    // ¿Ya existe un <script> con esta URL? (p. ej. recargado por otra vista)
    const existing = document.querySelector<HTMLScriptElement>(`script[data-mfe="${CSS.escape(url)}"]`)
    if (existing && existing.dataset.loaded === 'true') { resolve(); return }

    const script = existing ?? document.createElement('script')
    script.type = 'module'
    script.src = url
    script.async = true
    script.dataset.mfe = url

    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado al cargar el microfrontend (${timeout} ms).`))
    }, timeout)

    script.addEventListener('load', () => {
      clearTimeout(timer)
      script.dataset.loaded = 'true'
      resolve()
    })
    script.addEventListener('error', () => {
      clearTimeout(timer)
      scriptCache.delete(url) // permite reintentar
      reject(new Error('No se pudo cargar el microfrontend (error de red o URL inválida).'))
    })

    if (!existing) document.head.appendChild(script)
  })

  scriptCache.set(url, promise)
  return promise
}

export function DynamicMicrofrontend({
  scriptUrl, tagName, props, events, timeout = 15000, style, className,
}: DynamicMicrofrontendProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [attempt, setAttempt] = useState(0)
  const hostRef = useRef<HTMLDivElement>(null)
  const elRef = useRef<HTMLElement | null>(null)

  // Cargar el script y esperar a que el Custom Element quede definido.
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setErrorMsg('')

    loadScript(scriptUrl, timeout)
      .then(() => customElements.whenDefined(tagName).catch(() => { /* algunos definen sincrónicamente */ }))
      .then(() => {
        if (cancelled) return
        if (!customElements.get(tagName)) {
          // El script cargó pero no registró el tag esperado.
          throw new Error(`El microfrontend no registró el elemento <${tagName}>.`)
        }
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al cargar el microfrontend.')
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [scriptUrl, tagName, timeout, attempt])

  // Crear/actualizar el Custom Element y sincronizar props cuando esté listo.
  useEffect(() => {
    if (status !== 'ready' || !hostRef.current) return
    const host = hostRef.current

    let el = elRef.current
    if (!el || el.tagName.toLowerCase() !== tagName.toLowerCase()) {
      host.innerHTML = ''
      el = document.createElement(tagName)
      host.appendChild(el)
      elRef.current = el
    }

    // Props: string/number/boolean → atributo; resto → propiedad del elemento.
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null) { el.removeAttribute(key); continue }
        if (typeof value === 'object' || typeof value === 'function') {
          ;(el as unknown as Record<string, unknown>)[key] = value
        } else {
          el.setAttribute(key, String(value))
        }
      }
    }
  }, [status, tagName, props])

  // Suscribir/limpiar los Custom Events emitidos por el MFE.
  useEffect(() => {
    if (status !== 'ready' || !elRef.current || !events) return
    const el = elRef.current
    const wrapped: Array<[string, EventListener]> = Object.entries(events).map(([name, handler]) => {
      const listener: EventListener = (e) => handler((e as CustomEvent).detail)
      el.addEventListener(name, listener)
      return [name, listener]
    })
    return () => { wrapped.forEach(([name, listener]) => el.removeEventListener(name, listener)) }
  }, [status, events])

  if (status === 'loading') {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '2rem', color: 'var(--klock-text-3)', ...style }}>
        <Loader2 size={18} className="ui-spin" />
        <span style={{ fontSize: 'var(--klock-sm)' }}>Cargando módulo…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', padding: '1.5rem', textAlign: 'center', ...style }}>
        <AlertTriangle size={22} color="var(--klock-danger)" />
        <p style={{ fontSize: 'var(--klock-sm)', color: 'var(--klock-text-2)', maxWidth: 360 }}>{errorMsg}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="button button--secondary button--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    )
  }

  return <div ref={hostRef} className={className} style={style} />
}

export default DynamicMicrofrontend
