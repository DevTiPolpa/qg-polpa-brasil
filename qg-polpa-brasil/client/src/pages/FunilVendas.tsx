import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import {
  TrendingUp, Target, CheckCircle, XCircle, Clock, Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { trpc } from '../lib/trpc'
import { formatCurrency, formatNumber, formatPercent, formatMes } from '../lib/utils'

// ─── Cores ────────────────────────────────────────────────────────────────────
const C_ANDAMENTO = 'oklch(0.62 0.18 250)'
const C_GANHO     = 'oklch(0.65 0.20 145)'
const C_PERDIDO   = 'oklch(0.65 0.22 25)'
const C_GRID      = 'oklch(0.22 0.008 265)'
const C_TICK      = 'oklch(0.52 0.012 265)'

// ─── Ordem das etapas por pipeline ───────────────────────────────────────────
// Palavras-chave únicas de cada etapa para match case-insensitive
const STAGE_ORDER: Record<number, string[]> = {
  0: [
    'SQL',           // SQL - Oportunidade Qualificada
    'Proposta',      // Proposta / Envio da amostra
    'Explorat',      // Teste Exploratório no Cliente
    'Aplica',        // Aplicação no Cliente
    'Homologa',      // Homologação
    'Industrial',    // Teste Industrial/Mercado
    'Negocia',       // Negociação
    'Efetivando',    // Efetivando venda
  ],
  31: [
    'Explora',       // Exploração
    'Conhecendo',    // Conhecendo o Desafio
    'Desenvolvimento', // Desenvolvimento do Projeto
    'Formula',       // Formulação e Embalagem
    'Efetivando',    // Efetivando Venda
  ],
}

function sortEtapas<T extends { etapa: string; pipelineId: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const order = STAGE_ORDER[a.pipelineId] ?? STAGE_ORDER[b.pipelineId] ?? []
    const idxA = order.findIndex(kw => a.etapa.toLowerCase().includes(kw.toLowerCase()))
    const idxB = order.findIndex(kw => b.etapa.toLowerCase().includes(kw.toLowerCase()))
    const posA = idxA === -1 ? 99 : idxA
    const posB = idxB === -1 ? 99 : idxB
    return posA - posB
  })
}

// ─── Pipelines disponíveis ────────────────────────────────────────────────────
const PIPELINES = [
  { id: 0,  label: 'Comercial' },
  { id: 31, label: 'Private Label' },
]
const ALL_IDS = PIPELINES.map(p => p.id)

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs space-y-1">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface KpiProps {
  label: string; value: string; sub?: string
  icon: React.ElementType; iconClass: string; loading?: boolean
}
function KpiCard({ label, value, sub, icon: Icon, iconClass, loading }: KpiProps) {
  return (
    <Card className="border border-border bg-card transition-all duration-150">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        {loading ? <Skeleton className="h-5 w-24" /> : <p className="text-sm font-bold text-foreground">{value}</p>}
        {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function FunilVendas() {
  const [selectedIds, setSelectedIds] = useState<number[] | undefined>(undefined)
  const [userId, setUserId]           = useState<number | undefined>(undefined)

  const { data: crmVendedores } = trpc.funilCrm.vendedores.useQuery()

  const input = { ...(selectedIds ? { pipelineIds: selectedIds } : {}), ...(userId != null ? { userId } : {}) }
  const inputOrUndef = Object.keys(input).length > 0 ? input : undefined

  const { data: kpis,        isLoading: loadKpis }     = trpc.funilCrm.kpis.useQuery(inputOrUndef)
  const { data: porEtapa,    isLoading: loadEtapa }    = trpc.funilCrm.porEtapa.useQuery(inputOrUndef)
  const { data: porPipeline, isLoading: loadPipeline } = trpc.funilCrm.porPipeline.useQuery(inputOrUndef)
  const { data: vendedores,  isLoading: loadVend }     = trpc.funilCrm.topVendedores.useQuery(inputOrUndef)
  const { data: evolucao,    isLoading: loadEvol }     = trpc.funilCrm.evolucaoMensal.useQuery(inputOrUndef)

  const kpi = kpis?.[0]

  // Agrupa etapas por pipeline, respeitando a ordem definida
  const etapasPorPipeline = sortEtapas(porEtapa ?? []).reduce<Record<string, typeof porEtapa>>((acc, e) => {
    const key = e.pipeline ?? 'Comercial'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(e)
    return acc
  }, {})

  const evolucaoFormatada = (evolucao ?? []).map(e => ({ ...e, mesLabel: formatMes(e.mes) }))

  // ─── Handlers do filtro ────────────────────────────────────────────────────
  function togglePipeline(id: number) {
    if (!selectedIds) {
      // Estava em "Todos" → seleciona só este
      setSelectedIds([id])
    } else if (selectedIds.includes(id)) {
      // Estava selecionado → remove
      const next = selectedIds.filter(x => x !== id)
      setSelectedIds(next.length === 0 || next.length === ALL_IDS.length ? undefined : next)
    } else {
      // Não estava → adiciona
      const next = [...selectedIds, id]
      setSelectedIds(next.length === ALL_IDS.length ? undefined : next)
    }
  }

  function isActive(id: number) {
    return !selectedIds || selectedIds.includes(id)
  }

  const allActive = !selectedIds

  return (
    <div className="space-y-6 fade-in">
      {/* Header + filtro */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline CRM — dados sincronizados do Bitrix24</p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro vendedor */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendedor:</span>
            <select
              value={userId ?? ''}
              onChange={e => setUserId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-slate-800 border border-slate-700 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 min-w-[150px]"
            >
              <option value="">Todos</option>
              {(crmVendedores ?? []).map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Filtro de pipelines */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funil:</span>
            <button
              onClick={() => setSelectedIds(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                allActive
                  ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Todos
            </button>
            {PIPELINES.map(p => (
              <button
                key={p.id}
                onClick={() => togglePipeline(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive(p.id) && !allActive
                    ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40'
                    : allActive
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-white hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Em Andamento"  value={formatNumber(kpi?.emAndamento ?? 0)}          sub="negócios ativos"             icon={Clock}        iconClass="bg-blue-500/15 text-blue-400"    loading={loadKpis} />
        <KpiCard label="Valor Pipeline" value={formatCurrency(kpi?.valorPipeline ?? 0)}     sub="potencial em aberto"         icon={TrendingUp}   iconClass="bg-green-500/15 text-green-400"  loading={loadKpis} />
        <KpiCard label="Ganhos"         value={formatNumber(kpi?.ganhos ?? 0)}               sub={formatCurrency(kpi?.valorGanho ?? 0)} icon={CheckCircle} iconClass="bg-emerald-500/15 text-emerald-400" loading={loadKpis} />
        <KpiCard label="Perdidos"       value={formatNumber(kpi?.perdidos ?? 0)}             icon={XCircle}      iconClass="bg-red-500/15 text-red-400"      loading={loadKpis} />
        <KpiCard label="Taxa Conversão" value={formatPercent(kpi?.taxaConversao ?? 0)}       sub="ganhos / (ganhos+perdidos)"  icon={Target}       iconClass="bg-amber-500/15 text-amber-400"  loading={loadKpis} />
        <KpiCard label="Ciclo Médio"    value={`${formatNumber(kpi?.diasMedioFechamento ?? 0)} dias`} sub="da abertura ao fechamento" icon={Users} iconClass="bg-purple-500/15 text-purple-400" loading={loadKpis} />
      </div>

      {/* Etapas por pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loadEtapa
          ? [0, 1].map(i => <Skeleton key={i} className="h-72" />)
          : Object.entries(etapasPorPipeline).map(([pipeline, etapas]) => (
            <Card key={pipeline} className="border border-border bg-card">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Etapas em Andamento — {pipeline}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{etapas?.length} etapas com negócios ativos</p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <ResponsiveContainer width="100%" height={Math.max(200, (etapas?.length ?? 1) * 40 + 20)}>
                  <BarChart
                    layout="vertical"
                    data={etapas?.map(e => ({ etapa: e.etapa, Negócios: e.total }))}
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: C_TICK }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="etapa" width={180}
                      tick={{ fontSize: 10, fill: C_TICK }} axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.22 0.008 265 / 0.4)' }} />
                    <Bar dataKey="Negócios" fill={C_ANDAMENTO} radius={[0, 3, 3, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Por pipeline + Evolução mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">Negócios por Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loadPipeline
              ? <Skeleton className="h-56" />
              : (
                <div className="space-y-3 py-1">
                  {(porPipeline ?? []).map(p => {
                    const total = p.emAndamento + p.ganhos + p.perdidos
                    const pctA = total > 0 ? (p.emAndamento / total) * 100 : 0
                    const pctG = total > 0 ? (p.ganhos / total) * 100 : 0
                    const pctP = total > 0 ? (p.perdidos / total) * 100 : 0
                    return (
                      <div key={p.pipeline} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{p.pipeline}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(p.valorPipeline)} em aberto</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-px">
                          <div style={{ width: `${pctA}%`, background: C_ANDAMENTO }} />
                          <div style={{ width: `${pctG}%`, background: C_GANHO }} />
                          <div style={{ width: `${pctP}%`, background: C_PERDIDO }} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C_ANDAMENTO }} />{p.emAndamento} abertos</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C_GANHO }} />{p.ganhos} ganhos</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C_PERDIDO }} />{p.perdidos} perdidos</span>
                          <span className="ml-auto font-semibold text-amber-400">{formatPercent(p.taxaConversao)} conv.</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">Evolução Mensal — últimos 12 meses</CardTitle>
            <p className="text-xs text-muted-foreground">Negócios abertos, ganhos e perdidos por mês de criação</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loadEvol
              ? <Skeleton className="h-56" />
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={evolucaoFormatada} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: C_TICK }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C_TICK }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => <span style={{ color: C_TICK }}>{v}</span>} />
                    <Line type="monotone" dataKey="abertos"  name="Abertos"  stroke={C_ANDAMENTO} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ganhos"   name="Ganhos"   stroke={C_GANHO}     strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="perdidos" name="Perdidos" stroke={C_PERDIDO}    strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Top Vendedores */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-foreground">Top Vendedores — Pipeline em Aberto</CardTitle>
          <p className="text-xs text-muted-foreground">Ranking por valor de pipeline ativo</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadVend
            ? <Skeleton className="h-48" />
            : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_60px_60px_80px_70px] gap-2 pb-1 border-b border-border">
                  {['Vendedor', 'Pipeline', 'Abertos', 'Ganhos', 'Perdidos', 'Conversão'].map(h => (
                    <span key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {(vendedores ?? []).map((v, i) => {
                  const maxP = Math.max(...(vendedores ?? []).map(x => x.valorPipeline), 1)
                  return (
                    <div key={i}>
                      <div className="grid grid-cols-[1fr_80px_60px_60px_80px_70px] gap-2 items-center py-1.5">
                        <span className="text-sm text-foreground font-medium truncate">{v.nome.trim()}</span>
                        <span className="text-xs font-semibold text-green-400">{formatCurrency(v.valorPipeline)}</span>
                        <span className="text-xs text-muted-foreground text-center">{v.emAndamento}</span>
                        <span className="text-xs text-emerald-400 text-center">{v.ganhos}</span>
                        <span className="text-xs text-red-400 text-center">{v.perdidos}</span>
                        <span className="text-xs font-semibold text-amber-400">{formatPercent(v.taxaConversao)}</span>
                      </div>
                      <div className="h-0.5 bg-muted rounded-full overflow-hidden -mt-1 mb-1">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(v.valorPipeline / maxP) * 100}%`, background: C_ANDAMENTO }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  )
}
