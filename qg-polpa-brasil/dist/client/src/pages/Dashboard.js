import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import FiltrosGlobais from "@/components/FiltrosGlobais";
import { formatCurrency, formatKg, formatNumber, formatMes, tipoReceitaLabel } from "@/lib/utils";
import { COLORS, BORDER_L_COLOR } from "@/lib/colors";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList, Line, ComposedChart, } from "recharts";
import { TrendingUp, Users, Package, DollarSign, Scale, AlertTriangle, RotateCcw, Search, ChevronRight, ChevronDown, BarChart2, Filter, } from "lucide-react";
// Aliases locais a partir da fonte central de cores
const COLOR_VENDA_FIRME = COLORS.VENDA_FIRME;
const COLOR_FORECAST = COLORS.FORECAST;
const COLOR_NOVO_PROJETO = COLORS.NOVO_PROJETO;
const COLOR_DEVOLUCAO = COLORS.DEVOLUCAO;
const COLOR_ORCAMENTO = COLORS.ORCAMENTO;
const CHART_COLORS = [
    COLOR_VENDA_FIRME,
    COLOR_FORECAST,
    COLOR_NOVO_PROJETO,
    COLOR_DEVOLUCAO,
    "oklch(0.72 0.22 310)",
];
const TIPO_RECEITA_MAP = {
    VENDA_FIRME: "VENDA_FIRME",
    FORECAST: "FORECAST",
    NOVO_PROJETO: "NOVO_PROJETO",
};
const KPI_CONFIG = [
    { key: "faturamentoTotal", label: "Faturamento", sub: undefined, icon: DollarSign, iconClass: "icon-green", fmt: (v) => formatCurrency(v) },
    { key: "volumeTotal", label: "Volume", sub: undefined, icon: Scale, iconClass: "icon-blue", fmt: (v) => formatKg(v) },
    { key: "precoMedio", label: "Preço Médio / kg", sub: undefined, icon: TrendingUp, iconClass: "icon-amber", fmt: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) },
    { key: "clientesAtivos", label: "Clientes Ativos", sub: undefined, icon: Users, iconClass: "icon-purple", fmt: (v) => formatNumber(v) },
    { key: "produtosVendidos", label: "Produtos Vendidos", sub: undefined, icon: Package, iconClass: "icon-cyan", fmt: (v) => formatNumber(v) },
];
function YoYBadge({ atual, anterior }) {
    if (anterior == null || anterior === 0)
        return null;
    const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
    const positivo = pct >= 0;
    const cor = positivo
        ? "text-[oklch(0.65_0.20_145)] bg-[oklch(0.65_0.20_145_/_0.12)]"
        : "text-[oklch(0.65_0.22_25)] bg-[oklch(0.65_0.22_25_/_0.12)]";
    return (_jsxs("span", { className: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cor}`, children: [positivo ? "↑" : "↓", " ", Math.abs(pct).toFixed(1), "%"] }));
}
function KpiCard({ label, sub, value, icon: Icon, iconClass, loading, onClick, atual, anterior }) {
    return (_jsx(Card, { className: `border border-border bg-card transition-all duration-150 ${onClick ? "card-hover cursor-pointer hover:border-[oklch(0.65_0.20_145_/_0.5)]" : ""}`, onClick: onClick, children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight", children: label }), _jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`, children: _jsx(Icon, { className: "w-3.5 h-3.5" }) })] }), _jsx("p", { className: "text-sm font-bold text-foreground tracking-tight leading-none break-all", children: loading ? "—" : value }), _jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [sub && _jsx("p", { className: "text-[10px] text-muted-foreground", children: sub }), !loading && atual != null && _jsx(YoYBadge, { atual: atual, anterior: anterior })] })] }) }));
}
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length)
        return null;
    const order = ["Venda Firme", "Forecast", "Novo Projeto"];
    // Separar séries do ano atual das do ano anterior
    const seriesAtuais = payload.filter((p) => p.name !== "Ano Anterior");
    const antEntry = payload.find((p) => p.name === "Ano Anterior");
    const sorted = [...seriesAtuais].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    const total = sorted.reduce((acc, p) => acc + (p.value ?? 0), 0);
    return (_jsxs("div", { className: "bg-card border border-border rounded-xl px-4 py-3 shadow-2xl text-sm min-w-[230px]", children: [_jsx("p", { className: "text-white font-semibold mb-3 text-xs uppercase tracking-wide", children: label }), _jsx("div", { className: "space-y-2", children: sorted.map((p) => (_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-sm flex-shrink-0", style: { background: p.color } }), _jsx("span", { className: "text-slate-300 text-xs", children: p.name })] }), _jsx("span", { className: "font-semibold text-white text-xs tabular-nums", children: formatCurrency(p.value) })] }, p.name))) }), _jsxs("div", { className: "border-t border-border mt-3 pt-2 flex items-center justify-between", children: [_jsx("span", { className: "text-slate-300 text-xs font-medium", children: "Total Atual" }), _jsx("span", { className: "font-bold text-white text-sm tabular-nums", children: formatCurrency(total) })] }), antEntry != null && antEntry.value != null && (_jsxs("div", { className: "border-t border-dashed border-border/60 mt-2 pt-2 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-5 h-0 border-t-2 border-dashed", style: { borderColor: antEntry.color } }), _jsx("span", { className: "text-slate-300 text-xs", children: "Ano Anterior" })] }), _jsx("span", { className: "text-slate-300 text-xs tabular-nums", children: formatCurrency(antEntry.value) })] }))] }));
};
// ─── Modal de Drill-Down ─────────────────────────────────────────────────────
function DrillDownModal({ open, onClose, tipoReceita, filtros, }) {
    const [, navigate] = useLocation();
    const [busca, setBusca] = useState("");
    const { data, isLoading } = trpc.dashboard.drillDown.useQuery({ tipoReceita: tipoReceita ?? "", filtros }, { enabled: open && !!tipoReceita });
    const filtrado = useMemo(() => {
        if (!data)
            return [];
        if (!busca.trim())
            return data;
        const q = busca.toLowerCase();
        return data.filter((r) => (r.razaoSocial ?? "").toLowerCase().includes(q) ||
            (r.nomeProduto ?? "").toLowerCase().includes(q) ||
            (r.nomeVendedor ?? "").toLowerCase().includes(q));
    }, [data, busca]);
    const titulo = tipoReceita ? tipoReceitaLabel(tipoReceita) : "";
    // Totais do drill-down
    const totalFat = filtrado.reduce((s, r) => s + Number(r.faturamento), 0);
    const totalVol = filtrado.reduce((s, r) => s + Number(r.volume), 0);
    return (_jsx(Dialog, { open: open, onOpenChange: (v) => !v && onClose(), children: _jsxs(DialogContent, { className: "max-w-5xl max-h-[85vh] flex flex-col bg-card border-border", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2 text-foreground", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: titulo }), _jsx("span", { children: "Detalhamento por Cliente e Produto" })] }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3 shrink-0", children: [_jsxs("div", { className: "rounded-lg bg-background border border-border p-3", children: [_jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1", children: "Registros" }), _jsx("p", { className: "text-lg font-bold text-foreground", children: formatNumber(filtrado.length) })] }), _jsxs("div", { className: "rounded-lg bg-background border border-border p-3", children: [_jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1", children: "Faturamento" }), _jsx("p", { className: "text-lg font-bold text-foreground", children: formatCurrency(totalFat) })] }), _jsxs("div", { className: "rounded-lg bg-background border border-border p-3", children: [_jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1", children: "Volume" }), _jsx("p", { className: "text-lg font-bold text-foreground", children: formatKg(totalVol) })] })] }), _jsxs("div", { className: "relative shrink-0", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" }), _jsx(Input, { placeholder: "Buscar por cliente, produto ou vendedor...", value: busca, onChange: (e) => setBusca(e.target.value), className: "pl-9 h-8 text-sm bg-background border-border" })] }), _jsx("div", { className: "overflow-auto flex-1 rounded-lg border border-border", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-40 text-muted-foreground text-sm", children: "Carregando..." })) : filtrado.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-40 text-muted-foreground text-sm", children: "Nenhum registro encontrado" })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { className: "border-border hover:bg-transparent", children: [_jsx(TableHead, { className: "text-xs text-muted-foreground w-[30%]", children: "Cliente" }), _jsx(TableHead, { className: "text-xs text-muted-foreground w-[25%]", children: "Produto" }), _jsx(TableHead, { className: "text-xs text-muted-foreground w-[20%]", children: "Grupo" }), _jsx(TableHead, { className: "text-xs text-muted-foreground text-right w-[13%]", children: "Faturamento" }), _jsx(TableHead, { className: "text-xs text-muted-foreground text-right w-[12%]", children: "Volume (kg)" })] }) }), _jsx(TableBody, { children: filtrado.map((row, i) => (_jsxs(TableRow, { className: "border-border hover:bg-muted/30 cursor-pointer", onClick: () => {
                                        onClose();
                                        navigate(`/clientes?codParc=${row.codParc}`);
                                    }, children: [_jsx(TableCell, { className: "text-xs font-medium text-foreground truncate max-w-0", children: _jsx("span", { className: "block truncate", children: row.razaoSocial ?? `#${row.codParc}` }) }), _jsx(TableCell, { className: "text-xs text-muted-foreground truncate max-w-0", children: _jsx("span", { className: "block truncate", children: row.nomeProduto ?? `#${row.codProduto}` }) }), _jsx(TableCell, { className: "text-xs text-muted-foreground truncate max-w-0", children: _jsx("span", { className: "block truncate", children: row.grupoProduto ?? "—" }) }), _jsx(TableCell, { className: "text-xs font-semibold text-foreground text-right whitespace-nowrap", children: formatCurrency(row.faturamento) }), _jsx(TableCell, { className: "text-xs text-muted-foreground text-right whitespace-nowrap", children: formatKg(row.volume) })] }, i))) })] })) })] }) }));
}
// ─── Bloco de Segmentos ─────────────────────────────────────────────────────
// Escala monocromática verde — do mais intenso ao mais suave
const SEG_COLORS = [
    "oklch(0.68 0.20 145)", // verde 1 — mais intenso
    "oklch(0.62 0.17 145)", // verde 2
    "oklch(0.56 0.14 145)", // verde 3
    "oklch(0.50 0.11 145)", // verde 4
    "oklch(0.44 0.09 145)", // verde 5
    "oklch(0.38 0.07 145)", // verde 6
    "oklch(0.32 0.05 145)", // verde 7
    "oklch(0.27 0.04 145)", // verde 8 — mais suave
];
function SegmentosBlock({ data }) {
    const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
    const sorted = [...data].sort((a, b) => Number(b.faturamento) - Number(a.faturamento));
    return (_jsx("div", { className: "space-y-3", children: sorted.map((seg, i) => {
            const fat = Number(seg.faturamento);
            const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
            const color = SEG_COLORS[i % SEG_COLORS.length];
            const label = seg.segmento ?? "Sem segmento";
            return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-sm shrink-0", style: { background: color } }), _jsx("span", { className: "font-medium text-foreground truncate max-w-[200px]", title: label, children: label }), _jsxs("span", { className: "text-muted-foreground shrink-0", children: ["\u00B7 ", seg.clientes, " ", Number(seg.clientes) === 1 ? "cliente" : "clientes"] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-4", children: [_jsx("span", { className: "text-muted-foreground tabular-nums", children: formatKg(Number(seg.volume)) }), _jsx("span", { className: "font-semibold text-foreground tabular-nums", children: formatCurrency(fat) }), _jsxs("span", { className: "text-[11px] font-bold tabular-nums w-10 text-right", style: { color }, children: [pct.toFixed(1), "%"] })] })] }), _jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${pct}%`, background: color } }) })] }, label));
        }) }));
}
const PROJ_COLORS = {
    "Novo Projeto": "oklch(0.60 0.10 220)", // azul acinzentado
    "Recorrente": "oklch(0.58 0.09 160)", // verde acinzentado
};
const PROJ_FALLBACK = "oklch(0.52 0.05 240)";
function ProjetosBlock({ data, onSelect, selected }) {
    const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
    const sorted = [...data].sort((a, b) => Number(b.faturamento) - Number(a.faturamento));
    return (_jsxs(Card, { className: "border border-border bg-card", children: [_jsx(CardHeader, { className: "pb-1.5 pt-3 px-4", children: _jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Representatividade por Projeto", onSelect && _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-2", children: "\u00B7 clique para filtrar" })] }) }), _jsx(CardContent, { className: "px-4 pb-3 space-y-2", children: sorted.map((p) => {
                    const fat = Number(p.faturamento);
                    const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
                    const label = p.projeto ?? "Sem projeto";
                    const color = PROJ_COLORS[label] ?? PROJ_FALLBACK;
                    const isActive = selected === label;
                    const isInactive = selected !== null && selected !== undefined && !isActive;
                    return (_jsxs("div", { className: `space-y-1 rounded-md px-2 py-0.5 transition-all duration-150 ${onSelect ? "cursor-pointer hover:bg-accent/30" : ""} ${isActive ? "bg-accent/40 ring-1 ring-inset" : ""} ${isInactive ? "opacity-40" : ""}`, style: isActive ? { outline: `2px solid ${color}`, outlineOffset: "-1px" } : {}, onClick: () => onSelect?.(isActive ? null : label), children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-sm shrink-0", style: { background: color } }), _jsx("span", { className: "font-medium text-foreground truncate max-w-[200px]", title: label, children: label }), _jsxs("span", { className: "text-muted-foreground shrink-0", children: ["\u00B7 ", p.clientes, " ", Number(p.clientes) === 1 ? "cliente" : "clientes"] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-4", children: [_jsx("span", { className: "text-muted-foreground tabular-nums", children: formatKg(Number(p.volume)) }), _jsx("span", { className: "font-semibold text-foreground tabular-nums", children: formatCurrency(fat) }), _jsxs("span", { className: "text-[11px] font-bold tabular-nums w-10 text-right", style: { color }, children: [pct.toFixed(1), "%"] })] })] }), _jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${pct}%`, background: color } }) })] }, label));
                }) })] }));
}
// ─── Bloco de Top Clientes ─────────────────────────────────────────────────
// Escala monocromática verde — do mais intenso ao mais suave
const CLI_COLORS = [
    "oklch(0.68 0.20 145)", // verde 1 — mais intenso
    "oklch(0.64 0.18 145)", // verde 2
    "oklch(0.60 0.16 145)", // verde 3
    "oklch(0.56 0.14 145)", // verde 4
    "oklch(0.52 0.12 145)", // verde 5
    "oklch(0.48 0.10 145)", // verde 6
    "oklch(0.44 0.09 145)", // verde 7
    "oklch(0.40 0.07 145)", // verde 8
    "oklch(0.36 0.06 145)", // verde 9
    "oklch(0.32 0.05 145)", // verde 10 — mais suave
];
// Linha de cliente com expand/collapse de produtos
function ClienteTopRow({ cli, i, totalFat, onNavigate, filtrosCombinados }) {
    const [expanded, setExpanded] = useState(false);
    const { data: mix, isLoading: loadingMix } = trpc.clientes.mix.useQuery({ codParc: cli.codParc, filtros: filtrosCombinados }, { enabled: expanded && !!cli.codParc });
    const fat = Number(cli.faturamento);
    const pct = totalFat > 0 ? (fat / totalFat) * 100 : 0;
    const color = CLI_COLORS[i % CLI_COLORS.length];
    const label = cli.razaoSocial || "Cliente";
    return (_jsxs("div", { className: "rounded-lg border border-transparent hover:border-border/40 transition-all duration-150", children: [_jsxs("div", { className: "space-y-1 px-1.5 py-0.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center gap-1.5 min-w-0", children: [_jsx("button", { onClick: () => setExpanded((v) => !v), className: "text-muted-foreground hover:text-foreground transition-colors shrink-0", title: expanded ? "Recolher produtos" : "Expandir produtos", children: expanded
                                            ? _jsx(ChevronDown, { className: "w-3 h-3" })
                                            : _jsx(ChevronRight, { className: "w-3 h-3" }) }), _jsx("div", { className: "w-2 h-2 rounded-full shrink-0", style: { background: color } }), _jsx("span", { className: "font-medium text-foreground truncate max-w-[120px] cursor-pointer hover:underline", title: label, onClick: () => onNavigate && cli.codParc ? onNavigate(cli.codParc) : undefined, children: label })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0 ml-2", children: [_jsx("span", { className: "text-muted-foreground tabular-nums text-[10px]", children: formatKg(Number(cli.volume)) }), _jsx("span", { className: "font-semibold text-foreground tabular-nums", children: formatCurrency(fat) }), _jsxs("span", { className: "text-[11px] font-bold tabular-nums w-9 text-right", style: { color }, children: [pct.toFixed(1), "%"] })] })] }), _jsx("div", { className: "h-1 rounded-full bg-muted overflow-hidden ml-5", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${pct}%`, background: color } }) })] }), expanded && (_jsx("div", { className: "ml-7 mr-2 mb-1.5 mt-0.5 pl-2 border-l-2 border-border", children: loadingMix ? (_jsx("p", { className: "text-[11px] text-muted-foreground py-1", children: "Carregando..." })) : !mix || mix.length === 0 ? (_jsx("p", { className: "text-[11px] text-muted-foreground py-1", children: "Nenhum produto encontrado" })) : (_jsx("div", { className: "space-y-0.5 py-0.5", children: mix.map((p, j) => (_jsxs("div", { className: "flex items-center justify-between text-[11px] py-0.5", children: [_jsx("span", { className: "text-muted-foreground truncate max-w-[160px]", title: p.nomeProduto ?? "-", children: p.nomeProduto ?? "-" }), _jsx("span", { className: "text-foreground tabular-nums shrink-0 ml-2", children: formatCurrency(Number(p.faturamento)) })] }, j))) })) }))] }));
}
function ClientesTopBlock({ data, onNavigate, filtroLabel, filtrosCombinados }) {
    const totalFat = data.reduce((s, r) => s + Number(r.faturamento), 0);
    return (_jsxs(Card, { className: `border bg-card ${filtroLabel ? "border-[oklch(0.65_0.20_145_/_0.4)] ring-1 ring-[oklch(0.65_0.20_145_/_0.15)]" : "border-border"}`, children: [_jsx(CardHeader, { className: "pb-2 pt-4 px-5", children: _jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Top Clientes por Faturamento", onNavigate && _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-2", children: "\u00B7 clique no nome para ver detalhes \u00B7 seta para expandir produtos" })] }), filtroLabel && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[oklch(0.65_0.20_145_/_0.4)] bg-[oklch(0.65_0.20_145_/_0.08)] text-[oklch(0.75_0.15_145)]", children: [_jsx(Filter, { className: "w-2.5 h-2.5" }), filtroLabel] }))] }) }), _jsx(CardContent, { className: "px-5 pb-4", children: _jsx("div", { className: "space-y-1 overflow-y-auto max-h-72 pr-1", children: data.map((cli, i) => (_jsx(ClienteTopRow, { cli: cli, i: i, totalFat: totalFat, onNavigate: onNavigate, filtrosCombinados: filtrosCombinados }, cli.codParc ?? i))) }) })] }));
}
// ─── Dashboard Principal ─────────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [, navigate] = useLocation();
    const [filtros, setFiltros] = useState({ dataInicio: "2026-01-01", dataFim: "2026-12-31" });
    const [drillDownTipo, setDrillDownTipo] = useState(null);
    const [tipoReceitaFiltro, setTipoReceitaFiltro] = useState(null);
    const [projetoFiltroLocal, setProjetoFiltroLocal] = useState(null);
    // Filtros combinados: inclui tipoReceita e projeto local quando selecionados
    const filtrosCombinados = useMemo(() => {
        let f = tipoReceitaFiltro ? { ...filtros, tipoReceita: tipoReceitaFiltro, tiposReceita: [tipoReceitaFiltro] } : filtros;
        if (projetoFiltroLocal)
            f = { ...f, projeto: projetoFiltroLocal, projetos: [projetoFiltroLocal] };
        return f;
    }, [filtros, tipoReceitaFiltro, projetoFiltroLocal]);
    const { data: kpis, isLoading: loadingKpis } = trpc.dashboard.kpis.useQuery(filtrosCombinados);
    const { data: evolucao, isLoading: loadingEvolucao } = trpc.dashboard.evolucaoMensal.useQuery(filtrosCombinados);
    const { data: kpisTipo } = trpc.dashboard.kpisPorTipo.useQuery(filtros);
    const { data: totalVendas } = trpc.dashboard.totalVendas.useQuery();
    const { data: segmentosData, isLoading: loadingSegmentos } = trpc.dashboard.segmentos.useQuery(filtrosCombinados);
    const { data: projetosData } = trpc.dashboard.projetos.useQuery(filtrosCombinados);
    const { data: clientesTopData } = trpc.dashboard.clientesTop.useQuery(filtrosCombinados);
    const { data: evolucaoAnt } = trpc.dashboard.evolucaoMensalAnoAnterior.useQuery(filtrosCombinados);
    const { data: kpisAnt } = trpc.dashboard.kpisAnoAnterior.useQuery(filtrosCombinados);
    const { data: orcamentoKpis } = trpc.dashboard.orcamentoKpis.useQuery(filtrosCombinados);
    const { data: orcamentoMensal } = trpc.dashboard.orcamentoMensal.useQuery(filtrosCombinados);
    // Mapa do orçamento: mes (YYYY-MM) → { fatOrc, volOrc }
    const orcMap = new Map();
    (orcamentoMensal ?? []).forEach((r) => {
        orcMap.set(r.mes ?? "", { fatOrc: Number(r.faturamento), volOrc: Number(r.volume) });
    });
    // Mapa do ano anterior: mesAlinhado (YYYY-MM do ano atual) → { fatAnt, volAnt }
    const antMap = new Map();
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
    const TIPO_COLOR_MAP = {
        VENDA_FIRME: COLORS.VENDA_FIRME,
        FORECAST: COLORS.FORECAST,
        NOVO_PROJETO: COLORS.NOVO_PROJETO,
        DEVOLUCAO: COLORS.DEVOLUCAO,
    };
    const ORDEM_TIPO = { VENDA_FIRME: 0, FORECAST: 1, NOVO_PROJETO: 2 };
    const pieData = [...(kpisTipo ?? [])]
        .filter((k) => k.tipoReceita !== "DEVOLUCAO")
        .sort((a, b) => (ORDEM_TIPO[a.tipoReceita ?? ""] ?? 9) - (ORDEM_TIPO[b.tipoReceita ?? ""] ?? 9))
        .map((k) => ({
        name: tipoReceitaLabel(k.tipoReceita ?? ""),
        value: Number(k.faturamento),
        tipo: k.tipoReceita ?? "",
        color: TIPO_COLOR_MAP[k.tipoReceita ?? ""] ?? CHART_COLORS[0],
    }));
    const hasData = (totalVendas ?? 0) > 0;
    const temDevolucao = (kpis?.faturamentoDevolucao ?? 0) > 0;
    // Clique em barra do gráfico mensal → filtra pelo mês
    const handleBarClick = (data) => {
        if (!data?.activePayload?.[0])
            return;
        const mes = data.activeLabel; // ex: "Jan/26"
        // Encontrar o mes original (YYYY-MM) a partir do label
        const original = evolucaoFormatada.find((e) => e.mesLabel === mes);
        if (!original?.mes)
            return;
        const [ano, m] = original.mes.split("-");
        const inicio = `${ano}-${m}-01`;
        const fim = `${ano}-${m}-31`;
        setFiltros((f) => ({ ...f, dataInicio: inicio, dataFim: fim }));
    };
    // Clique no gráfico de pizza → abre drill-down do tipo
    const handlePieClick = (data) => {
        if (data?.tipo)
            setDrillDownTipo(data.tipo);
    };
    // Cor da borda esquerda dos cards por TIPO (não por índice)
    // Fonte: src/lib/colors.ts — BORDER_L_COLOR
    return (_jsxs("div", { className: "space-y-6 fade-in", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground tracking-tight", children: "Dashboard Executivo" }), _jsxs("p", { className: "text-sm text-muted-foreground mt-0.5", children: ["Vis\u00E3o consolidada \u00B7 ", _jsx("span", { className: "text-[oklch(0.65_0.20_145)]", children: "Datas por Previs\u00E3o de Entrega (Embarque)" })] })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.20_145)] inline-block animate-pulse" }), "Dados atualizados"] })] }), _jsx(FiltrosGlobais, { filtros: filtros, onChange: setFiltros }), (() => {
                const badges = [];
                // Filtros globais
                (filtros.mercados ?? (filtros.mercado ? [filtros.mercado] : [])).forEach((v) => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, mercados: (f.mercados ?? []).filter((x) => x !== v), mercado: undefined })) }));
                (filtros.vendedores ?? (filtros.vendedor ? [filtros.vendedor] : [])).forEach((v) => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, "")}`, onRemove: () => setFiltros((f) => ({ ...f, vendedores: (f.vendedores ?? []).filter((x) => x !== v), vendedor: undefined })) }));
                (filtros.projetos ?? (filtros.projeto ? [filtros.projeto] : [])).forEach((v) => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, projetos: (f.projetos ?? []).filter((x) => x !== v), projeto: undefined })) }));
                (filtros.gruposProduto ?? (filtros.grupoProduto ? [filtros.grupoProduto] : [])).forEach((v) => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros((f) => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter((x) => x !== v), grupoProduto: undefined })) }));
                if (projetoFiltroLocal)
                    badges.push({ label: `Projeto: ${projetoFiltroLocal}`, onRemove: () => setProjetoFiltroLocal(null) });
                if (tipoReceitaFiltro)
                    badges.push({ label: tipoReceitaLabel(tipoReceitaFiltro), onRemove: () => setTipoReceitaFiltro(null) });
                if (badges.length === 0)
                    return null;
                return (_jsxs("div", { className: "flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0", children: "Filtros ativos" }), _jsx("div", { className: "flex items-center gap-1.5 flex-wrap flex-1", children: badges.map((b, i) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-[11px] text-slate-200", children: [b.label, _jsx("button", { onClick: b.onRemove, className: "text-slate-400 hover:text-white ml-0.5 leading-none", children: "\u00D7" })] }, i))) }), _jsx("button", { onClick: () => { setFiltros({ dataInicio: "2026-01-01", dataFim: "2026-12-31" }); setProjetoFiltroLocal(null); setTipoReceitaFiltro(null); }, className: "shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1", children: "Limpar tudo" })] }));
            })(), !hasData && (_jsx(Card, { className: "border-dashed border-border", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-16 text-center", children: [_jsx(AlertTriangle, { className: "w-10 h-10 text-amber-500 mb-3" }), _jsx("h3", { className: "font-semibold text-foreground mb-1", children: "Nenhum dado importado" }), _jsxs("p", { className: "text-sm text-muted-foreground max-w-sm", children: ["Acesse ", _jsx("strong", { children: "Importar Dados" }), " no menu lateral para carregar a base nacional de vendas."] })] }) })), _jsxs("div", { className: `grid gap-3 ${temDevolucao ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"}`, children: [KPI_CONFIG.map((cfg) => (_jsx(KpiCard, { label: cfg.label, sub: cfg.sub, value: cfg.fmt(kpis?.[cfg.key] ?? 0), icon: cfg.icon, iconClass: cfg.iconClass, loading: loadingKpis, atual: kpis?.[cfg.key] ?? undefined, anterior: kpisAnt?.[cfg.key] ?? null, onClick: cfg.key === "clientesAtivos" ? () => navigate("/clientes") :
                            cfg.key === "produtosVendidos" ? () => navigate("/produtos") :
                                undefined }, cfg.key))), temDevolucao && (_jsx(Card, { className: "border border-[oklch(0.55_0.22_25_/_0.3)] bg-[oklch(0.55_0.22_25_/_0.06)] card-hover cursor-pointer transition-all duration-150", onClick: () => setDrillDownTipo("DEVOLUCAO"), children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("p", { className: "text-[10px] font-semibold text-[oklch(0.72_0.22_25)] uppercase tracking-widest leading-tight", children: "Devolu\u00E7\u00F5es" }), _jsx("div", { className: "w-8 h-8 rounded-lg icon-red flex items-center justify-center shrink-0", children: _jsx(RotateCcw, { className: "w-3.5 h-3.5" }) })] }), _jsxs("p", { className: "text-sm font-bold text-[oklch(0.72_0.22_25)] tracking-tight leading-none break-all", children: ["\u2212 ", formatCurrency(kpis?.faturamentoDevolucao ?? 0)] }), _jsxs("p", { className: "text-[10px] text-[oklch(0.65_0.22_25)] mt-1.5", children: ["\u2212 ", formatKg(kpis?.volumeDevolucao ?? 0)] })] }) }))] }), (orcamentoKpis || (projetosData && projetosData.length > 0)) && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch", children: [orcamentoKpis && (() => {
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
                        return (_jsx(Card, { className: "lg:col-span-2 border border-[oklch(0.55_0.18_55_/_0.35)] bg-[oklch(0.55_0.18_55_/_0.06)] !py-0 !gap-0", children: _jsxs(CardContent, { className: "px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "w-6 h-6 rounded-md flex items-center justify-center shrink-0", style: { background: `${COLOR_ORCAMENTO}22` }, children: _jsx(TrendingUp, { className: "w-3 h-3", style: { color: COLOR_ORCAMENTO } }) }), _jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest", style: { color: COLOR_ORCAMENTO }, children: "Or\u00E7amento 2026" })] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 items-baseline", children: [_jsxs("div", { children: [_jsx("span", { className: "text-base font-bold text-foreground", children: formatCurrency(meta) }), _jsx("span", { className: "text-[11px] text-muted-foreground ml-1", children: "meta" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-semibold text-foreground", children: formatKg(orcamentoKpis.volumeTotal) }), _jsx("span", { className: "text-[11px] text-muted-foreground ml-1", children: "vol." })] }), _jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground", children: [_jsxs("span", { children: [formatNumber(orcamentoKpis.clientesUnicos), " cli."] }), _jsx("span", { className: "text-muted-foreground/30", children: "\u00B7" }), _jsxs("span", { children: [formatNumber(orcamentoKpis.produtosUnicos), " prod."] })] })] }), _jsxs("div", { className: "mt-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-[10px]", children: [_jsxs("span", { className: "font-semibold", style: { color: barColor }, children: [pct.toFixed(1), "% do or\u00E7amento atingido"] }), falta > 0 && (_jsxs("span", { className: "text-muted-foreground", children: ["Faltam ", formatCurrency(falta)] })), falta === 0 && (_jsx("span", { style: { color: barColor }, className: "font-semibold", children: "Meta atingida \u2713" }))] }), _jsx("div", { className: "h-2 rounded-full bg-muted/40 overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-700", style: { width: `${pct}%`, background: barColor } }) }), _jsxs("div", { className: "flex items-center justify-between text-[9px] text-muted-foreground", children: [_jsxs("span", { children: ["Realizado: ", formatCurrency(realizado)] }), _jsxs("span", { children: ["Meta: ", formatCurrency(meta)] })] })] }), _jsxs("div", { className: "flex items-center gap-1 mt-2", children: [_jsx("div", { className: "w-4 border-t-2 border-dashed", style: { borderColor: COLOR_ORCAMENTO } }), _jsx("span", { className: "text-[9px]", style: { color: COLOR_ORCAMENTO }, children: "Linha nos gr\u00E1ficos" })] })] }) }));
                    })(), projetosData && projetosData.length > 0 && (_jsx("div", { className: "lg:col-span-3", children: _jsx(ProjetosBlock, { data: projetosData.map((p) => ({ ...p, faturamento: Number(p.faturamento), volume: Number(p.volume), clientes: Number(p.clientes) })), onSelect: (proj) => setProjetoFiltroLocal(proj), selected: projetoFiltroLocal }) }))] })), tipoReceitaFiltro && (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: "text-muted-foreground", children: "Filtrando por:" }), _jsxs(Badge, { variant: "secondary", className: "gap-1", children: [tipoReceitaLabel(tipoReceitaFiltro), _jsx("button", { onClick: () => setTipoReceitaFiltro(null), className: "ml-1 text-muted-foreground hover:text-foreground transition-colors", children: "\u2715" })] })] })), (kpisTipo && kpisTipo.filter((k) => k.tipoReceita !== "DEVOLUCAO").length > 0) && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", style: { alignItems: 'start' }, children: _jsx("div", { className: "contents", children: [...kpisTipo]
                        .filter((k) => k.tipoReceita !== "DEVOLUCAO")
                        .sort((a, b) => {
                        const ordem = { VENDA_FIRME: 0, FORECAST: 1, NOVO_PROJETO: 2 };
                        return (ordem[a.tipoReceita ?? ""] ?? 9) - (ordem[b.tipoReceita ?? ""] ?? 9);
                    })
                        .map((k, i) => {
                        const isActive = tipoReceitaFiltro === k.tipoReceita;
                        return (_jsx(Card, { className: `border border-l-4 ${BORDER_L_COLOR[k.tipoReceita ?? ""] ?? ""} bg-card group transition-all duration-150 self-start !py-0 !gap-0 ${isActive
                                ? "ring-2 ring-offset-1 ring-offset-background ring-[oklch(0.65_0.20_145_/_0.5)] shadow-lg"
                                : "card-hover cursor-pointer"}`, onClick: () => setTipoReceitaFiltro(isActive ? null : (k.tipoReceita ?? null)), children: _jsxs(CardContent, { className: "px-4 py-7", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsxs("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight", children: [tipoReceitaLabel(k.tipoReceita ?? ""), isActive && _jsx("span", { className: "ml-1 text-[oklch(0.65_0.20_145)]", children: "\u25CF" })] }), _jsx("button", { className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors group/det shrink-0", onClick: (e) => { e.stopPropagation(); setDrillDownTipo(k.tipoReceita ?? ""); }, children: _jsx(BarChart2, { className: "w-3 h-3 group-hover/det:text-[oklch(0.65_0.20_145)] transition-colors" }) })] }), _jsx("p", { className: "text-sm font-bold text-foreground tracking-tight leading-none break-all", children: formatCurrency(k.faturamento) }), _jsx("div", { className: "flex items-center gap-2 mt-1.5", children: _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [formatKg(k.volume), " \u00B7 ", formatNumber(k.clientes), " cli."] }) })] }) }, k.tipoReceita));
                    }) }) })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "lg:col-span-2 border border-border bg-card", children: [_jsx(CardHeader, { className: "pb-2 pt-5 px-5", children: _jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Evolu\u00E7\u00E3o Mensal de Faturamento", _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-2", children: "\u00B7 clique em um m\u00EAs para filtrar" })] }) }), _jsx(CardContent, { className: "px-3 pb-4", children: loadingEvolucao ? (_jsx("div", { className: "h-64 flex items-center justify-center text-muted-foreground text-sm", children: "Carregando..." })) : evolucaoFormatada.length === 0 ? (_jsx("div", { className: "h-64 flex items-center justify-center text-muted-foreground text-sm", children: "Sem dados no per\u00EDodo" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(ComposedChart, { data: evolucaoFormatada, margin: { top: 5, right: 10, left: 0, bottom: 5 }, onClick: handleBarClick, style: { cursor: "pointer" }, barCategoryGap: "25%", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "oklch(0.22 0.008 265)", vertical: false }), _jsx(XAxis, { dataKey: "mesLabel", tick: { fontSize: 11, fill: "oklch(0.52 0.012 265)" }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11, fill: "oklch(0.52 0.012 265)" }, axisLine: false, tickLine: false, tickFormatter: (v) => `R$${(v / 1000).toFixed(0)}k` }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: "oklch(0.22 0.008 265 / 0.5)" } }), _jsx(Legend, { wrapperStyle: { fontSize: 12, color: "oklch(0.52 0.012 265)" } }), _jsx(Bar, { dataKey: "novoProjeto", name: "Novo Projeto", fill: COLOR_NOVO_PROJETO, stackId: "fat", maxBarSize: 48 }), _jsx(Bar, { dataKey: "forecast", name: "Forecast", fill: COLOR_FORECAST, stackId: "fat", maxBarSize: 48 }), _jsx(Bar, { dataKey: "vendaFirme", name: "Venda Firme", fill: COLOR_VENDA_FIRME, stackId: "fat", radius: [4, 4, 0, 0], maxBarSize: 48, children: _jsx(LabelList, { dataKey: "total", position: "top", style: { fontSize: 10, fill: "oklch(0.75 0.012 265)", fontWeight: 500 }, formatter: (v) => v > 0 ? Math.round(v / 1000).toLocaleString('pt-BR') : "" }) }), evolucaoAnt && evolucaoAnt.length > 0 && (_jsx(Line, { dataKey: "fatAnt", name: "Ano Anterior", stroke: "oklch(0.75 0.012 265)", strokeWidth: 1.5, strokeDasharray: "5 4", dot: false, activeDot: { r: 4, fill: "oklch(0.75 0.012 265)" }, connectNulls: true })), orcamentoMensal && orcamentoMensal.length > 0 && (_jsx(Line, { dataKey: "fatOrc", name: "Or\u00E7amento", stroke: COLOR_ORCAMENTO, strokeWidth: 2, strokeDasharray: "6 3", dot: false, activeDot: { r: 4, fill: COLOR_ORCAMENTO }, connectNulls: true }))] }) })) })] }), _jsxs(Card, { className: "border border-border bg-card", children: [_jsx(CardHeader, { className: "pb-2 pt-5 px-5", children: _jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Distribui\u00E7\u00E3o por Tipo de Top", _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-2", children: "\u00B7 clique para detalhar" })] }) }), _jsx(CardContent, { className: "px-4 pb-4", children: pieData.length === 0 ? (_jsx("div", { className: "h-64 flex items-center justify-center text-muted-foreground text-sm", children: "Sem dados" })) : (_jsxs("div", { children: [_jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 52, outerRadius: 80, paddingAngle: 4, dataKey: "value", onClick: handlePieClick, style: { cursor: "pointer" }, children: pieData.map((item, i) => (_jsx(Cell, { fill: item.color }, i))) }), _jsx(Tooltip, { formatter: (v) => formatCurrency(v), contentStyle: { background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "#fff" }, labelStyle: { color: "#fff" }, itemStyle: { color: "#fff" } })] }) }), _jsx("div", { className: "space-y-2.5 mt-3", children: pieData.map((item, i) => (_jsxs("div", { className: "flex items-center justify-between text-xs cursor-pointer hover:opacity-80 transition-opacity", onClick: () => setDrillDownTipo(item.tipo), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full shrink-0", style: { background: item.color } }), _jsx("span", { className: "text-white", children: item.name })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "font-semibold text-white", children: formatCurrency(item.value) }), _jsx(ChevronRight, { className: "w-3 h-3 text-muted-foreground/40" })] })] }, item.name))) })] })) })] })] }), evolucaoFormatada.length > 0 && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "lg:col-span-2 border border-border bg-card", children: [_jsx(CardHeader, { className: "pb-2 pt-4 px-5", children: _jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Evolu\u00E7\u00E3o de Volume (kg)", _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-2", children: "\u00B7 clique em uma barra para filtrar pelo m\u00EAs" })] }) }), _jsx(CardContent, { className: "px-3 pb-3", children: _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(ComposedChart, { data: evolucaoFormatada, margin: { top: 22, right: 10, left: 0, bottom: 5 }, onClick: handleBarClick, style: { cursor: "pointer" }, barCategoryGap: "25%", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "oklch(0.22 0.008 265)", vertical: false }), _jsx(XAxis, { dataKey: "mesLabel", tick: { fontSize: 10, fill: "oklch(0.52 0.012 265)" }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 10, fill: "oklch(0.52 0.012 265)" }, axisLine: false, tickLine: false, tickFormatter: (v) => `${(v / 1000).toFixed(0)}t`, width: 32 }), _jsx(Tooltip, { formatter: (v, name) => [
                                                    name === "Ano Anterior" ? formatKg(v) : formatKg(v),
                                                    name,
                                                ], contentStyle: { background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "#fff" }, labelStyle: { color: "#fff" }, itemStyle: { color: "#fff" } }), _jsx(Legend, { wrapperStyle: { fontSize: 11, color: "oklch(0.52 0.012 265)" } }), _jsx(Bar, { dataKey: "volume", name: "Volume (kg)", fill: CHART_COLORS[0], radius: [4, 4, 0, 0], maxBarSize: 40, children: _jsx(LabelList, { dataKey: "volume", position: "top", style: { fontSize: 9, fill: "oklch(0.70 0.012 265)", fontWeight: 500 }, formatter: (v) => v > 0 ? `${(v / 1000).toFixed(1)}t` : "" }) }), evolucaoAnt && evolucaoAnt.length > 0 && (_jsx(Line, { dataKey: "volAnt", name: "Ano Anterior", stroke: "oklch(0.75 0.012 265)", strokeWidth: 1.5, strokeDasharray: "5 4", dot: false, activeDot: { r: 4, fill: "oklch(0.75 0.012 265)" }, connectNulls: true })), orcamentoMensal && orcamentoMensal.length > 0 && (_jsx(Line, { dataKey: "volOrc", name: "Or\u00E7amento", stroke: COLOR_ORCAMENTO, strokeWidth: 2, strokeDasharray: "6 3", dot: false, activeDot: { r: 4, fill: COLOR_ORCAMENTO }, connectNulls: true }))] }) }) })] }), clientesTopData && clientesTopData.length > 0 && (_jsx(ClientesTopBlock, { data: clientesTopData.map((c) => ({
                            razaoSocial: c.razaoSocial ?? "Cliente",
                            faturamento: Number(c.faturamento),
                            volume: Number(c.volume),
                            produtos: Number(c.produtos),
                            codParc: c.codParc ?? undefined,
                        })), onNavigate: (codParc) => navigate(`/clientes?codParc=${codParc}`), filtroLabel: [
                            ...(filtros.projetos ?? (filtros.projeto ? [filtros.projeto] : [])),
                            ...(filtros.mercados ?? (filtros.mercado ? [filtros.mercado] : [])),
                            ...(filtros.vendedores ?? (filtros.vendedor ? [filtros.vendedor] : [])).map((v) => v.replace(/^\d+ - /, "")),
                            ...(filtros.gruposProduto ?? (filtros.grupoProduto ? [filtros.grupoProduto] : [])),
                            projetoFiltroLocal ?? "",
                            tipoReceitaFiltro ? tipoReceitaLabel(tipoReceitaFiltro) : "",
                        ].filter(Boolean).join(" · ") || undefined, filtrosCombinados: filtrosCombinados }))] })), _jsx(DrillDownModal, { open: !!drillDownTipo, onClose: () => setDrillDownTipo(null), tipoReceita: drillDownTipo, filtros: filtros })] }));
}
