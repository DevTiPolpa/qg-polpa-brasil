import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from 'recharts'
import {
  getVisaoGlobalResumo, getVisaoGlobalFiltrosDisponiveis, getVisaoGlobalClientes, getVisaoGlobalClienteProdutos,
  type VisaoGlobalFiltros, type VisaoGlobalLinhaMercado, type VisaoGlobalTipoReceita,
  type VisaoGlobalClienteItem, type VisaoGlobalClienteProdutoItem,
} from '../lib/api'
import MultiSelect from '../components/MultiSelect'
import { Button } from '../components/ui/button'
import { formatCurrency, formatCurrencyExato, formatCurrencyAbrev, formatKg, formatPercent, formatNumber, formatData, tipoReceitaLabel } from '../lib/utils'
import { COLORS, BORDER_L_COLOR } from '../lib/colors'
import { useTheme } from '../hooks/useTheme'
import { TrendingUp, TrendingDown, Target, DollarSign, Package, PackageCheck, AlertTriangle, Info, SlidersHorizontal, X, BarChart2, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'

// Mesma convenção de meses abreviados já usada em lib/utils.ts (MES_ABREV), duplicada
// aqui só porque precisamos do índice (1-12) pra ida e volta com o filtro de meses.
const MES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Rótulos do dropdown de Tipo — pedidos nesse texto exato ("Vendas Firmes"/"Projeto"),
// diferente de tipoReceitaLabel() (usado nos 3 cards clicáveis, "Venda Firme"/"Novo
// Projeto"), então um mapa dedicado em vez de reaproveitar aquele util.
const TIPO_RECEITA_DROPDOWN_LABEL: Record<VisaoGlobalTipoReceita, string> = {
  VENDA_FIRME: 'Vendas Firmes',
  FORECAST: 'Forecast',
  NOVO_PROJETO: 'Projeto',
}
const TIPO_RECEITA_DROPDOWN_OPTIONS = Object.values(TIPO_RECEITA_DROPDOWN_LABEL)
const TIPO_RECEITA_POR_LABEL: Record<string, VisaoGlobalTipoReceita> = Object.fromEntries(
  (Object.entries(TIPO_RECEITA_DROPDOWN_LABEL) as [VisaoGlobalTipoReceita, string][]).map(([tipo, label]) => [label, tipo])
)

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

// Variação % vs. mesmo período do ano anterior — mesmo padrão visual/cálculo do
// YoYBadge já usado no Dashboard Executivo (verde se maior, vermelho se menor).
function YoYBadge({ atual, anterior }: { atual: number; anterior?: number | null }) {
  const { theme } = useTheme()
  if (anterior == null || anterior === 0) return null
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100
  const positivo = pct >= 0
  const cor = theme === 'light'
    ? (positivo ? 'text-[#166534] bg-[#16653422]' : 'text-[#991b1b] bg-[#991b1b22]')
    : (positivo ? 'text-[oklch(0.65_0.20_145)] bg-[oklch(0.65_0.20_145_/_0.12)]' : 'text-[oklch(0.65_0.22_25)] bg-[oklch(0.65_0.22_25_/_0.12)]')
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cor}`}>
      {positivo ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs. ano anterior
    </span>
  )
}

function KpiCard({ label, value, tooltip, icon: Icon, colorClass, atual, anterior }: {
  label: string; value: string; tooltip?: string; icon: React.ElementType; colorClass: string
  atual?: number; anterior?: number | null
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
      {atual != null && (
        <div className="mt-1.5">
          <YoYBadge atual={atual} anterior={anterior} />
        </div>
      )}
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
    setMesesSel(prev => (prev.includes(mesLabel) ? prev.filter(m => m !== mesLabel) : [...prev, mesLabel]))
  }

  const todosSelecionados = mesesSel.length === MES_LABEL.length
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
                onChange={() => setMesesSel(todosSelecionados ? [] : [...MES_LABEL])}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-xs text-foreground font-semibold">{ano} · selecionar tudo</span>
            </label>
            <div className="py-1">
              {MES_LABEL.map(m => (
                <label key={m} className="flex items-center gap-2 px-3 py-1 hover:bg-accent cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mesesSel.includes(m)}
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

// ─── Detalhamento de Vendas: cliente → produto (mesmo padrão visual/interação da
// tela Histórico Clientes, adaptado aos filtros da Visão Global) ──────────────────
function ProdutoRow({ p, isSelected, isDimmed, onClick }: {
  p: VisaoGlobalClienteProdutoItem; isSelected: boolean; isDimmed: boolean; onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-800/40 cursor-pointer select-none transition-all ${
        isSelected ? 'bg-violet-900/40' : 'hover:bg-slate-800/30'
      } ${isDimmed ? 'opacity-30' : ''}`}
    >
      <td className={`py-1.5 pr-4 ${isSelected ? 'text-violet-300' : 'text-slate-400'}`}>{p.codProduto}</td>
      <td className={`py-1.5 pr-4 font-medium max-w-[220px] truncate ${isSelected ? 'text-violet-200' : 'text-foreground'}`}>{p.nomeProduto}</td>
      <td className="py-1.5 pr-4 text-right text-slate-300 whitespace-nowrap">{formatNumber(p.volume, 2)}</td>
      <td className="py-1.5 pr-4 text-right text-slate-300 whitespace-nowrap">{formatNumber(p.valor, 2)}</td>
      <td className="py-1.5 pr-4 text-right text-slate-300">{formatCurrencyExato(p.precoMedio)}</td>
      <td className="py-1.5 text-right text-slate-400">{p.dtUltimaCompra ? formatData(p.dtUltimaCompra) : '—'}</td>
    </tr>
  )
}

function ClienteRow({ c, rank, filtros, isExpanded, onToggle, dimmed, selectedProdutoCode, onProdutoClick }: {
  c: VisaoGlobalClienteItem; rank: number; filtros: VisaoGlobalFiltros
  isExpanded: boolean; onToggle: () => void; dimmed: boolean
  selectedProdutoCode: string | null; onProdutoClick: (code: string) => void
}) {
  const { data: produtos, isLoading: prodLoading } = useQuery({
    queryKey: ['visao-global-cliente-produtos', c.codParc, filtros],
    queryFn: () => getVisaoGlobalClienteProdutos(c.codParc, filtros),
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
            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90 text-green-400' : 'text-slate-500'}`} />
            <div>
              <p className="font-medium text-foreground truncate max-w-[240px]">{c.razaoSocial}</p>
              <p className="text-[10px] text-slate-500">{c.codParc}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{formatNumber(c.valor, 2)}</td>
        <td className="px-2 py-1.5 text-right text-slate-400">{formatNumber(c.pctValor, 1)}%</td>
        <td className="px-2 py-1.5 text-right text-slate-300 whitespace-nowrap">{formatNumber(c.volume, 2)}</td>
        <td className="px-2 py-1.5 text-right text-slate-400">{formatNumber(c.pctVolume, 1)}%</td>
        <td className="px-2 py-1.5 text-right text-slate-300">{formatCurrencyExato(c.precoMedio)}</td>
        <td className="px-2 py-1.5 text-right text-slate-300">{c.qtdProdutos}</td>
        <td className="px-2 py-1.5 text-right text-slate-400 whitespace-nowrap">{c.ultimaCompra ? formatData(c.ultimaCompra) : '—'}</td>
      </tr>
      <tr>
        <td colSpan={9} className="p-0">
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[600px]' : 'max-h-0'}`}>
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
                    {produtos.map(p => (
                      <ProdutoRow
                        key={p.codProduto}
                        p={p}
                        isSelected={selectedProdutoCode === p.codProduto}
                        isDimmed={!!selectedProdutoCode && selectedProdutoCode !== p.codProduto}
                        onClick={() => onProdutoClick(p.codProduto)}
                      />
                    ))}
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

export default function VisaoGlobal() {
  const [ano, setAno] = useState(2026)
  const [mesesSel, setMesesSel] = useState<string[]>([...MES_LABEL])
  const [gruposSel, setGruposSel] = useState<string[]>([])
  const [tipoReceitaSel, setTipoReceitaSel] = useState<VisaoGlobalTipoReceita | null>(null)
  // Filtro dropdown de tipo (seleção múltipla) — independente dos 3 cards clicáveis
  // (seleção única) logo abaixo; os dois controles coexistem e o que vale pro
  // backend é a união dos dois (ver `tiposReceitaEfetivos`).
  const [tipoMultiSel, setTipoMultiSel] = useState<VisaoGlobalTipoReceita[]>([])
  const [mercadosSel, setMercadosSel] = useState<string[]>([])
  const [projetosSel, setProjetosSel] = useState<string[]>([])
  // Detalhamento de Vendas — 1 cliente expandido por vez; produto clicado dentro
  // da expansão só esmaece as outras linhas (realce visual, sem filtrar a tabela).
  const [expandedParc, setExpandedParc] = useState<number | null>(null)
  const [selectedProdutoCode, setSelectedProdutoCode] = useState<string | null>(null)
  function toggleClienteDetalhe(codParc: number) {
    setExpandedParc(prev => (prev === codParc ? null : codParc))
    setSelectedProdutoCode(null)
  }
  function handleProdutoClick(code: string) {
    setSelectedProdutoCode(prev => (prev === code ? null : code))
  }

  function toggleTipoReceita(tipo: VisaoGlobalTipoReceita) {
    setTipoReceitaSel(prev => (prev === tipo ? null : tipo))
  }

  const tiposReceitaEfetivos = useMemo(
    () => Array.from(new Set([...(tipoReceitaSel ? [tipoReceitaSel] : []), ...tipoMultiSel])),
    [tipoReceitaSel, tipoMultiSel]
  )
  // Clique numa linha de mercado na tabela — soma/remove esse mercado da seleção
  // múltipla (mesmo estado do filtro "Todos os mercados" acima).
  function toggleMercado(mercado: string) {
    setMercadosSel(prev => (prev.includes(mercado) ? prev.filter(m => m !== mercado) : [...prev, mercado]))
  }
  // Clique numa barra do mês — vira o filtro de mês (o mesmo já usado pelo
  // seletor de período), sempre substituindo por um único mês.
  // Clicar de novo no mesmo mês limpa o filtro.
  function toggleMes(mesLabel: string) {
    setMesesSel(prev => (prev.length === 1 && prev[0] === mesLabel ? [...MES_LABEL] : [mesLabel]))
  }

  const { data: disponiveis } = useQuery({
    queryKey: ['visao-global-filtros-disponiveis'],
    queryFn: getVisaoGlobalFiltrosDisponiveis,
    staleTime: 5 * 60_000,
  })

  // Filtros "de tela" — usados pela barra de filtros e pela própria tabela de
  // Detalhamento de Vendas (que precisa continuar navegável, listando todos os
  // clientes, mesmo quando um deles está expandido/selecionado).
  const filtros: VisaoGlobalFiltros = useMemo(() => ({
    ano,
    meses: mesesSel.map(m => MES_LABEL.indexOf(m) + 1).filter(n => n > 0),
    gruposProduto: gruposSel,
    tipoReceita: tiposReceitaEfetivos,
    mercados: mercadosSel,
    projetos: projetosSel,
  }), [ano, mesesSel, gruposSel, tiposReceitaEfetivos, mercadosSel, projetosSel])

  // Filtros "escopados" — os mesmos + cliente/produto selecionado no Detalhamento de
  // Vendas, se houver. Usados pelo resumo (KPIs/gráfico/tabela de mercado), que
  // devem realçar o que estiver selecionado; a tabela de clientes em si usa `filtros`
  // (acima), sem escopo, pra não se auto-filtrar a uma linha só.
  const filtrosEscopo: VisaoGlobalFiltros = useMemo(() => ({
    ...filtros,
    ...(expandedParc != null ? { codParcs: [expandedParc] } : {}),
    ...(selectedProdutoCode != null ? { codProdutos: [Number(selectedProdutoCode)] } : {}),
  }), [filtros, expandedParc, selectedProdutoCode])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['visao-global-resumo', filtrosEscopo],
    queryFn: () => getVisaoGlobalResumo(filtrosEscopo),
    staleTime: 60_000,
  })

  // Mesmos filtros (já escopados), ano anterior — só pra calcular a variação % dos
  // cards "Previsão Total" e "Realizado KG" (ver YoYBadge). Reaproveita o mesmo
  // endpoint/resumo, sem nenhuma mudança de backend.
  const filtrosAnoAnterior: VisaoGlobalFiltros = useMemo(() => ({ ...filtrosEscopo, ano: ano - 1 }), [filtrosEscopo, ano])
  const { data: dataAnoAnterior } = useQuery({
    queryKey: ['visao-global-resumo', filtrosAnoAnterior],
    queryFn: () => getVisaoGlobalResumo(filtrosAnoAnterior),
    staleTime: 60_000,
  })

  // Detalhamento de Vendas — mesmos `filtros` da tela inteira, então qualquer
  // filtro (ano/mês/mercado/projeto/grupo/tipo) já reflete aqui automaticamente.
  const { data: clientesDetalhe, isLoading: clientesDetalheLoading } = useQuery({
    queryKey: ['visao-global-clientes', filtros],
    queryFn: () => getVisaoGlobalClientes(filtros),
    staleTime: 60_000,
  })
  const clienteSelecionado = expandedParc != null ? clientesDetalhe?.find(c => c.codParc === expandedParc) : undefined

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
    const tipoOk = tiposReceitaEfetivos.length === 0 || tiposReceitaEfetivos.includes(tipo)
    const mesOk = mesesSel.includes(mesLabel)
    return tipoOk && mesOk ? 1 : 0.2
  }

  const kpis = data?.kpis
  // "Previsão Total" = soma dos tipos selecionados (cards + dropdown de Tipo) — todos
  // os 3 (Vendas Firmes + Novos Projetos + Forecast) sem seleção. Vem pronto do
  // backend (kpis.previsaoTotalRS), que é a mesma base usada por Desvio R$/
  // Atingimento/Realizado KG — não recalcular aqui pra não divergir do filtro.
  const previsaoTotalRS = kpis?.previsaoTotalRS ?? null

  // Mesma conta, ano anterior — só pros badges de variação (YoYBadge) dos cards
  // "Previsão Total" e "Realizado KG".
  const kpisAnoAnterior = dataAnoAnterior?.kpis
  const previsaoTotalRSAnoAnterior = kpisAnoAnterior?.previsaoTotalRS ?? null

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
            {mesesSel.length === MES_LABEL.length
              ? `Ano ${ano}`
              : mesesSel.length <= 3
                ? mesesSel.map(m => `${m}/${String(ano).slice(2)}`).join(' + ')
                : `${mesesSel.length} meses selecionados`}
          </span>
          {((mesesSel.length > 0 && mesesSel.length < MES_LABEL.length) || gruposSel.length > 0 || tipoReceitaSel || tipoMultiSel.length > 0 || mercadosSel.length > 0 || projetosSel.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMesesSel([...MES_LABEL]); setGruposSel([]); setTipoReceitaSel(null); setTipoMultiSel([]); setMercadosSel([]); setProjetosSel([]) }}
              className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Row 1: Multi-selects */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect
            options={TIPO_RECEITA_DROPDOWN_OPTIONS}
            selected={tipoMultiSel.map(t => TIPO_RECEITA_DROPDOWN_LABEL[t])}
            onChange={(labels) => setTipoMultiSel(labels.map(l => TIPO_RECEITA_POR_LABEL[l]).filter(Boolean))}
            placeholder="Todos os tipos"
            className="flex-1 min-w-[130px] max-w-[180px]"
          />
          <MultiSelect options={mercadoOptions} selected={mercadosSel} onChange={setMercadosSel} placeholder="Todos os mercados" className="flex-1 min-w-[150px] max-w-[220px]" />
          <MultiSelect options={projetoOptions} selected={projetosSel} onChange={setProjetosSel} placeholder="Todos os projetos" className="flex-1 min-w-[150px] max-w-[220px]" />
          <MultiSelect options={grupoOptions} selected={gruposSel} onChange={setGruposSel} placeholder="Todos os grupos" className="flex-1 min-w-[140px] max-w-[200px]" />
        </div>

        {/* Row 2: Período — mesmo componente/formato do Dashboard Executivo */}
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodoPickerVG
            ano={ano}
            setAno={(a) => { setAno(a); setMesesSel([...MES_LABEL]) }}
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
          atual={previsaoTotalRS ?? undefined}
          anterior={previsaoTotalRSAnoAnterior}
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
          atual={kpis?.realizadoKG ?? undefined}
          anterior={kpisAnoAnterior?.realizadoKG}
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

      {/* Detalhamento de Vendas — clientes (→ produtos, expansível), respeitando
          todos os filtros ativos da tela (mesmo `filtros` do gráfico/tabela acima). */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <p className="text-sm font-semibold text-foreground">
            Detalhamento de Vendas
            <span className="text-[10px] text-muted-foreground font-normal ml-2">
              {clientesDetalhe ? `${clientesDetalhe.length} clientes` : ''}
            </span>
          </p>
          {expandedParc != null && (
            <span className="text-[11px] bg-green-900/40 text-green-400 border border-green-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              Filtrando a tela por {clienteSelecionado?.razaoSocial ?? `cliente ${expandedParc}`}
              {selectedProdutoCode && ` · produto ${selectedProdutoCode}`}
              <button onClick={() => toggleClienteDetalhe(expandedParc)} className="hover:text-foreground"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
        <div className="overflow-auto max-h-[560px] border border-slate-700/60 rounded-lg">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2 text-left font-medium text-slate-400">#</th>
                <th className="px-3 py-2 text-left font-medium text-slate-400">Cliente</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">Fat.</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">% Fat</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">Vol.</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">% Vol</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">R$/kg</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">Prod</th>
                <th className="px-2 py-2 text-right font-medium text-slate-400">Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {clientesDetalheLoading && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-8">Carregando...</td></tr>
              )}
              {!clientesDetalheLoading && !clientesDetalhe?.length && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-8">Sem dados para os filtros selecionados</td></tr>
              )}
              {!clientesDetalheLoading && (clientesDetalhe ?? []).map((c, i) => (
                <ClienteRow
                  key={c.codParc}
                  c={c}
                  rank={i + 1}
                  filtros={filtros}
                  isExpanded={expandedParc === c.codParc}
                  onToggle={() => toggleClienteDetalhe(c.codParc)}
                  dimmed={expandedParc !== null && expandedParc !== c.codParc}
                  selectedProdutoCode={expandedParc === c.codParc ? selectedProdutoCode : null}
                  onProdutoClick={handleProdutoClick}
                />
              ))}
            </tbody>
          </table>
        </div>
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
