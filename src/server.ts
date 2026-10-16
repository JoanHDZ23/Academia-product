import { app } from './app.js'
import { connectMongo } from './lib/mongodb.js'

const PORT = Number(process.env.PORT) || 4100

async function start() {
  // El servidor escucha SIEMPRE, aunque MongoDB no esté disponible al arrancar;
  // la conexión se reintenta en segundo plano.
  app.listen(PORT, () => {
    console.log(`[ommex-academia] Servidor corriendo en http://localhost:${PORT}`)
  })

  try {
    await connectMongo()
    console.log('[ommex-academia] MongoDB conectado.')
  } catch (err) {
    console.warn('[ommex-academia] MongoDB no disponible al iniciar. Reintentando en segundo plano.', err instanceof Error ? err.message : err)
    retryMongo()
  }
}

function retryMongo() {
  const RETRY_INTERVAL = 30_000
  const attempt = async () => {
    try {
      await connectMongo()
      console.log('[ommex-academia] MongoDB conectado (reintento exitoso).')
    } catch {
      setTimeout(attempt, RETRY_INTERVAL)
    }
  }
  setTimeout(attempt, RETRY_INTERVAL)
}

start().catch((err) => {
  console.error('Error al iniciar servidor:', err)
  process.exit(1)
})
