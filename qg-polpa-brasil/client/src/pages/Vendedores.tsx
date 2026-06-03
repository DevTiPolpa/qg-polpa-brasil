import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getVendedoresOriginalResumo, getVendedoresOriginalClienteMix, type VendedoresOriginalResumo } from '../lib/api'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency, formatNumber, formatKg, formatMes } from '../lib/utils'
import { TAILWIND, BORDER_L_COLOR } from '../lib/colors'
import { ChevronRight, ChevronDown, ExternalLink, Target, DollarSign } from 'lucide-react'

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
  const mixQueryKey = useMemo(() => [
    'vendedores-original-cliente-mix',
    c.codParc,
    filtros.dataInicio,
    filtros.dataFim,
    (filtros.mercados ?? []).join('|'),
    (filtros.vendedores ?? []).join('|'),
    (filtros.projetos ?? []).join('|'),
    (filtros.gruposProduto ?? []).join('|'),
    (filtros.tiposReceita ?? []).join('|'),
    filtros.uf,
    filtros.codProduto,
  ], [c.codParc, filtros])

  const { data: mix = [], isLoading: loadingMix, error: mixError } = useQuery({
    queryKey: mixQueryKey,
    queryFn: () => getVendedoresOriginalClienteMix(Number(c.codParc), filtros as any),
    enabled: expanded && c.codParc != null,
    staleTime: 30_000,
  })

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
      {expanded && loadingMix && (
        <tr className="bg-slate-900/60 border-l-2 border-l-slate-600">
          <td colSpan={6} className="pl-7 pr-2 py-2 text-slate-500 text-[11px]">Carregando produtos...</td>
        </tr>
      )}
      {expanded && mixError && (
        <tr className="bg-slate-900/60 border-l-2 border-l-red-700">
          <td colSpan={6} className="pl-7 pr-2 py-2 text-red-400 text-[11px]">Não foi possível carregar os produtos deste cliente.</td>
        </tr>
      )}
      {expanded && !loadingMix && !mixError && (mix ?? []).map((p: any) => (
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

  const filtrosComTipo: Filtros = (() => {
    let f = filtros
    if (tipoAtivo) f = { ...f, tiposReceita: [tipoAtivo], tipoReceita: tipoAtivo }
    if (projetosAtivos.length > 0) f = { ...f, projetos: projetosAtivos }
    return f
  })()

  // Quando um vendedor está selecionado, o endpoint consolidado recebe o filtro do vendedor.
  const filtrosApi: Filtros = selected
    ? { ...filtrosComTipo, vendedores: [selected], vendedor: selected }
    : filtrosComTipo

  const [resumo, setResumo] = useState<VendedoresOriginalResumo | null>(null)
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [erroResumo, setErroResumo] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setLoadingResumo(true)
    setErroResumo(null)
    getVendedoresOriginalResumo({
      dataInicio: filtrosApi.dataInicio,
      dataFim: filtrosApi.dataFim,
      mercados: filtrosApi.mercados,
      vendedores: filtrosApi.vendedores,
      projetos: filtrosApi.projetos,
      gruposProduto: filtrosApi.gruposProduto,
      tiposReceita: filtrosApi.tiposReceita,
      limitClientes: 100,
    })
      .then(data => { if (ativo) setResumo(data) })
      .catch(err => { if (ativo) setErroResumo(err instanceof Error ? err.message : 'Erro ao carregar vendedores') })
      .finally(() => { if (ativo) setLoadingResumo(false) })
    return () => { ativo = false }
  }, [
    filtrosApi.dataInicio,
    filtrosApi.dataFim,
    JSON.stringify(filtrosApi.mercados ?? []),
    JSON.stringify(filtrosApi.vendedores ?? []),
    JSON.stringify(filtrosApi.projetos ?? []),
    JSON.stringify(filtrosApi.gruposProduto ?? []),
    JSON.stringify(filtrosApi.tiposReceita ?? []),
  ])

  const metasRaw = resumo?.metas ?? []
  const lista = resumo?.vendedores ?? []
  const evolucaoConsolidada = resumo?.evolucaoMensal ?? []
  const evolucaoPorTipo = resumo?.evolucaoPorTipo ?? []
  const crmMapping = resumo?.crmMapping ?? []
  const crmKpis = resumo?.crmKpis ?? []
  const orcamentoMensal = resumo?.orcamentoMensal ?? []
  const clientesConsolidados = resumo?.clientesConsolidados ?? []
  const evolucaoVendedor = resumo?.evolucaoMensal ?? []
  const clientesVendedor = resumo?.clientesConsolidados ?? []
  const todosProjetos = useMemo(() => {
    const projetos = new Set<string>()
    for (const m of metasRaw) if (m.projeto) projetos.add(m.projeto)
    for (const v of lista) {
      if (Number(v.fatRecorrente ?? 0) > 0) projetos.add('Recorrente')
      if (Number(v.fatNovoProjeto ?? 0) > 0) projetos.add('Novo Projeto')
    }
    return [...projetos].sort().map(projeto => ({ projeto }))
  }, [metasRaw, lista])
  const kpisTipo = [
    { tipoReceita: 'VENDA_FIRME', faturamento: Number(resumo?.kpis?.vendaFirme ?? 0) },
    { tipoReceita: 'FORECAST', faturamento: Number(resumo?.kpis?.forecast ?? 0) },
    { tipoReceita: 'NOVO_PROJETO', faturamento: Number(resumo?.kpis?.novoProjeto ?? 0) },
  ]
  const kpisAnt = null

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
    const normalizarNome = (nome: string) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
    for (const m of mappingArr) {
      const crmId = m.crmUserId ?? m.id
      if (crmId == null) continue
      const kpi = kpisArr.find(k => k.crmUserId === crmId)
      const nome = m.nomeFaturamento ?? m.nome
      if (kpi && nome) {
        const nomeNormalizado = normalizarNome(nome)
        const vendedor = (lista ?? []).find(v => normalizarNome(v.nomeVendedor ?? '').includes(nomeNormalizado) || nomeNormalizado.includes(normalizarNome(v.nomeVendedor ?? '')))
        map[vendedor?.nomeVendedor ?? nome] = kpi
      }
    }
    return map
  }, [crmMapping, crmKpis, lista])

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
  if (tipoAtivo) {
    const labels: Record<string, string> = { VENDA_FIRME: 'Venda Firme', FORECAST: 'Forecast', NOVO_PROJETO: 'Novo Projeto' }
    badges.push({ label: `Tipo: ${labels[tipoAtivo] ?? tipoAtivo}`, onRemove: () => setTipoAtivo(null) })
  }
  projetosAtivos.forEach(p => badges.push({ label: `Projeto: ${p}`, onRemove: () => setProjetosAtivos(prev => prev.filter(x => x !== p)) }))
  ;(filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }))
  ;(filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }))
  ;(filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }))
  ;(filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }))
  ;(filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Análise por Vendedor</h1>
        <p className="text-slate-400 text-sm mt-0.5">Performance individual, carteira de clientes e evolução</p>
      </div>

      <FiltrosGlobais filtros={filtros} onChange={setFiltros} />

      {erroResumo && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          Erro ao carregar os dados completos da API: {erroResumo}
        </div>
      )}
      {loadingResumo && !resumo && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
          Carregando dados completos de vendedores...
        </div>
      )}

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

      {/* KPI cards com sparklines */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* Card Faturamento Total */}
          {(() => {
            const fatAtual = totalFat
            const fatAnt = Number(kpisAnt?.faturamentoTotal ?? 0)
            const pct = fatAnt > 0 ? ((fatAtual - fatAnt) / fatAnt) * 100 : null
            const positivo = pct != null && pct >= 0
            return (
              <div className="text-left rounded-xl border border-l-4 border-l-green-500 bg-slate-800 px-4 pt-4 pb-2 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Faturamento</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-green-500/15">
                    <DollarSign className="w-3 h-3 text-green-400" />
                  </div>
                </div>
                <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(fatAtual)}</p>
                <div className="mt-auto -mx-1">
                  <MiniSparkline data={sparklines.TOTAL} color="#22c55e" />
                </div>
              </div>
            )
          })()}

          {[
            { key: 'VENDA_FIRME',  label: 'Venda Firme',  kpi: kpiVendaFirme  },
            { key: 'FORECAST',     label: 'Forecast',     kpi: kpiForecast    },
            { key: 'NOVO_PROJETO', label: 'Novo Projeto', kpi: kpiNovoProjeto },
          ].map(({ key, label, kpi }) => {
            const isActive = tipoAtivo === key
            const color = SPARKLINE_COLOR[key]
            return (
              <button key={key} onClick={() => setTipoAtivo(isActive ? null : key)}
                className={`text-left rounded-xl border border-l-4 ${BORDER_L_COLOR[key]} bg-slate-800 px-4 pt-4 pb-2 flex flex-col transition-all duration-150 ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-white/20 shadow-lg' : 'hover:bg-slate-700/60 cursor-pointer'}`}
              >
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {label}{isActive && <span className={`ml-1.5 ${TAILWIND[key as keyof typeof TAILWIND].text}`}>●</span>}
                </p>
                <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(Number(kpi?.faturamento ?? 0))}</p>
                <div className="mt-auto -mx-1">
                  <MiniSparkline data={sparklines[key] ?? []} color={color} />
                </div>
              </button>
            )
          })}

          {/* Card Meta */}
          <div className="text-left rounded-xl border border-l-4 border-l-orange-500 bg-slate-800 px-4 pt-4 pb-3 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3 h-3 text-orange-400" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Meta 2026</p>
            </div>
            <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(totalMeta)}</p>
            {totalMeta > 0 && totalFat > 0 && (
              <div className="space-y-1.5 mt-auto">
                <span className={`text-[11px] font-semibold ${totalFat >= totalMeta ? 'text-green-400' : 'text-orange-400'}`}>
                  {((totalFat / totalMeta) * 100).toFixed(1)}% atingido
                </span>
                {totalFat < totalMeta && (
                  <p className="text-[10px] text-slate-500">
                    Faltam <span className="text-slate-300">{formatCurrency(totalMeta - totalFat)}</span>
                  </p>
                )}
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (totalFat / totalMeta) * 100)}%` }} />
                </div>
              </div>
            )}
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