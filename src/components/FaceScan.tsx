/**
 * FaceScan — captura de selfie guiada estilo Nequi.
 *
 * - Marco circular con silueta de referencia.
 * - Instrucciones claras ("expresión neutra, sin gafas ni sombrero").
 * - Detección facial en vivo con face-api.js.
 * - Captura AUTOMÁTICA cuando el rostro está bien posicionado y estable.
 * - Botón manual de respaldo.
 *
 * Reutilizable para: registro inicial de rostro y verificación de entrada.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

interface FaceScanProps {
  /** Se llama con el dataURL JPEG cuando se captura la selfie. */
  onCapture: (dataUrl: string) => void
  /** Se llama si el usuario cancela. */
  onCancel?: () => void
  /** Título mostrado arriba. */
  title?: string
  /** Subtítulo con instrucciones. */
  subtitle?: string
  /** Texto del botón de captura manual. */
  captureLabel?: string
  /** Si true, captura automáticamente al detectar rostro estable (default true). */
  autoCapture?: boolean
}

type ScanState = 'loading' | 'searching' | 'detected' | 'capturing'

export function FaceScan({
  onCapture,
  onCancel,
  title = 'Tómate una selfie',
  subtitle = 'Mantén una expresión neutra, busca una luz equilibrada y quítate las gafas y los sombreros',
  captureLabel = 'Tomar selfie',
  autoCapture = true,
}: FaceScanProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<ScanState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Contador de frames consecutivos con rostro bien posicionado (para estabilidad)
  const stableFramesRef = useRef(0)
  const capturedRef = useRef(false)

  /** Captura el frame actual del video a dataURL. */
  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || capturedRef.current) return
    capturedRef.current = true
    setState('capturing')
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    // Detener cámara antes de entregar
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    onCapture(dataUrl)
  }, [onCapture])

  useEffect(() => {
    let cancelled = false
    let animFrame = 0

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream

        // Cargar modelos de detección facial
        const { loadFaceModels } = await import('../lib/face-scan')
        const loaded = await loadFaceModels()
        if (cancelled) return

        if (!loaded) {
          // Sin modelos: permitir captura manual (no bloquear)
          setState('detected')
          return
        }

        const faceapi = await import('face-api.js')
        setState('searching')

        const detect = async () => {
          if (cancelled || capturedRef.current) return
          const video = videoRef.current
          if (!video || video.readyState < 2) {
            animFrame = requestAnimationFrame(() => void detect())
            return
          }
          const det = await faceapi.detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
          )
          if (cancelled || capturedRef.current) return

          if (det) {
            // Verifica que el rostro esté razonablemente centrado y grande
            const box = det.box
            const vw = video.videoWidth || 1
            const vh = video.videoHeight || 1
            const cx = box.x + box.width / 2
            const cy = box.y + box.height / 2
            const centeredX = Math.abs(cx - vw / 2) < vw * 0.22
            const centeredY = Math.abs(cy - vh / 2) < vh * 0.25
            const bigEnough = box.width > vw * 0.28
            const wellPositioned = centeredX && centeredY && bigEnough

            if (wellPositioned) {
              stableFramesRef.current += 1
              setState('detected')
              // Captura automática tras ~8 frames estables (≈0.7s)
              if (autoCapture && stableFramesRef.current >= 8) {
                capture()
                return
              }
            } else {
              stableFramesRef.current = 0
              setState('searching')
            }
          } else {
            stableFramesRef.current = 0
            setState('searching')
          }
          animFrame = requestAnimationFrame(() => void detect())
        }
        void detect()
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica los permisos.')
      }
    }
    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(animFrame)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusText =
    error ? error
    : state === 'loading'   ? 'Iniciando cámara…'
    : state === 'searching' ? 'Centra tu rostro en el círculo'
    : state === 'detected'  ? (autoCapture ? 'No te muevas, la foto se tomará automáticamente' : 'Rostro detectado')
    : 'Capturando…'

  return (
    <div className="facescan">
      <div className="facescan__head">
        <h2 className="facescan__title">{title}</h2>
        <p className="facescan__subtitle">{subtitle}</p>
      </div>

      {/* Marco circular con silueta */}
      <div className={`facescan__ring facescan__ring--${state}`}>
        <div className="facescan__circle">
          <video ref={videoRef} autoPlay playsInline muted className="facescan__video" />
          {/* Silueta de referencia cuando aún no hay rostro */}
          {(state === 'loading' || state === 'searching') && (
            <svg className="facescan__silhouette" viewBox="0 0 120 140" aria-hidden="true">
              {/* Cabeza — superficie del tema (se controla por CSS: claro/oscuro) */}
              <path className="facescan__head-shape" d="M60 18 C43 18 32 33 32 53 C32 68 41 82 60 90 C79 82 88 68 88 53 C88 33 77 18 60 18 Z" />
              {/* Hombros — color de marca (violeta) */}
              <path d="M20 140 C20 106 39 92 60 92 C81 92 100 106 100 140 Z" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>

      <p className="facescan__status">{statusText}</p>

      {/* Botón manual (respaldo) + cancelar */}
      <div className="facescan__actions">
        {!autoCapture || error ? (
          <button
            type="button"
            className="facescan__btn facescan__btn--primary"
            onClick={capture}
            disabled={state === 'loading' || state === 'capturing'}
          >
            {captureLabel}
          </button>
        ) : (
          <button
            type="button"
            className="facescan__btn facescan__btn--ghost"
            onClick={capture}
            disabled={state === 'loading' || state === 'capturing'}
          >
            Tomar ahora
          </button>
        )}
        {onCancel && (
          <button type="button" className="facescan__btn facescan__btn--text" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
