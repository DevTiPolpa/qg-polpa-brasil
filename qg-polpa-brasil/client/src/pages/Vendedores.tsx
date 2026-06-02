import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { trpc } from '../lib/trpc'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency, formatNumber, formatKg, formatMes } from '../lib/utils'
import { TAILWIND, BORDER_L_COLOR } from '../lib/colors'
import { ChevronRight, ChevronDown, ExternalLink, Target, DollarSign } from 'lucide-react'
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

function ClienteRow({ c, selected, filtros }: { c: any; selected: string | null; filtros: Filtros }) {
  const [expanded, setExpanded] = useState(false)
  const { data: mix } = trpc.clientes.mix.useQuery(
    { codParc: c.codParc, filtros },
    { enabled: expanded && !!c.codParc }
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

type LinhaVendedor = {
  nomeVendedor: string
  faturamento: number
  qtdNegociada: number
  qtdEntregue: number
  pesoLiquido: number
  notas: number
  clientes: number
}

type EvolucaoLinha = { mes: string; faturamento: number }

type ProjetoLinha = { projeto: string; faturamento: number }

function normalizarTexto(valor?: string | null) {
  return (valor ?? '').trim()
}

function mesDentroDoPeriodo(anoMes: string, filtros: Filtros) {
  const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null
  const fim = filtros.dataFim ? filtros.dataFim.slice(0, 7) : null
  if (ini && anoMes < ini) return false
  if (fim && anoMes > fim) return false
  return true
}

function projetoEhNovoProjeto(projeto: string) {
  return projeto.toUpperCase().includes('NOVO') || projeto.toUpperCase().includes('PROJ')
}

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
        if (ativo) setB2BResumo(rows)
      } catch (err) {
        if (ativo) setB2BError(err instanceof Error ? err.message : 'Erro ao carregar B2B')
      } finally {
        if (ativo) setB2BLoading(false)
      }
    }
    carregarB2B()
    return () => { ativo = false }
  }, [anoB2B])

  const opcoesB2B = useMemo(() => {
    const uniq = (arr: string[]) => [...new Set(arr.map(normalizarTexto).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      mercados: uniq(b2bResumo.map(r => r.mercadoVendas)),
      vendedores: uniq(b2bResumo.map(r => r.vendedor)),
      projetos: uniq(b2bResumo.map(r => r.projeto)),
      grupos: uniq(b2bResumo.map(r => normalizarTexto((r as any).grupoProduto ?? (r as any).grupo ?? ''))),
    }
  }, [b2bResumo])

  const filtrosComTipo: Filtros = (() => {
    let f = filtros
    if (tipoAtivo) f = { ...f, tiposReceita: [tipoAtivo], tipoReceita: tipoAtivo }
    if (projetosAtivos.length > 0) f = { ...f, projetos: projetosAtivos }
    return f
  })()

  const b2bFiltrado = useMemo(() => {
    return b2bResumo.filter(r => {
      const vendedor = normalizarTexto(r.vendedor)
      const projeto = normalizarTexto(r.projeto)
      const mercado = normalizarTexto(r.mercadoVendas)
      const grupo = normalizarTexto((r as any).grupoProduto ?? (r as any).grupo ?? '')
      if (!mesDentroDoPeriodo(r.anoMes, filtros)) return false
      if ((filtros.mercados?.length ?? 0) > 0 && !filtros.mercados!.includes(mercado)) return false
      if ((filtros.vendedores?.length ?? 0) > 0 && !filtros.vendedores!.includes(vendedor)) return false
      if ((filtros.projetos?.length ?? 0) > 0 && !filtros.projetos!.includes(projeto)) return false
      if ((filtros.gruposProduto?.length ?? 0) > 0 && !filtros.gruposProduto!.includes(grupo)) return false
      if (selected && vendedor !== selected) return false
      if (projetosAtivos.length > 0 && !projetosAtivos.includes(projeto)) return false
      if (tipoAtivo === 'NOVO_PROJETO' && !projetoEhNovoProjeto(projeto)) return false
      if (tipoAtivo === 'VENDA_FIRME' && projetoEhNovoProjeto(projeto)) return false
      if (tipoAtivo === 'FORECAST') return false
      return true
    })
  }, [b2bResumo, filtros, selected, projetosAtivos, tipoAtivo])

  const lista = useMemo<LinhaVendedor[]>(() => {
    const map: Record<string, LinhaVendedor> = {}
    for (const r of b2bFiltrado) {
      const vendedor = normalizarTexto(r.vendedor) || 'Sem vendedor'
      if (!map[vendedor]) {
        map[vendedor] = { nomeVendedor: vendedor, faturamento: 0, qtdNegociada: 0, qtdEntregue: 0, pesoLiquido: 0, notas: 0, clientes: 0 }
      }
      map[vendedor].faturamento += Number(r.valorPendente ?? 0)
      map[vendedor].qtdNegociada += Number(r.quantidadeNegociada ?? 0)
      map[vendedor].qtdEntregue += Number(r.quantidadeEntregue ?? 0)
      map[vendedor].pesoLiquido += Number(r.pesoLiquido ?? 0)
      map[vendedor].notas += Number(r.notas ?? 0)
      map[vendedor].clientes += Number(r.clientes ?? 0)
    }
    return Object.values(map).sort((a, b) => b.faturamento - a.faturamento)
  }, [b2bFiltrado])

  const evolucaoConsolidada = useMemo<EvolucaoLinha[]>(() => {
    const map: Record<string, number> = {}
    for (const r of b2bFiltrado) map[r.anoMes] = (map[r.anoMes] ?? 0) + Number(r.valorPendente ?? 0)
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([mes, faturamento]) => ({ mes, faturamento }))
  }, [b2bFiltrado])

  const evolucaoVendedor = evolucaoConsolidada

  const todosProjetos = useMemo<ProjetoLinha[]>(() => {
    const map: Record<string, number> = {}
    const base = b2bResumo.filter(r => {
      if (!mesDentroDoPeriodo(r.anoMes, filtros)) return false
      const mercado = normalizarTexto(r.mercadoVendas)
      const vendedor = normalizarTexto(r.vendedor)
      if ((filtros.mercados?.length ?? 0) > 0 && !filtros.mercados!.includes(mercado)) return false
      if ((filtros.vendedores?.length ?? 0) > 0 && !filtros.vendedores!.includes(vendedor)) return false
      if (selected && vendedor !== selected) return false
      return true
    })
    for (const r of base) {
      const projeto = normalizarTexto(r.projeto) || 'Sem projeto'
      map[projeto] = (map[projeto] ?? 0) + Number(r.valorPendente ?? 0)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([projeto, faturamento]) => ({ projeto, faturamento }))
  }, [b2bResumo, filtros, selected])

  const metasPorVendedor = useMemo(() => {
    const total = lista.reduce((s, v) => s + v.faturamento, 0)
    const map: Record<string, number> = {}
    for (const v of lista) map[v.nomeVendedor] = total > 0 ? v.faturamento : 0
    return map
  }, [lista])

  const metasPorMes = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of evolucaoConsolidada) map[r.mes] = r.faturamento
    return map
  }, [evolucaoConsolidada])

  const totalMeta = Object.values(metasPorVendedor).reduce((s, v) => s + v, 0)

  const crmKpiByVendedor = useMemo(() => {
    const map: Record<string, any> = {}
    for (const v of lista) {
      map[v.nomeVendedor] = {
        emAndamento: v.notas,
        valorAndamento: v.faturamento,
        ganhos: v.clientes,
        valorGanho: v.qtdEntregue,
        perdidos: 0,
        taxaConversao: v.qtdNegociada > 0 ? (v.qtdEntregue / v.qtdNegociada) * 100 : 0,
        cicloGanhos: 0,
      }
    }
    return map
  }, [lista])

  const sparklines = useMemo(() => {
    const meses = [...new Set(evolucaoConsolidada.map(r => r.mes))].sort()
    const total = meses.map(mes => Number(evolucaoConsolidada.find(r => r.mes === mes)?.faturamento ?? 0))
    const novo = meses.map(mes => b2bFiltrado.filter(r => r.anoMes === mes && projetoEhNovoProjeto(normalizarTexto(r.projeto))).reduce((s, r) => s + Number(r.valorPendente ?? 0), 0))
    const vendaFirme = meses.map(mes => b2bFiltrado.filter(r => r.anoMes === mes && !projetoEhNovoProjeto(normalizarTexto(r.projeto))).reduce((s, r) => s + Number(r.valorPendente ?? 0), 0))
    return { TOTAL: total, VENDA_FIRME: vendaFirme, FORECAST: [], NOVO_PROJETO: novo }
  }, [evolucaoConsolidada, b2bFiltrado])

  const totalFat = lista.reduce((s, v) => s + Number(v.faturamento), 0)
  const valorVendaFirme = b2bFiltrado.filter(r => !projetoEhNovoProjeto(normalizarTexto(r.projeto))).reduce((s, r) => s + Number(r.valorPendente ?? 0), 0)
  const valorNovoProjeto = b2bFiltrado.filter(r => projetoEhNovoProjeto(normalizarTexto(r.projeto))).reduce((s, r) => s + Number(r.valorPendente ?? 0), 0)
  const valorForecast = 0

  const evolucao = selected ? evolucaoVendedor : evolucaoConsolidada
  const clientes = useMemo(() => lista.slice(0, 30).map((v, i) => ({
    codParc: i + 1,
    razaoSocial: v.nomeVendedor,
    uf: '—',
    faturamento: v.faturamento,
    volume: v.pesoLiquido,
    ultimaCompra: null,
  })), [lista])
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
  const showOrcamento = false

  const limparTudo = () => {
    setFiltros(DEFAULT_FILTROS)
    setTipoAtivo(null)
    setProjetosAtivos([])
    setSelected(null)
  }

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

      <FiltrosGlobais filtros={filtros} onChange={setFiltros} opcoesOverride={opcoesB2B} />

      {b2bError && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          Erro ao carregar B2B: {b2bError}
        </div>
      )}

      {b2bLoading && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
          Carregando dados da B2B...
        </div>
      )}

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="text-left rounded-xl border border-l-4 border-l-green-500 bg-slate-800 px-4 pt-4 pb-2 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Faturamento</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-green-500/15">
              <DollarSign className="w-3 h-3 text-green-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(totalFat)}</p>
          <div className="mt-auto -mx-1">
            <MiniSparkline data={sparklines.TOTAL} color="#22c55e" />
          </div>
        </div>

        {[
          { key: 'VENDA_FIRME',  label: 'Venda Firme',  valor: valorVendaFirme },
          { key: 'FORECAST',     label: 'Forecast',     valor: valorForecast },
          { key: 'NOVO_PROJETO', label: 'Novo Projeto', valor: valorNovoProjeto },
        ].map(({ key, label, valor }) => {
          const isActive = tipoAtivo === key
          const color = SPARKLINE_COLOR[key]
          return (
            <button key={key} onClick={() => setTipoAtivo(isActive ? null : key)}
              className={`text-left rounded-xl border border-l-4 ${BORDER_L_COLOR[key]} bg-slate-800 px-4 pt-4 pb-2 flex flex-col transition-all duration-150 ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-white/20 shadow-lg' : 'hover:bg-slate-700/60 cursor-pointer'}`}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                {label}{isActive && <span className={`ml-1.5 ${TAILWIND[key as keyof typeof TAILWIND].text}`}>●</span>}
              </p>
              <p className="text-lg font-bold text-white leading-none mb-1">{formatCurrency(Number(valor ?? 0))}</p>
              <div className="mt-auto -mx-1">
                <MiniSparkline data={sparklines[key] ?? []} color={color} />
              </div>
            </button>
          )
        })}

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
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (totalFat / totalMeta) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">{tituloEvolucao}</h2>
            {!selected && <span className="text-[11px] text-slate-500">Clique em um vendedor para filtrar</span>}
          </div>
          {(() => {
            const chartData = (evolucao ?? []).map(r => ({
              mes: formatMes(r.mes),
              Faturamento: Number(r.faturamento),
              Meta: metasPorMes[r.mes] ?? null,
              Orçamento: showOrcamento ? null : undefined,
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
                </LineChart>
              </ResponsiveContainer>
            )
          })()}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block rounded" /><span className="text-[11px] text-slate-500">Faturamento</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-orange-500 inline-block" /><span className="text-[11px] text-slate-500">Meta</span></span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">Resultado Vendedores</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 border-b border-slate-700/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider select-none">
            <p className="flex-1 min-w-0">Vendedor</p>
            <p className="w-[88px] text-right shrink-0">Realizado</p>
            <p className="w-[88px] text-right shrink-0">Meta</p>
            <p className="w-[72px] text-right shrink-0">% Ating.</p>
            <div className="w-px h-3 bg-slate-700 shrink-0" />
            <p className="w-[52px] text-center shrink-0">Em And.</p>
            <p className="w-[80px] text-center shrink-0">Vlr And.</p>
            <p className="w-[52px] text-center shrink-0">Ganhos</p>
            <p className="w-[80px] text-center shrink-0">Vlr Ganho</p>
            <p className="w-[52px] text-center shrink-0">Perdidos</p>
            <p className="w-[58px] text-center shrink-0">Taxa</p>
            <p className="w-[46px] text-center shrink-0">Ciclo</p>
            <div className="w-4 shrink-0" />
          </div>

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
                    <p className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{v.nomeVendedor ?? 'Sem vendedor'}</p>
                    <p className="w-[88px] text-right shrink-0 text-sm font-bold text-white">{fmtM(fat)}</p>
                    <p className="w-[88px] text-right shrink-0 text-sm text-slate-300">{meta != null ? fmtM(meta) : '—'}</p>
                    <p className={`w-[72px] text-right shrink-0 text-sm font-bold ${pctColor}`}>
                      {pctAting != null ? `${pctAting.toFixed(1)}%` : '—'}
                    </p>
                    <div className="w-px h-6 bg-slate-700 shrink-0" />
                    <p className="w-[52px] text-center shrink-0 text-sm text-white">{crm != null ? crm.emAndamento : '—'}</p>
                    <p className="w-[80px] text-center shrink-0 text-sm text-white">{crm != null ? fmtM(Number(crm.valorAndamento)) : '—'}</p>
                    <p className="w-[52px] text-center shrink-0 text-sm font-semibold text-green-400">{crm != null ? crm.ganhos : '—'}</p>
                    <p className="w-[80px] text-center shrink-0 text-sm text-white">{crm != null ? formatNumber(Number(crm.valorGanho)) : '—'}</p>
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