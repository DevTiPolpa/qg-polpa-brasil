import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency } from '../lib/utils'
import { History, ChevronRight, ChevronDown, Camera, AlertCircle, ArrowUpDown, Filter } from 'lucide-react'
import {
  getSnapshotDatas,
  getSnapshotHistorico,
  getSnapshotHistoricoProdutos,
  type SnapshotClienteRow,
  type SnapshotProdutoRow,
} from '../lib/api'

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

const LINHAS_VISIVEIS = 25
const ALTURA_LINHA_PX = 38
const ALTURA_CABECALHO_PX = 40
const ALTURA_TOTAIS_PX = 40
const ALTURA_TABELA_PX = ALTURA_CABECALHO_PX + ALTURA_TOTAIS_PX + LINHAS_VISIVEIS * ALTURA_LINHA_PX

// Variação = Atual - semana anterior (último snapshot disponível antes do "Atual")
function deltaVsSemanaAnterior(currValor: number, dates: string[], snapshots: Record<string, { valor: number }>) {
  const semanaAnterior = dates.length > 0 ? (snapshots[dates[dates.length - 1]]?.valor ?? 0) : 0
  return currValor - semanaAnterior
}

// Formata "2026-05-23" → "23/05"
function fmtDate(iso: string) {
  const [, mm, dd] = iso.split('-')
  return `${dd}/${mm}`
}

// Formata "2026-05-23" → "Sex 23/05/26"
function fmtDateFull(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })
}

function compact(v: number) {
  if (v === 0) return null
  return formatCurrency(v)
}

// Uma célula de valor + delta em relação à coluna anterior
function ValCell({ valor, prev, highlight }: { valor: number; prev: number | null; highlight?: boolean }) {
  const formatted = compact(valor)
  const diff = prev !== null ? valor - prev : null
  const hasDiff = diff !== null && Math.abs(diff) > 50

  if (!formatted && !hasDiff) return <td className="px-2 py-2 text-center text-slate-700 text-xs">—</td>

  const diffColor = hasDiff ? (diff! > 0 ? 'text-green-400' : 'text-red-400') : ''
  const bgColor   = highlight ? (hasDiff && diff! > 0 ? 'bg-green-900/20' : hasDiff && diff! < 0 ? 'bg-red-900/20' : '') : ''

  return (
    <td className={`px-2 py-2 text-right whitespace-nowrap ${bgColor}`}>
      <div className={`text-xs font-semibold ${highlight ? 'text-white' : 'text-slate-300'}`}>
        {formatted ?? '—'}
      </div>
      {hasDiff && (
        <div className={`text-[10px] ${diffColor} leading-none mt-0.5`}>
          {diff! > 0 ? '↑' : '↓'} {compact(Math.abs(diff!)) ?? ''}
        </div>
      )}
    </td>
  )
}

// Linha de cliente (expansível)
function ClienteRow({ row, dates, filtros }: { row: SnapshotClienteRow; dates: string[]; filtros: Filtros }) {
  const [expanded, setExpanded] = useState(false)
  const { data: detalhe } = useQuery({
    queryKey: ['snapshot', 'historico-produtos', row.codParc, filtros],
    queryFn: () => getSnapshotHistoricoProdutos(row.codParc, filtros),
    enabled: expanded,
    staleTime: 60_000,
  })

  const deltaTotal = deltaVsSemanaAnterior(row.currValor, dates, row.snapshots)

  return (
    <>
      <tr
        className="hover:bg-slate-700/30 cursor-pointer transition-colors border-b border-slate-700/30"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Nome */}
        <td className="px-3 py-2 sticky left-0 bg-slate-800 z-10 border-r border-slate-700/40">
          <span className="flex items-center gap-1.5">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
            <span className="text-sm text-white font-medium truncate max-w-[220px]">
              {row.razaoSocial ?? `Cliente ${row.codParc}`}
            </span>
          </span>
        </td>

        {/* Uma coluna por snapshot */}
        {dates.map((d, i) => {
          const v = row.snapshots[d]?.valor ?? 0
          const prev = i === 0 ? null : (row.snapshots[dates[i - 1]]?.valor ?? 0)
          return <ValCell key={d} valor={v} prev={prev} />
        })}

        {/* Atual */}
        {(() => {
          const prev = dates.length > 0 ? (row.snapshots[dates[dates.length - 1]]?.valor ?? 0) : null
          return <ValCell valor={row.currValor} prev={prev} highlight />
        })()}

        {/* Δ Total */}
        <td className="px-2 py-2 text-right whitespace-nowrap border-l border-slate-700/40">
          {Math.abs(deltaTotal) < 50
            ? <span className="text-slate-600 text-xs">—</span>
            : <span className={`text-xs font-bold ${deltaTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {deltaTotal > 0 ? '+' : ''}{compact(deltaTotal)}
              </span>
          }
        </td>
      </tr>

      {/* Linhas de produto (expansão) */}
      {expanded && (detalhe?.rows ?? []).map((p: SnapshotProdutoRow) => {
        const pDelta = deltaVsSemanaAnterior(p.currValor, dates, p.snapshots)
        return (
          <tr key={p.codProduto} className="bg-slate-900/50 border-b border-slate-700/20">
            <td className="pl-10 pr-3 py-1.5 sticky left-0 bg-slate-900/50 z-10 border-r border-slate-700/40">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                <span className="text-slate-500 text-[10px] tabular-nums shrink-0">{p.codProduto}</span>
                <span className="text-slate-300 text-[11px] truncate max-w-[180px]">{p.nomeProduto ?? '—'}</span>
              </span>
            </td>
            {dates.map((d, i) => {
              const v = p.snapshots[d]?.valor ?? 0
              const prev = i === 0 ? null : (p.snapshots[dates[i - 1]]?.valor ?? 0)
              return <ValCell key={d} valor={v} prev={prev} />
            })}
            {(() => {
              const prev = dates.length > 0 ? (p.snapshots[dates[dates.length - 1]]?.valor ?? 0) : null
              return <ValCell valor={p.currValor} prev={prev} highlight />
            })()}
            <td className="px-2 py-1.5 text-right border-l border-slate-700/40">
              {Math.abs(pDelta) < 50
                ? <span className="text-slate-600 text-[10px]">—</span>
                : <span className={`text-[10px] font-semibold ${pDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pDelta > 0 ? '+' : ''}{compact(pDelta)}
                  </span>
              }
            </td>
          </tr>
        )
      })}
    </>
  )
}

export default function SnapshotComparativo() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)
  const [ordemDesc, setOrdemDesc] = useState(true)
  const [apenasComVariacao, setApenasComVariacao] = useState(false)

  const { data: info } = useQuery({
    queryKey: ['snapshot', 'datas'],
    queryFn: getSnapshotDatas,
    staleTime: 60_000,
  })
  const { data, isLoading } = useQuery({
    queryKey: ['snapshot', 'historico', filtros],
    queryFn: () => getSnapshotHistorico(filtros),
    staleTime: 60_000,
  })

  const dates  = data?.dates ?? []
  const rows   = data?.rows  ?? []
  const hasDates = dates.length > 0

  const rowsExibidas = useMemo(() => {
    let lista = rows
    if (apenasComVariacao) {
      lista = lista.filter(r => Math.abs(deltaVsSemanaAnterior(r.currValor, dates, r.snapshots)) > 50)
    }
    lista = [...lista].sort((a, b) => ordemDesc ? b.currValor - a.currValor : a.currValor - b.currValor)
    return lista
  }, [rows, dates, apenasComVariacao, ordemDesc])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-violet-400" />
            Comparativo Semanal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Evolução da previsão de vendas — uma coluna por semana · dados fixados toda quarta-feira às 08h30
          </p>
        </div>

        {/* Info snapshots */}
        {(info ?? []).length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
            <Camera className="w-4 h-4 text-violet-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Snapshots disponíveis</p>
              <p className="text-sm font-semibold text-white">{info!.length} {info!.length === 1 ? 'semana' : 'semanas'}</p>
              <p className="text-[10px] text-slate-500">
                {fmtDateFull(info![info!.length - 1].snapshotDate)} → {fmtDateFull(info![0].snapshotDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      <FiltrosGlobais filtros={filtros} onChange={setFiltros} showTipoReceita />

      {/* Sem dados */}
      {!isLoading && !hasDates && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <AlertCircle className="w-10 h-10 text-slate-500" />
          <div className="text-center">
            <p className="text-white font-semibold">Nenhum snapshot disponível</p>
            <p className="text-slate-400 text-sm mt-1">
              O sistema congela automaticamente toda quarta-feira às 08h30.
            </p>
          </div>
        </div>
      )}

      {/* Tabela pivot */}
      {(hasDates || isLoading) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-3 flex-wrap">
            <p className="text-sm font-semibold text-white">Evolução por Cliente</p>
            <span className="text-xs text-slate-500">{rowsExibidas.length} de {rows.length} clientes</span>

            <button
              onClick={() => setOrdemDesc(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-md px-2.5 py-1 transition-colors"
              title="Ordenar pelo valor Atual"
            >
              <ArrowUpDown className="w-3 h-3" />
              {ordemDesc ? 'Maior → Menor' : 'Menor → Maior'}
            </button>

            <button
              onClick={() => setApenasComVariacao(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2.5 py-1 border transition-colors ${
                apenasComVariacao
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                  : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
              }`}
              title="Mostrar apenas quem teve variação em relação à semana anterior"
            >
              <Filter className="w-3 h-3" />
              Apenas com variação
            </button>

            <span className="ml-auto text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-green-500/50" /> aumento vs. semana anterior
              <span className="w-2 h-2 rounded-sm bg-red-500/50 ml-2" /> redução
            </span>
          </div>

          <div className="overflow-auto" style={{ maxHeight: `${ALTURA_TABELA_PX}px` }}>
            <table className="w-full text-xs" style={{ minWidth: `${280 + dates.length * 110 + 120 + 90}px` }}>
              <thead className="bg-slate-800 sticky top-0 z-20">
                <tr className="border-b border-slate-700">
                  {/* Cliente */}
                  <th className="text-left px-3 py-2.5 font-medium text-slate-400 sticky left-0 bg-slate-800 z-20 border-r border-slate-700/40 w-[260px]">
                    Cliente
                  </th>
                  {/* Uma coluna por snapshot */}
                  {dates.map(d => (
                    <th key={d} className="text-right px-2 py-2.5 font-medium text-violet-400 w-[110px] whitespace-nowrap">
                      {fmtDateFull(d)}
                    </th>
                  ))}
                  {/* Atual */}
                  <th className="text-right px-2 py-2.5 font-semibold text-green-400 w-[110px] whitespace-nowrap">
                    Atual
                  </th>
                  {/* Variação */}
                  <th className="text-right px-2 py-2.5 font-medium text-slate-400 w-[90px] border-l border-slate-700/40 whitespace-nowrap">
                    Variação
                  </th>
                </tr>

                {/* Linha de somatória — fixa no topo, junto com o cabeçalho */}
                {!isLoading && rowsExibidas.length > 0 && (() => {
                  const totSnap: Record<string, number> = {}
                  dates.forEach(d => { totSnap[d] = rowsExibidas.reduce((s, r) => s + (r.snapshots[d]?.valor ?? 0), 0) })
                  const totCurr = rowsExibidas.reduce((s, r) => s + r.currValor, 0)
                  const semanaAnteriorTotal = dates.length > 0 ? (totSnap[dates[dates.length - 1]] ?? 0) : 0
                  const totDelta = totCurr - semanaAnteriorTotal
                  return (
                    <tr className="border-b-2 border-slate-600 bg-slate-700/40 sticky top-[40px] z-20">
                      <td className="px-3 py-2.5 sticky left-0 bg-slate-700/60 z-20 border-r border-slate-600 font-semibold text-slate-300 text-xs">
                        TOTAL
                      </td>
                      {dates.map((d, i) => {
                        const tot = totSnap[d]
                        const prev = i === 0 ? null : totSnap[dates[i - 1]]
                        const diff = prev !== null ? tot - prev : null
                        return (
                          <td key={d} className="px-2 py-2.5 text-right whitespace-nowrap">
                            <div className="text-xs font-bold text-slate-200">{compact(tot) ?? '—'}</div>
                            {diff !== null && Math.abs(diff) > 50 && (
                              <div className={`text-[10px] leading-none mt-0.5 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {diff > 0 ? '↑' : '↓'} {compact(Math.abs(diff))}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      {/* Total Atual */}
                      {(() => {
                        const prev = dates.length > 0 ? totSnap[dates[dates.length - 1]] : null
                        const diff = prev !== null ? totCurr - prev : null
                        return (
                          <td className="px-2 py-2.5 text-right whitespace-nowrap">
                            <div className="text-xs font-bold text-green-300">{compact(totCurr) ?? '—'}</div>
                            {diff !== null && Math.abs(diff) > 50 && (
                              <div className={`text-[10px] leading-none mt-0.5 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {diff > 0 ? '↑' : '↓'} {compact(Math.abs(diff))}
                              </div>
                            )}
                          </td>
                        )
                      })()}
                      {/* Variação total */}
                      <td className="px-2 py-2.5 text-right border-l border-slate-600 whitespace-nowrap">
                        <span className={`text-xs font-bold ${totDelta > 0 ? 'text-green-400' : totDelta < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {Math.abs(totDelta) < 50 ? '—' : `${totDelta > 0 ? '+' : ''}${compact(totDelta)}`}
                        </span>
                      </td>
                    </tr>
                  )
                })()}
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-700/30 animate-pulse">
                        <td className="px-3 py-2 sticky left-0 bg-slate-800 border-r border-slate-700/40">
                          <div className="h-3 bg-slate-700 rounded w-40" />
                        </td>
                        {Array.from({ length: dates.length + 2 }).map((_, j) => (
                          <td key={j} className="px-2 py-2">
                            <div className="h-3 bg-slate-700 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rowsExibidas.map((row: SnapshotClienteRow) => (
                      <ClienteRow key={row.codParc} row={row} dates={dates} filtros={filtros} />
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}