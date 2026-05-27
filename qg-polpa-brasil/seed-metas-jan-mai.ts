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

const metas: { nomeVendedor: string; mes: string; valorMeta: number }[] = [
  // 73 - MARIA BAY
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-04', valorMeta: 364064.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-05', valorMeta: 479550.00 },

  // 5 - JULIA ALBERTI
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-01', valorMeta:  48677.00 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-02', valorMeta:  65322.53 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-03', valorMeta:  87494.62 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-04', valorMeta: 246663.98 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-05', valorMeta: 332396.30 },

  // 23 - TALIA STEFANI SCAIN
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-01', valorMeta:  37848.00 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-02', valorMeta: 145780.82 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-03', valorMeta: 235356.32 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-04', valorMeta:  92219.42 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-05', valorMeta:  90681.68 },

  // 64 - JENNIFER ANACLETO
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-04', valorMeta: 31178.00 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-05', valorMeta:  2511.60 },

  // 8 - NATALY FIGUEIREDO
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-01', valorMeta: 44743.20 },
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-02', valorMeta: 15421.64 },
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-03', valorMeta: 94317.43 },

  // 27 - RAMON LACOWICZ
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-01', valorMeta: 119494.80 },
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-02', valorMeta: 125191.60 },
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-03', valorMeta: 259650.00 },
]

async function main() {
  const pool = await sql.connect(config)
  console.log('Conectado. Inserindo metas jan-mai/26...')

  let ok = 0
  for (const m of metas) {
    await pool.request()
      .input('vend',  sql.NVarChar(200), m.nomeVendedor)
      .input('mes',   sql.NVarChar(7),   m.mes)
      .input('meta',  sql.Decimal(15,2),  m.valorMeta)
      .input('proj',  sql.NVarChar(100),  PROJETO)
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
