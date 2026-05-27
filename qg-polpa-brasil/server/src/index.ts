import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routers'
import { createContext } from './trpc'
import { createForecastSnapshot, getSnapshotDates } from './db'

const app = express()
const PORT = process.env.PORT ?? 5000

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }))

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'QG Polpa Brasil' }))

// Serve o build do React em produção
const CLIENT_DIST = path.resolve(__dirname, '../../../client/dist')
app.use(express.static(CLIENT_DIST))
app.get('*', (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`[QG Polpa Brasil] Servidor rodando em http://localhost:${PORT}`)
})

// ─── Cron: snapshot toda sexta-feira às 17:00 ────────────────────────────────
let _lastSnapshotCheck = ''
setInterval(async () => {
  const now = new Date()
  if (now.getDay() !== 5 || now.getHours() !== 17 || now.getMinutes() !== 0) return
  const today = now.toISOString().split('T')[0]
  if (_lastSnapshotCheck === today) return   // já executou hoje
  _lastSnapshotCheck = today
  try {
    const existing = await getSnapshotDates()
    if (existing.some(d => d.snapshotDate === today)) {
      console.log('[Snapshot] Já existe snapshot para hoje, pulando.')
      return
    }
    const { inserted } = await createForecastSnapshot()
    console.log(`[Snapshot] Criado snapshot de ${today} com ${inserted} linhas.`)
  } catch (err) {
    console.error('[Snapshot] Erro ao criar snapshot:', err)
  }
}, 60_000)
