import { useState, useMemo } from 'react'
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock, Users, Target, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { trpc } from '../lib/trpc'
import { formatCurrency, formatNumber, formatPercent, formatMes } from '../lib/utils'

// ─── Cores ────────────────────────────────────────────────────────────────────
const C_AND  = 'oklch(0.62 0.18 250)'
const C_WON  = 'oklch(0.65 0.20 145)'
const C_LOST = 'oklch(0.65 0.22 25)'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

function pct(v: number | null | undefined) {
  return v != null ? `${formatNumber(v, 1)}%` : '—'
}
function dias(v: number | null | undefined) {
  return v != null ? `${formatNumber(v, 0)}d` : '—'
}

function KpiCard({ label, value, sub, icon: Icon, iconClass, loading }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; iconClass: string; loading?: boolean
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        {loading ? <Skeleton className="h-5 w-20" /> : <p className="text-sm font-bold text-foreground">{value}</p>}
        {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const today = new Date()
const defaultIni = `${today.getFullYear()}-01-01`
const defaultFim = today.toISOString().slice(0, 10)

const PIPELINES = [
  { id: null, label: 'Todos' },
  { id: 0,    label: 'Comercial' },
  { id: 31,   label: 'Private Label' },
]

// ─── Mescla linhas A (criados) + B (fechados) por período ─────────────────────
function mergeCalendario<A extends { periodo: string }, B extends { periodo: string }>(
  a: A[], b: B[], zeroA: Omit<A, 'periodo'>, zeroB: Omit<B, 'periodo'>
): Array<A & B> {
  const periods = [...new Set([...a.map(x => x.periodo), ...b.map(x => x.periodo)])].sort()
  return periods.map(p => ({
    ...zeroA,
    ...zeroB,
    ...a.find(x => x.periodo === p),
    ...b.find(x => x.periodo === p),
    periodo: p,
  })) as Array<A & B>
}

// ─── Seção genérica de deals ──────────────────────────────────────────────────
function DealsSection({
  title, subtitle, pipelineId, origem, dateIni, dateFim, visao, userId,
}: {
  title: string; subtitle: string
  pipelineId: number | null; origem: 'leads' | 'base' | 'total'
  dateIni: string; dateFim: string; visao: 'calendario' | 'coorte'
  userId?: number
}) {
  const snapQ = trpc.panoramaCrm.dealsSnapshot.useQuery({ pipelineId, origem, userId })
  const dealsQ = trpc.panoramaCrm.deals.useQuery({ dateIni, dateFim, visao, pipelineId, origem, userId })

  const snap = snapQ.data
  const loading = dealsQ.isLoading || snapQ.isLoading

  type Row = { periodo: string; criados: number; ganhos: number; valorGanhos: number; perdidos: number; taxaConv: number | null; cicloTotal: number | null; cicloGanhos: number | null; emAndamento?: number; valorEmAndamento?: number }

  const rows: Row[] = useMemo(() => {
    if (!dealsQ.data) return []
    if (visao === 'calendario') {
      const d = dealsQ.data as { criados: { periodo: string; criados: number }[]; fechados: { periodo: string; ganhos: number; valorGanhos: number; perdidos: number; cicloTotal: number | null; cicloGanhos: number | null }[] }
      return mergeCalendario(d.criados, d.fechados, { criados: 0 }, { ganhos: 0, valorGanhos: 0, perdidos: 0, cicloTotal: null, cicloGanhos: null }).map(r => ({
        ...r,
        taxaConv: (r.ganhos + r.perdidos + (snap?.emAndamento ?? 0)) > 0
          ? r.ganhos / ((snap?.emAndamento ?? 0) + r.ganhos + r.perdidos) * 100
          : null,
      }))
    } else {
      const d = dealsQ.data as { rows: Row[] }
      return d.rows ?? []
    }
  }, [dealsQ.data, snap, visao])

  const totGanhos  = rows.reduce((s, r) => s + r.ganhos, 0)
  const totPerdidos = rows.reduce((s, r) => s + r.perdidos, 0)
  const totValor   = rows.reduce((s, r) => s + r.valorGanhos, 0)
  const taxaTotal  = snap ? totGanhos / Math.max(snap.emAndamento + totGanhos + totPerdidos, 1) * 100 : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Em Andamento"  value={formatNumber(snap?.emAndamento ?? 0)}       icon={Clock}        iconClass="bg-blue-500/15 text-blue-400"    loading={snapQ.isLoading} />
        <KpiCard label="Valor em And." value={formatCurrency(snap?.valorEmAndamento ?? 0)} icon={DollarSign}   iconClass="bg-blue-500/15 text-blue-400"    loading={snapQ.isLoading} />
        <KpiCard label="Ganhos"        value={formatNumber(totGanhos)}                      icon={CheckCircle}  iconClass="bg-green-500/15 text-green-400"  loading={loading} />
        <KpiCard label="Valor Ganhos"  value={formatCurrency(totValor)}                     icon={TrendingUp}   iconClass="bg-green-500/15 text-green-400"  loading={loading} />
        <KpiCard label="Perdidos"      value={formatNumber(totPerdidos)}                    icon={XCircle}      iconClass="bg-red-500/15 text-red-400"      loading={loading} />
        <KpiCard label="Taxa Conversão" value={pct(taxaTotal)}                              icon={Target}       iconClass="bg-amber-500/15 text-amber-400"  loading={loading} />
        <KpiCard label="Ciclo Ganhos"  value={dias(rows.find(r => r.cicloGanhos != null)?.cicloGanhos)} icon={Users} iconClass="bg-purple-500/15 text-purple-400" loading={loading} />
      </div>

      {/* Tabela */}
      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          {loading ? <Skeleton className="h-40 m-4" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Criados</TableHead>
                  <TableHead className="text-right text-green-400">Ganhos</TableHead>
                  <TableHead className="text-right text-green-400">Valor Ganhos</TableHead>
                  <TableHead className="text-right text-red-400">Perdidos</TableHead>
                  <TableHead className="text-right">Taxa Conv.%</TableHead>
                  <TableHead className="text-right">Ciclo Total</TableHead>
                  <TableHead className="text-right">Ciclo Ganhos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.periodo}>
                    <TableCell className="font-medium">{formatMes(r.periodo)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNumber(r.criados)}</TableCell>
                    <TableCell className="text-right text-green-400">{formatNumber(r.ganhos)}</TableCell>
                    <TableCell className="text-right text-green-400">{formatCurrency(r.valorGanhos)}</TableCell>
                    <TableCell className="text-right text-red-400">{formatNumber(r.perdidos)}</TableCell>
                    <TableCell className="text-right">{pct(r.taxaConv)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{dias(r.cicloTotal)}</TableCell>
                    <TableCell className="text-right">{dias(r.cicloGanhos)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sem dados para o período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PanoramaCrm() {
  const [dateIni, setDateIni] = useState(defaultIni)
  const [dateFim, setDateFim] = useState(defaultFim)
  const [visao, setVisao]     = useState<'calendario' | 'coorte'>('calendario')
  const [pipeline, setPipeline] = useState<number | null>(null)
  const [userId, setUserId]     = useState<number | undefined>(undefined)

  const { data: crmVendedores } = trpc.panoramaCrm.vendedores.useQuery()

  // Leads
  const leadsSnapQ = trpc.panoramaCrm.leadsSnapshot.useQuery()
  const leadsQ     = trpc.panoramaCrm.leads.useQuery({ dateIni, dateFim, visao })
  const leadsSnap  = leadsSnapQ.data ?? 0

  type LeadRow = { periodo: string; criados: number; comMovimentacao: number; convertidos: number; perdidos: number; taxaConv: number | null; cicloMedio: number | null; emAndamento?: number }

  const leadsRows: LeadRow[] = useMemo(() => {
    if (!leadsQ.data) return []
    if (visao === 'calendario') {
      const d = leadsQ.data as { criados: { periodo: string; criados: number; comMovimentacao: number }[]; fechados: { periodo: string; convertidos: number; perdidos: number; cicloMedio: number | null }[] }
      const merged = mergeCalendario(d.criados ?? [], d.fechados ?? [], { criados: 0, comMovimentacao: 0 }, { convertidos: 0, perdidos: 0, cicloMedio: null })
      const totConv = merged.reduce((s, r) => s + r.convertidos, 0)
      const totPerd = merged.reduce((s, r) => s + r.perdidos, 0)
      return merged.map(r => ({
        ...r,
        taxaConv: (leadsSnap + totConv + totPerd) > 0 ? r.convertidos / (leadsSnap + totConv + totPerd) * 100 : null,
      }))
    } else {
      const d = leadsQ.data as { rows: LeadRow[] }
      return d.rows ?? []
    }
  }, [leadsQ.data, leadsSnap, visao])

  const totConv  = leadsRows.reduce((s, r) => s + r.convertidos, 0)
  const totPerdL = leadsRows.reduce((s, r) => s + r.perdidos, 0)
  const taxaLeads = (leadsSnap + totConv + totPerdL) > 0 ? totConv / (leadsSnap + totConv + totPerdL) * 100 : 0

  return (
    <div className="space-y-8 fade-in">
      {/* Header + filtros */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Panorama CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise histórica de leads e negócios — Bitrix24</p>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Datas */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date" value={dateIni} onChange={e => setDateIni(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <span className="text-muted-foreground text-sm">até</span>
            <input
              type="date" value={dateFim} onChange={e => setDateFim(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="h-5 w-px bg-slate-700" />

          {/* Visão */}
          <div className="flex items-center gap-1">
            {(['calendario', 'coorte'] as const).map(v => (
              <button key={v} onClick={() => setVisao(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${visao === v ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                {v === 'calendario' ? '📅 Calendário' : '📊 Coorte'}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-700" />

          {/* Vendedor */}
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

          <div className="h-5 w-px bg-slate-700" />

          {/* Pipeline (só para seções de negócios) */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline:</span>
            {PIPELINES.map(p => (
              <button key={String(p.id)} onClick={() => setPipeline(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pipeline === p.id ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso da visão */}
        <p className="text-[11px] text-muted-foreground border-l-2 border-slate-600 pl-3">
          {visao === 'calendario'
            ? '📅 Visão Calendário: ganhos/perdidos contabilizados no mês em que fecharam, independente da criação.'
            : '📊 Visão Coorte: cada linha mostra o destino final dos leads/negócios criados naquele mês. Meses recentes aparecem com conversão baixa pois ainda estão maturando.'}
        </p>
      </div>

      {/* ── Seção 1: Leads ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">1. Geração de Demanda — Leads</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Em Andamento" value={formatNumber(leadsSnap)}  icon={Clock}       iconClass="bg-blue-500/15 text-blue-400"   loading={leadsSnapQ.isLoading} />
          <KpiCard label="Criados"      value={formatNumber(leadsRows.reduce((s,r)=>s+r.criados,0))} icon={Users} iconClass="bg-slate-500/15 text-slate-400" loading={leadsQ.isLoading} />
          <KpiCard label="Convertidos"  value={formatNumber(totConv)}    icon={CheckCircle} iconClass="bg-green-500/15 text-green-400" loading={leadsQ.isLoading} />
          <KpiCard label="Perdidos"     value={formatNumber(totPerdL)}   icon={XCircle}     iconClass="bg-red-500/15 text-red-400"     loading={leadsQ.isLoading} />
          <KpiCard label="Taxa Conv.%"  value={pct(taxaLeads)}           icon={Target}      iconClass="bg-amber-500/15 text-amber-400" loading={leadsQ.isLoading} />
          <KpiCard label="Ciclo Médio"  value={dias(leadsRows.find(r=>r.cicloMedio!=null)?.cicloMedio)} icon={TrendingUp} iconClass="bg-purple-500/15 text-purple-400" loading={leadsQ.isLoading} />
        </div>

        <Card className="border border-border bg-card">
          <CardContent className="p-0">
            {leadsQ.isLoading ? <Skeleton className="h-40 m-4" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Criados</TableHead>
                    <TableHead className="text-right">Movimentação</TableHead>
                    <TableHead className="text-right text-green-400">Convertidos</TableHead>
                    <TableHead className="text-right text-red-400">Perdidos</TableHead>
                    <TableHead className="text-right">Taxa Conv.%</TableHead>
                    <TableHead className="text-right">Ciclo Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsRows.map(r => (
                    <TableRow key={r.periodo}>
                      <TableCell className="font-medium">{formatMes(r.periodo)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatNumber(r.criados)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatNumber(r.comMovimentacao)}</TableCell>
                      <TableCell className="text-right text-green-400">{formatNumber(r.convertidos)}</TableCell>
                      <TableCell className="text-right text-red-400">{formatNumber(r.perdidos)}</TableCell>
                      <TableCell className="text-right">{pct(r.taxaConv)}</TableCell>
                      <TableCell className="text-right">{dias(r.cicloMedio)}</TableCell>
                    </TableRow>
                  ))}
                  {leadsRows.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem dados para o período</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Seção 2: Negócios de Leads ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">2. Negócios de Leads</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DealsSection title="Negócios de Leads — Comercial" subtitle="Deals com lead_id preenchido | Funil Comercial" pipelineId={0} origem="leads" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
        <DealsSection title="Negócios de Leads — Private Label" subtitle="Deals com lead_id preenchido | Funil Marca Própria" pipelineId={31} origem="leads" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
      </div>

      {/* ── Seção 3: Base de Clientes ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">3. Negócios da Base de Clientes</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DealsSection title="Base de Clientes — Comercial" subtitle="Deals sem lead_id | Funil Comercial" pipelineId={0} origem="base" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
        <DealsSection title="Base de Clientes — Private Label" subtitle="Deals sem lead_id | Funil Marca Própria" pipelineId={31} origem="base" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
      </div>

      {/* ── Seção 4: Visão Completa ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">4. Visão Completa (Leads + Base)</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <DealsSection title="Visão Completa — Comercial" subtitle="Todos os deals | Funil Comercial" pipelineId={0} origem="total" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
        <DealsSection title="Visão Completa — Private Label" subtitle="Todos os deals | Funil Marca Própria" pipelineId={31} origem="total" dateIni={dateIni} dateFim={dateFim} visao={visao} userId={userId} />
      </div>
    </div>
  )
}
