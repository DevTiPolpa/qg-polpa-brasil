import * as sql from 'mssql'
import * as dotenv from 'dotenv'
dotenv.config()

const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'PolpaBrasil',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: false, trustServerCertificate: true },
}

async function main() {
  const pool = await sql.connect(config)
  await pool.request()
    .input('valor', sql.Decimal(15,2), 732189.71)
    .input('vend',  sql.NVarChar(200), '5 - JULIA ALBERTI')
    .input('mes',   sql.NVarChar(7),   '2026-06')
    .input('proj',  sql.NVarChar(100), 'RECORRENTES')
    .query(`UPDATE metas_2026 SET valor_meta = @valor, updated_at = GETDATE()
            WHERE nome_vendedor = @vend AND mes = @mes AND projeto = @proj`)
  console.log('✓ Corrigido: 5 - JULIA ALBERTI | 2026-06 | R$ 732.189,71')
  await pool.close()
}

main().catch(console.error)
