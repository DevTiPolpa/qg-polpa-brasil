import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getDashboardOriginalClienteMix, getDashboardOriginalDrilldown, getDashboardOriginalResumo, type DashboardOriginalFiltros } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import FiltrosGlobais, { Filtros } from "@/components/FiltrosGlobais";
import { formatCurrency, formatKg, formatNumber, formatMes, tipoReceitaLabel } from "@/lib/utils";
import { COLORS, BORDER_L_COLOR, colorByTipo } from "@/lib/colors";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList,
  Line, ComposedChart,
} from "recharts";
import {
  TrendingUp, Users, Package, DollarSign, Scale,
  AlertTriangle, RotateCcw, Search, ChevronRight, ChevronDown, ExternalLink, BarChart2, Filter, X,
} from "lucide-react";

// Aliases locais a partir da fonte central de cores
const COLOR_VENDA_FIRME  = COLORS.VENDA_FIRME;
const COLOR_FORECAST     = COLORS.FORECAST;
const COLOR_NOVO_PROJETO = COLORS.NOVO_PROJETO;
const COLOR_DEVOLUCAO    = COLORS.DEVOLUCAO;
const COLOR_ORCAMENTO    = COLORS.ORCAMENTO;

const CHART_COLORS = [
  COLOR_VENDA_FIRME,
  COLOR_FORECAST,
  COLOR_NOVO_PROJETO,
  COLOR_DEVOLUCAO,
  "oklch(0.72 0.22 310)",
];

const TIPO_RECEITA_MAP: Record<string, string> = {
  VENDA_FIRME: "VENDA_FIRME",
  FORECAST: "FORECAST",
  NOVO_PROJETO: "NOVO_PROJETO",
};

const KPI_CONFIG = [
  { key: "faturamentoTotal", label: "Faturamento", sub: undefined, icon: DollarSign, iconClass: "icon-green", fmt: (v: number) => formatCurrency(v) },
  { key: "volumeTotal",      label: "Volume",      sub: undefined, icon: Scale,       iconClass: "icon-blue",   fmt: (v: number) => formatKg(v) },
  { key: "precoMedio",       label: "Preço Médio / kg",    sub: undefined,            icon: TrendingUp,  iconClass: "icon-amber",  fmt: (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) },
  { key: "clientesAtivos",   label: "Qtd de Clientes no Período", sub: undefined,       icon: Users,       iconClass: "icon-purple", fmt: (v: number) => formatNumber(v) },
  { key: "produtosVendidos", label: "Produtos Vendidos",   sub: undefined,            icon: Package,     iconClass: "icon-cyan",   fmt: (v: number) => formatNumber(v) },
];

function YoYBadge({ atual, anterior }: { atual: number; anterior?: number | null }) {
  if (anterior == null || anterior === 0) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const positivo = pct >= 0;
  const cor = positivo
    ? "text-[oklch(0.65_0.20_145)] bg-[oklch(0.65_0.20_145_/_0.12)]"
    : "text-[oklch(0.65_0.22_25)] bg-[oklch(0.65_0.22_25_/_0.12)]";
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cor}`}>
      {positivo ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, sub, value, icon: Icon, iconClass, loading, onClick, atual, anterior }: {
  label: string; sub?: string; value: string; icon: any; iconClass: string; loading: boolean; onClick?: () => void;
  atual?: number; anterior?: number | null;
}) {
  return (
    <Card
      className={`border border-border bg-card transition-all duration-150 ${onClick ? "card-hover cursor-pointer hover:border-[oklch(0.65_0.20_145_/_0.5)]" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-sm font-bold text-foreground tracking-tight leading-none break-all">{loading ? "—" : value}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          {!loading && atual != null && <YoYBadge atual={atual} anterior={anterior} />}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const order = ["Venda Firme", "Forecast", "Novo Projeto"];
  const LINHAS_REFERENCIA = ["Ano Anterior", "Orçamento"];
  const seriesAtuais = payload.filter((p: any) => !LINHAS_REFERENCIA.includes(p.name));
  const antEntry = payload.find((p: any) => p.name === "Ano Anterior");
  const orcEntry = payload.find((p: any) => p.name === "Orçamento");
  const sorted = [...seriesAtuais].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const total = sorted.reduce((acc: number, p: any) => acc + (p.value ?? 0), 0);
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-2xl text-sm min-w-[230px]">
      <p className="text-white font-semibold mb-3 text-xs uppercase tracking-wide">{label}</p>
      <div className="space-y-2">
        {sorted.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
              <span className="text-slate-300 text-xs">{p.name}</span>
            </div>
            <span className="font-semibold text-white text-xs tabular-nums">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-3 pt-2 flex items-center justify-between">
        <span className="text-slate-300 text-xs font-medium">Total Atual</span>
        <span className="font-bold text-white text-sm tabular-nums">{formatCurrency(total)}</span>
      </div>
      {orcEntry != null && orcEntry.value != null && (
        <div className="border-t border-dashed border-border/60 mt-2 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: orcEntry.color }} />
            <span className="text-slate-300 text-xs">Orçamento</span>
          </div>
          <span className="text-slate-300 text-xs tabular-nums">{formatCurrency(orcEntry.value)}</span>
        </div>
      )}
      {antEntry != null && antEntry.value != null && (
        <div className="border-t border-dashed border-border/60 mt-2 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: antEntry.color }} />
            <span className="text-slate-300 text-xs">Ano Anterior</span>
          </div>
          <span className="text-slate-300 text-xs tabular-nums">{formatCurrency(antEntry.value)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Modal de Drill-Down ─────────────────────────────────────────────────────
function DrillDownModal({
  open, onClose, tipoReceita, filtros,
}: {
  open: boolean; onClose: () => void; tipoReceita: string | null; filtros: Filtros;
}) {
  const [, navigate] = useLocation();
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["dashboard-original-drilldown", tipoReceita, filtros],
    queryFn: () => getDashboardOriginalDrilldown(tipoReceita ?? "", filtros as DashboardOriginalFiltros),
    enabled: open && !!tipoReceita,
  });

  // Agrupa por cliente, produtos ordenados por faturamento desc
  const porCliente = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    const map = new Map<number, { codParc: number; razaoSocial: string; totalFat: number; totalVol: number; produtos: typeof data }>();
    for (const r of data) {
      if (q && !(r.razaoSocial ?? "").toLowerCase().includes(q) && !(r.nomeProduto ?? "").toLowerCase().includes(q)) continue;
      const entry = map.get(r.codParc) ?? { codParc: r.codParc, razaoSocial: r.razaoSocial ?? `#${r.codParc}`, totalFat: 0, totalVol: 0, produtos: [] };
      entry.totalFat += Number(r.faturamento);
      entry.totalVol += Number(r.volume);
      entry.produtos.push(r);
      map.set(r.codParc, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => b.totalFat - a.totalFat)
      .map(c => ({ ...c, produtos: c.produtos.sort((a, b) => Number(b.faturamento) - Number(a.faturamento)) }));
  }, [data, busca]);

  const titulo = tipoReceita ? tipoReceitaLabel(tipoReceita) : "";

  const totalFat = porCliente.reduce((s, r) => s + r.totalFat, 0);
  const totalVol = porCliente.reduce((s, r) => s + r.totalVol, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Badge variant="secondary" className="text-xs">{titulo}</Badge>
            <span>Detalhamento por Cliente e Produto</span>
          </DialogTitle>
        </DialogHeader>

        {/* Totais rápidos */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Clientes</p>
            <p className="text-lg font-bold text-foreground">{formatNumber(porCliente.length)}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Faturamento</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalFat)}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Volume</p>
            <p className="text-lg font-bold text-foreground">{formatKg(totalVol)}</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-8 text-sm bg-background border-border"
          />
        </div>

        {/* Tabela */}
        <div className="overflow-auto flex-1 rounded-lg border border-border">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
          ) : porCliente.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Nenhum registro encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-6" />
                  <TableHead className="text-xs text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right w-[180px]">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porCliente.map((cli, i) => (
                  <>
                    <TableRow
                      key={cli.codParc}
                      className="border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandido(expandido === i ? null : i)}
                    >
                      <TableCell className="pl-3 pr-0 text-muted-foreground">
                        {expandido === i ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/clientes?codParc=${cli.codParc}`); }}
                        >{cli.razaoSocial}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground text-right whitespace-nowrap">
                        {formatCurrency(cli.totalFat)}
                      </TableCell>
                    </TableRow>
                    {expandido === i && (
                      <TableRow key={`${cli.codParc}-produtos`} className="border-border">
                        <TableCell colSpan={3} className="p-0">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border/30 bg-muted/10">
                                <th className="text-[10px] text-muted-foreground font-medium text-left pl-10 py-1.5 w-[110px]">Código</th>
                                <th className="text-[10px] text-muted-foreground font-medium text-left py-1.5">Descrição</th>
                                <th className="text-[10px] text-muted-foreground font-medium text-left py-1.5 w-[160px]">Grupo</th>
                                <th className="text-[10px] text-muted-foreground font-medium text-right py-1.5 w-[130px]">Faturamento</th>
                                <th className="text-[10px] text-muted-foreground font-medium text-right py-1.5 pr-4 w-[110px]">Volume (kg)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cli.produtos.map((p, j) => (
                                <tr key={j} className="border-b border-white/5 hover:bg-muted/10">
                                  <td className="text-[11px] text-muted-foreground font-mono pl-10 py-1.5">{p.codProduto}</td>
                                  <td className="text-[11px] text-foreground py-1.5">{p.nomeProduto ?? "—"}</td>
                                  <td className="text-[11px] text-muted-foreground py-1.5">{p.grupoProduto ?? "—"}</td>
                                  <td className="text-[11px] text-foreground font-medium text-right py-1.5">{formatCurrency(Number(p.faturamento))}</td>
                                  <td className="text-[11px] text-muted-foreground text-right py-1.5 pr-4">{formatKg(Number(p.volume))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bloco de Segmentos ─────────────────────────────────────────────────────
// Escala monocromática verde — do mais intenso ao mais suave
const SEG_COLORS = [
  "oklch(0.68 0.20 145)",  // verde 1 — mais intenso
  "oklch(0.62 0.17 145)",  // verde 2
  "oklch(0.56 0.14 145)",  // verde 3
  "oklch(0.50 0.11 145)",  // verde 4
  "oklch(0.44 0.09 145)",  // verde 5
  "oklch(0.38 0.07 145)",  // verde 6
  "oklch(0.32 0.05 145)",  // verde 7
  "oklch(0.27 0.04 145)",  // verde 8 — mais suave
];

function SegmentosBlock({ data }: { data: { segmento: string | null; faturamento: number; volume: number; clientes: number; produtos: number }[] }) {
  const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
  const sorted = [...data].sort((a, b) => Number(b.faturamento) - Number(a.faturamento));

  return (
    <div className="space-y-3">
      {sorted.map((seg, i) => {
        const fat = Number(seg.faturamento);
        const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
        const color = SEG_COLORS[i % SEG_COLORS.length];
        const label = seg.segmento ?? "Sem segmento";
        return (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                <span className="font-medium text-foreground truncate max-w-[200px]" title={label}>{label}</span>
                <span className="text-muted-foreground shrink-0">
                  · {seg.clientes} {Number(seg.clientes) === 1 ? "cliente" : "clientes"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-muted-foreground tabular-nums">{formatKg(Number(seg.volume))}</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(fat)}</span>
                <span
                  className="text-[11px] font-bold tabular-nums w-10 text-right"
                  style={{ color }}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Barra de progresso */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

  const PROJ_COLORS: Record<string, string> = {
  "Novo Projeto": "oklch(0.60 0.10 220)",   // azul acinzentado
  "Recorrente":   "oklch(0.58 0.09 160)",   // verde acinzentado
};
const PROJ_FALLBACK = "oklch(0.52 0.05 240)";

function ProjetosBlock({ data, onSelect, selected }: { data: { projeto: string | null; faturamento: number; volume: number; clientes: number }[]; onSelect?: (projeto: string | null) => void; selected?: string | null }) {
  const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
  const sorted = [...data].sort((a, b) => Number(b.faturamento) - Number(a.faturamento));
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-1.5 pt-3 px-4">
        <CardTitle className="text-sm font-semibold text-foreground">
          Representatividade por Projeto
          {onSelect && <span className="text-[10px] text-muted-foreground font-normal ml-2">· clique para filtrar</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {sorted.map((p) => {
          const fat = Number(p.faturamento);
          const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
          const label = p.projeto ?? "Sem projeto";
          const color = PROJ_COLORS[label] ?? PROJ_FALLBACK;
          const isActive = selected === label;
          const isInactive = selected !== null && selected !== undefined && !isActive;
          return (
            <div
              key={label}
              className={`space-y-1 rounded-md px-2 py-0.5 transition-all duration-150 ${onSelect ? "cursor-pointer hover:bg-accent/30" : ""} ${isActive ? "bg-accent/40 ring-1 ring-inset" : ""} ${isInactive ? "opacity-40" : ""}`}
              style={isActive ? { outline: `2px solid ${color}`, outlineOffset: "-1px" } : {}}
              onClick={() => onSelect?.(isActive ? null : label)}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="font-medium text-foreground truncate max-w-[200px]" title={label}>{label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(fat)}</span>
                  <span className="text-[11px] font-bold tabular-nums w-10 text-right" style={{ color }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Bloco de Top Clientes ─────────────────────────────────────────────────
// Escala monocromática verde — do mais intenso ao mais suave
const CLI_COLORS = [
  "oklch(0.68 0.20 145)",  // verde 1 — mais intenso
  "oklch(0.64 0.18 145)",  // verde 2
  "oklch(0.60 0.16 145)",  // verde 3
  "oklch(0.56 0.14 145)",  // verde 4
  "oklch(0.52 0.12 145)",  // verde 5
  "oklch(0.48 0.10 145)",  // verde 6
  "oklch(0.44 0.09 145)",  // verde 7
  "oklch(0.40 0.07 145)",  // verde 8
  "oklch(0.36 0.06 145)",  // verde 9
  "oklch(0.32 0.05 145)",  // verde 10 — mais suave
];

// Linha de cliente com expand/collapse de produtos
function ClienteTopRow({ cli, i, totalFat, onNavigate, filtrosCombinados }: {
  cli: { razaoSocial: string; faturamento: number; volume: number; produtos: number; codParc?: number };
  i: number;
  totalFat: number;
  onNavigate?: (codParc: number) => void;
  filtrosCombinados?: Record<string, any>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: mix = [], isLoading: loadingMix } = useQuery({
    queryKey: ["dashboard-original-cliente-mix", cli.codParc, filtrosCombinados],
    queryFn: () => getDashboardOriginalClienteMix(cli.codParc!, filtrosCombinados as DashboardOriginalFiltros),
    enabled: expanded && !!cli.codParc,
  });
  const fat = Number(cli.faturamento);
  const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
  const color = CLI_COLORS[i % CLI_COLORS.length];
  const label = cli.razaoSocial || "Cliente";
  return (
    <div className="rounded-lg border border-transparent hover:border-border/40 transition-all duration-150">
      <div className="space-y-1 px-1.5 py-0.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={expanded ? "Recolher produtos" : "Expandir produtos"}
            >
              {expanded
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />}
            </button>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span
              className="font-medium text-foreground truncate max-w-[320px] cursor-pointer hover:underline"
              title={label}
              onClick={() => onNavigate && cli.codParc ? onNavigate(cli.codParc) : undefined}
            >{label}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="font-semibold text-foreground tabular-nums">{formatCurrency(fat)}</span>
            <span className="text-[11px] font-bold tabular-nums w-9 text-right" style={{ color }}>{pct.toFixed(1)}%</span>
          </div>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden ml-5">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      {/* Sublinhas de produtos */}
      {expanded && (
        <div className="ml-7 mr-2 mb-1.5 mt-0.5 pl-2 border-l-2 border-border">
          {loadingMix ? (
            <p className="text-[11px] text-muted-foreground py-1">Carregando...</p>
          ) : !mix || mix.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-1">Nenhum produto encontrado</p>
          ) : (
            <div className="space-y-0.5 py-0.5">
              {mix.map((p: any, j: number) => (
                <div key={j} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-muted-foreground truncate max-w-[160px]" title={p.nomeProduto ?? "-"}>{p.nomeProduto ?? "-"}</span>
                  <span className="text-foreground tabular-nums shrink-0 ml-2">{formatCurrency(Number(p.faturamento))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientesTopBlock({ data, onNavigate, filtroLabel, filtrosCombinados }: {
  data: { razaoSocial: string; faturamento: number; volume: number; produtos: number; codParc?: number }[];
  onNavigate?: (codParc: number) => void;
  filtroLabel?: string;
  filtrosCombinados?: Record<string, any>;
}) {
  const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
  return (
    <Card className={`border bg-card ${filtroLabel ? "border-[oklch(0.65_0.20_145_/_0.4)] ring-1 ring-[oklch(0.65_0.20_145_/_0.15)]" : "border-border"}`}>
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold text-foreground">
            Top Clientes por Faturamento
            {onNavigate && <span className="text-[10px] text-muted-foreground font-normal ml-2">· clique no nome para ver detalhes · seta para expandir produtos</span>}
          </CardTitle>
          {filtroLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[oklch(0.65_0.20_145_/_0.4)] bg-[oklch(0.65_0.20_145_/_0.08)] text-[oklch(0.75_0.15_145)]">
              <Filter className="w-2.5 h-2.5" />
              {filtroLabel}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-1 overflow-y-auto max-h-72 pr-1">
          {data.map((cli, i) => (
            <ClienteTopRow
              key={cli.codParc ?? i}
              cli={cli}
              i={i}
              totalFat={totalFat}
              onNavigate={onNavigate}
              filtrosCombinados={filtrosCombinados}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Principal ─────────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [filtros, setFiltros] = useState<Filtros>({ dataInicio: "2026-01-01", dataFim: "2026-12-31" });
  const [drillDownTipo, setDrillDownTipo] = useState<string | null>(null);
  const [tipoReceitaFiltro, setTipoReceitaFiltro] = useState<string | null>(null);
  const [projetoFiltroLocal, setProjetoFiltroLocal] = useState<string | null>(null);

  // Filtros combinados: inclui tipoReceita e projeto local quando selecionados
  const filtrosCombinados = useMemo(
    () => {
      let f: typeof filtros = tipoReceitaFiltro ? { ...filtros, tipoReceita: tipoReceitaFiltro, tiposReceita: [tipoReceitaFiltro] } : filtros;
      if (projetoFiltroLocal) f = { ...f, projeto: projetoFiltroLocal, projetos: [projetoFiltroLocal] };
      return f;
    },
    [filtros, tipoReceitaFiltro, projetoFiltroLocal]
  );

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["dashboard-original-resumo", filtrosCombinados],
    queryFn: () => getDashboardOriginalResumo(filtrosCombinados as DashboardOriginalFiltros, 50),
  });

  const kpis = resumo?.kpis;
  const evolucao = resumo?.evolucaoMensal ?? [];
  const kpisTipo = resumo?.kpisPorTipo ?? [];
  const totalVendas = resumo?.totalVendas ?? 0;
  const segmentosData = resumo?.segmentos ?? [];
  const projetosData = resumo?.projetos ?? [];
  const clientesTopData = resumo?.clientesTop ?? [];
  const evolucaoAnt = resumo?.evolucaoMensalAnoAnterior ?? [];
  const kpisAnt = resumo?.kpisAnoAnterior;
  const orcamentoKpis = resumo?.orcamentoKpis;
  const orcamentoMensal = resumo?.orcamentoMensal ?? [];
  const loadingKpis = loadingResumo;
  const loadingEvolucao = loadingResumo;
  const loadingSegmentos = loadingResumo;

  // Mapa do orçamento: mes (YYYY-MM) → { fatOrc, volOrc }
  const orcMap = new Map<string, { fatOrc: number; volOrc: number }>();
  (orcamentoMensal ?? []).forEach((r) => {
    orcMap.set(r.mes ?? "", { fatOrc: Number(r.faturamento), volOrc: Number(r.volume) });
  });

  // Mapa do ano anterior: mesAlinhado (YYYY-MM do ano atual) → { fatAnt, volAnt }
  const antMap = new Map<string, { fatAnt: number; volAnt: number }>();
  (evolucaoAnt ?? []).forEach((r) => {
    const key = r.mesAlinhado ?? r.mes ?? "";
    antMap.set(key, { fatAnt: Number(r.faturamento), volAnt: Number(r.volume) });
  });

  const evolucaoFormatada = (evolucao ?? []).map((e) => {
    const vf = Number(e.vendaFirme);
    const fc = Number(e.forecast);
    const np = Number(e.novoProjeto);
    const ant = antMap.get(e.mes ?? "");
    return {
      ...e,
      mesLabel: formatMes(e.mes ?? ""),
      faturamento: Number(e.faturamento),
      volume: Number(e.volume),
      vendaFirme: vf,
      forecast: fc,
      novoProjeto: np,
      total: vf + fc + np,
      fatAnt: ant?.fatAnt ?? null,
      volAnt: ant?.volAnt ?? null,
      fatOrc: orcMap.get(e.mes ?? "")?.fatOrc ?? null,
      volOrc: orcMap.get(e.mes ?? "")?.volOrc ?? null,
    };
  });

  const TIPO_COLOR_MAP: Record<string, string> = {
    VENDA_FIRME:  COLORS.VENDA_FIRME,
    FORECAST:     COLORS.FORECAST,
    NOVO_PROJETO: COLORS.NOVO_PROJETO,
    DEVOLUCAO:    COLORS.DEVOLUCAO,
  };

  const ORDEM_TIPO: Record<string, number> = { VENDA_FIRME: 0, FORECAST: 1, NOVO_PROJETO: 2 }

  const pieData = [...(kpisTipo ?? [])]
    .filter((k) => k.tipoReceita !== "DEVOLUCAO")
    .sort((a, b) => (ORDEM_TIPO[a.tipoReceita ?? ""] ?? 9) - (ORDEM_TIPO[b.tipoReceita ?? ""] ?? 9))
    .map((k) => ({
      name: tipoReceitaLabel(k.tipoReceita ?? ""),
      value: Number(k.faturamento),
      tipo: k.tipoReceita ?? "",
      color: TIPO_COLOR_MAP[k.tipoReceita ?? ""] ?? CHART_COLORS[0],
    }));

  const hasData = loadingResumo || (totalVendas ?? 0) > 0;
  const temDevolucao = (kpis?.faturamentoDevolucao ?? 0) > 0;

  // Clique em barra do gráfico mensal → filtra pelo mês
  const handleBarClick = (data: any) => {
    if (!data?.activePayload?.[0]) return;
    const mes = data.activeLabel; // ex: "Jan/26"
    // Encontrar o mes original (YYYY-MM) a partir do label
    const original = evolucaoFormatada.find((e) => e.mesLabel === mes);
    if (!original?.mes) return;
    const [ano, m] = original.mes.split("-");
    const inicio = `${ano}-${m}-01`;
    const fim = `${ano}-${m}-31`;
    setFiltros((f) => ({ ...f, dataInicio: inicio, dataFim: fim }));
  };

  // Clique no gráfico de pizza → abre drill-down do tipo
  const handlePieClick = (data: any) => {
    if (data?.tipo) setDrillDownTipo(data.tipo);
  };

  // Cor da borda esquerda dos cards por TIPO (não por índice)
  // Fonte: src/lib/colors.ts — BORDER_L_COLOR

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão consolidada · <span className="text-[oklch(0.65_0.20_145)]">Datas por Previsão de Entrega (Embarque)</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.20_145)] inline-block animate-pulse" />
          Dados atualizados
        </div>
      </div>

      <FiltrosGlobais filtros={filtros} onChange={setFiltros} />

      {/* Barra de filtros ativos — mostra badges para cada filtro selecionado */}
      {(() => {
        const badges: { label: string; onRemove: () => void }[] = [];
        // Filtros globais
        (filtros.mercados ?? (filtros.mercado ? [filtros.mercado] : [])).forEach((v) =>
          badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, mercados: (f.mercados ?? []).filter((x) => x !== v), mercado: undefined })) })
        );
        (filtros.vendedores ?? (filtros.vendedor ? [filtros.vendedor] : [])).forEach((v) =>
          badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, "")}`, onRemove: () => setFiltros((f) => ({ ...f, vendedores: (f.vendedores ?? []).filter((x) => x !== v), vendedor: undefined })) })
        );
        (filtros.projetos ?? (filtros.projeto ? [filtros.projeto] : [])).forEach((v) =>
          badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, projetos: (f.projetos ?? []).filter((x) => x !== v), projeto: undefined })) })
        );
        (filtros.gruposProduto ?? (filtros.grupoProduto ? [filtros.grupoProduto] : [])).forEach((v) =>
          badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter((x) => x !== v), grupoProduto: undefined })) })
        );
        if (projetoFiltroLocal) badges.push({ label: `Projeto: ${projetoFiltroLocal}`, onRemove: () => setProjetoFiltroLocal(null) });
        if (tipoReceitaFiltro) badges.push({ label: tipoReceitaLabel(tipoReceitaFiltro), onRemove: () => setTipoReceitaFiltro(null) });
        if (badges.length === 0) return null;
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
            <button
              onClick={() => { setFiltros({ dataInicio: "2026-01-01", dataFim: "2026-12-31" }); setProjetoFiltroLocal(null); setTipoReceitaFiltro(null); }}
              className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1"
            >
              Limpar tudo
            </button>
          </div>
        );
      })()}

      {!hasData && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Nenhum dado importado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Acesse <strong>Importar Dados</strong> no menu lateral para carregar a base nacional de vendas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards — clique em Clientes navega para /clientes, Produtos para /produtos */}
      <div className={`grid gap-3 ${temDevolucao ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"}`}>
        {KPI_CONFIG.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            sub={cfg.sub}
            value={cfg.fmt((kpis as any)?.[cfg.key] ?? 0)}
            icon={cfg.icon}
            iconClass={cfg.iconClass}
            loading={loadingKpis}
            atual={(kpis as any)?.[cfg.key] ?? undefined}
            anterior={(kpisAnt as any)?.[cfg.key] ?? null}
            onClick={
              cfg.key === "clientesAtivos" ? () => navigate("/clientes") :
              cfg.key === "produtosVendidos" ? () => navigate("/produtos") :
              undefined
            }
          />
        ))}
        {/* Card de Devoluções integrado na grid */}
        {temDevolucao && (
          <Card
            className="border border-[oklch(0.55_0.22_25_/_0.3)] bg-[oklch(0.55_0.22_25_/_0.06)] card-hover cursor-pointer transition-all duration-150"
            onClick={() => setDrillDownTipo("DEVOLUCAO")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[10px] font-semibold text-[oklch(0.72_0.22_25)] uppercase tracking-widest leading-tight">Devoluções</p>
                <div className="w-8 h-8 rounded-lg icon-red flex items-center justify-center shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-sm font-bold text-[oklch(0.72_0.22_25)] tracking-tight leading-none break-all">
                − {formatCurrency(kpis?.faturamentoDevolucao ?? 0)}
              </p>
              <p className="text-[10px] text-[oklch(0.65_0.22_25)] mt-1.5">
                − {formatKg(kpis?.volumeDevolucao ?? 0)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Card de Orçamento 2026 + Representatividade por Projeto na mesma linha — grade 1/3 + 2/3 */}
      {(orcamentoKpis || (projetosData && projetosData.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
          {/* Orçamento 2026 — ocupa 2 colunas (2/5) */}
          {orcamentoKpis && (() => {
            const meta = Number(orcamentoKpis.faturamentoTotal);
            const realizado = Number(kpis?.faturamentoTotal ?? 0);
            const pct = meta > 0 ? Math.min((realizado / meta) * 100, 100) : 0;
            const falta = Math.max(meta - realizado, 0);
            // Cor da barra: verde ≥ 70%, amarelo ≥ 40%, vermelho < 40%
            const barColor = pct >= 70
              ? "oklch(0.65 0.20 145)"
              : pct >= 40
              ? "oklch(0.75 0.18 80)"
              : "oklch(0.65 0.22 25)";
            return (
              <Card className="lg:col-span-2 border border-[oklch(0.55_0.18_55_/_0.35)] bg-[oklch(0.55_0.18_55_/_0.06)] !py-0 !gap-0">
                <CardContent className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${COLOR_ORCAMENTO}22` }}>
                      <TrendingUp className="w-3 h-3" style={{ color: COLOR_ORCAMENTO }} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: COLOR_ORCAMENTO }}>Orçamento 2026</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
                    <div>
                      <span className="text-base font-bold text-foreground">{formatCurrency(meta)}</span>
                      <span className="text-[11px] text-muted-foreground ml-1">meta</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{formatKg(orcamentoKpis.volumeTotal)}</span>
                      <span className="text-[11px] text-muted-foreground ml-1">vol.</span>
                    </div>
                  </div>

                  {/* Termômetro de progresso */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold" style={{ color: barColor }}>{pct.toFixed(1)}% do orçamento atingido</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>Realizado: {formatCurrency(realizado)}</span>
                      <span>Meta: {formatCurrency(meta)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-4 border-t-2 border-dashed" style={{ borderColor: COLOR_ORCAMENTO }} />
                    <span className="text-[9px]" style={{ color: COLOR_ORCAMENTO }}>Linha nos gráficos</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {/* Representatividade por Projeto — ocupa 3 colunas (3/5) */}
          {projetosData && projetosData.length > 0 && (
            <div className="lg:col-span-3">
              <ProjetosBlock
                data={projetosData.map((p) => ({ ...p, faturamento: Number(p.faturamento), volume: Number(p.volume), clientes: Number(p.clientes) }))}
                onSelect={(proj) => setProjetoFiltroLocal(proj)}
                selected={projetoFiltroLocal}
              />
            </div>
          )}
        </div>
      )}

      {/* Camadas de Receita — clique no card filtra gráficos, link Detalhar abre modal */}
      {tipoReceitaFiltro && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filtrando por:</span>
          <Badge variant="secondary" className="gap-1">
            {tipoReceitaLabel(tipoReceitaFiltro)}
            <button
              onClick={() => setTipoReceitaFiltro(null)}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >✕</button>
          </Badge>
        </div>
      )}
      {(kpisTipo && kpisTipo.filter((k) => k.tipoReceita !== "DEVOLUCAO").length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{alignItems: 'start'}}>
          {/* Cards compactos de tipo de receita */}
          <div className="contents">
            {[...kpisTipo]
              .filter((k) => k.tipoReceita !== "DEVOLUCAO")
              .sort((a, b) => {
                const ordem: Record<string, number> = { VENDA_FIRME: 0, FORECAST: 1, NOVO_PROJETO: 2 }
                return (ordem[a.tipoReceita ?? ""] ?? 9) - (ordem[b.tipoReceita ?? ""] ?? 9)
              })
              .map((k, i) => {
                const isActive = tipoReceitaFiltro === k.tipoReceita;
                return (
                  <Card
                    key={k.tipoReceita}
                    className={`border border-l-4 ${BORDER_L_COLOR[k.tipoReceita ?? ""] ?? ""} bg-card group transition-all duration-150 self-start !py-0 !gap-0 ${
                      isActive
                        ? "ring-2 ring-offset-1 ring-offset-background ring-[oklch(0.65_0.20_145_/_0.5)] shadow-lg"
                        : "card-hover cursor-pointer"
                    }`}
                    onClick={() => setTipoReceitaFiltro(isActive ? null : (k.tipoReceita ?? null))}
                  >
                    <CardContent className="px-4 py-7">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">
                          {tipoReceitaLabel(k.tipoReceita ?? "")}
                          {isActive && <span className="ml-1 text-[oklch(0.65_0.20_145)]">●</span>}
                        </p>
                        <button
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors group/det shrink-0"
                          onClick={(e) => { e.stopPropagation(); setDrillDownTipo(k.tipoReceita ?? ""); }}
                        >
                          <BarChart2 className="w-3 h-3 group-hover/det:text-[oklch(0.65_0.20_145)] transition-colors" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-foreground tracking-tight leading-none break-all">{formatCurrency(k.faturamento)}</p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Evolução Mensal — clique em barra filtra pelo mês */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">
              Evolução Mensal de Faturamento
              <span className="text-[10px] text-muted-foreground font-normal ml-2">· clique em um mês para filtrar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loadingEvolucao ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
            ) : evolucaoFormatada.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={evolucaoFormatada} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} onClick={handleBarClick} style={{ cursor: "pointer" }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 265)" vertical={false} />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: "oklch(0.52 0.012 265)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.012 265)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.22 0.008 265 / 0.5)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "oklch(0.52 0.012 265)" }} />
                  <Bar dataKey="novoProjeto" name="Novo Projeto" fill={COLOR_NOVO_PROJETO} stackId="fat" maxBarSize={48} />
                  <Bar dataKey="forecast" name="Forecast" fill={COLOR_FORECAST} stackId="fat" maxBarSize={48} />
                  <Bar dataKey="vendaFirme" name="Venda Firme" fill={COLOR_VENDA_FIRME} stackId="fat" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fontSize: 10, fill: "oklch(0.75 0.012 265)", fontWeight: 500 }}
                      formatter={(v: number) => v > 0 ? Math.round(v / 1000).toLocaleString('pt-BR') : ""}
                    />
                  </Bar>
                  {evolucaoAnt && evolucaoAnt.length > 0 && (
                    <Line
                      dataKey="fatAnt"
                      name="Ano Anterior"
                      stroke="oklch(0.75 0.012 265)"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={{ r: 4, fill: "oklch(0.75 0.012 265)" }}
                      connectNulls
                    />
                  )}
                  {orcamentoMensal && orcamentoMensal.length > 0 && (
                    <Line
                      dataKey="fatOrc"
                      name="Orçamento"
                      stroke={COLOR_ORCAMENTO}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={{ r: 4, fill: COLOR_ORCAMENTO }}
                      connectNulls
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Tipo — clique abre drill-down */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">
              Distribuição por Tipo de Top
              <span className="text-[10px] text-muted-foreground font-normal ml-2">· clique para detalhar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={handlePieClick}
                      style={{ cursor: "pointer" }}
                    >
                      {pieData.map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-3">
                      {pieData.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setDrillDownTipo(item.tipo)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-white">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume mensal + Segmentos lado a lado */}
      {evolucaoFormatada.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border border-border bg-card">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-foreground">
                Evolução de Volume (kg)
                <span className="text-[10px] text-muted-foreground font-normal ml-2">· clique em uma barra para filtrar pelo mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={evolucaoFormatada} margin={{ top: 22, right: 10, left: 0, bottom: 5 }} onClick={handleBarClick} style={{ cursor: "pointer" }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 265)" vertical={false} />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 10, fill: "oklch(0.52 0.012 265)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.012 265)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} width={32} />
                  <Tooltip
                    formatter={(v: any, name: string) => [
                      name === "Ano Anterior" ? formatKg(v) : formatKg(v),
                      name,
                    ]}
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.52 0.012 265)" }} />
                  <Bar dataKey="volume" name="Volume (kg)" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList
                      dataKey="volume"
                      position="top"
                      style={{ fontSize: 9, fill: "oklch(0.70 0.012 265)", fontWeight: 500 }}
                      formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(1)}t` : ""}
                    />
                  </Bar>
                  {evolucaoAnt && evolucaoAnt.length > 0 && (
                    <Line
                      dataKey="volAnt"
                      name="Ano Anterior"
                      stroke="oklch(0.75 0.012 265)"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={{ r: 4, fill: "oklch(0.75 0.012 265)" }}
                      connectNulls
                    />
                  )}
                  {orcamentoMensal && orcamentoMensal.length > 0 && (
                    <Line
                      dataKey="volOrc"
                      name="Orçamento"
                      stroke={COLOR_ORCAMENTO}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={{ r: 4, fill: COLOR_ORCAMENTO }}
                      connectNulls
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {clientesTopData && clientesTopData.length > 0 && (
            <ClientesTopBlock
              data={clientesTopData.map((c) => ({
                razaoSocial: c.razaoSocial ?? "Cliente",
                faturamento: Number(c.faturamento),
                volume: Number(c.volume),
                produtos: Number(c.produtos),
                codParc: c.codParc ?? undefined,
              }))}
              onNavigate={(codParc) => navigate(`/clientes?codParc=${codParc}`)}
              filtroLabel={[
                ...(filtros.projetos ?? (filtros.projeto ? [filtros.projeto] : [])),
                ...(filtros.mercados ?? (filtros.mercado ? [filtros.mercado] : [])),
                ...(filtros.vendedores ?? (filtros.vendedor ? [filtros.vendedor] : [])).map((v) => v.replace(/^\d+ - /, "")),
                ...(filtros.gruposProduto ?? (filtros.grupoProduto ? [filtros.grupoProduto] : [])),
                projetoFiltroLocal ?? "",
                tipoReceitaFiltro ? tipoReceitaLabel(tipoReceitaFiltro) : "",
              ].filter(Boolean).join(" · ") || undefined}
              filtrosCombinados={filtrosCombinados}
            />
          )}
        </div>
      )}

      <DrillDownModal
        open={!!drillDownTipo}
        onClose={() => setDrillDownTipo(null)}
        tipoReceita={drillDownTipo}
        filtros={filtrosCombinados}
      />
    </div>
  );
}