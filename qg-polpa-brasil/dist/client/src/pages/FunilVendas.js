import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, } from 'recharts';
import { TrendingUp, Target, CheckCircle, XCircle, Clock, Users, } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { trpc } from '../lib/trpc';
import { formatCurrency, formatNumber, formatPercent, formatMes } from '../lib/utils';
// ─── Cores ────────────────────────────────────────────────────────────────────
const C_ANDAMENTO = 'oklch(0.62 0.18 250)';
const C_GANHO = 'oklch(0.65 0.20 145)';
const C_PERDIDO = 'oklch(0.65 0.22 25)';
const C_GRID = 'oklch(0.22 0.008 265)';
const C_TICK = 'oklch(0.52 0.012 265)';
// ─── Ordem das etapas por pipeline ───────────────────────────────────────────
// Palavras-chave únicas de cada etapa para match case-insensitive
const STAGE_ORDER = {
    0: [
        'SQL', // SQL - Oportunidade Qualificada
        'Proposta', // Proposta / Envio da amostra
        'Explorat', // Teste Exploratório no Cliente
        'Aplica', // Aplicação no Cliente
        'Homologa', // Homologação
        'Industrial', // Teste Industrial/Mercado
        'Negocia', // Negociação
        'Efetivando', // Efetivando venda
    ],
    31: [
        'Explora', // Exploração
        'Conhecendo', // Conhecendo o Desafio
        'Desenvolvimento', // Desenvolvimento do Projeto
        'Formula', // Formulação e Embalagem
        'Efetivando', // Efetivando Venda
    ],
};
function sortEtapas(items) {
    return [...items].sort((a, b) => {
        const order = STAGE_ORDER[a.pipelineId] ?? STAGE_ORDER[b.pipelineId] ?? [];
        const idxA = order.findIndex(kw => a.etapa.toLowerCase().includes(kw.toLowerCase()));
        const idxB = order.findIndex(kw => b.etapa.toLowerCase().includes(kw.toLowerCase()));
        const posA = idxA === -1 ? 99 : idxA;
        const posB = idxB === -1 ? 99 : idxB;
        return posA - posB;
    });
}
// ─── Pipelines disponíveis ────────────────────────────────────────────────────
const PIPELINES = [
    { id: 0, label: 'Comercial' },
    { id: 31, label: 'Private Label' },
];
const ALL_IDS = PIPELINES.map(p => p.id);
// ─── Componentes auxiliares ───────────────────────────────────────────────────
function Skeleton({ className = '' }) {
    return _jsx("div", { className: `bg-muted animate-pulse rounded ${className}` });
}
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length)
        return null;
    return (_jsxs("div", { className: "bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs space-y-1", children: [label && _jsx("p", { className: "font-semibold text-foreground mb-1", children: label }), payload.map(p => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: p.color } }), _jsxs("span", { className: "text-muted-foreground", children: [p.name, ":"] }), _jsx("span", { className: "font-semibold text-foreground", children: formatNumber(p.value) })] }, p.name)))] }));
}
function KpiCard({ label, value, sub, icon: Icon, iconClass, loading }) {
    return (_jsx(Card, { className: "border border-border bg-card transition-all duration-150", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", children: label }), _jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`, children: _jsx(Icon, { className: "w-3.5 h-3.5" }) })] }), loading ? _jsx(Skeleton, { className: "h-5 w-24" }) : _jsx("p", { className: "text-sm font-bold text-foreground", children: value }), sub && !loading && _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: sub })] }) }));
}
// ─── Página ───────────────────────────────────────────────────────────────────
export default function FunilVendas() {
    // Filtro: null = todos, senão array com IDs selecionados
    const [selectedIds, setSelectedIds] = useState(undefined);
    const input = selectedIds ? { pipelineIds: selectedIds } : undefined;
    const { data: kpis, isLoading: loadKpis } = trpc.funilCrm.kpis.useQuery(input);
    const { data: porEtapa, isLoading: loadEtapa } = trpc.funilCrm.porEtapa.useQuery(input);
    const { data: porPipeline, isLoading: loadPipeline } = trpc.funilCrm.porPipeline.useQuery(input);
    const { data: vendedores, isLoading: loadVend } = trpc.funilCrm.topVendedores.useQuery(input);
    const { data: evolucao, isLoading: loadEvol } = trpc.funilCrm.evolucaoMensal.useQuery(input);
    const kpi = kpis?.[0];
    // Agrupa etapas por pipeline, respeitando a ordem definida
    const etapasPorPipeline = sortEtapas(porEtapa ?? []).reduce((acc, e) => {
        const key = e.pipeline ?? 'Comercial';
        if (!acc[key])
            acc[key] = [];
        acc[key].push(e);
        return acc;
    }, {});
    const evolucaoFormatada = (evolucao ?? []).map(e => ({ ...e, mesLabel: formatMes(e.mes) }));
    // ─── Handlers do filtro ────────────────────────────────────────────────────
    function togglePipeline(id) {
        if (!selectedIds) {
            // Estava em "Todos" → seleciona só este
            setSelectedIds([id]);
        }
        else if (selectedIds.includes(id)) {
            // Estava selecionado → remove
            const next = selectedIds.filter(x => x !== id);
            setSelectedIds(next.length === 0 || next.length === ALL_IDS.length ? undefined : next);
        }
        else {
            // Não estava → adiciona
            const next = [...selectedIds, id];
            setSelectedIds(next.length === ALL_IDS.length ? undefined : next);
        }
    }
    function isActive(id) {
        return !selectedIds || selectedIds.includes(id);
    }
    const allActive = !selectedIds;
    return (_jsxs("div", { className: "space-y-6 fade-in", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground tracking-tight", children: "Funil de Vendas" }), _jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Pipeline CRM \u2014 dados sincronizados do Bitrix24" })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: "Funil:" }), _jsx("button", { onClick: () => setSelectedIds(undefined), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${allActive
                                    ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'}`, children: "Todos" }), PIPELINES.map(p => (_jsx("button", { onClick: () => togglePipeline(p.id), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive(p.id) && !allActive
                                    ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40'
                                    : allActive
                                        ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        : 'text-slate-500 hover:text-white hover:bg-slate-700'}`, children: p.label }, p.id)))] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", children: [_jsx(KpiCard, { label: "Em Andamento", value: formatNumber(kpi?.emAndamento ?? 0), sub: "neg\u00F3cios ativos", icon: Clock, iconClass: "bg-blue-500/15 text-blue-400", loading: loadKpis }), _jsx(KpiCard, { label: "Valor Pipeline", value: formatCurrency(kpi?.valorPipeline ?? 0), sub: "potencial em aberto", icon: TrendingUp, iconClass: "bg-green-500/15 text-green-400", loading: loadKpis }), _jsx(KpiCard, { label: "Ganhos", value: formatNumber(kpi?.ganhos ?? 0), sub: formatCurrency(kpi?.valorGanho ?? 0), icon: CheckCircle, iconClass: "bg-emerald-500/15 text-emerald-400", loading: loadKpis }), _jsx(KpiCard, { label: "Perdidos", value: formatNumber(kpi?.perdidos ?? 0), icon: XCircle, iconClass: "bg-red-500/15 text-red-400", loading: loadKpis }), _jsx(KpiCard, { label: "Taxa Convers\u00E3o", value: formatPercent(kpi?.taxaConversao ?? 0), sub: "ganhos / (ganhos+perdidos)", icon: Target, iconClass: "bg-amber-500/15 text-amber-400", loading: loadKpis }), _jsx(KpiCard, { label: "Ciclo M\u00E9dio", value: `${formatNumber(kpi?.diasMedioFechamento ?? 0)} dias`, sub: "da abertura ao fechamento", icon: Users, iconClass: "bg-purple-500/15 text-purple-400", loading: loadKpis })] }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: loadEtapa
                    ? [0, 1].map(i => _jsx(Skeleton, { className: "h-72" }, i))
                    : Object.entries(etapasPorPipeline).map(([pipeline, etapas]) => (_jsxs(Card, { className: "border border-border bg-card", children: [_jsxs(CardHeader, { className: "pb-2 pt-5 px-5", children: [_jsxs(CardTitle, { className: "text-sm font-semibold text-foreground", children: ["Etapas em Andamento \u2014 ", pipeline] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [etapas?.length, " etapas com neg\u00F3cios ativos"] })] }), _jsx(CardContent, { className: "px-3 pb-4", children: _jsx(ResponsiveContainer, { width: "100%", height: Math.max(200, (etapas?.length ?? 1) * 40 + 20), children: _jsxs(BarChart, { layout: "vertical", data: etapas?.map(e => ({ etapa: e.etapa, Negócios: e.total })), margin: { left: 8, right: 16, top: 4, bottom: 4 }, barCategoryGap: "20%", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: C_GRID, horizontal: false }), _jsx(XAxis, { type: "number", tick: { fontSize: 11, fill: C_TICK }, axisLine: false, tickLine: false }), _jsx(YAxis, { type: "category", dataKey: "etapa", width: 180, tick: { fontSize: 10, fill: C_TICK }, axisLine: false, tickLine: false }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: 'oklch(0.22 0.008 265 / 0.4)' } }), _jsx(Bar, { dataKey: "Neg\u00F3cios", fill: C_ANDAMENTO, radius: [0, 3, 3, 0], maxBarSize: 20 })] }) }) })] }, pipeline))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs(Card, { className: "border border-border bg-card", children: [_jsx(CardHeader, { className: "pb-2 pt-5 px-5", children: _jsx(CardTitle, { className: "text-sm font-semibold text-foreground", children: "Neg\u00F3cios por Pipeline" }) }), _jsx(CardContent, { className: "px-3 pb-4", children: loadPipeline
                                    ? _jsx(Skeleton, { className: "h-56" })
                                    : (_jsx("div", { className: "space-y-3 py-1", children: (porPipeline ?? []).map(p => {
                                            const total = p.emAndamento + p.ganhos + p.perdidos;
                                            const pctA = total > 0 ? (p.emAndamento / total) * 100 : 0;
                                            const pctG = total > 0 ? (p.ganhos / total) * 100 : 0;
                                            const pctP = total > 0 ? (p.perdidos / total) * 100 : 0;
                                            return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: p.pipeline }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [formatCurrency(p.valorPipeline), " em aberto"] })] }), _jsxs("div", { className: "flex h-2 rounded-full overflow-hidden gap-px", children: [_jsx("div", { style: { width: `${pctA}%`, background: C_ANDAMENTO } }), _jsx("div", { style: { width: `${pctG}%`, background: C_GANHO } }), _jsx("div", { style: { width: `${pctP}%`, background: C_PERDIDO } })] }), _jsxs("div", { className: "flex items-center gap-3 text-[10px] text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { background: C_ANDAMENTO } }), p.emAndamento, " abertos"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { background: C_GANHO } }), p.ganhos, " ganhos"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { background: C_PERDIDO } }), p.perdidos, " perdidos"] }), _jsxs("span", { className: "ml-auto font-semibold text-amber-400", children: [formatPercent(p.taxaConversao), " conv."] })] })] }, p.pipeline));
                                        }) })) })] }), _jsxs(Card, { className: "border border-border bg-card", children: [_jsxs(CardHeader, { className: "pb-2 pt-5 px-5", children: [_jsx(CardTitle, { className: "text-sm font-semibold text-foreground", children: "Evolu\u00E7\u00E3o Mensal \u2014 \u00FAltimos 12 meses" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Neg\u00F3cios abertos, ganhos e perdidos por m\u00EAs de cria\u00E7\u00E3o" })] }), _jsx(CardContent, { className: "px-3 pb-4", children: loadEvol
                                    ? _jsx(Skeleton, { className: "h-56" })
                                    : (_jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(LineChart, { data: evolucaoFormatada, margin: { left: 0, right: 8, top: 4, bottom: 4 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: C_GRID }), _jsx(XAxis, { dataKey: "mesLabel", tick: { fontSize: 11, fill: C_TICK }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11, fill: C_TICK }, axisLine: false, tickLine: false }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Legend, { wrapperStyle: { fontSize: 11, paddingTop: 8 }, formatter: v => _jsx("span", { style: { color: C_TICK }, children: v }) }), _jsx(Line, { type: "monotone", dataKey: "abertos", name: "Abertos", stroke: C_ANDAMENTO, strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "ganhos", name: "Ganhos", stroke: C_GANHO, strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "perdidos", name: "Perdidos", stroke: C_PERDIDO, strokeWidth: 2, dot: false })] }) })) })] })] }), _jsxs(Card, { className: "border border-border bg-card", children: [_jsxs(CardHeader, { className: "pb-2 pt-5 px-5", children: [_jsx(CardTitle, { className: "text-sm font-semibold text-foreground", children: "Top Vendedores \u2014 Pipeline em Aberto" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Ranking por valor de pipeline ativo" })] }), _jsx(CardContent, { className: "px-5 pb-5", children: loadVend
                            ? _jsx(Skeleton, { className: "h-48" })
                            : (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "grid grid-cols-[1fr_80px_60px_60px_80px_70px] gap-2 pb-1 border-b border-border", children: ['Vendedor', 'Pipeline', 'Abertos', 'Ganhos', 'Perdidos', 'Conversão'].map(h => (_jsx("span", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", children: h }, h))) }), (vendedores ?? []).map((v, i) => {
                                        const maxP = Math.max(...(vendedores ?? []).map(x => x.valorPipeline), 1);
                                        return (_jsxs("div", { children: [_jsxs("div", { className: "grid grid-cols-[1fr_80px_60px_60px_80px_70px] gap-2 items-center py-1.5", children: [_jsx("span", { className: "text-sm text-foreground font-medium truncate", children: v.nome.trim() }), _jsx("span", { className: "text-xs font-semibold text-green-400", children: formatCurrency(v.valorPipeline) }), _jsx("span", { className: "text-xs text-muted-foreground text-center", children: v.emAndamento }), _jsx("span", { className: "text-xs text-emerald-400 text-center", children: v.ganhos }), _jsx("span", { className: "text-xs text-red-400 text-center", children: v.perdidos }), _jsx("span", { className: "text-xs font-semibold text-amber-400", children: formatPercent(v.taxaConversao) })] }), _jsx("div", { className: "h-0.5 bg-muted rounded-full overflow-hidden -mt-1 mb-1", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${(v.valorPipeline / maxP) * 100}%`, background: C_ANDAMENTO } }) })] }, i));
                                    })] })) })] })] }));
}
