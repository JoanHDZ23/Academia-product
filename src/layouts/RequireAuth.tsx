import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { clearCurrentUser, getCurrentToken, getCurrentUser, isOfflineSessionValid } from '../lib/auth-storage'

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
  const now = useMemo(() => Date.now() / 1000, [])

  // Sin sesión → login
  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  const exp = getTokenExpiry(token)
  const jwtExpired = exp !== null && now > exp

  if (jwtExpired) {
    // Offline con sesión válida: permitir acceso aunque el JWT haya expirado.
    // El token se renovará automáticamente al reconectar y volver a ingresar.
    const offline = !navigator.onLine
    if (offline && isOfflineSessionValid()) {
      // Acceso offline permitido — continúa sin limpiar la sesión
      return children
    }
    // Online con JWT expirado → forzar re-login
    clearCurrentUser()
    return <Navigate to="/login" replace />
  }

  return children
}
