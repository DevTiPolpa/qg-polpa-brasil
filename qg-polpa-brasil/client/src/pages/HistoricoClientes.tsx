import { useState, useMemo, useEffect } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import {
  getHistoricoClientesKpis,
  getHistoricoClientesLista,
  getHistoricoClientesEvolucaoMensal,
  getHistoricoClientesPorEstado,
  getHistoricoClientesPorSegmento,
  getHistoricoClienteProdutos,
  type HistoricoClientesFiltros,
} from '../lib/api'
import {
  DollarSign, Percent, Weight, Tag, Package, Users,
  RefreshCw, X, ChevronDown, ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

type CrossFilter = { type: 'uf' | 'segmento'; value: string } | null

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#a78bfa']

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtMi(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Mil`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(v: number, dec = 2) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtKg(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi kg`
  if (v >= 1_000) return `${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Mil kg`
  return `${fmtNum(v, 0)} kg`
}

function fmtTableNum(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = 'text-green-400' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-slate-700/60 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmtNum(p.value, 0) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Donut Panel ──────────────────────────────────────────────────────────────
function DonutPanel({ title, data, total, selectedName, onSliceClick }: {
  title: string
  data: { name: string; valor: number; pct: number }[]
  total: number
  selectedName?: string | null
  onSliceClick?: (name: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? data : data.slice(0, 6)
  const hasSelection = !!selectedName

  return (
    <div className={`bg-slate-800 border rounded-xl overflow-hidden transition-colors ${hasSelection ? 'border-green-600/50' : 'border-slate-700'}`}>
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        {hasSelection && (
          <button onClick={() => onSliceClick?.(selectedName!)} className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1">
            <X className="w-3 h-3" /> {selectedName}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="relative flex items-center justify-center mb-3">
          <PieChart width={180} height={180}>
            <Pie
              data={data}
              cx={90} cy={90}
              innerRadius={55} outerRadius={80}
              dataKey="valor"
              nameKey="name"
              paddingAngle={2}
              startAngle={90} endAngle={-270}
              onClick={(d: any) => onSliceClick?.(d.name)}
              style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={hasSelection && selectedName !== d.name ? 0.3 : 1}
                  stroke={selectedName === d.name ? '#fff' : 'none'}
                  strokeWidth={selectedName === d.name ? 1.5 : 0}
                />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute text-center pointer-events-none">
            <p className="text-[10px] text-slate-400 leading-none">{hasSelection ? 'Filtrado' : 'Total'}</p>
            <p className="text-xs font-bold text-white mt-0.5">{fmtMi(total)}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {shown.map((d, i) => (
            <div
              key={d.name}
              onClick={() => onSliceClick?.(d.name)}
              className={`flex items-center gap-2 rounded px-1 -mx-1 transition-opacity ${
                onSliceClick ? 'cursor-pointer hover:bg-white/5' : ''
              } ${hasSelection && selectedName !== d.name ? 'opacity-30' : ''} ${selectedName === d.name ? 'bg-white/5' : ''}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="flex-1 text-[11px] text-slate-300 truncate">{d.name}</span>
              <span className="text-[11px] text-slate-400 shrink-0">{fmtNum(d.pct, 1)}%</span>
              <span className="text-[11px] font-medium text-white shrink-0 min-w-[60px] text-right">{fmtMi(d.valor)}</span>
            </div>
          ))}
        </div>
        {data.length > 6 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="w-full mt-3 pt-2 border-t border-slate-700 text-[10px] text-slate-400 hover:text-white flex items-center justify-center gap-1"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Ver menos' : `Ver todos (${data.length})`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Cliente Row (expansível com lazy load de produtos) ───────────────────────
type ClienteItem = {
  codParc: number; razaoSocial: string
  valor: number; volume: number; precoMedio: number
  qtdProdutos: number; pctValor: number; pctVolume: number
}

function ClienteRow({ c, rank, baseFiltros, isExpanded, onToggle, dimmed, selectedProductCode, onProductClick }: {
  c: ClienteItem; rank: number; baseFiltros: HistoricoClientesFiltros
  isExpanded: boolean; onToggle: () => void; dimmed?: boolean
  selectedProductCode?: string | null
  onProductClick?: (code: string, name: string) => void
}) {
  const produtosFiltros = baseFiltros

  const { data: produtos, isLoading: prodLoading } = useQuery({
    queryKey: ['historico-clientes', 'cliente-produtos', c.codParc, produtosFiltros],
    queryFn: () => getHistoricoClienteProdutos(c.codParc, produtosFiltros),
    enabled: isExpanded,
    staleTime: 60_000,
  })

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-slate-700/30 cursor-pointer select-none transition-all ${
          isExpanded ? 'bg-green-950/30' : 'hover:bg-slate-700/20'
        } ${dimmed ? 'opacity-30' : ''}`}
      >
        <td className="px-3 py-1.5 text-slate-500">{rank}</td>
        <td className="px-3 py-1.5">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                isExpanded ? 'rotate-90 text-green-400' : 'text-slate-500'
              }`}
            />
            <div>
              <p className="font-medium text-white truncate max-w-[240px]">{c.razaoSocial}</p>
              <p className="text-[10px] text-slate-500">{c.codParc}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{fmtTableNum(c.valor)}</td>
        <td className="px-2 py-1.5 text-right text-slate-400">{fmtNum(c.pctValor, 1)}%</td>
        <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{fmtTableNum(c.volume)}</td>
        <td className="px-2 py-1.5 text-right text-slate-400">{fmtNum(c.pctVolume, 1)}%</td>
        <td className="px-2 py-1.5 text-right text-slate-300">R$ {fmtNum(c.precoMedio, 2)}</td>
        <td className="px-2 py-1.5 text-right text-slate-300">{c.qtdProdutos}</td>
      </tr>
      {/* Expansion row — always rendered, altura controlada por CSS */}
      <tr>
        <td colSpan={8} className="p-0">
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              isExpanded ? 'max-h-[600px]' : 'max-h-0'
            }`}
          >
            <div className="bg-slate-900/50 border-b border-slate-600/50 px-10 py-3">
              {isExpanded && prodLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                  <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
                  Carregando produtos...
                </div>
              )}
              {isExpanded && !prodLoading && !produtos?.length && (
                <p className="text-slate-500 text-xs py-2">Nenhum produto encontrado.</p>
              )}
              {isExpanded && !prodLoading && !!produtos?.length && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      <th className="text-left pb-1.5 pr-4 font-medium text-slate-500 w-20">Código</th>
                      <th className="text-left pb-1.5 pr-4 font-medium text-slate-500">Produto</th>
                      <th className="text-right pb-1.5 pr-4 font-medium text-slate-500">Volume (KG)</th>
                      <th className="text-right pb-1.5 pr-4 font-medium text-slate-500">Faturamento</th>
                      <th className="text-right pb-1.5 pr-4 font-medium text-slate-500">R$/kg</th>
                      <th className="text-right pb-1.5 font-medium text-slate-500">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map(p => {
                      const isSelected = selectedProductCode === p.codProduto
                      const isDimmed = !!selectedProductCode && !isSelected
                      return (
                        <tr
                          key={p.codProduto}
                          onClick={() => onProductClick?.(p.codProduto, p.nomeProduto)}
                          className={`border-b border-slate-800/40 cursor-pointer select-none transition-all ${
                            isSelected ? 'bg-violet-900/40' : 'hover:bg-slate-800/30'
                          } ${isDimmed ? 'opacity-30' : ''}`}
                        >
                          <td className={`py-1.5 pr-4 ${isSelected ? 'text-violet-300' : 'text-slate-400'}`}>{p.codProduto}</td>
                          <td className={`py-1.5 pr-4 font-medium max-w-[220px] truncate ${isSelected ? 'text-violet-200' : 'text-white'}`}>{p.nomeProduto}</td>
                          <td className="py-1.5 pr-4 text-right text-slate-300 whitespace-nowrap">{fmtTableNum(p.volume)}</td>
                          <td className="py-1.5 pr-4 text-right text-slate-300 whitespace-nowrap">{fmtTableNum(p.valor)}</td>
                          <td className="py-1.5 pr-4 text-right text-slate-300">R$ {fmtNum(p.precoMedio, 2)}</td>
                          <td className="py-1.5 text-right text-slate-400">
                            {p.dtUltimaCompra ? new Date(p.dtUltimaCompra).toLocaleDateString('pt-BR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function toBackend(f: Filtros): HistoricoClientesFiltros {
  return {
    dataInicio: f.dataInicio,
    dataFim: f.dataFim,
    codParcs: f.codParcs?.length ? f.codParcs : undefined,
    mercados: f.mercados?.length ? f.mercados : undefined,
    gruposProduto: f.gruposProduto?.length ? f.gruposProduto : undefined,
    vendedores: f.vendedores?.length ? f.vendedores : undefined,
  }
}

function withMonth(b: HistoricoClientesFiltros, mes: number | null): HistoricoClientesFiltros {
  if (mes === null) return b
  return { ...b, meses: [mes] }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoricoClientes() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)
  const [updatedAt, setUpdatedAt] = useState(() => new Date())

  // cross-filter: donut slice selection (filtra tabela de clientes)
  const [crossFilter, setCrossFilter] = useState<CrossFilter>(null)
  // expansion: qual cliente está expandido (filtra os donuts)
  const [expandedParc, setExpandedParc] = useState<number | null>(null)
  // month cross-filter: clicar em barra dos gráficos de evolução filtra todos os painéis
  const [monthCrossFilter, setMonthCrossFilter] = useState<number | null>(null)
  // product cross-filter: clicar em produto na expansão do cliente filtra todos os painéis
  const [productCrossFilter, setProductCrossFilter] = useState<{ code: string; name: string } | null>(null)

  // Sempre que os filtros globais mudarem, reseta os cross-filters e marca a atualização
  useEffect(() => {
    setCrossFilter(null)
    setExpandedParc(null)
    setMonthCrossFilter(null)
    setProductCrossFilter(null)
    setUpdatedAt(new Date())
  }, [filtros])

  const queryOpts = { staleTime: 30_000 }

  const productCode = productCrossFilter?.code ?? null

  // Queries para donuts: produto > cliente expandido > base
  const donutBackend = useMemo(() => {
    const base = toBackend(filtros)
    if (productCode) return { ...base, codProdutos: [productCode] }
    if (expandedParc) return { ...base, codParcs: [expandedParc] }
    return base
  }, [filtros, expandedParc, productCode])

  // Query para clientes: produto > cross-filter donut > base
  const clientesBackend = useMemo(() => {
    const base = toBackend(filtros)
    if (productCode) return { ...base, codProdutos: [productCode] }
    if (crossFilter?.type === 'uf') return { ...base, ufs: [crossFilter.value] }
    if (crossFilter?.type === 'segmento') return { ...base, gruposProduto: [...(base.gruposProduto ?? []), crossFilter.value] }
    return base
  }, [filtros, crossFilter, productCode])

  // Backends para kpis e evolução que também filtram por produto
  const kpisBackend = useMemo(() => {
    const base = toBackend(filtros)
    return productCode ? { ...base, codProdutos: [productCode] } : base
  }, [filtros, productCode])

  const evolucaoBackend = useMemo(() => {
    const base = toBackend(filtros)
    return productCode ? { ...base, codProdutos: [productCode] } : base
  }, [filtros, productCode])

  const kpisQueryInput = useMemo(() => withMonth(kpisBackend, monthCrossFilter), [kpisBackend, monthCrossFilter])
  const clientesQueryInput = useMemo(() => withMonth(clientesBackend, monthCrossFilter), [clientesBackend, monthCrossFilter])
  const evolucaoQueryInput = useMemo(() => withMonth(evolucaoBackend, monthCrossFilter), [evolucaoBackend, monthCrossFilter])
  const donutQueryInput = useMemo(() => withMonth(donutBackend, monthCrossFilter), [donutBackend, monthCrossFilter])

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['historico-clientes', 'kpis', kpisQueryInput],
    queryFn: () => getHistoricoClientesKpis(kpisQueryInput),
    ...queryOpts,
  })

  const { data: clientes, isLoading: clientesLoading } = useQuery({
    queryKey: ['historico-clientes', 'clientes', clientesQueryInput],
    queryFn: () => getHistoricoClientesLista(clientesQueryInput),
    ...queryOpts,
  })

  const { data: evolucao } = useQuery({
    queryKey: ['historico-clientes', 'evolucao-mensal', evolucaoQueryInput],
    queryFn: () => getHistoricoClientesEvolucaoMensal(evolucaoQueryInput),
    ...queryOpts,
  })

  const { data: estados } = useQuery({
    queryKey: ['historico-clientes', 'por-estado', donutQueryInput],
    queryFn: () => getHistoricoClientesPorEstado(donutQueryInput),
    ...queryOpts,
  })

  const { data: segmentos } = useQuery({
    queryKey: ['historico-clientes', 'por-segmento', donutQueryInput],
    queryFn: () => getHistoricoClientesPorSegmento(donutQueryInput),
    ...queryOpts,
  })

  function toggleCliente(codParc: number) {
    setExpandedParc(p => {
      const next = p === codParc ? null : codParc
      if (next !== null) setCrossFilter(null)
      return next
    })
    setProductCrossFilter(null)
  }

  function handleEstadoClick(uf: string) {
    setCrossFilter(f => f?.type === 'uf' && f.value === uf ? null : { type: 'uf', value: uf })
    setExpandedParc(null)
    setProductCrossFilter(null)
  }

  function handleSegmentoClick(seg: string) {
    setCrossFilter(f => f?.type === 'segmento' && f.value === seg ? null : { type: 'segmento', value: seg })
    setExpandedParc(null)
    setProductCrossFilter(null)
  }

  function handleMonthClick(mes: number) {
    setMonthCrossFilter(m => m === mes ? null : mes)
  }

  function handleProductClick(code: string, name: string) {
    setProductCrossFilter(p => p?.code === code ? null : { code, name })
    setCrossFilter(null)
  }

  // Build monthly evolution with all 12 months filled
  const evolucaoChart = useMemo(() => {
    const byMes = new Map((evolucao ?? []).map(r => [r.mes, r]))
    return MESES.map((nome, i) => {
      const r = byMes.get(i + 1)
      return {
        name: nome,
        volume: Number(r?.volume ?? 0),
        precoMedio: Number(r?.precoMedio ?? 0),
        valor: Number(r?.valor ?? 0),
      }
    })
  }, [evolucao])

  const estadosDonut = useMemo(() =>
    (estados ?? []).map(r => ({ name: r.uf, valor: r.valor, pct: r.pct })),
    [estados]
  )

  const segmentosDonut = useMemo(() =>
    (segmentos ?? []).map(r => ({ name: r.segmento, valor: r.valor, pct: r.pct })),
    [segmentos]
  )

  const totalEstados = useMemo(() => estadosDonut.reduce((s, r) => s + r.valor, 0), [estadosDonut])
  const totalSegmentos = useMemo(() => segmentosDonut.reduce((s, r) => s + r.valor, 0), [segmentosDonut])

  const clientesTotal = useMemo(() => ({
    valor: (clientes ?? []).reduce((s, r) => s + r.valor, 0),
    volume: (clientes ?? []).reduce((s, r) => s + r.volume, 0),
  }), [clientes])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-green-400" />
            Histórico Clientes / Produtos
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Análise de vendas firmes por cliente, produto e período
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizado em {updatedAt.toLocaleDateString('pt-BR')} {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <FiltrosGlobais filtros={filtros} onChange={setFiltros} showProjetos={false} showTipoReceita={false} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Faturamento Total"
          value={kpisLoading ? '...' : fmtMi(kpis?.totalValor ?? 0)}
          sub={`${fmtNum(kpis?.pctFaturamento ?? 100, 1)}% do total`}
          color="text-green-400"
        />
        <KpiCard
          icon={Percent}
          label="% do Faturamento"
          value={kpisLoading ? '...' : `${fmtNum(kpis?.pctFaturamento ?? 100, 2)}%`}
          sub="vs período selecionado"
          color="text-blue-400"
        />
        <KpiCard
          icon={Weight}
          label="Volume (KG)"
          value={kpisLoading ? '...' : fmtKg(kpis?.totalVolume ?? 0)}
          sub={`${fmtNum(kpis?.pctVolume ?? 100, 1)}% do total`}
          color="text-amber-400"
        />
        <KpiCard
          icon={Tag}
          label="Preço Médio"
          value={kpisLoading ? '...' : `R$ ${fmtNum(kpis?.precoMedio ?? 0, 2)}`}
          sub="por kg"
          color="text-violet-400"
        />
        <KpiCard
          icon={Package}
          label="Qtd. Produtos"
          value={kpisLoading ? '...' : fmtNum(kpis?.qtdProdutos ?? 0, 0)}
          sub="SKUs distintos"
          color="text-pink-400"
        />
        <KpiCard
          icon={Users}
          label="Clientes Ativos"
          value={kpisLoading ? '...' : fmtNum(kpis?.qtdClientes ?? 0, 0)}
          sub="clientes distintos"
          color="text-cyan-400"
        />
      </div>

      {/* Charts Row — KG e Faturamento lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução Mensal KG */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">Evolução Mensal (KG)</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#4F9D6E' }} /> Volume (KG)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-4 border-t-2 border-dashed border-white/40" /> Preço Médio (R$)
              </span>
            </div>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={evolucaoChart} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="vol" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <YAxis yAxisId="pm" orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${v.toFixed(0)}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="vol" dataKey="volume" name="Volume kg" fill="#4F9D6E" radius={[3, 3, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(_d: unknown, index: number) => handleMonthClick(index + 1)}>
                  {evolucaoChart.map((_e, i) => (
                    <Cell key={i} fill="#4F9D6E" opacity={monthCrossFilter === null || monthCrossFilter === i + 1 ? 1 : 0.25} />
                  ))}
                </Bar>
                <Line yAxisId="pm" type="monotone" dataKey="precoMedio" name="Preço Médio R$"
                  stroke="#ffffff" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Mensal Faturamento */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">Evolução Mensal (Faturamento)</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#4F7CAC' }} /> Faturamento (R$)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-4 border-t-2 border-dashed border-white/40" /> Preço Médio (R$)
              </span>
            </div>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={evolucaoChart} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="fat" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}Mi` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(v)} />
                <YAxis yAxisId="pm" orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${v.toFixed(0)}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="fat" dataKey="valor" name="Faturamento R$" fill="#4F7CAC" radius={[3, 3, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(_d: unknown, index: number) => handleMonthClick(index + 1)}>
                  {evolucaoChart.map((_e, i) => (
                    <Cell key={i} fill="#4F7CAC" opacity={monthCrossFilter === null || monthCrossFilter === i + 1 ? 1 : 0.25} />
                  ))}
                </Bar>
                <Line yAxisId="pm" type="monotone" dataKey="precoMedio" name="Preço Médio R$"
                  stroke="#ffffff" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Banners de cross-filter ativo */}
      {(monthCrossFilter !== null || productCrossFilter !== null) && (
        <div className="flex flex-wrap gap-2">
          {monthCrossFilter !== null && (
            <div className="flex-1 text-[11px] bg-amber-900/40 text-amber-400 border border-amber-700/50 px-3 py-2 rounded-lg flex items-center gap-2">
              <span>Mês: <strong>{MESES_FULL[monthCrossFilter - 1]}</strong> — filtrando todos os painéis</span>
              <button onClick={() => setMonthCrossFilter(null)} className="ml-auto flex items-center gap-1 hover:text-white">
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}
          {productCrossFilter !== null && (
            <div className="flex-1 text-[11px] bg-violet-900/40 text-violet-400 border border-violet-700/50 px-3 py-2 rounded-lg flex items-center gap-2">
              <span>Produto: <strong>{productCrossFilter.name}</strong> — filtrando todos os painéis</span>
              <button onClick={() => setProductCrossFilter(null)} className="ml-auto flex items-center gap-1 hover:text-white">
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clients Table — largura total */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-white">Clientes</p>
          <span className="text-xs text-slate-500">{clientes?.length ?? 0} clientes</span>
          {expandedParc && (
            <span className="ml-auto text-[11px] bg-green-900/40 text-green-400 border border-green-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              Donuts → cliente expandido
              <button onClick={() => setExpandedParc(null)} className="hover:text-white"><X className="w-3 h-3" /></button>
            </span>
          )}
          {crossFilter && (
            <span className="ml-auto text-[11px] bg-blue-900/40 text-blue-400 border border-blue-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              Filtrando por {crossFilter.type === 'uf' ? 'Estado' : 'Segmento'}: {crossFilter.value}
              <button onClick={() => setCrossFilter(null)} className="hover:text-white"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-xs min-w-[700px]">
            <thead className="bg-slate-800 sticky top-0 z-10">
              <tr className="border-b border-slate-700">
                <th className="text-left px-3 py-2 font-medium text-slate-400 w-6">#</th>
                <th className="text-left px-3 py-2 font-medium text-slate-400">Cliente</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">Fat.</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">% Fat</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">Vol.</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">% Vol</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">R$/kg</th>
                <th className="text-right px-2 py-2 font-medium text-slate-400">Prod</th>
              </tr>
            </thead>
            <tbody>
              {clientesLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/30 animate-pulse">
                      <td className="px-3 py-2" colSpan={8}><div className="h-3 bg-slate-700 rounded w-full" /></td>
                    </tr>
                  ))
                : (clientes ?? []).map((c, i) => (
                    <ClienteRow
                      key={c.codParc}
                      c={c}
                      rank={i + 1}
                      baseFiltros={toBackend(filtros)}
                      isExpanded={expandedParc === c.codParc}
                      onToggle={() => toggleCliente(c.codParc)}
                      dimmed={expandedParc !== null && expandedParc !== c.codParc}
                      selectedProductCode={expandedParc === c.codParc ? productCode : null}
                      onProductClick={handleProductClick}
                    />
                  ))
              }
            </tbody>
            {!clientesLoading && (clientes?.length ?? 0) > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-600 bg-slate-700/40">
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-xs font-bold text-slate-300">Total</td>
                  <td className="px-2 py-2 text-right text-xs font-bold text-white whitespace-nowrap">{fmtTableNum(clientesTotal.valor)}</td>
                  <td className="px-2 py-2 text-right text-xs text-slate-400">100%</td>
                  <td className="px-2 py-2 text-right text-xs font-bold text-white whitespace-nowrap">{fmtTableNum(clientesTotal.volume)}</td>
                  <td className="px-2 py-2 text-right text-xs text-slate-400">100%</td>
                  <td className="px-2 py-2 text-right text-xs font-semibold text-white">
                    R$ {clientesTotal.volume > 0 ? fmtNum(clientesTotal.valor / clientesTotal.volume, 2) : '—'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs text-slate-400">{kpis?.qtdProdutos ?? '—'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado Donut */}
        <DonutPanel
          title={expandedParc ? 'Estado — cliente selecionado' : 'Representatividade por Estado'}
          data={estadosDonut}
          total={totalEstados}
          selectedName={crossFilter?.type === 'uf' ? crossFilter.value : null}
          onSliceClick={handleEstadoClick}
        />

        {/* Segmento Donut */}
        <DonutPanel
          title={expandedParc ? 'Grupo de Produtos — cliente selecionado' : 'Grupo de Produtos'}
          data={segmentosDonut}
          total={totalSegmentos}
          selectedName={crossFilter?.type === 'segmento' ? crossFilter.value : null}
          onSliceClick={handleSegmentoClick}
        />
      </div>
    </div>
  )
}