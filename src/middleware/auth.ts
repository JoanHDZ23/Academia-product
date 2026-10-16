import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/auth.js'
import { readDatabase } from '../lib/database.js'
import type { AuthUser, UserRole } from '../types.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Token requerido.' })
    return
  }

  const token = authorization.replace('Bearer ', '')

  try {
    request.authUser = verifyToken(token)
    // Root no pertenece a una institución; no se valida empresa activa.
    if (request.authUser.role === 'root') {
      next()
      return
    }
    void checkCompanyActive(request, response, next)
  } catch {
    response.status(401).json({ message: 'Token inválido o vencido.' })
  }
}

/** Middleware que exige rol root. */
export function requireRoot(request: Request, response: Response, next: NextFunction) {
  if (!request.authUser || request.authUser.role !== 'root') {
    response.status(403).json({ message: 'Acceso denegado. Se requiere rol root.' })
    return
  }
  next()
}

async function checkCompanyActive(request: Request, response: Response, next: NextFunction) {
  try {
    const db = await readDatabase()
    const company = db.companies.find((c) => c.id === request.authUser!.companyId)
    if (company && company.activa === false) {
      response.status(403).json({ message: 'Tu institución está inactiva. Contacta al administrador.' })
      return
    }
  } catch {
    // Si falla la lectura, dejar pasar
  }
  next()
}

/** Middleware de roles. */
export function requireRole(roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({ message: 'Sesión no válida.' })
      return
    }
    if (roles.includes(request.authUser.role as UserRole)) {
      next()
      return
    }
    response.status(403).json({ message: 'No tienes permisos para esta acción.' })
  }
}
