# Klock Academia — Backend

Express 5 + MongoDB (TypeScript, ESM). API de gestión académica.

## Scripts

- `npm run dev` — servidor con recarga (tsx) en `http://localhost:4100`.
- `npm run build` — compila a `dist/` (tsc).
- `npm start` — ejecuta `dist/server.js`.

## Variables de entorno (`.env`)

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto (Render lo inyecta). Default 4100. |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas. |
| `MONGODB_DB_NAME` | Base de datos. Default `ommex_academia`. |
| `JWT_SECRET` | Secreto para firmar los JWT de sesión. |
| `FACE_SERVICE_URL` | (Opcional) microservicio DeepFace. Si se omite, la verificación facial se omite. |

## Endpoints principales

- `POST /api/auth/register-institution` — crea institución + admin.
- `POST /api/auth/login` — ingreso por `numeroDocumento`.
- `GET/POST /api/auth/member-invitations/:token[/complete]` — auto-registro de alumnos.
- `/api/academic/*` — asignaturas, cursos, grupos, sesiones, eventos, personas, notificaciones, `dashboard-summary`.
- `/api/academic-attendance/*` — ingreso QR/biométrico, confirmación docente, justificaciones, alertas, porcentajes.
- `/api/locations` — sedes.
- `/api/companies/me`, `/api/companies/management`, `/api/settings`.
- `GET /api/health`, `GET /api/health/db`.
