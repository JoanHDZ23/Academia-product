import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { apiRequest, type EmbedLoginResponse } from '../lib/api'
import { clearCurrentUser, getCurrentToken, getCurrentUser, isOfflineSessionValid, setCurrentToken, setCurrentUser } from '../lib/auth-storage'
import { getEmbedCompanyId, getEmbedCompanyName, getEmbedRole, getEmbedUser, isEmbedded } from '../lib/embed-context'

function getTokenExpiry(token: string): number | null {
  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return null
    const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return decoded.exp ?? null
  } catch {
    return null
  }
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = getCurrentUser()
  const token = getCurrentToken()
  const embedded = isEmbedded()
  const now = useMemo(() => Date.now() / 1000, [])

  // Estado del auto-ingreso embebido (sin pantalla de login).
  const [embedState, setEmbedState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [embedError, setEmbedError] = useState<string | null>(null)

  const hasSession = Boolean(user && token)

  // Modo embebido sin sesión: abre sesión automáticamente con el contexto
  // recibido desde turnos y renderiza el home directamente (sin pasar por login).
  useEffect(() => {
    if (!embedded || hasSession || embedState !== 'idle') return
    setEmbedState('loading')
    void apiRequest<EmbedLoginResponse>('/auth/embed', {
      method: 'POST',
      body: {
        companyId: getEmbedCompanyId(),
        companyName: getEmbedCompanyName(),
        user: getEmbedUser(),
        role: getEmbedRole(),
      },
    })
      .then((res) => {
        setCurrentToken(res.token)
        setCurrentUser({
          id: res.user.id,
          companyId: res.user.companyId,
          nombreCompleto: res.user.nombreCompleto,
          correo: res.user.correo,
          cargo: res.user.cargo,
          role: res.user.role,
          allowedModules: res.user.allowedModules as never,
          permissionLevels: res.user.permissionLevels,
        })
        setEmbedState('done')
      })
      .catch((err) => {
        setEmbedError(err instanceof Error ? err.message : 'No fue posible abrir Academia.')
        setEmbedState('error')
      })
  }, [embedded, hasSession, embedState])

  // ── Modo embebido ────────────────────────────────────────────────────────
  if (embedded) {
    if (hasSession || embedState === 'done') return children
    return (
      <div className="auth-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
        {embedState === 'error'
          ? <p className="turn-table__error">{embedError}</p>
          : <p style={{ color: 'var(--klock-text-3, #64748b)' }}>Abriendo Academia…</p>}
      </div>
    )
  }

  // ── Modo normal ──────────────────────────────────────────────────────────
  if (!hasSession) {
    return <Navigate to="/login" replace />
  }

  const exp = getTokenExpiry(token!)
  const jwtExpired = exp !== null && now > exp

  if (jwtExpired) {
    const offline = !navigator.onLine
    if (offline && isOfflineSessionValid()) {
      return children
    }
    clearCurrentUser()
    return <Navigate to="/login" replace />
  }

  return children
}
