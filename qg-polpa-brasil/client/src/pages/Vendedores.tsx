import { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { trpc } from '../lib/trpc'
import { type Filtros } from '../components/FiltrosGlobais'
import MultiSelect from '../components/MultiSelect'
import { formatCurrency, formatNumber, formatKg, formatMes } from '../lib/utils'
import { TAILWIND, BORDER_L_COLOR } from '../lib/colors'
import { ChevronRight, ChevronDown, ExternalLink, Target, DollarSign, SlidersHorizontal, X } from 'lucide-react'
import { getB2BResumo, type B2BResumoItem } from '../lib/api'

const SPARKLINE_COLOR: Record<string, string> = {
  VENDA_FIRME: '#22c55e',
  FORECAST: '#f97316',
  NOVO_PROJETO: '#3b82f6',
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-9" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 100, H = 36
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 6) - 3
    return `${x},${y}`
  })
  const areaPoints = [`0,${H}`, ...pts, `${W},${H}`].join(' ')
  const gid = `sg${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gid})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function ProjetoDonut({ projetos, projetosAtivos }: { projetos: Array<{ projeto: string; faturamento: number }>; projetosAtivos: string[] }) {
  const CORES = ['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#14b8a6', '#ec4899']
  const total = projetos.reduce((s, p) => s + Number(p.faturamento), 0)
  if (total === 0 || projetos.length === 0) return null
  const dominant = projetos[0]
  const dominantPct = (Number(dominant.faturamento) / total) * 100
  const label = dominantPct.toFixed(1) + '%'
  const name = dominant.projeto.length > 11 ? dominant.projeto.slice(0, 11) + '…' : dominant.projeto
  const r = 36, ri = 22, cx = 46, cy = 46
  const polar = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
  }
  const arc = (start: number, span: number, color: string, dimmed: boolean) => {
    if (span >= 360) span = 359.9
    const p1 = polar(start, r), p2 = polar(start + span, r)
    const i1 = polar(start + span, ri), i2 = polar(start, ri)
    const lg = span > 180 ? 1 : 0
    const d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${lg} 1 ${p2.x} ${p2.y} L ${i1.x} ${i1.y} A ${ri} ${ri} 0 ${lg} 0 ${i2.x} ${i2.y} Z`
    return <path key={start} d={d} fill={color} opacity={dimmed ? 0.2 : 1} />
  }
  let angle = -90
  const segs = projetos.map((p, i) => {
    const span = (Number(p.faturamento) / total) * 360
    const seg = { start: angle, span, color: CORES[i % CORES.length], dimmed: projetosAtivos.length > 0 && !projetosAtivos.includes(p.projeto) }
    angle += span
    return seg
  })
  return (
    <div className="flex flex-col items-center shrink-0">
      <svg width="92" height="92">
        {segs.map((s, i) => arc(s.start, s.span, s.color, s.dimmed))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{label}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#94a3b8" fontSize="8">{name}</text>
      </svg>
    </div>
  )
}

function GaugeArc({ fat, meta }: { fat: number; meta: number }) {
  const achievement = Math.max(0, (fat / meta) * 100)
  const fillColor = achievement < 40 ? '#ef4444' : achievement < 70 ? '#eab308' : achievement < 85 ? '#4ade80' : '#16a34a'
  const cx = 72, cy = 66, r = 56
  const leftX = cx - r, rightX = cx + r
  const arcSpan = Math.min(180, (achievement / 100) * 180)
  const theta = (Math.PI / 180) * (180 - arcSpan)
  const endX = cx + r * Math.cos(theta)
  const endY = cy - r * Math.sin(theta)
  const largeArc = arcSpan > 180 ? 1 : 0
  return (
    <div className="shrink-0">
      <svg viewBox="0 0 144 78" width="120" height="65" style={{ display: 'block' }}>
        <path d={`M ${leftX} ${cy} A ${r} ${r} 0 0 1 ${rightX} ${cy}`} fill="none" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
        {arcSpan > 0.5 && (
          <path d={`M ${leftX} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke={fillColor} strokeWidth="12" strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="17" fontWeight="bold">{`${achievement.toFixed(2)}%`}</text>
      </svg>
    </div>
  )
}

function MetaGauge({ fat, meta }: { fat: number; meta: number }) {
  const achievement = Math.max(0, (fat / meta) * 100)  // 0% a N%
  const difPct      = ((fat / meta) - 1) * 100

  // Escalonamento de cores por atingimento
  const fillColor = achievement < 40 ? '#ef4444'
    : achievement < 70              ? '#eab308'
    : achievement < 85              ? '#4ade80'
    :                                 '#16a34a'

  const cx = 72, cy = 66, r = 56
  const leftX  = cx - r  // 16
  const rightX = cx + r  // 128

  const arcSpan  = Math.min(180, (achievement / 100) * 180)
  const theta    = (Math.PI / 180) * (180 - arcSpan)
  const endX     = cx + r * Math.cos(theta)
  const endY     = cy - r * Math.sin(theta)
  const largeArc = arcSpan > 180 ? 1 : 0

  const tickIX = endX - 7 * Math.cos(theta)
  const tickIY = endY + 7 * Math.sin(theta)
  const tickOX = endX + 4 * Math.cos(theta)
  const tickOY = endY - 4 * Math.sin(theta)

  const label = `${achievement.toFixed(2)}%`
  const fmt = (v: number) =>
    v >= 1_000_000 ? `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
    : v >= 1_000   ? `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`
    :                `R$ ${v.toFixed(0)}`

  return (
    <div className="flex flex-col items-center shrink-0 w-36">
      {/* R$ acima do gauge */}
      <div className="flex w-full justify-between px-0.5 mb-1">
        <div>
          <p className="text-xs font-bold text-white leading-none">{fmt(fat)}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Realizado</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-white leading-none">{fmt(meta)}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Meta</p>
        </div>
      </div>
      <p className="text-[9px] font-medium text-slate-400 mb-0.5">% Atingimento</p>
      <svg viewBox="0 0 144 80" width="144" height="80" style={{ display: 'block' }}>
        <path d={`M ${leftX} ${cy} A ${r} ${r} 0 0 1 ${rightX} ${cy}`}
          fill="none" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
        {arcSpan > 0.5 && (
          <path d={`M ${leftX} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none" stroke={fillColor} strokeWidth="12" strokeLinecap="round" />
        )}
        {arcSpan > 2 && (
          <line x1={tickIX} y1={tickIY} x2={tickOX} y2={tickOY}
            stroke="white" strokeWidth="2" strokeLinecap="round" />
        )}
        <text x={leftX}  y={cy + 13} textAnchor="middle" fill="#475569" fontSize="9">0%</text>
        <text x={cx}     y={cy - r - 7} textAnchor="middle" fill="#475569" fontSize="9">50%</text>
        <text x={rightX} y={cy + 13} textAnchor="middle" fill="#475569" fontSize="9">100%</text>
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="17" fontWeight="bold">{label}</text>
      </svg>
    </div>
  )
}

function ClienteRow({ c, selected, filtros }: { c: any; selected: string | null; filtros: Filtros }) {
  const [expanded, setExpanded] = useState(false)
  const { data: mix } = trpc.clientes.mix.useQuery(
    { codParc: c.codParc, filtros },
    { enabled: expanded }
  )
  return (
    <>
      <tr
        className="hover:bg-slate-700/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-2 py-2 text-white font-medium">
          <span className="flex items-center gap-1">
            {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />}
            <span className="truncate">{c.razaoSocial ?? `Cliente ${c.codParc}`}</span>
          </span>
        </td>
        <td className="px-2 py-2 text-slate-400 text-center">{c.uf ?? '—'}</td>
        <td className="px-2 py-2 text-green-400 font-semibold text-right">{formatCurrency(Number(c.faturamento))}</td>
        <td className="px-2 py-2 text-slate-400 text-right">{Math.round(Number(c.volume)).toLocaleString('pt-BR')}</td>
        <td className="px-2 py-2 text-slate-400 text-right">{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—'}</td>
        <td className="px-2 py-2 text-right">
          <button className="text-slate-500 hover:text-slate-300 transition-colors text-[10px] flex items-center gap-0.5 ml-auto">
            <ExternalLink className="w-3 h-3" />
          </button>
        </td>
      </tr>
      {expanded && (mix ?? []).map((p: any) => (
        <tr key={p.codProduto} className="bg-slate-900/60 border-l-2 border-l-slate-600">
          <td className="pl-7 pr-2 py-1.5 text-slate-300 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
              <span className="text-slate-500 shrink-0">{p.codProduto}</span>
              <span className="truncate">{p.nomeProduto ?? '—'}</span>
            </span>
          </td>
          <td className="px-2 py-1.5" />
          <td className="px-2 py-1.5 text-green-500/80 text-[11px] text-right">{formatCurrency(Number(p.faturamento))}</td>
          <td className="px-2 py-1.5 text-slate-500 text-[11px] text-right">{Math.round(Number(p.volume)).toLocaleString('pt-BR')}</td>
          <td className="px-2 py-1.5 text-slate-500 text-[11px] text-right">{p.ultimaCompra ? new Date(p.ultimaCompra).toLocaleDateString('pt-BR') : '—'}</td>
          <td className="px-2 py-1.5" />
        </tr>
      ))}
    </>
  )
}

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

export default function Vendedores() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)
  const [selected, setSelected] = useState<string | null>(null)
  const [tipoAtivo, setTipoAtivo] = useState<string | null>(null)
  const [projetosAtivos, setProjetosAtivos] = useState<string[]>([])
  const [b2bResumo, setB2BResumo] = useState<B2BResumoItem[]>([])
  const [b2bLoading, setB2BLoading] = useState(false)
  const [b2bError, setB2BError] = useState<string | null>(null)

  const anoB2B = filtros.dataInicio?.slice(0, 4) || '2026'

  useEffect(() => {
    let ativo = true

    async function carregarB2B() {
      try {
        setB2BLoading(true)
        setB2BError(null)
        const rows = await getB2BResumo(anoB2B)

        if (ativo) {
          setB2BResumo(rows)
        }
      } catch (error) {
        if (ativo) {
          setB2BResumo([])
          setB2BError(error instanceof Error ? error.message : 'Erro ao carregar resumo da B2B')
        }
      } finally {
        if (ativo) {
          setB2BLoading(false)
        }
      }
    }

    carregarB2B()

    return () => {
      ativo = false
    }
  }, [anoB2B])

  const filtrosComTipo: Filtros = (() => {
    let f = filtros
    if (tipoAtivo) f = { ...f, tiposReceita: [tipoAtivo], tipoReceita: tipoAtivo }
    if (projetosAtivos.length > 0) f = { ...f, projetos: projetosAtivos }
    return f
  })()

  // Quando um vendedor está selecionado, os cards KPI refletem apenas esse vendedor
  const filtrosKpi: Filtros = selected
    ? { ...filtrosComTipo, vendedores: [selected], vendedor: selected }
    : filtrosComTipo

  const { data: kpisTipo } = trpc.dashboard.kpisPorTipo.useQuery(filtrosKpi)
  const { data: kpisAnt } = trpc.dashboard.kpisAnoAnterior.useQuery(filtrosKpi)
  const filtrosMeta = {
    projetos: projetosAtivos.length > 0 ? projetosAtivos : filtros.projetos,
    mercados: filtros.mercados,
    vendedores: selected ? [selected] : filtros.vendedores,
  }
  const { data: metasRaw } = trpc.vendedores.metas.useQuery(filtrosMeta)
  const { data: lista } = trpc.vendedores.lista.useQuery(filtrosComTipo)
  // Query sem filtro de projeto para listar todos os projetos disponíveis nos botões
  const filtrosSemProjeto: Filtros = (() => {
    let f = filtros
    if (tipoAtivo) f = { ...f, tiposReceita: [tipoAtivo], tipoReceita: tipoAtivo }
    if (selected) f = { ...f, vendedores: [selected], vendedor: selected }
    return f
  })()
  const { data: todosProjetos } = trpc.vendedores.projetos.useQuery({ filtros: filtrosSemProjeto })
  const { data: evolucaoConsolidada } = trpc.vendedores.evolucaoConsolidada.useQuery(filtrosComTipo, { enabled: !selected })
  const { data: evolucaoPorTipo } = trpc.vendedores.evolucaoPorTipo.useQuery(filtrosComTipo, { enabled: !selected })
  const { data: crmMapping }     = trpc.vendedores.crmMapping.useQuery()
  const { data: crmKpis }        = trpc.vendedores.crmKpis.useQuery()
  const { data: orcamentoMensal } = trpc.dashboard.orcamentoMensal.useQuery(filtrosComTipo, { enabled: !selected })
  const { data: clientesConsolidados } = trpc.vendedores.clientesConsolidados.useQuery(filtrosComTipo, { enabled: !selected })
  const { data: evolucaoVendedor } = trpc.vendedores.evolucao.useQuery({ nomeVendedor: selected!, filtros: filtrosComTipo }, { enabled: !!selected })
  const { data: clientesVendedor } = trpc.vendedores.clientes.useQuery({ nomeVendedor: selected!, filtros: filtrosComTipo }, { enabled: !!selected })

  // Metas: filtrar pelo período selecionado (projeto/mercado já vêm filtrados do servidor)
  const metasPorVendedor = useMemo(() => {
    const map: Record<string, number> = {}
    for (const m of metasRaw ?? []) {
      const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null
      const fim = filtros.dataFim   ? filtros.dataFim.slice(0, 7)   : null
      if (ini && m.mes < ini) continue
      if (fim && m.mes > fim) continue
      map[m.nomeVendedor] = (map[m.nomeVendedor] ?? 0) + Number(m.valorMeta)
    }
    return map
  }, [metasRaw, filtros.dataInicio, filtros.dataFim])

  const metasPorMes = useMemo(() => {
    const map: Record<string, number> = {}
    for (const m of metasRaw ?? []) {
      const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null
      const fim = filtros.dataFim   ? filtros.dataFim.slice(0, 7)   : null
      if (ini && m.mes < ini) continue
      if (fim && m.mes > fim) continue
      map[m.mes] = (map[m.mes] ?? 0) + Number(m.valorMeta)
    }
    return map
  }, [metasRaw, filtros.dataInicio, filtros.dataFim])

  const totalMeta = Object.values(metasPorVendedor).reduce((s, v) => s + v, 0)

  // Lookup: nomeVendedor → KPIs CRM
  const crmKpiByVendedor = useMemo(() => {
    const mappingArr = crmMapping ?? []
    const kpisArr    = crmKpis    ?? []
    const map: Record<string, typeof kpisArr[0]> = {}
    for (const m of mappingArr) {
      if (m.crmUserId == null) continue
      const kpi = kpisArr.find(k => k.crmUserId === m.crmUserId)
      if (kpi) map[m.nomeFaturamento] = kpi
    }
    return map
  }, [crmMapping, crmKpis])

  // Sparklines — séries mensais por tipo para os KPI cards
  const sparklines = useMemo(() => {
    const rows = evolucaoPorTipo ?? []
    const meses = [...new Set(rows.map(r => r.mes))].sort()
    const byTipo: Record<string, number[]> = { VENDA_FIRME: [], FORECAST: [], NOVO_PROJETO: [] }
    for (const tipo of Object.keys(byTipo)) {
      byTipo[tipo] = meses.map(mes => Number(rows.find(r => r.mes === mes && r.tipoReceita === tipo)?.faturamento ?? 0))
    }
    const total = meses.map(mes => Number((evolucaoConsolidada ?? []).find(r => r.mes === mes)?.faturamento ?? 0))
    return { ...byTipo, TOTAL: total }
  }, [evolucaoPorTipo, evolucaoConsolidada])

  const totalFat = selected
    ? Number((lista ?? []).find(v => v.nomeVendedor === selected)?.faturamento ?? 0)
    : (lista ?? []).reduce((s, v) => s + Number(v.faturamento), 0)

  const kpiVendaFirme = kpisTipo?.find(k => k.tipoReceita === 'VENDA_FIRME')
  const kpiForecast = kpisTipo?.find(k => k.tipoReceita === 'FORECAST')
  const kpiNovoProjeto = kpisTipo?.find(k => k.tipoReceita === 'NOVO_PROJETO')

  const evolucao = selected ? evolucaoVendedor : evolucaoConsolidada
  const clientes = selected ? clientesVendedor : clientesConsolidados
  const tituloEvolucao = selected ? `Evolução — ${selected}` : 'Evolução Consolidada — Todos os Vendedores'
  const tituloClientes = selected ? `Clientes — ${selected}` : 'Top Clientes — Todos os Vendedores'

  const DEFAULT_FILTROS_OBJ: Filtros = DEFAULT_FILTROS
  const temFiltrosGlobais =
    filtros.dataInicio !== DEFAULT_FILTROS_OBJ.dataInicio ||
    filtros.dataFim !== DEFAULT_FILTROS_OBJ.dataFim ||
    (filtros.mercados?.length ?? 0) > 0 ||
    (filtros.vendedores?.length ?? 0) > 0 ||
    (filtros.projetos?.length ?? 0) > 0 ||
    (filtros.gruposProduto?.length ?? 0) > 0 ||
    (filtros.tiposReceita?.length ?? 0) > 0

  const temQualquerFiltro = temFiltrosGlobais || !!tipoAtivo || projetosAtivos.length > 0 || !!selected

  // Orçamento só aparece quando não há filtros além de data
  const showOrcamento =
    (filtros.mercados?.length ?? 0) === 0 &&
    (filtros.vendedores?.length ?? 0) === 0 &&
    (filtros.projetos?.length ?? 0) === 0 &&
    (filtros.gruposProduto?.length ?? 0) === 0 &&
    (filtros.tiposReceita?.length ?? 0) === 0 &&
    !tipoAtivo &&
    projetosAtivos.length === 0 &&
    !selected

  const limparTudo = () => {
    setFiltros(DEFAULT_FILTROS)
    setTipoAtivo(null)
    setProjetosAtivos([])
    setSelected(null)
  }

  // Badges dos filtros ativos
  const badges: { label: string; onRemove: () => void }[] = []
  if (selected) badges.push({ label: `Vendedor: ${selected.replace(/^\d+ - /, '')}`, onRemove: () => setSelected(null) })
  projetosAtivos.forEach(p => badges.push({ label: `Projeto: ${p}`, onRemove: () => setProjetosAtivos(prev => prev.filter(x => x !== p)) }))
  ;(filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }))
  ;(filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }))
  ;(filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }))
  ;(filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }))
  ;(filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }))

  const b2bFiltrado = useMemo(() => {
    const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null
    const fim = filtros.dataFim ? filtros.dataFim.slice(0, 7) : null
    const vendedoresFiltro = selected ? [selected] : (filtros.vendedores ?? [])
    const projetosFiltro = projetosAtivos.length > 0 ? projetosAtivos : (filtros.projetos ?? [])
    const mercadosFiltro = filtros.mercados ?? []

    return b2bResumo.filter(row => {
      if (ini && row.anoMes < ini) return false
      if (fim && row.anoMes > fim) return false
      if (vendedoresFiltro.length > 0 && !vendedoresFiltro.includes(row.vendedor)) return false
      if (projetosFiltro.length > 0 && !projetosFiltro.includes(row.projeto)) return false
      if (mercadosFiltro.length > 0 && !mercadosFiltro.includes(row.mercadoVendas)) return false
      return true
    })
  }, [b2bResumo, filtros.dataInicio, filtros.dataFim, filtros.vendedores, filtros.projetos, filtros.mercados, projetosAtivos, selected])

  const b2bTotais = useMemo(() => {
    return b2bFiltrado.reduce(
      (acc, row) => {
        acc.quantidadeNegociada += Number(row.quantidadeNegociada ?? 0)
        acc.quantidadeEntregue += Number(row.quantidadeEntregue ?? 0)
        acc.pesoLiquido += Number(row.pesoLiquido ?? 0)
        acc.valorPendente += Number(row.valorPendente ?? 0)
        acc.notas += Number(row.notas ?? 0)
        acc.clientes += Number(row.clientes ?? 0)
        return acc
      },
      {
        quantidadeNegociada: 0,
        quantidadeEntregue: 0,
        pesoLiquido: 0,
        valorPendente: 0,
        notas: 0,
        clientes: 0,
      }
    )
  }, [b2bFiltrado])

  const b2bPorVendedor = useMemo(() => {
    const map = new Map<string, {
      vendedor: string
      quantidadeNegociada: number
      quantidadeEntregue: number
      pesoLiquido: number
      valorPendente: number
      notas: number
      clientes: number
    }>()

    for (const row of b2bFiltrado) {
      const atual = map.get(row.vendedor) ?? {
        vendedor: row.vendedor,
        quantidadeNegociada: 0,
        quantidadeEntregue: 0,
        pesoLiquido: 0,
        valorPendente: 0,
        notas: 0,
        clientes: 0,
      }

      atual.quantidadeNegociada += Number(row.quantidadeNegociada ?? 0)
      atual.quantidadeEntregue += Number(row.quantidadeEntregue ?? 0)
      atual.pesoLiquido += Number(row.pesoLiquido ?? 0)
      atual.valorPendente += Number(row.valorPendente ?? 0)
      atual.notas += Number(row.notas ?? 0)
      atual.clientes += Number(row.clientes ?? 0)

      map.set(row.vendedor, atual)
    }

    return Array.from(map.values()).sort((a, b) => b.valorPendente - a.valorPendente)
  }, [b2bFiltrado])


  const b2bOpcoes = useMemo(() => {
    const unico = (valores: Array<string | null | undefined>) =>
      Array.from(new Set(valores.map(v => String(v ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    return {
      mercados: unico(b2bResumo.map(row => row.mercadoVendas)),
      vendedores: unico(b2bResumo.map(row => row.vendedor)),
      projetos: unico(b2bResumo.map(row => row.projeto)),
    }
  }, [b2bResumo])

  const limparFiltrosB2B = () => {
    setFiltros(DEFAULT_FILTROS)
    setTipoAtivo(null)
    setProjetosAtivos([])
    setSelected(null)
  }

  const aplicarPeriodoRapido = (dataInicio: string, dataFim: string) => {
    setFiltros(prev => ({ ...prev, dataInicio, dataFim }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Análise por Vendedor</h1>
        <p className="text-slate-400 text-sm mt-0.5">Performance individual, carteira de clientes e evolução</p>
      </div>

      {/* Filtros B2B — opções derivadas da própria tabela B2B */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Filtros B2B</span>
          <span className="text-xs text-muted-foreground/50">· Consulta somente leitura da tabela B2B</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium">
            {filtros.dataInicio?.slice(0, 4) ?? '2026'}
          </span>
          {temQualquerFiltro && (
            <button
              type="button"
              onClick={limparFiltrosB2B}
              className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 inline-flex items-center"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect
            options={b2bOpcoes.mercados}
            selected={filtros.mercados ?? []}
            onChange={(vals) => setFiltros(prev => ({ ...prev, mercados: vals, mercado: vals[0] }))}
            placeholder="Todos os mercados"
            className="flex-1 min-w-[130px] max-w-[220px]"
          />
          <MultiSelect
            options={b2bOpcoes.vendedores}
            selected={filtros.vendedores ?? []}
            onChange={(vals) => {
              setSelected(null)
              setFiltros(prev => ({ ...prev, vendedores: vals, vendedor: vals[0] }))
            }}
            placeholder="Todos os vendedores"
            className="flex-1 min-w-[150px] max-w-[240px]"
          />
          <MultiSelect
            options={b2bOpcoes.projetos}
            selected={filtros.projetos ?? []}
            onChange={(vals) => {
              setProjetosAtivos([])
              setFiltros(prev => ({ ...prev, projetos: vals, projeto: vals[0] }))
            }}
            placeholder="Todos os projetos"
            className="flex-1 min-w-[130px] max-w-[220px]"
          />
          <button
            type="button"
            disabled
            title="A consulta B2B atual não traz grupo de produto. Para habilitar este filtro, o backend precisa retornar grupoProduto na rota B2B."
            className="flex-1 min-w-[130px] max-w-[220px] h-7 px-2.5 rounded-md border border-border bg-background/60 text-xs text-muted-foreground text-left opacity-60 cursor-not-allowed"
          >
            Grupos indisponíveis na B2B
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => aplicarPeriodoRapido('2026-01-01', '2026-12-31')}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${
              filtros.dataInicio === '2026-01-01' && filtros.dataFim === '2026-12-31'
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent'
            }`}
          >
            2026
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodoRapido('2025-01-01', '2025-12-31')}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${
              filtros.dataInicio === '2025-01-01' && filtros.dataFim === '2025-12-31'
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent'
            }`}
          >
            2025
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodoRapido('2026-01-01', '2026-06-30')}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${
              filtros.dataInicio === '2026-01-01' && filtros.dataFim === '2026-06-30'
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent'
            }`}
          >
            1º Sem 2026
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodoRapido('2026-07-01', '2026-12-31')}
            className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${
              filtros.dataInicio === '2026-07-01' && filtros.dataFim === '2026-12-31'
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent'
            }`}
          >
            2º Sem 2026
          </button>
        </div>
      </div>

      {/* Botões rápidos de Projeto */}
      {(todosProjetos ?? []).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">Projeto</span>
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {(todosProjetos ?? []).map(p => {
              const isActive = projetosAtivos.includes(p.projeto)
              return (
                <button
                  key={p.projeto}
                  onClick={() => setProjetosAtivos(prev => isActive ? prev.filter(x => x !== p.projeto) : [...prev, p.projeto])}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                    isActive
                      ? 'bg-green-500/20 text-green-300 border-green-500/50'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:border-slate-400 hover:text-white'
                  }`}
                >
                  {p.projeto}
                </button>
              )
            })}
          </div>
          {projetosAtivos.length > 0 && (
            <button onClick={() => setProjetosAtivos([])} className="shrink-0 text-[11px] text-slate-400 hover:text-white transition-colors">
              Limpar ×
            </button>
          )}
        </div>
      )}

      {/* Banner filtros ativos */}
      {temQualquerFiltro && (
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
          <button
            onClick={limparTudo}
            className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* KPI cards — baseados na B2B */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="text-left rounded-xl border border-l-4 border-l-blue-500 bg-slate-800 px-4 pt-4 pb-4 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Valor pendente B2B</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/15">
              <DollarSign className="w-3 h-3 text-blue-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(b2bTotais.valorPendente)}</p>
          <p className="text-[10px] text-slate-500 mt-auto">Base: ValorPendente da B2B</p>
        </div>

        <div className="text-left rounded-xl border border-l-4 border-l-green-500 bg-slate-800 px-4 pt-4 pb-4 flex flex-col">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Qtd. negociada</p>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatNumber(b2bTotais.quantidadeNegociada, 0)}</p>
          <p className="text-[10px] text-slate-500 mt-auto">Pedidos/negociações no período</p>
        </div>

        <div className="text-left rounded-xl border border-l-4 border-l-yellow-500 bg-slate-800 px-4 pt-4 pb-4 flex flex-col">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Qtd. entregue</p>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatNumber(b2bTotais.quantidadeEntregue, 0)}</p>
          <p className="text-[10px] text-slate-500 mt-auto">Entregue conforme B2B</p>
        </div>

        <div className="text-left rounded-xl border border-l-4 border-l-cyan-500 bg-slate-800 px-4 pt-4 pb-4 flex flex-col">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Peso líquido</p>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatKg(b2bTotais.pesoLiquido)}</p>
          <p className="text-[10px] text-slate-500 mt-auto">Peso total filtrado</p>
        </div>

        <div className="text-left rounded-xl border border-l-4 border-l-orange-500 bg-slate-800 px-4 pt-4 pb-4 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3 h-3 text-orange-400" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Notas / Clientes</p>
          </div>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatNumber(b2bTotais.notas, 0)} / {formatNumber(b2bTotais.clientes, 0)}</p>
          <p className="text-[10px] text-slate-500 mt-auto">Quantidade de notas e clientes</p>
        </div>
      </div>


      {/* B2B ERP — somente leitura */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Detalhamento B2B por vendedor</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Resumo por vendedor da tabela B2B. Consulta somente leitura; sem edição pelo QG.
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 px-2 py-1">
            Somente leitura
          </span>
        </div>

        {b2bError && (
          <div className="mx-5 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {b2bError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-5 border-b border-slate-700/60">
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Valor pendente</p>
            <p className="text-lg font-bold text-white mt-1">{formatCurrency(b2bTotais.valorPendente)}</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Qtd. negociada</p>
            <p className="text-lg font-bold text-white mt-1">{formatNumber(b2bTotais.quantidadeNegociada, 0)}</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Qtd. entregue</p>
            <p className="text-lg font-bold text-white mt-1">{formatNumber(b2bTotais.quantidadeEntregue, 0)}</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Peso líquido</p>
            <p className="text-lg font-bold text-white mt-1">{formatKg(b2bTotais.pesoLiquido)}</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Notas / Clientes</p>
            <p className="text-lg font-bold text-white mt-1">{formatNumber(b2bTotais.notas, 0)} / {formatNumber(b2bTotais.clientes, 0)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Vendedor</th>
                <th className="px-3 py-2 text-right font-semibold">Valor pendente</th>
                <th className="px-3 py-2 text-right font-semibold">Qtd. negociada</th>
                <th className="px-3 py-2 text-right font-semibold">Qtd. entregue</th>
                <th className="px-3 py-2 text-right font-semibold">Peso líquido</th>
                <th className="px-5 py-2 text-right font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {b2bLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-5 text-center text-slate-400">
                    Carregando dados da B2B...
                  </td>
                </tr>
              )}

              {!b2bLoading && b2bPorVendedor.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-5 text-center text-slate-500">
                    Nenhum registro encontrado para os filtros atuais.
                  </td>
                </tr>
              )}

              {!b2bLoading && b2bPorVendedor.slice(0, 10).map(row => (
                <tr key={row.vendedor} className="hover:bg-slate-700/25 transition-colors">
                  <td className="px-5 py-2.5 text-white font-medium">{row.vendedor}</td>
                  <td className="px-3 py-2.5 text-right text-blue-300 font-semibold">{formatCurrency(row.valorPendente)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(row.quantidadeNegociada, 0)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(row.quantidadeEntregue, 0)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatKg(row.pesoLiquido)}</td>
                  <td className="px-5 py-2.5 text-right text-slate-300">{formatNumber(row.notas, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-700/60 bg-slate-900/20">
          <p className="text-[11px] text-slate-500">
            Observação: ValorPendente está sendo exibido como indicador operacional. Ele ainda não deve ser usado como faturamento realizado definitivo até confirmarmos a regra financeira correta do ERP.
          </p>
        </div>
      </div>

      {/* Layout vertical: Evolução → Resultado → Top Clientes */}
      <div className="flex flex-col gap-4">

        {/* Evolução Consolidada */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">{tituloEvolucao}</h2>
            {!selected && <span className="text-[11px] text-slate-500">Clique em um vendedor para filtrar</span>}
          </div>
          {(() => {
            const orcMap: Record<string, number> = {}
            for (const o of orcamentoMensal ?? []) orcMap[o.mes] = Number(o.faturamento)
            const chartData = (evolucao ?? []).map(r => ({
              mes: formatMes(r.mes),
              Faturamento: Number(r.faturamento),
              Meta: metasPorMes[r.mes] ?? null,
              Orçamento: showOrcamento ? (orcMap[r.mes] ?? null) : undefined,
            }))
            return (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f1d30" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
                  <Tooltip
                    contentStyle={{ background: '#0f1d30', border: '1px solid #1e3454', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name]}
                    labelStyle={{ color: '#f8fafc', marginBottom: 4 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="Faturamento" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22c55e' }} />
                  <Line type="monotone" dataKey="Meta" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: '#f97316' }} connectNulls />
                  {showOrcamento && <Line type="monotone" dataKey="Orçamento" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: '#94a3b8' }} connectNulls />}
                </LineChart>
              </ResponsiveContainer>
            )
          })()}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block rounded" /><span className="text-[11px] text-slate-500">Faturamento</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-orange-500 inline-block" /><span className="text-[11px] text-slate-500">Meta</span></span>
            {showOrcamento && <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-slate-500 inline-block" /><span className="text-[11px] text-slate-500">Orçamento</span></span>}
          </div>
        </div>

        {/* Resultado Vendedores */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">

          {/* Título */}
          <div className="px-5 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">Resultado Vendedores</p>
          </div>

          {/* Cabeçalho das colunas */}
          <div className="flex items-center gap-3 px-5 py-2 border-b border-slate-700/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider select-none">
            <p className="flex-1 min-w-0">Vendedor</p>
            {/* Faturamento */}
            <p className="w-[88px] text-right shrink-0">Realizado</p>
            <p className="w-[88px] text-right shrink-0">Meta</p>
            <p className="w-[72px] text-right shrink-0">% Ating.</p>
            {/* Divisor */}
            <div className="w-px h-3 bg-slate-700 shrink-0" />
            {/* CRM */}
            <p className="w-[52px] text-center shrink-0">Em And.</p>
            <p className="w-[80px] text-center shrink-0">Vlr And.</p>
            <p className="w-[52px] text-center shrink-0">Ganhos</p>
            <p className="w-[80px] text-center shrink-0">Vlr Ganho</p>
            <p className="w-[52px] text-center shrink-0">Perdidos</p>
            <p className="w-[58px] text-center shrink-0">Taxa</p>
            <p className="w-[46px] text-center shrink-0">Ciclo</p>
            <div className="w-4 shrink-0" />
          </div>

          {/* Linhas */}
          <div className="divide-y divide-slate-700/40">
            {(() => {
              const fmtM = (n: number) =>
                n >= 1_000_000 ? `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
                : n >= 1_000   ? `R$ ${(n / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`
                :                `R$ ${n.toFixed(0)}`
              return (lista ?? []).map(v => {
                const fat  = Number(v.faturamento)
                const meta = metasPorVendedor[v.nomeVendedor ?? ''] ?? null
                const crm  = crmKpiByVendedor[v.nomeVendedor ?? ''] ?? null
                const isSelected = selected === v.nomeVendedor
                const pctAting = meta != null && meta > 0 ? (fat / meta) * 100 : null
                const pctColor = pctAting == null ? 'text-slate-400'
                  : pctAting >= 100 ? 'text-green-400'
                  : pctAting >= 85  ? 'text-green-300'
                  : pctAting >= 70  ? 'text-yellow-400'
                  : 'text-red-400'

                return (
                  <button key={v.nomeVendedor} onClick={() => setSelected(isSelected ? null : v.nomeVendedor)}
                    className={`w-full text-left px-5 py-3 hover:bg-slate-700/30 transition-colors group flex items-center gap-3 ${isSelected ? 'bg-green-900/20 border-l-4 border-l-green-500' : ''}`}
                  >
                    {/* Nome */}
                    <p className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{v.nomeVendedor ?? 'Sem vendedor'}</p>

                    {/* Faturamento */}
                    <p className="w-[88px] text-right shrink-0 text-sm font-bold text-white">{fmtM(fat)}</p>
                    <p className="w-[88px] text-right shrink-0 text-sm text-slate-300">{meta != null ? fmtM(meta) : '—'}</p>
                    <p className={`w-[72px] text-right shrink-0 text-sm font-bold ${pctColor}`}>
                      {pctAting != null ? `${pctAting.toFixed(1)}%` : '—'}
                    </p>

                    {/* Divisor */}
                    <div className="w-px h-6 bg-slate-700 shrink-0" />

                    {/* CRM */}
                    <p className="w-[52px] text-center shrink-0 text-sm text-white">{crm != null ? crm.emAndamento : '—'}</p>
                    <p className="w-[80px] text-center shrink-0 text-sm text-white">{crm != null ? fmtM(Number(crm.valorAndamento)) : '—'}</p>
                    <p className="w-[52px] text-center shrink-0 text-sm font-semibold text-green-400">{crm != null ? crm.ganhos : '—'}</p>
                    <p className="w-[80px] text-center shrink-0 text-sm text-white">{crm != null ? fmtM(Number(crm.valorGanho)) : '—'}</p>
                    <p className="w-[52px] text-center shrink-0 text-sm font-semibold text-red-400">{crm != null ? crm.perdidos : '—'}</p>
                    <p className="w-[58px] text-center shrink-0 text-sm text-white">{crm != null ? `${Number(crm.taxaConversao).toFixed(1)}%` : '—'}</p>
                    <p className="w-[46px] text-center shrink-0 text-sm text-white">{crm != null ? `${Math.round(Number(crm.cicloGanhos))}d` : '—'}</p>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                  </button>
                )
              })
            })()}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">{tituloClientes}</p>
          </div>
          <div className="overflow-y-auto max-h-[480px]">
            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[7%]" />
                <col className="w-[19%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-800">
                <tr className="border-b border-slate-700 text-slate-500">
                  <th className="text-left px-2 py-2 font-medium">Cliente</th>
                  <th className="text-left px-2 py-2 font-medium">UF</th>
                  <th className="text-right px-2 py-2 font-medium">Faturamento</th>
                  <th className="text-right px-2 py-2 font-medium">Volume</th>
                  <th className="text-right px-2 py-2 font-medium">Últ. Compra</th>
                  <th className="text-right px-2 py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {(clientes ?? []).map((c: any, i: number) => (
                  <ClienteRow key={`${c.codParc}-${i}`} c={c} selected={selected} filtros={filtrosComTipo} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}