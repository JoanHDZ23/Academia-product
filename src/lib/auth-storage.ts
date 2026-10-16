import { getDefaultAllowedModules, type AccessModule } from './access'

export type SessionRole = 'admin' | 'supervisor' | 'docente' | 'estudiante'

export type AuthSessionUser = {
  id: string
  companyId: string
  nombreCompleto: string
  correo: string
  cargo: string
  role: SessionRole
  positionId?: string
  allowedModules?: AccessModule[]
  permissionLevels?: Record<string, 'view' | 'edit' | 'full'>
}

const CURRENT_USER_KEY = 'ommex_academia_current_user'
const CURRENT_TOKEN_KEY = 'ommex_academia_current_token'
const OFFLINE_SESSION_KEY = 'ommex_academia_offline_session_expiry'
const OFFLINE_SESSION_DAYS = 30

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function setCurrentUser(user: AuthSessionUser) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function setCurrentToken(token: string) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CURRENT_TOKEN_KEY, token)
  const expiry = Date.now() + OFFLINE_SESSION_DAYS * 24 * 60 * 60 * 1000
  window.localStorage.setItem(OFFLINE_SESSION_KEY, String(expiry))
}

export function isOfflineSessionValid(): boolean {
  if (!canUseStorage()) return false
  const raw = window.localStorage.getItem(OFFLINE_SESSION_KEY)
  if (!raw) return false
  return Date.now() < Number(raw)
}

export function getCurrentUser(): AuthSessionUser | null {
  if (!canUseStorage()) return null
  const rawUser = window.localStorage.getItem(CURRENT_USER_KEY)
  if (!rawUser) return null
  try {
    const parsed = JSON.parse(rawUser) as AuthSessionUser
    return {
      ...parsed,
      allowedModules: parsed.allowedModules?.length
        ? parsed.allowedModules
        : getDefaultAllowedModules(parsed.role),
    }
  } catch {
    return null
  }
}

export function getCurrentToken() {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(CURRENT_TOKEN_KEY)
}

export function clearCurrentUser() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(CURRENT_USER_KEY)
  window.localStorage.removeItem(CURRENT_TOKEN_KEY)
  window.localStorage.removeItem(OFFLINE_SESSION_KEY)
}
