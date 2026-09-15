import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from 'recharts'
import {
  getVisaoGlobalResumo, getVisaoGlobalFiltrosDisponiveis,
  type VisaoGlobalFiltros, type VisaoGlobalLinhaMercado, type VisaoGlobalTipoReceita,
} from '../lib/api'
import MultiSelect from '../components/MultiSelect'
import { Button } from '../components/ui/button'
import { formatCurrency, formatCurrencyExato, formatCurrencyAbrev, formatKg, formatPercent, tipoReceitaLabel } from '../lib/utils'
import { COLORS, BORDER_L_COLOR } from '../lib/colors'
import { useTheme } from '../hooks/useTheme'
import { TrendingUp, TrendingDown, Target, DollarSign, Package, PackageCheck, AlertTriangle, Info, SlidersHorizontal, X, BarChart2, Calendar } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'

// Mesma convenção de meses abreviados já usada em lib/utils.ts (MES_ABREV), duplicada
// aqui só porque precisamos do índice (1-12) pra ida e volta com o filtro de meses.
const MES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function pctClass(v: number | null): string {
  if (v == null) return 'text-muted-foreground'
  if (v > 0.0005) return 'text-green-400'
  if (v < -0.0005) return 'text-red-400'
  return 'text-muted-foreground'
}
function fmtPct(v: number | null): string {
  return v == null ? '—' : formatPercent(v * 100)
}
function fmtRS(v: number | null): string {
  return v == null ? '—' : formatCurrencyExato(v)
}
function fmtKgOrDash(v: number | null): string {
  return v == null ? '—' : formatKg(v)
}

function GraficoTooltip({ active, payload, label, metric = 'faturamento' }: any) {
  if (!active || !payload?.length) return null
  const fmt = metric === 'volume' ? formatKg : formatCurrencyExato
  const previsaoTotal = payload
    .filter((p: any) => p.dataKey !== undefined && p.name !== 'Orçamento')
    .reduce((acc: number, p: any) => acc + (p.value ?? 0), 0)
  return (
    <div style={{ backgroundColor: 'var(--color-chart-tooltip-bg)', border: '1px solid var(--color-chart-tooltip-border)', borderRadius: 8, fontSize: 12, padding: '8px 12px' }}>
      <p style={{ color: 'var(--color-chart-tooltip-text)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>{p.name} : {fmt(p.value)}</p>
      ))}
      <p style={{ color: 'var(--color-chart-tooltip-text)', fontWeight: 700, margin: '4px 0 0', paddingTop: 4, borderTop: '1px solid var(--color-chart-tooltip-border)' }}>
        Previsão Total {metric === 'volume' ? 'KG' : 'R$'} : {fmt(previsaoTotal)}
      </p>
    </div>
  )
}

function KpiCard({ label, value, tooltip, icon: Icon, colorClass }: {
  label: string; value: string; tooltip?: string; icon: React.ElementType; colorClass: string
}) {
  return (
    <div className={`bg-slate-800 border border-slate-700 border-l-4 ${colorClass} rounded-xl px-4 py-4`} title={tooltip}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>
      <p className="text-lg font-bold text-foreground leading-none truncate">{value}</p>
    </div>
  )
}

function LinhaTabela({ linha, isTotal, selected, onClick }: {
  linha: VisaoGlobalLinhaMercado; isTotal?: boolean; selected?: boolean; onClick?: () => void
}) {
  const trClass = isTotal
    ? 'bg-slate-700/60 font-bold text-foreground border-t-2 border-slate-600'
    : selected
      ? 'bg-primary/15 border-b border-slate-700/30 cursor-pointer'
      : 'hover:bg-slate-700/30 border-b border-slate-700/30 cursor-pointer'
  const tdStickyBg = isTotal ? 'bg-slate-700/60' : selected ? 'bg-primary/15' : 'bg-slate-800'
  return (
    <tr className={trClass} onClick={onClick} title={isTotal ? undefined : 'Clique para filtrar a tela por este mercado'}>
      <td className={`px-3 py-2 whitespace-nowrap sticky left-0 z-10 border-r border-slate-700/40 ${tdStickyBg} ${selected ? 'text-primary font-semibold' : ''}`}>
        {isTotal ? 'TOTAL' : linha.mercado}
      </td>
      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap" title={fmtRS(linha.orcamentoRS)}>{fmtRS(linha.orcamentoRS)}</td>
      <td className="px-2 py-2 text-right text-slate-200 whitespace-nowrap" title={fmtRS(linha.previsaoTotalRS)}>{fmtRS(linha.previsaoTotalRS)}</td>
      <td className={`px-2 py-2 text-right whitespace-nowrap ${pctClass(linha.pctOrcPrevisaoRS)}`}>{fmtPct(linha.pctOrcPrevisaoRS)}</td>
      <td className="px-2 py-2 text-right text-slate-300 whitespace-nowrap">{fmtKgOrDash(linha.orcamentoKG)}</td>
      <td className="px-2 py-2 text-right text-slate-300 whitespace-nowrap">{fmtKgOrDash(linha.previsaoTotalKG)}</td>
      <td className={`px-2 py-2 text-right whitespace-nowrap ${pctClass(linha.pctOrcPrevisaoKG)}`}>{fmtPct(linha.pctOrcPrevisaoKG)}</td>
    </tr>
  )
}

// Mesmo cartão de "tipo de receita" usado no Dashboard Executivo — mesma
// nomenclatura (tipoReceitaLabel), cor da borda esquerda (BORDER_L_COLOR) e
// realce quando ativo (ring verde), pra manter as duas telas consistentes.
function TipoReceitaCard({ tipo, value, active, onClick }: {
  tipo: VisaoGlobalTipoReceita; value: string; active: boolean; onClick: () => void
}) {
  return (
    <Card
      className={`border border-l-4 ${BORDER_L_COLOR[tipo] ?? ''} bg-card transition-all duration-150 !py-0 !gap-0 cursor-pointer ${
        active
          ? 'ring-2 ring-offset-1 ring-offset-background ring-[oklch(0.65_0.20_145_/_0.5)] shadow-lg'
          : 'hover:border-border/80'
      }`}
      onClick={onClick}
    >
      <CardContent className="px-4 py-7">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
            {tipoReceitaLabel(tipo)}
            {active && <span className="ml-1 text-[oklch(0.65_0.20_145)]">●</span>}
          </p>
          <BarChart2 className="w-3 h-3 text-muted-foreground shrink-0" />
        </div>
        <p className="text-sm font-bold text-foreground tracking-tight leading-none break-all">{value}</p>
      </CardContent>
    </Card>
  )
}

// Seletor de período — mesmo formato/interação do PeriodoPicker usado no
// Dashboard Executivo (botão com ícone de calendário → popup com abas de ano +
// checklist de meses com "selecionar tudo" + botão OK). Adaptado pro modelo de
// filtro da Visão Global, que é sempre de UM ano só (troca de ano já reseta os
// meses) — diferente do Dashboard, que permite combinar meses de anos distintos.
function PeriodoPickerVG({ ano, setAno, anosDisponiveis, mesesSel, setMesesSel }: {
  ano: number
  setAno: (a: number) => void
  anosDisponiveis: number[]
  mesesSel: string[]
  setMesesSel: (fn: string[] | ((prev: string[]) => string[])) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggleMesLocal(mesLabel: string) {
    setMesesSel(prev => {
      const atual = prev.length === 0 ? [...MES_LABEL] : prev
      return atual.includes(mesLabel) ? atual.filter(m => m !== mesLabel) : [...atual, mesLabel]
    })
  }

  const todosSelecionados = mesesSel.length === 0 || mesesSel.length === MES_LABEL.length
  const label = todosSelecionados
    ? `Ano ${ano}`
    : mesesSel.length <= 3
      ? mesesSel.map(m => `${m}/${String(ano).slice(2)}`).join(' + ')
      : `${mesesSel.length} meses selecionados`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl w-[220px] overflow-hidden">
          {/* Seletor de ano — um ano por vez (o backend da Visão Global é anual) */}
          <div className="flex border-b border-border">
            {anosDisponiveis.map(a => (
              <button
                key={a}
                onClick={() => setAno(a)}
                className={`flex-1 text-[10px] font-semibold py-1.5 transition-colors ${
                  ano === a ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Checklist de meses do ano ativo */}
          <div className="max-h-[280px] overflow-y-auto">
            <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer bg-muted/40">
              <input
                type="checkbox"
                checked={todosSelecionados}
                onChange={() => setMesesSel([])}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-xs text-foreground font-semibold">{ano} · selecionar tudo</span>
            </label>
            <div className="py-1">
              {MES_LABEL.map(m => (
                <label key={m} className="flex items-center gap-2 px-3 py-1 hover:bg-accent cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todosSelecionados || mesesSel.includes(m)}
                    onChange={() => toggleMesLocal(m)}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-foreground">{m}/{String(ano).slice(2)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botão OK — os filtros já se aplicam a cada clique; o botão só fecha o popup */}
          <div className="border-t border-border p-2">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs py-1.5 rounded-md bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-colors"
            >
              OK{!todosSelecionados ? ` (${mesesSel.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VisaoGlobal() {
  const [ano, setAno] = useState(2026)
  const [mesesSel, setMesesSel] = useState<string[]>([])
  const [gruposSel, setGruposSel] = useState<string[]>([])
  const [tipoReceitaSel, setTipoReceitaSel] = useState<VisaoGlobalTipoReceita | null>(null)
  const [mercadosSel, setMercadosSel] = useState<string[]>([])
  const [projetosSel, setProjetosSel] = useState<string[]>([])

  function toggleTipoReceita(tipo: VisaoGlobalTipoReceita) {
    setTipoReceitaSel(prev => (prev === tipo ? null : tipo))
  }
  // Clique numa linha de mercado na tabela — soma/remove esse mercado da seleção
  // múltipla (mesmo estado do filtro "Todos os mercados" acima).
  function toggleMercado(mercado: string) {
    setMercadosSel(prev => (prev.includes(mercado) ? prev.filter(m => m !== mercado) : [...prev, mercado]))
  }
  // Clique numa barra do mês — vira o filtro de mês (o mesmo já usado pelo
  // seletor de período), sempre substituindo por um único mês.
  // Clicar de novo no mesmo mês limpa o filtro.
  function toggleMes(mesLabel: string) {
    setMesesSel(prev => (prev.length === 1 && prev[0] === mesLabel ? [] : [mesLabel]))
  }

  const { data: disponiveis } = useQuery({
    queryKey: ['visao-global-filtros-disponiveis'],
    queryFn: getVisaoGlobalFiltrosDisponiveis,
    staleTime: 5 * 60_000,
  })

  const filtros: VisaoGlobalFiltros = useMemo(() => ({
    ano,
    meses: mesesSel.map(m => MES_LABEL.indexOf(m) + 1).filter(n => n > 0),
    gruposProduto: gruposSel,
    tipoReceita: tipoReceitaSel ?? undefined,
    mercados: mercadosSel,
    projetos: projetosSel,
  }), [ano, mesesSel, gruposSel, tipoReceitaSel, mercadosSel, projetosSel])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['visao-global-resumo', filtros],
    queryFn: () => getVisaoGlobalResumo(filtros),
    staleTime: 60_000,
  })

  const anosDisponiveis = disponiveis?.anos?.length ? disponiveis.anos : [2026]
  const grupoOptions = disponiveis?.grupos ?? []
  const mercadoOptions = disponiveis?.mercados ?? []
  const projetoOptions = disponiveis?.projetos ?? []

  const realizadoDisponivel = data?.diagnostico.realizadoDisponivel ?? true
  const mercadosSemInfo = data?.diagnostico.mercadosSemInformacao ?? []

  const [chartView, setChartView] = useState<'faturamento' | 'volume'>('faturamento')
  // Cores de eixo/grade do gráfico não podem ler variável CSS (viram atributo
  // SVG, não estilo) — branch manual pelo tema, mesmos valores de index.css.
  const { theme } = useTheme()
  const chartAxisColor = theme === 'light' ? '#6B6F66' : '#94a3b8'
  const chartGridColor = theme === 'light' ? '#DEDED4' : '#334155'
  const chartLabelColor = theme === 'light' ? '#1E211D' : '#e2e8f0'

  const dadosGrafico = (data?.mensal ?? []).map(m => {
    const vendaFirme = m.vendaFirmeRS ?? 0
    const novoProjeto = m.novoProjetoRS ?? 0
    const forecast = m.forecastRS ?? 0
    const vendaFirmeKg = m.vendaFirmeKG ?? 0
    const novoProjetoKg = m.novoProjetoKG ?? 0
    const forecastKg = m.forecastKG ?? 0
    return {
      mes: MES_LABEL[m.mes - 1],
      orcamento: m.orcamentoRS,
      vendaFirme, novoProjeto, forecast,
      previsaoTotal: vendaFirme + novoProjeto + forecast,
      orcamentoKg: m.orcamentoKG,
      vendaFirmeKg, novoProjetoKg, forecastKg,
      previsaoTotalKg: vendaFirmeKg + novoProjetoKg + forecastKg,
    }
  })

  const chartConfig = chartView === 'faturamento'
    ? {
        vendaFirmeKey: 'vendaFirme' as const,
        forecastKey: 'forecast' as const,
        novoProjetoKey: 'novoProjeto' as const,
        orcamentoKey: 'orcamento' as const,
        totalKey: 'previsaoTotal' as const,
        tickFormatter: (v: number) => formatCurrencyAbrev(v),
        totalLabelFormatter: (v: number) => (v > 0 ? formatCurrency(v) : ''),
      }
    : {
        vendaFirmeKey: 'vendaFirmeKg' as const,
        forecastKey: 'forecastKg' as const,
        novoProjetoKey: 'novoProjetoKg' as const,
        orcamentoKey: 'orcamentoKg' as const,
        totalKey: 'previsaoTotalKg' as const,
        tickFormatter: (v: number) => formatKg(v),
        totalLabelFormatter: (v: number) => (v > 0 ? formatKg(v) : ''),
      }

  // Opacidade de cada segmento de barra: reduz quando um card de tipo OU um mês
  // diferente do clicado está selecionado — combina os dois filtros no mesmo
  // realce visual, sem afetar o cálculo em si (isso já é feito no backend).
  function opacidadeBarra(tipo: VisaoGlobalTipoReceita, mesLabel: string): number {
    const tipoOk = !tipoReceitaSel || tipoReceitaSel === tipo
    const mesOk = mesesSel.length === 0 || mesesSel.includes(mesLabel)
    return tipoOk && mesOk ? 1 : 0.2
  }

  const kpis = data?.kpis
  // "Previsão Total" = soma dos 3 grupos de receita (Vendas Firmes + Novos Projetos
  // + Forecast), sempre — independe do card de tipo selecionado, ao contrário do
  // card "Desvio R$"/"Atingimento" (esses continuam refletindo o Realizado filtrado).
  const previsaoTotalRS = kpis
    ? (kpis.vendaFirmeTotalRS ?? 0) + (kpis.novoProjetoTotalRS ?? 0) + (kpis.forecastTotalRS ?? 0)
    : null

  return (
    <div className="space-y-4">
      {/* Header — mesmo formato do Dashboard Executivo (sem card/borda, título +
          subtítulo à esquerda, indicador de status à direita). */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Visão Global Polpa Brasil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comparativo Orçado x Realizado por Mercado de Vendas</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.20_145)] inline-block animate-pulse" />
          Ano-base: {ano} ·{' '}
          {mercadosSel.length > 0
            ? <span className="text-[oklch(0.65_0.20_145)]">Filtrado por: {mercadosSel.join(', ')}</span>
            : 'Todos os mercados de vendas considerados'}
        </div>
      </div>

      {/* Filtros — mesmo padrão visual do FiltrosGlobais (Dashboard e demais telas
          restritas): mercado/projeto/grupo em multi-select + seletor de período
          igual ao do Dashboard. */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Filtros</span>
          <span className="text-xs text-muted-foreground/50">· Ano / Mês</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium">
            {mesesSel.length === 0
              ? `Ano ${ano}`
              : mesesSel.length <= 3
                ? mesesSel.map(m => `${m}/${String(ano).slice(2)}`).join(' + ')
                : `${mesesSel.length} meses selecionados`}
          </span>
          {(mesesSel.length > 0 || gruposSel.length > 0 || tipoReceitaSel || mercadosSel.length > 0 || projetosSel.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMesesSel([]); setGruposSel([]); setTipoReceitaSel(null); setMercadosSel([]); setProjetosSel([]) }}
              className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Row 1: Multi-selects */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect options={mercadoOptions} selected={mercadosSel} onChange={setMercadosSel} placeholder="Todos os mercados" className="flex-1 min-w-[150px] max-w-[220px]" />
          <MultiSelect options={projetoOptions} selected={projetosSel} onChange={setProjetosSel} placeholder="Todos os projetos" className="flex-1 min-w-[150px] max-w-[220px]" />
          <MultiSelect options={grupoOptions} selected={gruposSel} onChange={setGruposSel} placeholder="Todos os grupos" className="flex-1 min-w-[140px] max-w-[200px]" />
        </div>

        {/* Row 2: Período — mesmo componente/formato do Dashboard Executivo */}
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodoPickerVG
            ano={ano}
            setAno={(a) => { setAno(a); setMesesSel([]) }}
            anosDisponiveis={anosDisponiveis}
            mesesSel={mesesSel}
            setMesesSel={setMesesSel}
          />
        </div>
      </div>

      {/* Avisos de qualidade de dados — discretos, não bloqueiam a tela */}
      {!realizadoDisponivel && (
        <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/50 rounded-lg px-4 py-2.5 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Base de realizado não carregada para {ano} — exibindo apenas o orçamento.
        </div>
      )}
      {mercadosSemInfo.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/50 rounded-lg px-4 py-2.5 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Há registros sem Mercado de Vendas informado — agrupados como "Sem mercado informado" na tabela abaixo.
        </div>
      )}

      {/* Linha de cards de indicadores — largura total, acima da tabela (uma linha
          em desktop: 6 colunas; adapta pra 3 em telas médias, 2 em telas pequenas). */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Orçamento 2026"
          value={formatCurrency(kpis?.orcamentoTotalRS ?? 0)}
          tooltip={formatCurrencyExato(kpis?.orcamentoTotalRS ?? 0)}
          icon={Target}
          colorClass="border-l-[#E0974B]"
        />
        <KpiCard
          label="Previsão Total"
          value={previsaoTotalRS != null ? formatCurrency(previsaoTotalRS) : '—'}
          tooltip={previsaoTotalRS != null ? `${formatCurrencyExato(previsaoTotalRS)} (Vendas Firmes + Novos Projetos + Forecast)` : 'Base de realizado não carregada'}
          icon={DollarSign}
          colorClass="border-l-[#4F9D6E]"
        />
        <KpiCard
          label="Desvio R$"
          value={kpis?.desvioRS != null ? formatCurrency(kpis.desvioRS) : '—'}
          tooltip={kpis?.desvioRS != null ? formatCurrencyExato(kpis.desvioRS) : undefined}
          icon={kpis?.desvioRS != null && kpis.desvioRS < 0 ? TrendingDown : TrendingUp}
          colorClass={kpis?.desvioRS != null && kpis.desvioRS < 0 ? 'border-l-red-500' : 'border-l-green-600'}
        />
        <KpiCard
          label="Atingimento"
          value={kpis?.atingimentoPct != null ? formatPercent(kpis.atingimentoPct * 100) : '—'}
          icon={PackageCheck}
          colorClass="border-l-blue-500"
        />
        <KpiCard label="Orçamento KG" value={formatKg(kpis?.orcamentoKG ?? 0)} icon={Package} colorClass="border-l-[#E0974B]" />
        <KpiCard
          label="Realizado KG"
          value={kpis?.realizadoKG != null ? formatKg(kpis.realizadoKG) : '—'}
          icon={Package}
          colorClass="border-l-[#4F9D6E]"
        />
      </div>

      {/* Cards por tipo de receita — clicáveis: filtram Realizado (KPIs, colunas
          da tabela e gráfico) para mostrar só o tipo selecionado. Clicar de novo
          no mesmo card remove o filtro. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TipoReceitaCard
          tipo="VENDA_FIRME"
          value={kpis?.vendaFirmeTotalRS != null ? formatCurrency(kpis.vendaFirmeTotalRS) : '—'}
          active={tipoReceitaSel === 'VENDA_FIRME'}
          onClick={() => toggleTipoReceita('VENDA_FIRME')}
        />
        <TipoReceitaCard
          tipo="FORECAST"
          value={kpis?.forecastTotalRS != null ? formatCurrency(kpis.forecastTotalRS) : '—'}
          active={tipoReceitaSel === 'FORECAST'}
          onClick={() => toggleTipoReceita('FORECAST')}
        />
        <TipoReceitaCard
          tipo="NOVO_PROJETO"
          value={kpis?.novoProjetoTotalRS != null ? formatCurrency(kpis.novoProjetoTotalRS) : '—'}
          active={tipoReceitaSel === 'NOVO_PROJETO'}
          onClick={() => toggleTipoReceita('NOVO_PROJETO')}
        />
      </div>

      {/* Tabela "Mercado de Vendas" — largura total */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">Mercado de Vendas</p>
            {mercadosSel.map(m => (
              <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium">
                {m}
                <button onClick={() => toggleMercado(m)} className="hover:text-foreground transition-colors" title="Remover mercado do filtro">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">{data?.linhas.length ?? 0} mercados</span>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: '620px', overflowY: 'auto' }}>
          <table className="w-full text-xs min-w-[720px]">
            <thead className="bg-slate-800 sticky top-0 z-20">
              <tr className="border-b border-slate-700">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground sticky left-0 bg-slate-800 z-20 border-r border-slate-700/40 whitespace-nowrap">Mercado</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Orçamento R$</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Previsão Total R$</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">% Orç x Previsão Total R$</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Orçamento KG</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Previsão Total KG</th>
                <th className="text-right px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">% Orç x Previsão Total KG</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Carregando...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="text-center py-10 text-red-400 text-sm">Não foi possível carregar os dados.</td></tr>
              )}
              {!isLoading && !isError && (data?.linhas.length ?? 0) === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum dado para os filtros selecionados.</td></tr>
              )}
              {!isLoading && !isError && (data?.linhas ?? []).map(l => (
                <LinhaTabela
                  key={l.mercado}
                  linha={l}
                  selected={mercadosSel.includes(l.mercado)}
                  onClick={() => toggleMercado(l.mercado)}
                />
              ))}
              {/* Linha TOTAL — sempre por último, como um rodapé de somatória geral */}
              {data?.total && <LinhaTabela linha={data.total} isTotal />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico mensal */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <p className="text-sm font-semibold text-foreground">
            Resultado de Vendas
            <span className="text-[10px] text-muted-foreground font-normal ml-2">
              · rótulo: Previsão Total {chartView === 'volume' ? 'KG' : 'R$'}
            </span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {!realizadoDisponivel && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Realizado não disponível — mostrando só orçamento
              </span>
            )}
            <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
              {(['faturamento', 'volume'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartView === v ? 'bg-[oklch(0.65_0.20_145)] text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v === 'faturamento' ? 'Faturamento' : 'Volume'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={dadosGrafico} margin={{ left: 4, right: 8, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
            <XAxis dataKey="mes" stroke={chartAxisColor} fontSize={11} />
            <YAxis stroke={chartAxisColor} fontSize={11} width={72} tickFormatter={chartConfig.tickFormatter} />
            <Tooltip content={<GraficoTooltip metric={chartView} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {realizadoDisponivel && (
              <Bar
                dataKey={chartConfig.novoProjetoKey} stackId="real" name="Novos Projetos" fill={COLORS.NOVO_PROJETO}
                cursor="pointer" onClick={(entry: any) => toggleMes(entry?.mes)}
              >
                {dadosGrafico.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={opacidadeBarra('NOVO_PROJETO', entry.mes)} />
                ))}
              </Bar>
            )}
            {realizadoDisponivel && (
              <Bar
                dataKey={chartConfig.forecastKey} stackId="real" name="Forecast" fill={COLORS.FORECAST}
                cursor="pointer" onClick={(entry: any) => toggleMes(entry?.mes)}
              >
                {dadosGrafico.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={opacidadeBarra('FORECAST', entry.mes)} />
                ))}
              </Bar>
            )}
            {realizadoDisponivel && (
              <Bar
                dataKey={chartConfig.vendaFirmeKey} stackId="real" name="Vendas Firmes" fill={COLORS.VENDA_FIRME} radius={[4, 4, 0, 0]}
                cursor="pointer" onClick={(entry: any) => toggleMes(entry?.mes)}
              >
                {dadosGrafico.map((entry, idx) => (
                  <Cell key={idx} fillOpacity={opacidadeBarra('VENDA_FIRME', entry.mes)} />
                ))}
                <LabelList
                  dataKey={chartConfig.totalKey}
                  position="top"
                  style={{ fontSize: 10, fill: chartLabelColor, fontWeight: 500 }}
                  formatter={chartConfig.totalLabelFormatter}
                />
              </Bar>
            )}
            <Line dataKey={chartConfig.orcamentoKey} name="Orçamento" stroke={COLORS.ORCAMENTO} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Diagnóstico — área de qualidade de dados, discreta e recolhida por padrão */}
      <details className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none flex items-center gap-1.5 text-slate-300">
          <Info className="w-3.5 h-3.5" /> Diagnóstico de dados
        </summary>
        <div className="mt-2.5 space-y-1 pl-5">
          <p>Orçamento: {data?.diagnostico.totalRegistrosOrcamento ?? 0} registros carregados — fonte: {data?.diagnostico.fonteOrcamento ?? '—'}</p>
          <p>Data usada para período do orçamento: {data?.diagnostico.colunaDataOrcamento ?? '—'}</p>
          <p>Realizado: {data?.diagnostico.totalRegistrosRealizado ?? 0} registros carregados — fonte: {data?.diagnostico.fonteRealizado ?? '—'}</p>
          <p>Data usada para período do realizado: {data?.diagnostico.colunaDataRealizado ?? '—'}</p>
          <p>VLR ST disponível na base de realizado: {data?.diagnostico.vlrStDisponivel ? 'Sim' : 'Não — tratado como 0 (coluna ausente na fonte, não é dado inventado)'}</p>
        </div>
      </details>
    </div>
  )
}
