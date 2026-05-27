import * as XLSX from 'xlsx'
import * as sql from 'mssql'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'PolpaBrasil',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: process.env.DB_ENCRYPT === 'true', trustServerCertificate: true },
}

function excelDateToISO(serial: number): string | null {
  if (!serial || isNaN(serial)) return null
  const date = XLSX.SSF.parse_date_code(serial)
  if (!date) return null
  const m = String(date.m).padStart(2, '0')
  const d = String(date.d).padStart(2, '0')
  return `${date.y}-${m}-${d}`
}

function safeNum(v: any): number | null {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return isNaN(n) ? null : n
}

function safeStr(v: any, max = 255): string | null {
  if (v == null || v === '') return null
  return String(v).trim().substring(0, max)
}

async function main() {
  const filePath = path.join(__dirname, 'Orçamento 2026', 'Orçamento 2026 - Real.xls')
  console.log('Lendo arquivo:', filePath)

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets['Orçamento']
  if (!ws) throw new Error('Aba "Orçamento" não encontrada no arquivo')

  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  console.log(`Total de linhas lidas: ${rows.length}`)

  const pool = await sql.connect(config)
  console.log('Conectado ao banco. Limpando orcamento_2026...')
  await pool.request().query('TRUNCATE TABLE orcamento_2026')

  let importados = 0
  let erros = 0

  for (const row of rows) {
    const dtRaw = row['Previsão de Entrega (Embarque)']
    const dtISO = typeof dtRaw === 'number' ? excelDateToISO(dtRaw) : safeStr(dtRaw)

    try {
      await pool.request()
        .input('grupo',      sql.NVarChar(100),    safeStr(row['Grupo do Produto'], 100))
        .input('mercado',    sql.NVarChar(100),    safeStr(row['Mercado de Vendas'], 100))
        .input('codParc',    sql.Int,              safeNum(row['Cód. Parc']))
        .input('razao',      sql.NVarChar(255),    safeStr(row['Razão Social']))
        .input('codProd',    sql.BigInt,           safeNum(row['Cód. Produto']))
        .input('nomeProd',   sql.NVarChar(255),    safeStr(row['Produto']))
        .input('codTop',     sql.Int,              safeNum(row['Cód. TOP']))
        .input('top',        sql.NVarChar(150),    safeStr(row['TOP'], 150))
        .input('projeto',    sql.NVarChar(100),    safeStr(row['Projeto'], 100))
        .input('dtPrev',     sql.Date,             dtISO)
        .input('qtdNeg',     sql.Decimal(15,3),    safeNum(row['Qtd. Negociada']))
        .input('qtdPend',    sql.Decimal(15,3),    safeNum(row['Qtd. Pendente']))
        .input('qtdPendKg',  sql.Decimal(15,3),    safeNum(row['Qtd. Pendente KG']))
        .input('valPend',    sql.Decimal(15,2),    safeNum(row['Valor Pendente']))
        .input('uf',         sql.NVarChar(2),      safeStr(row['UF'], 2))
        .input('cidade',     sql.NVarChar(100),    safeStr(row['NOMECID'], 100))
        .query(`INSERT INTO orcamento_2026
          (grupo_produto, mercado_vendas, cod_parc, razao_social, cod_produto, nome_produto,
           cod_top, [top], projeto, dt_prev_entrega_embarque,
           qtd_negociada, qtd_pendente, qtd_pendente_kg, valor_pendente, uf, cidade)
          VALUES
          (@grupo, @mercado, @codParc, @razao, @codProd, @nomeProd,
           @codTop, @top, @projeto, @dtPrev,
           @qtdNeg, @qtdPend, @qtdPendKg, @valPend, @uf, @cidade)`)
      importados++
    } catch (e: any) {
      erros++
      if (erros <= 3) console.error('Erro na linha:', JSON.stringify(row), e.message)
    }
  }

  await pool.close()
  console.log(`\nImportação concluída: ${importados} registros importados, ${erros} erros.`)
}

main().catch(console.error)
