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

const PROJETO = 'RECORRENTES'

const metas: { nomeVendedor: string; mes: string; valorMeta: number }[] = [
  // 73 - MARIA BAY
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-04', valorMeta: 3471429.06 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-05', valorMeta: 4050271.26 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-06', valorMeta: 4016636.40 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-07', valorMeta: 4027552.80 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-08', valorMeta: 5157239.40 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-09', valorMeta: 5477093.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-10', valorMeta: 5190077.74 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-11', valorMeta: 5091275.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-12', valorMeta: 4709931.00 },

  // 5 - JULIA ALBERTI
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-01', valorMeta:  973119.46 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-02', valorMeta:  659684.82 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-03', valorMeta:  521828.92 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-04', valorMeta:  533457.13 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-05', valorMeta: 1054103.98 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-06', valorMeta:  728189.71 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-07', valorMeta: 1393184.79 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-08', valorMeta:  811649.22 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-09', valorMeta:  592766.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-10', valorMeta: 1197052.76 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-11', valorMeta:  681156.56 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-12', valorMeta: 2192262.83 },

  // 23 - TALIA STEFANI SCAIN
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-01', valorMeta:  101932.20 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-02', valorMeta:  204090.16 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-03', valorMeta:  150284.91 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-04', valorMeta:  299452.25 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-05', valorMeta:  270362.84 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-06', valorMeta:  187224.12 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-07', valorMeta:  187565.75 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-08', valorMeta:  166434.50 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-09', valorMeta:  378003.85 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-10', valorMeta:  198602.10 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-11', valorMeta:  248799.55 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-12', valorMeta:  234327.85 },

  // 64 - JENNIFER ANACLETO
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-04', valorMeta:  61009.48 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-05', valorMeta:  34168.48 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-06', valorMeta:  71890.40 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-07', valorMeta: 133676.50 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-08', valorMeta:  50946.60 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-09', valorMeta: 109956.88 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-10', valorMeta: 110146.86 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-11', valorMeta: 111013.20 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-12', valorMeta: 123850.70 },

  // 8 - NATALY FIGUEIREDO
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-01', valorMeta: 119120.48 },
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-02', valorMeta: 113306.80 },
  { nomeVendedor: '8 - NATALY FIGUEIREDO', mes: '2026-03', valorMeta: 150257.90 },

  // 3 - ALEXANDRE BRUCH
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-02', valorMeta:  155304.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-03', valorMeta:  314928.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-04', valorMeta:  648200.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-05', valorMeta: 1202796.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-06', valorMeta:  329220.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-07', valorMeta:  329220.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-08', valorMeta:  569220.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-09', valorMeta:  669120.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-10', valorMeta:  903960.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-11', valorMeta:  651220.00 },
  { nomeVendedor: '3 - ALEXANDRE BRUCH', mes: '2026-12', valorMeta:   16188.99 },

  // 27 - RAMON LACOWICZ
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-01', valorMeta: 3596007.78 },
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-02', valorMeta: 4790955.20 },
  { nomeVendedor: '27 - RAMON LACOWICZ', mes: '2026-03', valorMeta: 4870002.44 },
]

async function main() {
  const pool = await sql.connect(config)
  console.log('Conectado. Inserindo metas RECORRENTES...')

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
