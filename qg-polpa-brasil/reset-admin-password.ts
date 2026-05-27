import bcrypt from 'bcryptjs'
import { getPool } from './server/src/db'

async function main() {
  const email = 'admin@polpabrasil.com.br'
  const newPassword = 'Admin@2026'
  const hash = await bcrypt.hash(newPassword, 12)
  const pool = await getPool()
  if (!pool) { console.error('Sem conexão com o banco'); process.exit(1) }
  await pool.request()
    .input('hash', hash)
    .input('email', email)
    .query('UPDATE users SET password_hash = @hash WHERE email = @email')
  console.log(`✓ Senha resetada para: ${newPassword}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
