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
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-07', valorMeta: 259650.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-08', valorMeta: 109950.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-09', valorMeta: 277446.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-10', valorMeta: 109950.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-11', valorMeta: 277446.00 },
  { nomeVendedor: '73 - MARIA BAY', mes: '2026-12', valorMeta:  86550.00 },

  // 5 - JULIA ALBERTI
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-06', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-07', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-08', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-09', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-10', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-11', valorMeta: 678147.80 },
  { nomeVendedor: '5 - JULIA ALBERTI', mes: '2026-12', valorMeta: 678147.80 },

  // 23 - TALIA STEFANI SCAIN
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-06', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-07', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-08', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-09', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-10', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-11', valorMeta: 598650.28 },
  { nomeVendedor: '23 - TALIA STEFANI SCAIN', mes: '2026-12', valorMeta: 598650.28 },

  // 64 - JENNIFER ANACLETO
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-07', valorMeta: 333333.33 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-08', valorMeta: 333333.33 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-09', valorMeta: 333333.33 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-10', valorMeta: 333333.33 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-11', valorMeta: 333333.33 },
  { nomeVendedor: '64 - JENNIFER ANACLETO', mes: '2026-12', valorMeta: 333333.33 },

  // 74 - TATIANA EVANGELISTA
  { nomeVendedor: '74 - TATIANA EVANGELISTA', mes: '2026-08', valorMeta: 150000.00 },
  { nomeVendedor: '74 - TATIANA EVANGELISTA', mes: '2026-09', valorMeta: 150000.00 },
  { nomeVendedor: '74 - TATIANA EVANGELISTA', mes: '2026-10', valorMeta: 150000.00 },
  { nomeVendedor: '74 - TATIANA EVANGELISTA', mes: '2026-11', valorMeta: 150000.00 },
  { nomeVendedor: '74 - TATIANA EVANGELISTA', mes: '2026-12', valorMeta: 150000.00 },
]

async function main() {
  const pool = await sql.connect(config)
  console.log('Conectado. Criando tabela se não existir...')

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'metas_2026')
    CREATE TABLE metas_2026 (
      id            INT IDENTITY(1,1) PRIMARY KEY,
      nome_vendedor NVARCHAR(200) NOT NULL,
      mes           NVARCHAR(7)   NOT NULL,
      valor_meta    DECIMAL(15,2) NOT NULL DEFAULT 0,
      projeto       NVARCHAR(100) NULL,
      mercado_vendas NVARCHAR(100) NULL,
      created_at    DATETIME2 DEFAULT GETDATE(),
      updated_at    DATETIME2 DEFAULT GETDATE()
    )
  `)

  console.log('Inserindo metas...')

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
        ON t.nome_vendedor = s.nome_vendedor AND t.mes = s.mes
           AND t.projeto = s.projeto
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
