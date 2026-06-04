import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, Legend,
} from 'recharts'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency, formatNumber, formatMes } from '../lib/utils'
import {
  getNovosProjetosDrilldown,
  getNovosProjetosKpis,
  getNovosProjetosLista,
  getNovosProjetosPorMes,
  type NovosProjetosItem,
} from '../lib/api'
import {
  FolderOpen, TrendingUp, RefreshCw, DollarSign, X, ChevronRight,
  ChevronDown, ArrowUpRight, Clock, Zap,
} from 'lucide-react'

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

function formatCurrencyK(value: number) {
  if (Math.abs(value) >= 1_000_000) return `R$${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  if (Math.abs(value) >= 1_000) return `R$${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`
  return formatCurrency(value)
}

function formatKg(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}Mt`
  if (v >= 1_000) return `${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}t`
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
}

function labelMesCiclo(n: number) {
  if (n <= 0) return 'M1'
  if (n >= 13) return `M${n}+`
  return `M${n}`
}

function cycleColor(mes: number) {
  if (mes <= 3)  return 'text-violet-400 bg-violet-900/30 border-violet-700/40'
  if (mes <= 9)  return 'text-blue-400 bg-blue-900/30 border-blue-700/40'
  if (mes <= 12) return 'text-amber-400 bg-amber-900/30 border-amber-700/40'
  return 'text-green-400 bg-green-900/30 border-green-700/40'
}

function statusBadge(status: string) {
  return status === 'Recorrente'
    ? 'bg-green-900/40 text-green-400 border border-green-700/40'
    : 'bg-blue-900/40 text-blue-400 border border-blue-700/40'
}

function origemBadge(origem: string) {
  return origem === 'TESTE INDUSTRIAL'
    ? 'bg-orange-900/30 text-orange-400 border border-orange-700/40'
    : 'bg-slate-700/60 text-slate-400 border border-slate-600/40'
}

type ProjetoItem = NovosProjetosItem

interface ClickableCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  active: boolean
  color: 'blue' | 'green'
  onClick: () => void
}

function ClickableCard({ icon, label, value, sub, active, color, onClick }: ClickableCardProps) {
  const ring = color === 'blue'
    ? active ? 'border-blue-500 bg-blue-900/20 shadow-blue-900/30 shadow-lg' : 'border-slate-700 hover:border-blue-600/50 hover:bg-blue-900/10'
    : active ? 'border-green-500 bg-green-900/20 shadow-green-900/30 shadow-lg' : 'border-slate-700 hover:border-green-600/50 hover:bg-green-900/10'
  const iconRing = color === 'blue'
    ? active ? 'bg-blue-600/30' : 'bg-slate-700'
    : active ? 'bg-green-600/30' : 'bg-slate-700'
  const valueColor = active
    ? (color === 'blue' ? 'text-blue-300' : 'text-green-300')
    : 'text-white'

  return (
    <button
      onClick={onClick}
      className={`bg-slate-800 border rounded-xl px-4 py-3 flex items-center gap-3 w-full text-left transition-all duration-150 cursor-pointer ${ring}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconRing}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
          {label}
          {active && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-current/10 text-current opacity-70">ativo</span>}
        </p>
        <p className={`text-xl font-bold leading-tight transition-colors ${valueColor}`}>{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <ArrowUpRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${active ? (color === 'blue' ? 'text-blue-400' : 'text-green-400') : 'text-slate-600'}`} />
    </button>
  )
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 truncate">{label}</p>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  )
}

const queryOpts = { staleTime: 2 * 60 * 1000 }

export default function NovosProjetos() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)
  const [selectedCard, setSelectedCard] = useState<'abertos' | 'totais' | null>(null)
  const [drilldownMes, setDrilldownMes] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const baseInput = useMemo(() => ({ ...filtros, projetos: [] as string[] }), [filtros])
  const modoInput = useMemo(() => ({ ...baseInput, modoCard: (selectedCard ?? 'totais') as 'abertos' | 'totais' }), [baseInput, selectedCard])
  // kpisInput só inclui modoCard quando um card está ativo; undefined aciona soma direta no backend
  const kpisInput = useMemo(() => selectedCard ? { ...baseInput, modoCard: selectedCard } : baseInput, [baseInput, selectedCard])

  const { data: kpis } = useQuery({
    queryKey: ['novos-projetos', 'kpis', kpisInput],
    queryFn: () => getNovosProjetosKpis(kpisInput),
    ...queryOpts,
  })
  const { data: porMes } = useQuery({
    queryKey: ['novos-projetos', 'por-mes', modoInput],
    queryFn: () => getNovosProjetosPorMes(modoInput),
    ...queryOpts,
  })
  const { data: lista } = useQuery({
    queryKey: ['novos-projetos', 'lista', modoInput],
    queryFn: () => getNovosProjetosLista(modoInput),
    ...queryOpts,
  })
  const { data: drilldown, isLoading: drilldownLoading } = useQuery({
    queryKey: ['novos-projetos', 'drilldown', drilldownMes, baseInput],
    queryFn: () => getNovosProjetosDrilldown(drilldownMes ?? '', baseInput),
    enabled: !!drilldownMes,
    ...queryOpts,
  })

  const porMesChart = useMemo(() =>
    (porMes ?? []).map(r => ({
      mes: r.mes,
      mesLabel: formatMes(r.mes),
      projetos: Number(r.projetos),
      faturamento: Number(r.faturamento),
    })),
    [porMes]
  )

  const listaFiltrada = useMemo(() =>
    (lista ?? []).filter(p =>
      !search ||
      p.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      p.nomeProduto.toLowerCase().includes(search.toLowerCase()) ||
      p.codProduto.toLowerCase().includes(search.toLowerCase())
    ),
    [lista, search]
  )

  function toggleCard(card: 'abertos' | 'totais') {
    setSelectedCard(c => c === card ? null : card)
    setDrilldownMes(null)
  }

  function handleBarClick(data: { activePayload?: { payload: { mes: string } }[] }) {
    const mes = data?.activePayload?.[0]?.payload?.mes
    if (!mes) return
    setDrilldownMes(m => m === mes ? null : mes)
  }

  const activeBanner = selectedCard !== null

  return (
    <div className="space-y-4">
      <FiltrosGlobais filtros={filtros} onChange={f => { setFiltros(f); setDrilldownMes(null) }} showProjetos={false} />

      {/* Active filter banner */}
      {activeBanner && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
          selectedCard === 'abertos'
            ? 'bg-blue-900/30 border-blue-700/50 text-blue-300'
            : 'bg-green-900/30 border-green-700/50 text-green-300'
        }`}>
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>
            Filtrando por: <strong>{selectedCard === 'abertos' ? 'Projetos Abertos no Período' : 'Projetos Totais (M1–M12)'}</strong>
          </span>
          <button onClick={() => setSelectedCard(null)} className="ml-auto hover:opacity-70 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <ClickableCard
          icon={<FolderOpen className="w-4 h-4 text-blue-400" />}
          label="Projetos Abertos no Período"
          value={formatNumber(kpis?.projetosAbertos ?? 0)}
          sub="primeiro faturamento no período"
          active={selectedCard === 'abertos'}
          color="blue"
          onClick={() => toggleCard('abertos')}
        />
        <ClickableCard
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
          label="Projetos Totais"
          value={formatNumber(kpis?.projetosTotais ?? 0)}
          sub="M1–M12 ativos no período"
          active={selectedCard === 'totais'}
          color="green"
          onClick={() => toggleCard('totais')}
        />
        <InfoCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          label="Faturamento Total"
          value={formatCurrency(kpis?.faturamentoTotal ?? 0)}
          sub="novos projetos no período"
        />
        <InfoCard
          icon={<RefreshCw className="w-4 h-4 text-amber-400" />}
          label="Taxa de Conversão para Recorrentes"
          value={`${(kpis?.taxaConversao ?? 0).toFixed(1)}%`}
          sub={`${kpis?.taxaConversaoConvertidos ?? 0} de ${kpis?.taxaConversaoTotal ?? 0} atingiram M13`}
        />
        <InfoCard
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          label="Ticket Médio"
          value={formatCurrencyK(kpis?.ticketMedio ?? 0)}
          sub="por projeto ativo"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROJETOS por mês */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">PROJETOS</h3>
            {drilldownMes && (
              <button
                onClick={() => setDrilldownMes(null)}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <X className="w-3 h-3" /> Limpar seleção
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Clique em uma barra para ver o detalhamento do mês
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porMesChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mesLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [
                  name === 'Projetos' ? formatNumber(v) : formatCurrency(v),
                  name,
                ]}
                labelFormatter={(l) => `Mês: ${l}`}
              />
              <Bar dataKey="projetos" name="Projetos" radius={[4, 4, 0, 0]}>
                {porMesChart.map((d, i) => (
                  <Cell
                    key={i}
                    fill={drilldownMes === d.mes ? '#8b5cf6' : '#3b82f6'}
                    opacity={drilldownMes && drilldownMes !== d.mes ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faturamento mensal */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Faturamento Mensal</h3>
          <p className="text-xs text-slate-500 mb-3">Faturamento de novos projetos (M1–M12) no período</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={porMesChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mesLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => formatCurrencyK(v)} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                labelFormatter={(l) => `Mês: ${l}`}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="faturamento" name="Faturamento" stroke="#22c55e" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drilldown panel */}
      {drilldownMes && (
        <div className="bg-slate-800 border border-violet-700/50 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">
                Projetos com faturamento em{' '}
                <span className="text-violet-300">{formatMes(drilldownMes)}</span>
              </h3>
              {!drilldownLoading && drilldown && (
                <span className="text-xs text-slate-500">({drilldown.length} projetos)</span>
              )}
            </div>
            <button onClick={() => setDrilldownMes(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {drilldownLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          ) : (drilldown?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Nenhum projeto encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Cód. Cliente</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Nome Cliente</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Cód. Produto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Nome Produto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">1ª Compra</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Últ. Compra</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Faturamento Total</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Ciclo</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drilldown?.map(p => (
                    <tr key={`${p.codParc}-${p.codProduto}`} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-3 py-2 text-slate-500 text-xs font-mono">{p.codParc}</td>
                      <td className="px-3 py-2 text-white text-xs font-medium max-w-[140px] truncate">{p.razaoSocial}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs font-mono">{p.codProduto}</td>
                      <td className="px-3 py-2 text-slate-300 text-xs max-w-[130px] truncate">{p.nomeProduto}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{p.dtPrimeiro ? formatMes(p.dtPrimeiro) : '—'}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{p.ultimaCompra ? p.ultimaCompra.substring(0, 7) : '—'}</td>
                      <td className="px-3 py-2 text-right text-white text-xs font-medium">{formatCurrency(Number(p.faturamentoTotal))}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${cycleColor(p.mesAtualCiclo)}`}>
                          {labelMesCiclo(p.mesAtualCiclo)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Project list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">PROJETOS</h3>
            {listaFiltrada.length > 0 && (
              <span className="text-xs text-slate-500">({listaFiltrada.length})</span>
            )}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, produto ou código..."
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Cód. Cliente</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Nome Cliente</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Cód. Produto</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Nome Produto</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">1ª Compra</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Últ. Compra</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Volume Total</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Faturamento Total</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Ciclo</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase">Origem</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500 text-sm">
                    Nenhum projeto encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
              {listaFiltrada.map(p => {
                const rowHighlight = p.mesAtualCiclo >= 11 && p.mesAtualCiclo <= 12
                  ? 'bg-amber-900/10 hover:bg-amber-900/20'
                  : p.mesAtualCiclo <= 3
                    ? 'bg-violet-900/10 hover:bg-violet-900/20'
                    : 'hover:bg-slate-700/40'
                return (
                  <tr
                    key={`${p.codParc}-${p.codProduto}`}
                    className={`border-b border-slate-700/50 transition-colors ${rowHighlight}`}
                  >
                    <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{p.codParc}</td>
                    <td className="px-3 py-2.5 text-white font-medium text-xs max-w-[150px] truncate">{p.razaoSocial}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{p.codProduto}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-xs max-w-[140px] truncate">{p.nomeProduto}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{p.dtPrimeiro ? formatMes(p.dtPrimeiro) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{p.ultimaCompra ? p.ultimaCompra.substring(0, 7) : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-slate-300 text-xs">{formatKg(Number(p.volumeTotal))}</td>
                    <td className="px-3 py-2.5 text-right text-white text-xs font-medium">{formatCurrency(Number(p.faturamentoTotal))}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${cycleColor(p.mesAtualCiclo)}`}>
                        {labelMesCiclo(p.mesAtualCiclo)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${origemBadge(p.origem)}`}>
                        {p.origem === 'TESTE INDUSTRIAL' ? 'Teste Ind.' : 'Novo Proj.'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        {listaFiltrada.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-700 flex items-center gap-4 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Destaques:</span>
            <span className="flex items-center gap-1.5 text-[11px] text-violet-400">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" /> M1–M3 recém-abertos
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> M11–M12 próximos do fim do ciclo
            </span>
          </div>
        )}
      </div>
    </div>
  )
}