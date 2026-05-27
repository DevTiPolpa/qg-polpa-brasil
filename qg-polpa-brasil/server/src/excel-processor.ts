import * as XLSX from 'xlsx'
import { importarVendas } from './db'

function safeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function safeStr(val: unknown, maxlen = 255): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' ? null : s.substring(0, maxlen)
}

function safeDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

// Mapeamento oficial CODTIPOP → tipo de receita do sistema
const CODTIPOP_TIPO: Record<number, 'VENDA_FIRME' | 'FORECAST' | 'NOVO_PROJETO' | 'DEVOLUCAO' | 'IGNORAR'> = {
  1101: 'VENDA_FIRME',   // VENDA NF-E
  1125: 'VENDA_FIRME',   // VENDA NF-E CONTA E ORDEM
  1121: 'VENDA_FIRME',   // VENDA NF-E - EXPORTAÇÃO
  1133: 'VENDA_FIRME',   // VENDA NF-E CONTA E ORDEM SEM BAIXA DE ESTOQUE
  1001: 'VENDA_FIRME',   // PEDIDO DE VENDA
  1013: 'VENDA_FIRME',   // PEDIDO DE VENDA - CONTA E ORDEM
  1011: 'VENDA_FIRME',   // PEDIDO DE VENDA - EXPORTAÇÃO EURO
  1172: 'VENDA_FIRME',   // VENDA NF-E - SEM MOVIMENTAÇÃO DE ESTOQUE
  1012: 'VENDA_FIRME',   // PEDIDO DE VENDA - ECOMMERCE INDUSTRIAL
  1202: 'DEVOLUCAO',     // DEVOLUÇÃO DE VENDA DE MERCADORIAS - NF TERCEIROS
  1201: 'DEVOLUCAO',     // DEVOLUÇÃO DE VENDA - NF PRÓPRIA
  1299: 'DEVOLUCAO',     // DEVOLUÇÃO DE VENDA - EXPORTAÇÃO
  1204: 'DEVOLUCAO',     // DEVOLUÇÃO DE VENDA - NF PRÓPRIA (ANULAÇÃO)
  1020: 'FORECAST',      // PEDIDO DE VENDA - MÃE
  1025: 'NOVO_PROJETO',  // PEDIDO DE VENDA MÃE - NOVOS PROJETOS
  1023: 'IGNORAR',       // PEDIDO DE VENDA - MÃE (ESTOQUE MÍNIMO) — não considerar
}

function classificarTipoReceita(
  tipmov: string,
  descroper?: string | null,
  codTipop?: number | null,
): 'VENDA_FIRME' | 'FORECAST' | 'NOVO_PROJETO' | 'DEVOLUCAO' | 'IGNORAR' {
  // 1. Classificação precisa por CODTIPOP (fonte de verdade)
  if (codTipop != null && CODTIPOP_TIPO[codTipop] !== undefined) {
    return CODTIPOP_TIPO[codTipop]
  }

  // 2. Fallback por TIPMOV + descrição (compatibilidade com planilhas sem CODTIPOP)
  const mov = (tipmov ?? '').trim().toUpperCase()
  const op  = (descroper ?? '').toUpperCase()
  if (mov === 'D') return 'DEVOLUCAO'
  if (op.includes('NOVO PROJETO') || op.includes('NOVOPROJETO')) return 'NOVO_PROJETO'
  if (op.includes('ESTOQUE MINIM')) return 'IGNORAR'
  if (mov === 'P') return 'FORECAST'
  return 'VENDA_FIRME'
}

export async function processarExcel(base64: string, uploadId: number) {
  const buffer = Buffer.from(base64, 'base64')
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  const registros: Parameters<typeof importarVendas>[0] = []
  let erros = 0

  for (const row of rows) {
    try {
      const codParc = safeNum(row['CODPARC'] ?? row['cod_parc'])
      const codProduto = safeNum(row['REFERENCIA'] ?? row['cod_produto'])
      const nroUnico = safeNum(row['NUNOTA'] ?? row['nro_unico'])
      const tipmov = safeStr(row['TIPMOV'] ?? row['tipmov'], 1) ?? 'V'
      const codTipop = safeNum(row['CODTIPOP'] ?? row['cod_tipop'])

      if (!codParc || !codProduto || !nroUnico) { erros++; continue }

      const tipoReceita = classificarTipoReceita(tipmov, safeStr(row['DESCROPER'] ?? row['top']), codTipop)
      if (tipoReceita === 'IGNORAR') continue  // PEDIDO DE VENDA - MÃE (ESTOQUE MÍNIMO) e similares

      registros.push({
        nroUnico: nroUnico,
        nroNota: safeNum(row['NUMNOTA'] ?? row['nro_nota']),
        tipmov: tipmov as 'V' | 'D' | 'P',
        tipoReceita: tipoReceita as 'VENDA_FIRME' | 'FORECAST' | 'NOVO_PROJETO' | 'DEVOLUCAO',
        dtNeg: safeDate(row['DTNEG'] ?? row['dt_neg']),
        dtPrevEntregaEmbarque: safeDate(row['DTPREVENT'] ?? row['dt_prev_entrega_embarque']),
        dtMov: safeDate(row['DTMOV'] ?? row['dt_mov']),
        codParc,
        codProduto,
        nomeVendedor: safeStr(row['VENDEDOR'] ?? row['REPRESENTANTE'] ?? row['nome_vendedor'], 100),
        projeto: safeStr(row['PROJETO'] ?? row['projeto'], 100),
        mercadoVendas: safeStr(row['AD_MERCADO_VENDAS'] ?? row['mercado_vendas'], 100),
        grupoProduto: safeStr(row['DESCRGRUPOPROD'] ?? row['grupo_produto'], 100),
        perfilParceiro: safeStr(row['PERFILPARC'] ?? row['perfil_parceiro'], 100),
        uf: safeStr(row['UF'] ?? row['uf'], 2),
        top: safeStr(row['DESCROPER'] ?? row['top'], 150),
        codTipop: codTipop,
        qtdNegociada: safeNum(row['QTDNEG'] ?? row['qtd_negociada']),
        qtdPendenteKg: (() => {
          const v = safeNum(row['PESOLIQ'] ?? row['QTDPENDENTE'] ?? row['qtd_pendente_kg'])
          if (v === null) return null
          return tipmov === 'D' ? -Math.abs(v) : Math.abs(v)
        })(),
        valorPendente: safeNum(row['ValorPendente'] ?? row['valor_pendente']),
        valorIcms: safeNum(row['VLRICMS'] ?? row['valor_icms']),
        valorPis: safeNum(row['VLR_PIS'] ?? row['valor_pis']),
        valorCofins: safeNum(row['VLR_COFINS'] ?? row['valor_cofins']),
        vlrSt: safeNum(row['VLR_ST'] ?? row['vlr_st']),
        percDescBonificado: safeNum(row['PERCDESCBONIF'] ?? row['perc_desc_bonificado']),
        flagDevolucao: tipmov === 'D',
      })
    } catch {
      erros++
    }
  }

  const importados = await importarVendas(registros, uploadId)
  return { total: rows.length, importados, erros }
}
