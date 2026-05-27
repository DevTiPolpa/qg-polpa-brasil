import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { trpc } from '../lib/trpc'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency, formatKg, formatMes } from '../lib/utils'
import {
  Users, UserCheck, AlertTriangle, UserX, DollarSign,
  TrendingUp, BarChart2, MapPin, Layers, Zap,
} from 'lucide-react'

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

const STATE_COLORS    = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
const SEGMENT_COLORS  = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function getStatusCliente(ultimaCompra: string | null, primeiraCompra: string | null) {
  const now = Date.now()
  if (primeiraCompra && (now - new Date(primeiraCompra).getTime()) / 86400000 <= 60) return 'novo'
  if (!ultimaCompra) return 'inativo'
  const dias = (now - new Date(ultimaCompra).getTime()) / 86400000
  if (dias <= 75) return 'ativo'    // comprou nos últimos 2,5 meses
  if (dias <= 180) return 'emRisco' // 2,5–6 meses sem compra
  return 'inativo'
}

function getStatusDias(ultimaCompra: string | null) {
  if (!ultimaCompra) return 9999
  return Math.floor((Date.now() - new Date(ultimaCompra).getTime()) / 86400000)
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

// ── Radial Gauge ──────────────────────────────────────────────────────────────
function RadialGauge({ score }: { score: number }) {
  const cx = 90, cy = 90, r = 68, sw = 14

  const p2c = (deg: number) => ({
    x: +(cx + r * Math.cos((deg - 90) * Math.PI / 180)).toFixed(2),
    y: +(cy + r * Math.sin((deg - 90) * Math.PI / 180)).toFixed(2),
  })

  const arc = (sDeg: number, span: number) => {
    const eDeg = sDeg + span
    const s = p2c(sDeg), e = p2c(eDeg)
    const lg = span > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 0 ${e.x} ${e.y}`
  }

  const START = -135
  const TOTAL = 270
  const filled = Math.min(score, 100) / 100 * TOTAL
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Muito Bom' : score >= 40 ? 'Atenção' : 'Crítico'

  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44 mx-auto">
      <path d={arc(START, TOTAL)} fill="none" stroke="#1e293b" strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && (
        <path d={arc(START, filled)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="13">/100</text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill={color} fontSize="12" fontWeight="600">{label}</text>
    </svg>
  )
}

// ── Mini Sparkline ─────────────────────────────────────────────────────────────
function MiniSparkline({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="w-16 h-8" />
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const W = 64, H = 32
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 6) - 3,
  }))
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)

  // Todas as queries de faturamento consideram apenas Venda Firme
  const filtrosVF = useMemo<Filtros>(
    () => ({ ...filtros, tiposReceita: ['VENDA_FIRME'], tipoReceita: 'VENDA_FIRME' }),
    [filtros]
  )

  const { data: lista }       = trpc.clientes.lista.useQuery(filtrosVF)
  const { data: saude }       = trpc.clientes.saudeCarteira.useQuery(filtrosVF)
  const { data: kpis }        = trpc.dashboard.kpis.useQuery(filtrosVF)
  const { data: evolucao }    = trpc.vendedores.evolucaoConsolidada.useQuery(filtrosVF)
  const { data: orcamento }   = trpc.dashboard.orcamentoMensal.useQuery(filtros)
  const { data: produtos }    = trpc.produtos.performance.useQuery(filtrosVF)
  const { data: estados }     = trpc.clientes.vendasPorEstado.useQuery({ filtros: filtrosVF })
  const { data: segmentos }   = trpc.segmentos.performance.useQuery(filtrosVF)
  const { data: crescimento } = trpc.clientes.crescimento.useQuery(filtrosVF)

  // ── Computed data ──────────────────────────────────────────────────────────
  const listaComStatus = useMemo(() =>
    (lista ?? []).map(c => ({
      ...c,
      status: getStatusCliente(c.ultimaCompra, c.primeiraCompra),
      diasSemCompra: getStatusDias(c.ultimaCompra),
    })),
    [lista]
  )

  const ticketMedio = useMemo(() => {
    const fat = Number(kpis?.faturamentoTotal ?? 0)
    const n   = Number(kpis?.clientesAtivos ?? 0)
    return n > 0 ? fat / n : 0
  }, [kpis])

  const potencialCarteira = useMemo(() =>
    listaComStatus.filter(c => c.status === 'emRisco').reduce((s, c) => s + Number(c.faturamento), 0),
    [listaComStatus]
  )

  const evolucaoMerged = useMemo(() => {
    const map = new Map<string, { mes: string; real: number; meta: number }>()
    for (const r of (evolucao ?? [])) map.set(r.mes, { mes: r.mes, real: Number(r.faturamento), meta: 0 })
    for (const o of (orcamento ?? [])) {
      const ex = map.get(o.mes) ?? { mes: o.mes, real: 0, meta: 0 }
      map.set(o.mes, { ...ex, meta: Number(o.faturamento) })
    }
    return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes))
  }, [evolucao, orcamento])

  const sparkData = useMemo(() => evolucaoMerged.map(r => r.real), [evolucaoMerged])

  const totalEstados   = useMemo(() => (estados   ?? []).reduce((s, e) => s + Number(e.faturamento), 0), [estados])
  const totalSegmentos = useMemo(() => (segmentos ?? []).reduce((s, e) => s + Number(e.faturamento), 0), [segmentos])

  const clientesAtencao = useMemo(() =>
    listaComStatus
      .filter(c => c.status === 'emRisco' || c.status === 'inativo')
      .sort((a, b) => Number(b.faturamento) - Number(a.faturamento))
      .slice(0, 5),
    [listaComStatus]
  )

  const oportunidades = useMemo(() => {
    const ativos = listaComStatus.filter(c => c.status === 'ativo' || c.status === 'novo')
    const avgProd = ativos.length > 0 ? ativos.reduce((s, c) => s + Number(c.produtos), 0) / ativos.length : 3
    const avgFat  = ativos.length > 0 ? ativos.reduce((s, c) => s + Number(c.faturamento), 0) / ativos.length : 0
    return ativos
      .map(c => ({
        ...c,
        tipo: Number(c.produtos) < avgProd * 0.6 ? 'Cross-sell'
          : Number(c.faturamento) > avgFat * 1.5 ? 'Upsell'
          : 'Upsell',
        potencial: Number(c.faturamento) * (Number(c.produtos) < avgProd * 0.6 ? 0.25 : 0.15),
      }))
      .sort((a, b) => b.potencial - a.potencial)
      .slice(0, 3)
  }, [listaComStatus])

  const clientesReativacao = useMemo(() =>
    listaComStatus
      .filter(c => c.status === 'emRisco')
      .sort((a, b) => Number(b.faturamento) - Number(a.faturamento))
      .slice(0, 2)
      .map(c => ({ ...c, tipo: 'Reativação', potencial: Number(c.faturamento) * 0.5 })),
    [listaComStatus]
  )

  const insights = useMemo(() => {
    const result: { type: 'positive' | 'warning' | 'negative' | 'info'; title: string; desc: string }[] = []
    if (saude && saude.novos > 0)
      result.push({ type: 'positive', title: 'Crescimento da carteira', desc: `${saude.novos} novo${saude.novos > 1 ? 's clientes adicionados' : ' cliente adicionado'} no período.` })
    if (saude && saude.emRisco > 0)
      result.push({ type: 'warning', title: 'Atenção necessária', desc: `${saude.emRisco} cliente${saude.emRisco > 1 ? 's estão próximos' : ' está próximo'} da inatividade.` })
    if (estados && totalEstados > 0) {
      const top = estados[0]; const pct = Math.round(Number(top.faturamento) / totalEstados * 100)
      if (pct >= 25) result.push({ type: 'info', title: 'Concentração geográfica', desc: `${top.uf} representa ${pct}% do faturamento total da carteira.` })
    }
    if (segmentos && totalSegmentos > 0) {
      const top = segmentos[0]; const pct = Math.round(Number(top.faturamento) / totalSegmentos * 100)
      result.push({ type: 'positive', title: 'Segmento líder', desc: `${top.segmento || 'Principal segmento'} representa ${pct}% da carteira com ${top.clientes} clientes.` })
    }
    if (saude && saude.inativos > 3)
      result.push({ type: 'negative', title: 'Clientes inativos', desc: `${saude.inativos} clientes inativos. Ação de reativação é recomendada.` })
    if (produtos && produtos.length > 0 && Number(kpis?.faturamentoTotal ?? 0) > 0) {
      const top = produtos[0]; const pct = Math.round(Number(top.faturamento) / Number(kpis!.faturamentoTotal) * 100)
      if (pct >= 20) result.push({ type: 'info', title: 'Produto dominante', desc: `${top.nomeProduto || `Produto ${top.codProduto}`} representa ${pct}% do faturamento total.` })
    }
    return result.slice(0, 4)
  }, [saude, estados, segmentos, produtos, kpis, totalEstados, totalSegmentos])

  const topProdutos = useMemo(() => {
    const maxFat = Math.max(...(produtos ?? []).slice(0, 6).map(p => Number(p.faturamento)), 1)
    const totalFat = (produtos ?? []).reduce((s, p) => s + Number(p.faturamento), 0) || 1
    return (produtos ?? []).slice(0, 6).map(p => ({
      ...p,
      pct: Number(p.faturamento) / totalFat * 100,
      barPct: Number(p.faturamento) / maxFat * 100,
    }))
  }, [produtos])

  // ── KPI Card config ────────────────────────────────────────────────────────
  const kpiCards = [
    { icon: Users,         label: 'Novos Clientes',      value: String(saude?.novos ?? 0),          sub: `de ${saude?.total ?? 0} total`,                                                      color: 'text-blue-400',   bg: 'border-blue-500/20 bg-blue-500/5',   iconBg: 'bg-blue-500/15',   sparkColor: '#3b82f6' },
    { icon: UserCheck,     label: 'Clientes Ativos',     value: String(saude?.ativos ?? 0),          sub: saude?.total ? `${Math.round(saude.ativos / saude.total * 100)}% da carteira` : '—', color: 'text-green-400',  bg: 'border-green-500/20 bg-green-500/5', iconBg: 'bg-green-500/15',  sparkColor: '#22c55e' },
    { icon: AlertTriangle, label: 'Em Risco',            value: String(saude?.emRisco ?? 0),         sub: saude?.total ? `${Math.round(saude.emRisco / saude.total * 100)}% da carteira` : '—', color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5', iconBg: 'bg-amber-500/15',  sparkColor: '#f59e0b' },
    { icon: UserX,         label: 'Clientes Inativos',  value: String(saude?.inativos ?? 0),        sub: saude?.total ? `${Math.round(saude.inativos / saude.total * 100)}% da carteira` : '—', color: 'text-red-400',  bg: 'border-red-500/20 bg-red-500/5',   iconBg: 'bg-red-500/15',    sparkColor: '#ef4444' },
    { icon: DollarSign,   label: 'Ticket Médio',        value: formatCompact(ticketMedio),          sub: 'por cliente ativo',                                                                   color: 'text-purple-400', bg: 'border-purple-500/20 bg-purple-500/5', iconBg: 'bg-purple-500/15', sparkColor: '#8b5cf6' },
    { icon: TrendingUp,   label: 'Potencial da Carteira', value: formatCompact(potencialCarteira),  sub: `${saude?.emRisco ?? 0} clientes em risco`,                                            color: 'text-orange-400', bg: 'border-orange-500/20 bg-orange-500/5', iconBg: 'bg-orange-500/15', sparkColor: '#f97316' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Visão de Clientes</h1>
        <p className="text-sm text-slate-400 mt-0.5">Acompanhe sua carteira, performance e oportunidades</p>
      </div>

      {/* Filtros */}
      <FiltrosGlobais filtros={filtros} onChange={setFiltros} />

      {/* Active filter badges */}
      {(() => {
        const badges: { label: string; onRemove: () => void }[] = []
        ;(filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }))
        ;(filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }))
        ;(filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }))
        ;(filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }))
        ;(filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }))
        const temData = filtros.dataInicio !== DEFAULT_FILTROS.dataInicio || filtros.dataFim !== DEFAULT_FILTROS.dataFim
        if (badges.length === 0 && !temData) return null
        return (
          <div className="flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">Filtros ativos</span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {badges.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-[11px] text-slate-200">
                  {b.label}
                  <button onClick={b.onRemove} className="text-slate-400 hover:text-white ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
            <button onClick={() => setFiltros(DEFAULT_FILTROS)} className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1">
              Limpar tudo
            </button>
          </div>
        )
      })()}

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map(card => (
          <div key={card.label} className={`bg-slate-800 border ${card.bg} rounded-xl p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <MiniSparkline data={sparkData} color={card.sparkColor} />
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs font-semibold text-white mt-0.5">{card.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Score | Evolução | Insights ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Score de Saúde da Carteira */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Score de Saúde da Carteira</span>
          </div>
          <RadialGauge score={saude?.score ?? 0} />
          <div className="mt-5 space-y-2.5">
            {[
              { label: 'Ativos',    value: saude?.ativos ?? 0,   color: 'bg-green-500',  text: 'text-green-400'  },
              { label: 'Em Risco', value: saude?.emRisco ?? 0,  color: 'bg-amber-400',  text: 'text-amber-400'  },
              { label: 'Inativos', value: saude?.inativos ?? 0, color: 'bg-red-500',    text: 'text-red-400'    },
              { label: 'Novos',    value: saude?.novos ?? 0,    color: 'bg-blue-500',   text: 'text-blue-400'   },
            ].map(item => {
              const total = saude?.total ?? 0
              const pct = total > 0 ? Math.round(item.value / total * 100) : 0
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <span className="text-xs text-slate-400 flex-1">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.text}`}>{item.value}</span>
                  <span className="text-[11px] text-slate-600 w-8 text-right">({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Evolução de Faturamento */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Evolução de Faturamento</span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-slate-500">Faturamento Total</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(Number(kpis?.faturamentoTotal ?? 0))}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-green-400 rounded" /><span>Faturamento</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 border-t border-dashed border-slate-500" /><span>Meta</span></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolucaoMerged} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatMes(v)} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [formatCurrency(v), name === 'real' ? 'Faturamento' : 'Meta']}
                labelFormatter={v => formatMes(String(v))}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Line type="monotone" dataKey="real" stroke="#22c55e" strokeWidth={2} dot={false} name="real" />
              <Line type="monotone" dataKey="meta" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="meta" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights da Carteira */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Insights da Carteira</span>
          </div>
          <div className="space-y-3">
            {insights.map((ins, i) => {
              const cfg = {
                positive: { dot: 'bg-green-500', bg: 'bg-green-900/20 border-green-700/30', title: 'text-green-400', symbol: '↗' },
                warning:  { dot: 'bg-amber-500', bg: 'bg-amber-900/20 border-amber-700/30', title: 'text-amber-400', symbol: '⚡' },
                negative: { dot: 'bg-red-500',   bg: 'bg-red-900/20 border-red-700/30',     title: 'text-red-400',   symbol: '↘' },
                info:     { dot: 'bg-blue-500',  bg: 'bg-blue-900/20 border-blue-700/30',   title: 'text-blue-400',  symbol: '●' },
              }[ins.type]
              return (
                <div key={i} className={`${cfg.bg} border rounded-xl p-3.5 flex gap-3 items-start`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${cfg.title} bg-slate-900/40 shrink-0`}>
                    {cfg.symbol}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${cfg.title}`}>{ins.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ins.desc}</p>
                  </div>
                </div>
              )
            })}
            {insights.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">Carregando insights...</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Row: Atenção | Oportunidades | Crescimento ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Clientes que exigem atenção */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-700 bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Clientes que exigem atenção</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Clientes que precisam de ação imediata</p>
          </div>
          <div className="divide-y divide-slate-700/40">
            {clientesAtencao.map(c => (
              <div key={c.codParc} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.razaoSocial}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {c.diasSemCompra > 365
                      ? `${Math.floor(c.diasSemCompra / 30)} meses sem compra`
                      : `${c.diasSemCompra} dias sem compra`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.status === 'inativo' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-400'}`}>
                    {c.status === 'inativo' ? 'Inativo' : 'Em Risco'}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{formatCurrency(Number(c.faturamento))}</p>
                </div>
              </div>
            ))}
            {clientesAtencao.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-green-400 font-medium">Carteira saudável</p>
                <p className="text-[11px] text-slate-500 mt-1">Nenhum cliente em situação crítica</p>
              </div>
            )}
          </div>
        </div>

        {/* Oportunidades de Expansão */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-700 bg-blue-950/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Oportunidades de Expansão</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Clientes com potencial de crescimento</p>
          </div>
          <div className="divide-y divide-slate-700/40">
            {[...oportunidades, ...clientesReativacao].slice(0, 5).map(c => (
              <div key={c.codParc} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.razaoSocial}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{c.perfilParceiro ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    c.tipo === 'Cross-sell' ? 'bg-blue-900/40 text-blue-400'
                    : c.tipo === 'Reativação' ? 'bg-amber-900/40 text-amber-400'
                    : 'bg-purple-900/40 text-purple-400'
                  }`}>{c.tipo}</span>
                  <p className="text-[11px] text-slate-400 mt-1">{formatCurrency(c.potencial)}</p>
                </div>
              </div>
            ))}
            {oportunidades.length === 0 && clientesReativacao.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Carregando oportunidades...</div>
            )}
          </div>
        </div>

        {/* Clientes em Crescimento */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-700 bg-green-950/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Clientes em Crescimento</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Maiores crescimentos no período</p>
          </div>
          <div className="divide-y divide-slate-700/40">
            {(crescimento ?? []).map(c => (
              <div key={c.codParc} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.razaoSocial}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{c.perfilParceiro ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-green-400">↑ {Math.min(Math.round(c.crescimentoPct), 999)}%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(Number(c.fatAtual))}</p>
                </div>
              </div>
            ))}
            {(crescimento ?? []).length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Sem dados de crescimento no período</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Produtos | Estado | Segmento ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Produtos */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Top Produtos (por faturamento)</span>
          </div>
          <div className="space-y-3">
            {topProdutos.map((p, i) => (
              <div key={p.codProduto} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white font-medium truncate flex-1">{p.nomeProduto || `Produto ${p.codProduto}`}</span>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="text-green-400 font-semibold">{formatCurrency(Number(p.faturamento))}</span>
                    <span className="text-slate-500 w-8 text-right">{p.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.barPct}%`, background: `hsl(${130 - i * 12}, 65%, 40%)` }}
                  />
                </div>
              </div>
            ))}
            {topProdutos.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">Sem dados de produtos</p>}
          </div>
        </div>

        {/* Representatividade por Estado */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Representatividade por Estado</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <PieChart width={130} height={130}>
                <Pie data={(estados ?? []).slice(0, 7).map(e => ({ name: e.uf, value: Number(e.faturamento) }))}
                  cx={65} cy={65} innerRadius={42} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {(estados ?? []).slice(0, 7).map((_, i) => <Cell key={i} fill={STATE_COLORS[i % STATE_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white leading-tight">{formatCompact(totalEstados)}</span>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {(estados ?? []).slice(0, 6).map((e, i) => {
                const pct = totalEstados > 0 ? (Number(e.faturamento) / totalEstados) * 100 : 0
                return (
                  <div key={e.uf} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATE_COLORS[i % STATE_COLORS.length] }} />
                    <span className="font-semibold text-slate-300 w-5 shrink-0">{e.uf}</span>
                    <span className="text-slate-500 flex-1">{pct.toFixed(1)}%</span>
                    <span className="text-slate-400 text-[11px] shrink-0">{formatCurrency(Number(e.faturamento))}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Distribuição por Segmento */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Distribuição por Segmento</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <PieChart width={130} height={130}>
                <Pie data={(segmentos ?? []).slice(0, 7).map(s => ({ name: s.segmento || 'Outros', value: Number(s.faturamento) }))}
                  cx={65} cy={65} innerRadius={42} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {(segmentos ?? []).slice(0, 7).map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white leading-tight">{formatCompact(totalSegmentos)}</span>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {(segmentos ?? []).slice(0, 6).map((s, i) => {
                const pct = totalSegmentos > 0 ? (Number(s.faturamento) / totalSegmentos) * 100 : 0
                return (
                  <div key={s.segmento || i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                    <span className="text-slate-300 flex-1 truncate">{s.segmento || 'Outros'}</span>
                    <span className="text-slate-500">{pct.toFixed(0)}%</span>
                    <span className="text-slate-400 text-[11px] shrink-0">{formatCurrency(Number(s.faturamento))}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
