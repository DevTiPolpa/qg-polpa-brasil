import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { getUserByEmail, getUserById, updateLastSignedIn } from './db'

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'qgpolpabrasil_dev_secret'
const COOKIE_NAME = 'qg_session'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export interface SessionPayload {
  userId: number
  role: 'ADMIN' | 'VENDEDOR'
}

export function createSessionToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, COOKIE_SECRET, { expiresIn: '365d', algorithm: 'HS256' })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, COOKIE_SECRET) as SessionPayload
  } catch {
    return null
  }
}

export async function authenticateRequest(req: Request) {
  const cookieHeader = req.headers.cookie ?? ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return null

  const payload = verifySession(match[1])
  if (!payload) return null

  const user = await getUserById(payload.userId)
  if (!user || !user.ativo) return null

  await updateLastSignedIn(user.id)
  return user
}

export async function loginWithPassword(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user || !user.ativo) return null

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  return user
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  return pass
}

export { COOKIE_NAME }
