import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock, Users, Target, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { trpc } from '../lib/trpc';
import { formatCurrency, formatNumber, formatMes } from '../lib/utils';
// ─── Cores ────────────────────────────────────────────────────────────────────
const C_AND = 'oklch(0.62 0.18 250)';
const C_WON = 'oklch(0.65 0.20 145)';
const C_LOST = 'oklch(0.65 0.22 25)';
// ─── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
    return _jsx("div", { className: `bg-muted animate-pulse rounded ${className}` });
}
function pct(v) {
    return v != null ? `${formatNumber(v, 1)}%` : '—';
}
function dias(v) {
    return v != null ? `${formatNumber(v, 0)}d` : '—';
}
function KpiCard({ label, value, sub, icon: Icon, iconClass, loading }) {
    return (_jsx(Card, { className: "border border-border bg-card", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", children: label }), _jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`, children: _jsx(Icon, { className: "w-3.5 h-3.5" }) })] }), loading ? _jsx(Skeleton, { className: "h-5 w-20" }) : _jsx("p", { className: "text-sm font-bold text-foreground", children: value }), sub && !loading && _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: sub })] }) }));
}
// ─── Constantes ───────────────────────────────────────────────────────────────
const today = new Date();
const defaultIni = `${today.getFullYear()}-01-01`;
const defaultFim = today.toISOString().slice(0, 10);
const PIPELINES = [
    { id: null, label: 'Todos' },
    { id: 0, label: 'Comercial' },
    { id: 31, label: 'Private Label' },
];
// ─── Mescla linhas A (criados) + B (fechados) por período ─────────────────────
function mergeCalendario(a, b, zeroA, zeroB) {
    const periods = [...new Set([...a.map(x => x.periodo), ...b.map(x => x.periodo)])].sort();
    return periods.map(p => ({
        ...zeroA,
        ...zeroB,
        ...a.find(x => x.periodo === p),
        ...b.find(x => x.periodo === p),
        periodo: p,
    }));
}
// ─── Seção genérica de deals ──────────────────────────────────────────────────
function DealsSection({ title, subtitle, pipelineId, origem, dateIni, dateFim, visao, }) {
    const snapQ = trpc.panoramaCrm.dealsSnapshot.useQuery({ pipelineId, origem });
    const dealsQ = trpc.panoramaCrm.deals.useQuery({ dateIni, dateFim, visao, pipelineId, origem });
    const snap = snapQ.data;
    const loading = dealsQ.isLoading || snapQ.isLoading;
    const rows = useMemo(() => {
        if (!dealsQ.data)
            return [];
        if (visao === 'calendario') {
            const d = dealsQ.data;
            return mergeCalendario(d.criados, d.fechados, { criados: 0 }, { ganhos: 0, valorGanhos: 0, perdidos: 0, cicloTotal: null, cicloGanhos: null }).map(r => ({
                ...r,
                taxaConv: (r.ganhos + r.perdidos + (snap?.emAndamento ?? 0)) > 0
                    ? r.ganhos / ((snap?.emAndamento ?? 0) + r.ganhos + r.perdidos) * 100
                    : null,
            }));
        }
        else {
            const d = dealsQ.data;
            return d.rows ?? [];
        }
    }, [dealsQ.data, snap, visao]);
    const totGanhos = rows.reduce((s, r) => s + r.ganhos, 0);
    const totPerdidos = rows.reduce((s, r) => s + r.perdidos, 0);
    const totValor = rows.reduce((s, r) => s + r.valorGanhos, 0);
    const taxaTotal = snap ? totGanhos / Math.max(snap.emAndamento + totGanhos + totPerdidos, 1) * 100 : null;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold text-foreground", children: title }), _jsx("p", { className: "text-xs text-muted-foreground", children: subtitle })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3", children: [_jsx(KpiCard, { label: "Em Andamento", value: formatNumber(snap?.emAndamento ?? 0), icon: Clock, iconClass: "bg-blue-500/15 text-blue-400", loading: snapQ.isLoading }), _jsx(KpiCard, { label: "Valor em And.", value: formatCurrency(snap?.valorEmAndamento ?? 0), icon: DollarSign, iconClass: "bg-blue-500/15 text-blue-400", loading: snapQ.isLoading }), _jsx(KpiCard, { label: "Ganhos", value: formatNumber(totGanhos), icon: CheckCircle, iconClass: "bg-green-500/15 text-green-400", loading: loading }), _jsx(KpiCard, { label: "Valor Ganhos", value: formatCurrency(totValor), icon: TrendingUp, iconClass: "bg-green-500/15 text-green-400", loading: loading }), _jsx(KpiCard, { label: "Perdidos", value: formatNumber(totPerdidos), icon: XCircle, iconClass: "bg-red-500/15 text-red-400", loading: loading }), _jsx(KpiCard, { label: "Taxa Convers\u00E3o", value: pct(taxaTotal), icon: Target, iconClass: "bg-amber-500/15 text-amber-400", loading: loading }), _jsx(KpiCard, { label: "Ciclo Ganhos", value: dias(rows.find(r => r.cicloGanhos != null)?.cicloGanhos), icon: Users, iconClass: "bg-purple-500/15 text-purple-400", loading: loading })] }), _jsx(Card, { className: "border border-border bg-card", children: _jsx(CardContent, { className: "p-0", children: loading ? _jsx(Skeleton, { className: "h-40 m-4" }) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Per\u00EDodo" }), _jsx(TableHead, { className: "text-right", children: "Criados" }), _jsx(TableHead, { className: "text-right text-green-400", children: "Ganhos" }), _jsx(TableHead, { className: "text-right text-green-400", children: "Valor Ganhos" }), _jsx(TableHead, { className: "text-right text-red-400", children: "Perdidos" }), _jsx(TableHead, { className: "text-right", children: "Taxa Conv.%" }), _jsx(TableHead, { className: "text-right", children: "Ciclo Total" }), _jsx(TableHead, { className: "text-right", children: "Ciclo Ganhos" })] }) }), _jsxs(TableBody, { children: [rows.map(r => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: formatMes(r.periodo) }), _jsx(TableCell, { className: "text-right text-muted-foreground", children: formatNumber(r.criados) }), _jsx(TableCell, { className: "text-right text-green-400", children: formatNumber(r.ganhos) }), _jsx(TableCell, { className: "text-right text-green-400", children: formatCurrency(r.valorGanhos) }), _jsx(TableCell, { className: "text-right text-red-400", children: formatNumber(r.perdidos) }), _jsx(TableCell, { className: "text-right", children: pct(r.taxaConv) }), _jsx(TableCell, { className: "text-right text-muted-foreground", children: dias(r.cicloTotal) }), _jsx(TableCell, { className: "text-right", children: dias(r.cicloGanhos) })] }, r.periodo))), rows.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, className: "text-center text-muted-foreground py-8", children: "Sem dados para o per\u00EDodo" }) }))] })] })) }) })] }));
}
// ─── Página principal ─────────────────────────────────────────────────────────
export default function PanoramaCrm() {
    const [dateIni, setDateIni] = useState(defaultIni);
    const [dateFim, setDateFim] = useState(defaultFim);
    const [visao, setVisao] = useState('calendario');
    const [pipeline, setPipeline] = useState(null);
    // Leads
    const leadsSnapQ = trpc.panoramaCrm.leadsSnapshot.useQuery();
    const leadsQ = trpc.panoramaCrm.leads.useQuery({ dateIni, dateFim, visao });
    const leadsSnap = leadsSnapQ.data ?? 0;
    const leadsRows = useMemo(() => {
        if (!leadsQ.data)
            return [];
        if (visao === 'calendario') {
            const d = leadsQ.data;
            const merged = mergeCalendario(d.criados ?? [], d.fechados ?? [], { criados: 0, comMovimentacao: 0 }, { convertidos: 0, perdidos: 0, cicloMedio: null });
            const totConv = merged.reduce((s, r) => s + r.convertidos, 0);
            const totPerd = merged.reduce((s, r) => s + r.perdidos, 0);
            return merged.map(r => ({
                ...r,
                taxaConv: (leadsSnap + totConv + totPerd) > 0 ? r.convertidos / (leadsSnap + totConv + totPerd) * 100 : null,
            }));
        }
        else {
            const d = leadsQ.data;
            return d.rows ?? [];
        }
    }, [leadsQ.data, leadsSnap, visao]);
    const totConv = leadsRows.reduce((s, r) => s + r.convertidos, 0);
    const totPerdL = leadsRows.reduce((s, r) => s + r.perdidos, 0);
    const taxaLeads = (leadsSnap + totConv + totPerdL) > 0 ? totConv / (leadsSnap + totConv + totPerdL) * 100 : 0;
    return (_jsxs("div", { className: "space-y-8 fade-in", children: [_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground tracking-tight", children: "Panorama CRM" }), _jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "An\u00E1lise hist\u00F3rica de leads e neg\u00F3cios \u2014 Bitrix24" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }), _jsx("input", { type: "date", value: dateIni, onChange: e => setDateIni(e.target.value), className: "bg-slate-800 border border-slate-700 text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500" }), _jsx("span", { className: "text-muted-foreground text-sm", children: "at\u00E9" }), _jsx("input", { type: "date", value: dateFim, onChange: e => setDateFim(e.target.value), className: "bg-slate-800 border border-slate-700 text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500" })] }), _jsx("div", { className: "h-5 w-px bg-slate-700" }), _jsx("div", { className: "flex items-center gap-1", children: ['calendario', 'coorte'].map(v => (_jsx("button", { onClick: () => setVisao(v), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${visao === v ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`, children: v === 'calendario' ? '📅 Calendário' : '📊 Coorte' }, v))) }), _jsx("div", { className: "h-5 w-px bg-slate-700" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: "Pipeline:" }), PIPELINES.map(p => (_jsx("button", { onClick: () => setPipeline(p.id), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pipeline === p.id ? 'bg-green-600/20 text-green-400 ring-1 ring-green-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`, children: p.label }, String(p.id))))] })] }), _jsx("p", { className: "text-[11px] text-muted-foreground border-l-2 border-slate-600 pl-3", children: visao === 'calendario'
                            ? '📅 Visão Calendário: ganhos/perdidos contabilizados no mês em que fecharam, independente da criação.'
                            : '📊 Visão Coorte: cada linha mostra o destino final dos leads/negócios criados naquele mês. Meses recentes aparecem com conversão baixa pois ainda estão maturando.' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2", children: "1. Gera\u00E7\u00E3o de Demanda \u2014 Leads" }), _jsx("div", { className: "h-px flex-1 bg-border" })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", children: [_jsx(KpiCard, { label: "Em Andamento", value: formatNumber(leadsSnap), icon: Clock, iconClass: "bg-blue-500/15 text-blue-400", loading: leadsSnapQ.isLoading }), _jsx(KpiCard, { label: "Criados", value: formatNumber(leadsRows.reduce((s, r) => s + r.criados, 0)), icon: Users, iconClass: "bg-slate-500/15 text-slate-400", loading: leadsQ.isLoading }), _jsx(KpiCard, { label: "Convertidos", value: formatNumber(totConv), icon: CheckCircle, iconClass: "bg-green-500/15 text-green-400", loading: leadsQ.isLoading }), _jsx(KpiCard, { label: "Perdidos", value: formatNumber(totPerdL), icon: XCircle, iconClass: "bg-red-500/15 text-red-400", loading: leadsQ.isLoading }), _jsx(KpiCard, { label: "Taxa Conv.%", value: pct(taxaLeads), icon: Target, iconClass: "bg-amber-500/15 text-amber-400", loading: leadsQ.isLoading }), _jsx(KpiCard, { label: "Ciclo M\u00E9dio", value: dias(leadsRows.find(r => r.cicloMedio != null)?.cicloMedio), icon: TrendingUp, iconClass: "bg-purple-500/15 text-purple-400", loading: leadsQ.isLoading })] }), _jsx(Card, { className: "border border-border bg-card", children: _jsx(CardContent, { className: "p-0", children: leadsQ.isLoading ? _jsx(Skeleton, { className: "h-40 m-4" }) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Per\u00EDodo" }), _jsx(TableHead, { className: "text-right", children: "Criados" }), _jsx(TableHead, { className: "text-right", children: "Movimenta\u00E7\u00E3o" }), _jsx(TableHead, { className: "text-right text-green-400", children: "Convertidos" }), _jsx(TableHead, { className: "text-right text-red-400", children: "Perdidos" }), _jsx(TableHead, { className: "text-right", children: "Taxa Conv.%" }), _jsx(TableHead, { className: "text-right", children: "Ciclo M\u00E9dio" })] }) }), _jsxs(TableBody, { children: [leadsRows.map(r => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: formatMes(r.periodo) }), _jsx(TableCell, { className: "text-right text-muted-foreground", children: formatNumber(r.criados) }), _jsx(TableCell, { className: "text-right text-muted-foreground", children: formatNumber(r.comMovimentacao) }), _jsx(TableCell, { className: "text-right text-green-400", children: formatNumber(r.convertidos) }), _jsx(TableCell, { className: "text-right text-red-400", children: formatNumber(r.perdidos) }), _jsx(TableCell, { className: "text-right", children: pct(r.taxaConv) }), _jsx(TableCell, { className: "text-right", children: dias(r.cicloMedio) })] }, r.periodo))), leadsRows.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, className: "text-center text-muted-foreground py-8", children: "Sem dados para o per\u00EDodo" }) }))] })] })) }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2", children: "2. Neg\u00F3cios de Leads" }), _jsx("div", { className: "h-px flex-1 bg-border" })] }), _jsx(DealsSection, { title: "Neg\u00F3cios de Leads \u2014 Comercial", subtitle: "Deals com lead_id preenchido | Funil Comercial", pipelineId: 0, origem: "leads", dateIni: dateIni, dateFim: dateFim, visao: visao }), _jsx(DealsSection, { title: "Neg\u00F3cios de Leads \u2014 Private Label", subtitle: "Deals com lead_id preenchido | Funil Marca Pr\u00F3pria", pipelineId: 31, origem: "leads", dateIni: dateIni, dateFim: dateFim, visao: visao })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2", children: "3. Neg\u00F3cios da Base de Clientes" }), _jsx("div", { className: "h-px flex-1 bg-border" })] }), _jsx(DealsSection, { title: "Base de Clientes \u2014 Comercial", subtitle: "Deals sem lead_id | Funil Comercial", pipelineId: 0, origem: "base", dateIni: dateIni, dateFim: dateFim, visao: visao }), _jsx(DealsSection, { title: "Base de Clientes \u2014 Private Label", subtitle: "Deals sem lead_id | Funil Marca Pr\u00F3pria", pipelineId: 31, origem: "base", dateIni: dateIni, dateFim: dateFim, visao: visao })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2", children: "4. Vis\u00E3o Completa (Leads + Base)" }), _jsx("div", { className: "h-px flex-1 bg-border" })] }), _jsx(DealsSection, { title: "Vis\u00E3o Completa \u2014 Comercial", subtitle: "Todos os deals | Funil Comercial", pipelineId: 0, origem: "total", dateIni: dateIni, dateFim: dateFim, visao: visao }), _jsx(DealsSection, { title: "Vis\u00E3o Completa \u2014 Private Label", subtitle: "Todos os deals | Funil Marca Pr\u00F3pria", pipelineId: 31, origem: "total", dateIni: dateIni, dateFim: dateFim, visao: visao })] })] }));
}
