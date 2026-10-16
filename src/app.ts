import cors from 'cors'
import express from 'express'
import { academicRouter } from './routes/academic.js'
import { academicAttendanceRouter } from './routes/academic-attendance.js'
import { authRouter } from './routes/auth.js'
import { companiesRouter } from './routes/companies.js'
import { locationsRouter } from './routes/locations.js'
import { settingsRouter } from './routes/settings.js'

export const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    /\.vercel\.app$/,
    /\.onrender\.com$/,
  ],
  credentials: true,
}))
app.use(express.json({ limit: '12mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'ommex-academia', timestamp: new Date().toISOString() })
})

app.get('/api/health/db', async (_request, response) => {
  try {
    const { connectMongo } = await import('./lib/mongodb.js')
    const db = await connectMongo()
    await db.command({ ping: 1 })
    response.json({ status: 'connected', db: process.env.MONGODB_DB_NAME ?? 'ommex_academia' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    response.status(503).json({ status: 'disconnected', error: message })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/locations', locationsRouter)
app.use('/api/academic', academicRouter)
app.use('/api/academic-attendance', academicAttendanceRouter)

app.use(
  (
    error: Error,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[error-handler]', error.message)
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('Server selection timed out') ||
      error.message.includes('connect ETIMEDOUT') ||
      error.message.includes('MongoServerSelectionError')
    ) {
      response.status(503).json({ message: 'Base de datos no disponible. Verifica MongoDB Atlas.', detail: error.message })
      return
    }
    response.status(500).json({ message: 'Error interno del servidor.', detail: error.message })
  },
)
