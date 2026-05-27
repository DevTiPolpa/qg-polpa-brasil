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

const PROJETO = 'NOVOS PROJETOS'

const metas = [
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-01', valorMeta: 406840.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-02', valorMeta: 278200.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-03', valorMeta: 457780.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-06', valorMeta: 758530.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-08', valorMeta: 457780.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-09', valorMeta: 301475.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-10', valorMeta: 457780.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-12', valorMeta: 758530.00 },
]

async function main() {
  const pool = await sql.connect(config)
  console.log('Conectado. Inserindo metas de ALEXANDRE BRUCH...')

  let ok = 0
  for (const m of metas) {
    await pool.request()
      .input('vend', sql.NVarChar(200), m.nomeVendedor)
      .input('mes',  sql.NVarChar(7),   m.mes)
      .input('meta', sql.Decimal(15,2),  m.valorMeta)
      .input('proj', sql.NVarChar(100),  PROJETO)
      .query(`
        MERGE metas_2026 AS t
        USING (SELECT @vend AS nome_vendedor, @mes AS mes, @proj AS projeto) AS s
        ON t.nome_vendedor = s.nome_vendedor AND t.mes = s.mes AND t.projeto = s.projeto
        WHEN MATCHED THEN
          UPDATE SET valor_meta = @meta, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (nome_vendedor, mes, valor_meta, projeto)
          VALUES (@vend, @mes, @meta, @proj);
      `)
    console.log(`  ✓ ${m.nomeVendedor} | ${m.mes} | R$ ${m.valorMeta.toLocaleString('pt-BR')}`)
    ok++
  }

  await pool.close()
  console.log(`\n${ok} metas inseridas com sucesso.`)
}

main().catch(console.error)
