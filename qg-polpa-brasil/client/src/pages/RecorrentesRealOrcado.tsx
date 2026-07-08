import { Fragment, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatKg } from '../lib/utils'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import {
  getRecorrentesKpis,
  getRecorrentesProdutos,
  getRecorrentesTabela,
  type RecorrentesFiltros,
} from '../lib/api'

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

const LINHAS_VISIVEIS = 25
const ALTURA_LINHA_PX = 37
const ALTURA_CABECALHO_PX = 38
const ALTURA_TOTAIS_PX = 40
const ALTURA_TABELA_PX = ALTURA_CABECALHO_PX + ALTURA_TOTAIS_PX + LINHAS_VISIVEIS * ALTURA_LINHA_PX

type SortKey = 'razaoSocial' | 'volAtual' | 'pctVol' | 'orcKg' | 'pctKg' | 'fatAtual' | 'pctFat' | 'orcVal' | 'pctVal' | 'dif'
type SortDir = 'asc' | 'desc'

function pctColor(v: number) { return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-slate-400' }
function difColor(v: number) { return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-slate-400' }
function fmtPct(v: number)   { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%' }
function calcPct(real: number, orc: number): number | null {
  return orc === 0 ? null : ((real - orc) / orc) * 100
}

function SortTh({ label, col, cur, dir, onSort, left }: {
  label: string; col: SortKey; cur: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; left?: boolean
}) {
  const active = col === cur
  return (
    <th onClick={() => onSort(col)}
      className={`px-2 py-2.5 whitespace-nowrap cursor-pointer select-none transition-colors text-[10px] font-semibold uppercase tracking-wider
        ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
        ${left ? 'text-left' : 'text-right'}`}>
      <span className={`flex items-center gap-1 ${left ? '' : 'justify-end'}`}>
        {label}
        <span className="font-normal opacity-70">{active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </span>
    </th>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: any; color: string
}) {
  return (
    <div className={`bg-slate-800 border border-slate-700 border-l-4 ${color} rounded-xl px-5 py-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/60">
          <Icon className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>
      <p className="text-xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}

function ProdutosRow({ codParc, filtros }: { codParc: number; filtros: RecorrentesFiltros }) {
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['recorrentes', 'produtos', codParc, filtros],
    queryFn: () => getRecorrentesProdutos(codParc, filtros),
    staleTime: 60_000,
  })
  const totalVolReal = (produtos ?? []).reduce((s, p) => s + Number(p.volAtual), 0)

  if (isLoading) return (
    <tr><td colSpan={10} className="px-4 py-2 text-center text-slate-500 text-xs">Carregando produtos...</td></tr>
  )
  return (
    <>
      {(produtos ?? []).map(p => {
        const vol = Number(p.volAtual), orcKg = Number(p.orcKg)
        const fat = Number(p.fatAtual), orcVal = Number(p.orcVal)
        const pctKg  = calcPct(vol, orcKg)
        const pctVal = calcPct(fat, orcVal)
        const dif    = fat - orcVal
        const pctVol = totalVolReal > 0 ? (vol / totalVolReal) * 100 : 0
        return (
          <tr key={p.codProduto} className="bg-slate-900/50 border-l-2 border-l-slate-600 text-[11px]">
            <td className="pl-8 pr-2 py-1.5 text-slate-300 min-w-[200px] max-w-[240px]">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                <span className="truncate">{p.nomeProduto}</span>
              </span>
            </td>
            <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{vol.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-2 py-1.5 text-right text-slate-400 whitespace-nowrap">{pctVol.toFixed(1)}%</td>
            <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{orcKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className={`px-2 py-1.5 text-right font-semibold whitespace-nowrap ${pctKg != null ? pctColor(pctKg) : 'text-slate-500'}`}>{pctKg != null ? fmtPct(pctKg) : '—'}</td>
            <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{formatCurrency(fat)}</td>
            <td className="px-2 py-1.5 text-right text-slate-400">—</td>
            <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{formatCurrency(orcVal)}</td>
            <td className={`px-2 py-1.5 text-right font-semibold whitespace-nowrap ${pctVal != null ? pctColor(pctVal) : 'text-slate-500'}`}>{pctVal != null ? fmtPct(pctVal) : '—'}</td>
            <td className={`px-2 py-1.5 text-right font-semibold whitespace-nowrap ${difColor(dif)}`}>{formatCurrency(dif)}</td>
          </tr>
        )
      })}
    </>
  )
}

export default function RecorrentesRealOrcado() {
  const [filtrosGlobais, setFiltrosGlobais] = useState<Filtros>(DEFAULT_FILTROS)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [sortKey,  setSortKey]  = useState<SortKey>('volAtual')
  const [sortDir,  setSortDir]  = useState<SortDir>('desc')

  const filtros = useMemo<RecorrentesFiltros>(() => ({
    dataInicio:    filtrosGlobais.dataInicio,
    dataFim:       filtrosGlobais.dataFim,
    periodos:      filtrosGlobais.periodos?.length ? filtrosGlobais.periodos : undefined,
    mercados:      filtrosGlobais.mercados?.length ? filtrosGlobais.mercados : undefined,
    vendedores:    filtrosGlobais.vendedores?.length ? filtrosGlobais.vendedores : undefined,
    codParcs:      filtrosGlobais.codParcs?.length ? filtrosGlobais.codParcs : undefined,
    gruposProduto: filtrosGlobais.gruposProduto?.length ? filtrosGlobais.gruposProduto : undefined,
    codProdutos:   filtrosGlobais.codProdutos?.length ? filtrosGlobais.codProdutos : undefined,
  }), [filtrosGlobais])

  const { data: kpis,   isLoading: kpiLoad   } = useQuery({
    queryKey: ['recorrentes', 'kpis', filtros],
    queryFn: () => getRecorrentesKpis(filtros),
    staleTime: 60_000,
  })
  const { data: tabela, isLoading: tabelaLoad } = useQuery({
    queryKey: ['recorrentes', 'tabela', filtros],
    queryFn: () => getRecorrentesTabela(filtros),
    staleTime: 60_000,
  })

  const totalVolReal = useMemo(() => (tabela ?? []).reduce((s, r) => s + Number(r.volAtual), 0), [tabela])
  const totalFatReal = useMemo(() => (tabela ?? []).reduce((s, r) => s + Number(r.fatAtual), 0), [tabela])

  const sortedData = useMemo(() => {
    const rows = (tabela ?? []).map(row => {
      const vol    = Number(row.volAtual), orcKg  = Number(row.orcKg)
      const fat    = Number(row.fatAtual), orcVal = Number(row.orcVal)
      const pctVol = totalVolReal > 0 ? (vol / totalVolReal) * 100 : 0
      const pctFat = totalFatReal > 0 ? (fat / totalFatReal) * 100 : 0
      const pctKg  = calcPct(vol, orcKg) ?? -Infinity
      const pctVal = calcPct(fat, orcVal) ?? -Infinity
      const dif    = fat - orcVal
      return { ...row, vol, orcKg, fat, orcVal, pctVol, pctFat, pctKg, pctVal, dif }
    })

    return [...rows].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0
      switch (sortKey) {
        case 'razaoSocial': av = a.razaoSocial; bv = b.razaoSocial; break
        case 'volAtual':    av = a.vol;    bv = b.vol;    break
        case 'pctVol':      av = a.pctVol; bv = b.pctVol; break
        case 'orcKg':       av = a.orcKg;  bv = b.orcKg;  break
        case 'pctKg':       av = a.pctKg;  bv = b.pctKg;  break
        case 'fatAtual':    av = a.fat;    bv = b.fat;    break
        case 'pctFat':      av = a.pctFat; bv = b.pctFat; break
        case 'orcVal':      av = a.orcVal; bv = b.orcVal; break
        case 'pctVal':      av = a.pctVal; bv = b.pctVal; break
        case 'dif':         av = a.dif;    bv = b.dif;    break
      }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return sortDir === 'asc' ? av - (bv as number) : (bv as number) - av
    })
  }, [tabela, sortKey, sortDir, totalVolReal, totalFatReal])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const sp = { cur: sortKey, dir: sortDir, onSort: handleSort }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Recorrentes — Real x Orçado</h1>
        <p className="text-slate-400 text-sm mt-0.5">Comparativo entre faturamento realizado e orçamento do projeto Recorrentes</p>
      </div>

      <FiltrosGlobais filtros={filtrosGlobais} onChange={setFiltrosGlobais} showProjetos={false} showTipoReceita={false} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Faturamento Real" icon={DollarSign} color="border-l-green-500"
          value={kpiLoad ? '—' : formatCurrency(kpis?.fatAtual ?? 0)}
          sub={kpis && kpis.orcVal > 0 ? `${fmtPct(((kpis.fatAtual - kpis.orcVal) / kpis.orcVal) * 100)} vs Orçado` : undefined} />
        <KpiCard label="Volume Real (KG)" icon={TrendingUp} color="border-l-blue-500"
          value={kpiLoad ? '—' : formatKg(kpis?.volAtual ?? 0)}
          sub={kpis && kpis.orcKg > 0 ? `${fmtPct(((kpis.volAtual - kpis.orcKg) / kpis.orcKg) * 100)} vs Orçado` : undefined} />
        <KpiCard label="Orçamento" icon={Package} color="border-l-slate-500"
          value={kpiLoad ? '—' : formatCurrency(kpis?.orcVal ?? 0)} />
        <KpiCard label="Orçamento KG" icon={TrendingDown} color="border-l-slate-500"
          value={kpiLoad ? '—' : formatKg(kpis?.orcKg ?? 0)} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: `${ALTURA_TABELA_PX}px` }}>
          <table className="w-full text-xs min-w-[960px]">
            <thead className="sticky top-0 z-20 bg-slate-900">
              <tr className="border-b border-slate-700 bg-slate-900/40">
                <SortTh label="Código — Cliente"  col="razaoSocial" {...sp} left />
                <SortTh label="Vol. Real KG"      col="volAtual"    {...sp} />
                <SortTh label="% Vol"             col="pctVol"      {...sp} />
                <SortTh label="Orç. KG"           col="orcKg"       {...sp} />
                <SortTh label="Δ KG"              col="pctKg"       {...sp} />
                <SortTh label="Fat. Real R$"      col="fatAtual"    {...sp} />
                <SortTh label="% Fat"             col="pctFat"      {...sp} />
                <SortTh label="Orç. R$"           col="orcVal"      {...sp} />
                <SortTh label="Δ R$"              col="pctVal"      {...sp} />
                <SortTh label="Dif. R$"           col="dif"         {...sp} />
              </tr>

              {/* Linha de totais — fixa no topo, junto com o cabeçalho */}
              {!tabelaLoad && sortedData.length > 0 && (() => {
                const tVol  = sortedData.reduce((s, r) => s + r.vol, 0)
                const tOrcKg = sortedData.reduce((s, r) => s + r.orcKg, 0)
                const tFat  = sortedData.reduce((s, r) => s + r.fat, 0)
                const tOrc  = sortedData.reduce((s, r) => s + r.orcVal, 0)
                const pKg   = calcPct(tVol, tOrcKg)
                const pVal  = calcPct(tFat, tOrc)
                const dif   = tFat - tOrc
                const fmt2  = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                return (
                  <tr className="sticky top-[38px] z-20 border-b-2 border-slate-600 bg-slate-900/95 font-semibold text-white text-xs">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">{fmt2(tVol)}</td>
                    <td className="px-2 py-2.5 text-right text-slate-400">100%</td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">{fmt2(tOrcKg)}</td>
                    <td className={`px-2 py-2.5 text-right whitespace-nowrap ${pKg != null ? pctColor(pKg) : ''}`}>{pKg != null ? fmtPct(pKg) : '—'}</td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">{formatCurrency(tFat)}</td>
                    <td className="px-2 py-2.5 text-right text-slate-400">100%</td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">{formatCurrency(tOrc)}</td>
                    <td className={`px-2 py-2.5 text-right whitespace-nowrap ${pVal != null ? pctColor(pVal) : ''}`}>{pVal != null ? fmtPct(pVal) : '—'}</td>
                    <td className={`px-2 py-2.5 text-right whitespace-nowrap ${difColor(dif)}`}>{formatCurrency(dif)}</td>
                  </tr>
                )
              })()}
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {tabelaLoad && (
                <tr><td colSpan={10} className="text-center py-8 text-slate-500">Carregando...</td></tr>
              )}
              {!tabelaLoad && sortedData.map(row => {
                const isOpen = expanded.has(row.codParc)
                const fmt2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                return (
                  <Fragment key={row.codParc}>
                    <tr onClick={() => toggle(row.codParc)}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer group">
                      <td className="px-3 py-2 text-white font-semibold min-w-[200px] max-w-[240px]">
                        <span className="flex items-center gap-1.5">
                          {isOpen
                            ? <ChevronDown className="w-3 h-3 text-green-400 shrink-0" />
                            : <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-200 shrink-0" />}
                          <span className="truncate">{row.codParc} — {row.razaoSocial}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap">{fmt2(row.vol)}</td>
                      <td className="px-2 py-2 text-right text-slate-400 whitespace-nowrap">{row.pctVol.toFixed(1)}%</td>
                      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap">{fmt2(row.orcKg)}</td>
                      <td className={`px-2 py-2 text-right font-semibold whitespace-nowrap ${row.pctKg !== -Infinity ? pctColor(row.pctKg) : 'text-slate-500'}`}>{row.pctKg !== -Infinity ? fmtPct(row.pctKg) : '—'}</td>
                      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap">{formatCurrency(row.fat)}</td>
                      <td className="px-2 py-2 text-right text-slate-400 whitespace-nowrap">{row.pctFat.toFixed(1)}%</td>
                      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap">{formatCurrency(row.orcVal)}</td>
                      <td className={`px-2 py-2 text-right font-semibold whitespace-nowrap ${row.pctVal !== -Infinity ? pctColor(row.pctVal) : 'text-slate-500'}`}>{row.pctVal !== -Infinity ? fmtPct(row.pctVal) : '—'}</td>
                      <td className={`px-2 py-2 text-right font-semibold whitespace-nowrap ${difColor(row.dif)}`}>{formatCurrency(row.dif)}</td>
                    </tr>
                    {isOpen && <ProdutosRow codParc={row.codParc} filtros={filtros} />}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}