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
  const r = await pool.request().query(`
    SELECT nome_vendedor, mes, CAST(valor_meta AS FLOAT) AS valor
    FROM metas_2026 WHERE projeto = 'RECORRENTES'
    ORDER BY nome_vendedor, mes
  `)
  let total = 0
  for (const row of r.recordset) {
    console.log(row.nome_vendedor.padEnd(30), row.mes, 'R$', Number(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
    total += Number(row.valor)
  }
  console.log('\nTOTAL INSERIDO: R$', total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
  console.log('ESPERADO:       R$ 75.396.729,41')
  console.log('DIFERENÇA:      R$', (75396729.41 - total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
  await pool.close()
}

main().catch(console.error)
