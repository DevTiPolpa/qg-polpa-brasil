import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { trpc } from '../lib/trpc';
import FiltrosGlobais from '../components/FiltrosGlobais';
import { formatCurrency, formatKg, formatMes } from '../lib/utils';
import { Search, Users, UserCheck, AlertTriangle, UserX, Activity } from 'lucide-react';
const DEFAULT_FILTROS = { dataInicio: '2026-01-01', dataFim: '2026-12-31' };
function getStatusCliente(ultimaCompra, primeiraCompra) {
    const now = Date.now();
    if (primeiraCompra) {
        const diasPrimeira = (now - new Date(primeiraCompra).getTime()) / 86400000;
        if (diasPrimeira <= 60)
            return 'novo';
    }
    if (!ultimaCompra)
        return 'inativo';
    const dias = (now - new Date(ultimaCompra).getTime()) / 86400000;
    if (dias <= 180)
        return 'ativo';
    if (dias <= 365)
        return 'emRisco';
    return 'inativo';
}
export default function Clientes() {
    const [filtros, setFiltros] = useState(DEFAULT_FILTROS);
    const [search, setSearch] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('todos');
    const [selected, setSelected] = useState(null);
    const [exibindo, setExibindo] = useState(30);
    const { data: lista } = trpc.clientes.lista.useQuery(filtros);
    const { data: saude } = trpc.clientes.saudeCarteira.useQuery(filtros);
    const { data: kpis } = trpc.dashboard.kpis.useQuery(filtros);
    const { data: evolucao } = trpc.vendedores.evolucaoConsolidada.useQuery(filtros);
    const { data: produtos } = trpc.produtos.performance.useQuery(filtros);
    const { data: estados } = trpc.clientes.vendasPorEstado.useQuery({ filtros });
    const { data: historico } = trpc.clientes.historico.useQuery({ codParc: selected, filtros }, { enabled: !!selected });
    const { data: mix } = trpc.clientes.mix.useQuery({ codParc: selected, filtros }, { enabled: !!selected });
    const listaComStatus = useMemo(() => (lista ?? []).map(c => ({
        ...c,
        status: getStatusCliente(c.ultimaCompra, c.primeiraCompra),
    })), [lista]);
    const filtered = useMemo(() => listaComStatus.filter(c => {
        if (search && !(c.razaoSocial ?? '').toLowerCase().includes(search.toLowerCase()))
            return false;
        if (statusFiltro !== 'todos' && c.status !== statusFiltro)
            return false;
        return true;
    }), [listaComStatus, search, statusFiltro]);
    const selectedClient = lista?.find(c => c.codParc === selected);
    const scoreColor = !saude ? 'text-slate-400'
        : saude.score >= 70 ? 'text-green-400'
            : saude.score >= 40 ? 'text-amber-400'
                : 'text-red-400';
    const totalEstados = (estados ?? []).reduce((s, e) => s + Number(e.faturamento), 0);
    const statusTabs = [
        { key: 'todos', label: 'Todos', count: listaComStatus.length },
        { key: 'ativo', label: 'Ativo', count: listaComStatus.filter(c => c.status === 'ativo').length },
        { key: 'emRisco', label: 'Em Risco', count: listaComStatus.filter(c => c.status === 'emRisco').length },
        { key: 'inativo', label: 'Inativo', count: listaComStatus.filter(c => c.status === 'inativo').length },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl", children: [_jsxs("div", { className: "px-5 py-3 border-b border-slate-700 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "w-4 h-4 text-green-400" }), _jsx("span", { className: "text-sm font-semibold text-white", children: "Score de Sa\u00FAde da Carteira" })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [_jsx("span", { className: "text-xs text-slate-500", children: "Score Geral" }), _jsxs("span", { className: `text-2xl font-bold ${scoreColor}`, children: [saude?.score ?? '—', _jsx("span", { className: "text-slate-500 text-base font-normal", children: "/100" })] }), _jsx("div", { className: "w-32 h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-green-500 transition-all", style: { width: `${saude?.score ?? 0}%` } }) })] })] }), _jsx("div", { className: "px-5 py-2", children: _jsxs("p", { className: "text-[11px] text-slate-500", children: [saude?.total ?? 0, " clientes analisados \u00B7 Novos e Ativos contribuem 100%, Em Risco 50%, Inativos 0%"] }) }), _jsx("div", { className: "grid grid-cols-4 gap-0 divide-x divide-slate-700/60 border-t border-slate-700/60", children: [
                            {
                                icon: _jsx(Users, { className: "w-4 h-4 text-blue-400" }),
                                label: 'Novos Clientes',
                                sublabel: 'Compraram agora, não compravam antes',
                                value: saude?.novos ?? 0,
                                pct: saude?.total ? Math.round((saude.novos / saude.total) * 100) : 0,
                                color: 'text-blue-400',
                                barColor: 'bg-blue-500',
                                bg: 'bg-blue-900/10',
                            },
                            {
                                icon: _jsx(UserCheck, { className: "w-4 h-4 text-green-400" }),
                                label: 'Ativos',
                                sublabel: 'Última compra ≤ 6 meses',
                                value: saude?.ativos ?? 0,
                                pct: saude?.total ? Math.round((saude.ativos / saude.total) * 100) : 0,
                                color: 'text-green-400',
                                barColor: 'bg-green-500',
                                bg: 'bg-green-900/10',
                            },
                            {
                                icon: _jsx(AlertTriangle, { className: "w-4 h-4 text-amber-400" }),
                                label: 'Em Risco',
                                sublabel: 'Última compra entre 6-12 meses',
                                value: saude?.emRisco ?? 0,
                                pct: saude?.total ? Math.round((saude.emRisco / saude.total) * 100) : 0,
                                color: 'text-amber-400',
                                barColor: 'bg-amber-400',
                                bg: 'bg-amber-900/10',
                            },
                            {
                                icon: _jsx(UserX, { className: "w-4 h-4 text-red-400" }),
                                label: 'Inativos',
                                sublabel: 'Última compra > 12 meses',
                                value: saude?.inativos ?? 0,
                                pct: saude?.total ? Math.round((saude.inativos / saude.total) * 100) : 0,
                                color: 'text-red-400',
                                barColor: 'bg-red-500',
                                bg: 'bg-red-900/10',
                            },
                        ].map(item => (_jsxs("div", { className: `px-5 py-4 ${item.bg}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("div", { className: "flex items-center gap-1.5", children: item.icon }), _jsxs("span", { className: `text-[11px] font-semibold ${item.color}`, children: [item.pct, "%"] })] }), _jsx("p", { className: `text-3xl font-bold ${item.color} mt-1`, children: item.value }), _jsx("p", { className: "text-xs font-medium text-white mt-0.5", children: item.label }), _jsx("p", { className: "text-[11px] text-slate-500 mt-0.5", children: item.sublabel }), _jsx("div", { className: "h-1 bg-slate-700 rounded-full overflow-hidden mt-2", children: _jsx("div", { className: `h-full rounded-full ${item.barColor} transition-all`, style: { width: `${item.pct}%` } }) })] }, item.label))) })] }), _jsx(FiltrosGlobais, { filtros: filtros, onChange: setFiltros }), (() => {
                const badges = [];
                (filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }));
                (filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }));
                (filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }));
                (filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }));
                (filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }));
                const temData = filtros.dataInicio !== DEFAULT_FILTROS.dataInicio || filtros.dataFim !== DEFAULT_FILTROS.dataFim;
                if (badges.length === 0 && !temData)
                    return null;
                return (_jsxs("div", { className: "flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0", children: "Filtros ativos" }), _jsx("div", { className: "flex items-center gap-1.5 flex-wrap flex-1", children: badges.map((b, i) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-[11px] text-slate-200", children: [b.label, _jsx("button", { onClick: b.onRemove, className: "text-slate-400 hover:text-white ml-0.5 leading-none", children: "\u00D7" })] }, i))) }), _jsx("button", { onClick: () => setFiltros(DEFAULT_FILTROS), className: "shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1", children: "Limpar tudo" })] }));
            })(), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4 items-start", children: [_jsxs("div", { className: "lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-slate-700 space-y-3", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("p", { className: "text-sm font-semibold text-white", children: ["Clientes (", filtered.length, " de ", listaComStatus.length, ")"] }) }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { value: search, onChange: e => { setSearch(e.target.value); setExibindo(30); }, placeholder: "Buscar cliente...", className: "w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-green-500" })] }), _jsx("div", { className: "flex items-center gap-1.5 flex-wrap", children: statusTabs.map(tab => (_jsxs("button", { onClick: () => { setStatusFiltro(tab.key); setExibindo(30); }, className: `px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${statusFiltro === tab.key
                                                ? tab.key === 'todos' ? 'bg-slate-600 border-slate-500 text-white'
                                                    : tab.key === 'ativo' ? 'bg-green-900/40 border-green-600 text-green-400'
                                                        : tab.key === 'emRisco' ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                                                            : 'bg-red-900/40 border-red-700 text-red-400'
                                                : 'bg-slate-700/40 border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'}`, children: [tab.label, " ", tab.count] }, tab.key))) })] }), _jsxs("div", { className: "divide-y divide-slate-700/50 overflow-y-auto max-h-[600px]", children: [filtered.slice(0, exibindo).map(c => {
                                        const isSelected = selected === c.codParc;
                                        const statusLabel = c.status === 'novo' ? 'Novo'
                                            : c.status === 'ativo' ? 'Ativo'
                                                : c.status === 'emRisco' ? 'Em Risco'
                                                    : 'Inativo';
                                        const badgeClass = c.status === 'novo'
                                            ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50'
                                            : c.status === 'ativo'
                                                ? 'bg-green-900/40 text-green-400 border border-green-700/50'
                                                : c.status === 'emRisco'
                                                    ? 'bg-amber-900/40 text-amber-400 border border-amber-700/50'
                                                    : 'bg-red-900/40 text-red-400 border border-red-700/50';
                                        return (_jsxs("button", { onClick: () => setSelected(isSelected ? null : c.codParc), className: `w-full text-left px-4 py-3 hover:bg-slate-700/40 transition-colors ${isSelected ? 'bg-green-900/20 border-l-2 border-l-green-500' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-0.5", children: [_jsx("p", { className: "text-sm font-semibold text-white truncate leading-tight", children: c.razaoSocial }), _jsx("span", { className: `text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`, children: statusLabel })] }), _jsxs("div", { className: "flex items-center gap-2 text-[11px] text-slate-400 flex-wrap", children: [_jsx("span", { className: "uppercase tracking-wide text-slate-500", children: c.perfilParceiro }), _jsx("span", { children: "\u00B7" }), _jsx("span", { className: "text-green-400 font-medium", children: formatCurrency(Number(c.faturamento)) }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [c.produtos, " produtos"] }), _jsx("span", { children: "\u00B7" }), _jsx("span", { children: c.uf })] })] }, c.codParc));
                                    }), filtered.length > exibindo && (_jsxs("button", { onClick: () => setExibindo(n => n + 30), className: "w-full py-3 text-xs text-green-400 hover:text-green-300 transition-colors", children: ["Carregar mais (", filtered.length - exibindo, " restantes)"] }))] })] }), _jsx("div", { className: "lg:col-span-3 space-y-4", children: selected && selectedClient ? (
                        /* ── Detalhes do cliente selecionado ── */
                        _jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-5", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-0.5", children: selectedClient.razaoSocial }), _jsxs("p", { className: "text-xs text-slate-400 mb-4", children: [selectedClient.perfilParceiro, " \u00B7 ", selectedClient.uf, " \u00B7 ", selectedClient.nomeVendedor] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                { label: 'Faturamento', value: formatCurrency(Number(selectedClient.faturamento)) },
                                                { label: 'Volume', value: formatKg(Number(selectedClient.volume)) },
                                                { label: 'Produtos', value: String(selectedClient.produtos) },
                                            ].map(item => (_jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3", children: [_jsx("p", { className: "text-[11px] text-slate-400", children: item.label }), _jsx("p", { className: "text-base font-bold text-white mt-0.5", children: item.value })] }, item.label))) })] }), historico && historico.length > 0 && (_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-5", children: [_jsx("p", { className: "text-sm font-semibold text-white mb-4", children: "Hist\u00F3rico Mensal" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: historico.map(r => ({ mes: formatMes(r.mes), Faturamento: Number(r.faturamento) })), children: [_jsx(XAxis, { dataKey: "mes", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tickFormatter: v => `R$${(v / 1000).toFixed(0)}k`, tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false, width: 52 }), _jsx(Tooltip, { contentStyle: { background: '#0f1d30', border: '1px solid #1e3454', borderRadius: 8, fontSize: 12 }, formatter: (v) => [formatCurrency(v), 'Faturamento'], labelStyle: { color: '#f8fafc' } }), _jsx(Bar, { dataKey: "Faturamento", fill: "#16a34a", radius: [4, 4, 0, 0] })] }) })] })), mix && mix.length > 0 && (_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-slate-700", children: _jsxs("p", { className: "text-sm font-semibold text-white", children: ["Mix de Produtos (", mix.length, ")"] }) }), _jsx("div", { className: "divide-y divide-slate-700/50 overflow-y-auto max-h-[280px]", children: mix.map(p => (_jsxs("div", { className: "px-4 py-2.5 flex items-center justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm text-white truncate", children: p.nomeProduto ?? `Produto ${p.codProduto}` }), _jsxs("p", { className: "text-[11px] text-slate-400", children: [p.grupoProduto, " \u00B7 ", formatKg(Number(p.volume))] })] }), _jsx("p", { className: "text-sm font-semibold text-green-400 ml-3 shrink-0", children: formatCurrency(Number(p.faturamento)) })] }, p.codProduto))) })] }))] })) : (
                        /* ── Visão Consolidada ── */
                        _jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-sm font-semibold text-white", children: "Vis\u00E3o Consolidada da Carteira" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "\u2014 clique em um cliente para ver o detalhamento" })] }), _jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                                                { label: 'Fat.', value: formatCurrency(Number(kpis?.faturamentoTotal ?? 0)) },
                                                { label: 'Volume Total', value: formatKg(Number(kpis?.volumeTotal ?? 0)) },
                                                { label: 'Clientes Ativos', value: String(kpis?.clientesAtivos ?? 0) },
                                            ].map(item => (_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-slate-500 mb-0.5", children: item.label }), _jsx("p", { className: "text-xl font-bold text-white", children: item.value })] }, item.label))) })] }), _jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Evolu\u00E7\u00E3o Mensal Consolidada" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Clique para filtrar m\u00EAs" })] }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: (evolucao ?? []).map(r => ({ mes: formatMes(r.mes), Faturamento: Number(r.faturamento) })), children: [_jsx(XAxis, { dataKey: "mes", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tickFormatter: v => `R$${(v / 1000).toFixed(0)}k`, tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false, width: 58 }), _jsx(Tooltip, { contentStyle: { background: '#0f1d30', border: '1px solid #1e3454', borderRadius: 8, fontSize: 12 }, formatter: (v) => [formatCurrency(v), 'Faturamento'], labelStyle: { color: '#f8fafc' } }), _jsx(Bar, { dataKey: "Faturamento", fill: "#16a34a", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-700 flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Top Produtos (Carteira Completa)" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Clique para filtrar por produto" })] }), _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700/60 text-slate-500", children: [_jsx("th", { className: "text-left px-4 py-2.5 font-medium", children: "Produto" }), _jsx("th", { className: "text-left px-3 py-2.5 font-medium", children: "Grupo" }), _jsx("th", { className: "text-right px-3 py-2.5 font-medium", children: "Faturamento" }), _jsx("th", { className: "text-right px-4 py-2.5 font-medium", children: "Volume" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-700/40", children: (produtos ?? []).slice(0, 7).map(p => (_jsxs("tr", { className: "hover:bg-slate-700/30 transition-colors", children: [_jsx("td", { className: "px-4 py-2 text-white font-medium", children: _jsx("span", { className: "block truncate max-w-[220px]", children: p.nomeProduto ?? `Produto ${p.codProduto}` }) }), _jsx("td", { className: "px-3 py-2 text-slate-400 uppercase text-[10px] tracking-wide", children: p.grupoProduto ?? '—' }), _jsx("td", { className: "px-3 py-2 text-green-400 font-semibold text-right whitespace-nowrap", children: formatCurrency(Number(p.faturamento)) }), _jsx("td", { className: "px-4 py-2 text-slate-400 text-right whitespace-nowrap", children: formatKg(Number(p.volume)) })] }, p.codProduto))) })] })] }), _jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Representatividade por Estado" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Clique para filtrar por estado" })] }), _jsx("div", { className: "space-y-2.5", children: (estados ?? []).slice(0, 8).map(e => {
                                                const pct = totalEstados > 0 ? (Number(e.faturamento) / totalEstados) * 100 : 0;
                                                return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-semibold text-slate-300 w-6 shrink-0", children: e.uf }), _jsx("div", { className: "flex-1 h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-green-500 transition-all", style: { width: `${pct}%` } }) }), _jsxs("div", { className: "flex items-center gap-3 text-[11px] text-slate-400 text-right shrink-0 w-48", children: [_jsxs("span", { children: [pct.toFixed(1), "%"] }), _jsx("span", { children: formatCurrency(Number(e.faturamento)) })] })] }, e.uf));
                                            }) })] })] })) })] })] }));
}
