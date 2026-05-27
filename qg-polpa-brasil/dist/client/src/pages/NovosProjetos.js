import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, } from 'recharts';
import { trpc } from '../lib/trpc';
import FiltrosGlobais from '../components/FiltrosGlobais';
import { formatCurrency, formatNumber, formatMes } from '../lib/utils';
import { FolderOpen, TrendingUp, RefreshCw, DollarSign, X, ChevronRight } from 'lucide-react';
import { COLORS } from '../lib/colors';
const DEFAULT_FILTROS = { dataInicio: '2026-01-01', dataFim: '2026-12-31' };
const COLOR_NP = COLORS.NOVO_PROJETO;
const COLOR_REC = COLORS.VENDA_FIRME;
const COLOR_VF = COLORS.VENDA_FIRME;
const COLOR_FC = COLORS.FORECAST;
function formatCurrencyK(value) {
    if (Math.abs(value) >= 1000000)
        return `R$${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
    if (Math.abs(value) >= 1000)
        return `R$${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
    return formatCurrency(value);
}
export default function NovosProjetos() {
    const [filtros, setFiltros] = useState(DEFAULT_FILTROS);
    const [selecionado, setSelecionado] = useState(null);
    const [search, setSearch] = useState('');
    const { data: kpis } = trpc.novosProjetos.kpis.useQuery(filtros);
    const { data: porMes } = trpc.novosProjetos.porMes.useQuery(filtros);
    const { data: faturamentoMensal } = trpc.novosProjetos.faturamentoMensal.useQuery(filtros);
    const { data: lista } = trpc.novosProjetos.lista.useQuery(filtros);
    const { data: evolucao, isLoading: evolucaoLoading, isError: evolucaoError } = trpc.novosProjetos.evolucao.useQuery({ codParc: selecionado?.codParc ?? 0, codProduto: selecionado?.codProduto ?? 0 }, { enabled: !!selecionado });
    const listaFiltrada = useMemo(() => (lista ?? []).filter(p => !search ||
        (p.razaoSocial ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.nomeProduto ?? '').toLowerCase().includes(search.toLowerCase())), [lista, search]);
    const evolucaoFormatada = useMemo(() => {
        if (!evolucao)
            return [];
        const byMes = {};
        for (const r of evolucao) {
            if (!byMes[r.mes])
                byMes[r.mes] = { mes: r.mes, novoProjeto: 0, recorrente: 0 };
            if (r.projeto === 'NOVOS PROJETOS')
                byMes[r.mes].novoProjeto += Number(r.faturamento);
            else if (r.projeto === 'RECORRENTES')
                byMes[r.mes].recorrente += Number(r.faturamento);
        }
        return Object.values(byMes).sort((a, b) => a.mes.localeCompare(b.mes));
    }, [evolucao]);
    const porMesFormatado = (porMes ?? []).map(r => ({
        ...r,
        mesLabel: formatMes(r.mes),
        projetos: Number(r.projetos),
        faturamento: Number(r.faturamento),
    }));
    const faturamentoFormatado = (faturamentoMensal ?? []).map(r => ({
        ...r,
        mesLabel: formatMes(r.mes),
        faturamento: Number(r.faturamento),
        vendaFirme: Number(r.vendaFirme),
        forecast: Number(r.forecast),
        novoProjeto: Number(r.novoProjeto),
    }));
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(FiltrosGlobais, { filtros: filtros, onChange: setFiltros }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(KpiCard, { icon: _jsx(FolderOpen, { className: "w-4 h-4 text-blue-400" }), label: "Projetos Abertos", value: formatNumber(kpis?.totalProjetos ?? 0), sub: "no per\u00EDodo" }), _jsx(KpiCard, { icon: _jsx(DollarSign, { className: "w-4 h-4 text-green-400" }), label: "Faturamento Total", value: formatCurrencyK(kpis?.faturamentoTotal ?? 0), sub: "novos projetos" }), _jsx(KpiCard, { icon: _jsx(RefreshCw, { className: "w-4 h-4 text-amber-400" }), label: "Taxa de Convers\u00E3o", value: `${(kpis?.taxaConversao ?? 0).toFixed(1)}%`, sub: `${kpis?.convertidos ?? 0} de ${kpis?.total12m ?? 0} após 12m` }), _jsx(KpiCard, { icon: _jsx(TrendingUp, { className: "w-4 h-4 text-purple-400" }), label: "Ticket M\u00E9dio", value: formatCurrencyK(kpis?.ticketMedio ?? 0), sub: "por projeto" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-3", children: "Projetos Abertos por M\u00EAs" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: porMesFormatado, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { dataKey: "mesLabel", tick: { fill: '#94a3b8', fontSize: 11 } }), _jsx(YAxis, { tick: { fill: '#94a3b8', fontSize: 11 }, allowDecimals: false }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }, formatter: (v) => [formatNumber(v), 'Projetos'] }), _jsx(Bar, { dataKey: "projetos", fill: COLOR_NP, radius: [4, 4, 0, 0], name: "Projetos" })] }) })] }), _jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-3", children: "Faturamento Mensal \u2014 Novos Projetos" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: faturamentoFormatado, margin: { top: 4, right: 8, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { dataKey: "mesLabel", tick: { fill: '#94a3b8', fontSize: 11 } }), _jsx(YAxis, { tick: { fill: '#94a3b8', fontSize: 11 }, tickFormatter: v => formatCurrencyK(v) }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }, formatter: (v) => [formatCurrency(v)] }), _jsx(Legend, { iconSize: 8, wrapperStyle: { fontSize: 11 } }), _jsx(Bar, { dataKey: "faturamento", name: "Faturamento", fill: COLOR_NP, radius: [4, 4, 0, 0] })] }) })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl flex-1 min-w-0", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-3", children: [_jsx("h3", { className: "text-sm font-semibold text-white", children: "Projetos Abertos" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Buscar cliente ou produto...", className: "bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700", children: [_jsx("th", { className: "text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Cliente" }), _jsx("th", { className: "text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Produto" }), _jsx("th", { className: "text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Vendedor" }), _jsx("th", { className: "text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Abertura" }), _jsx("th", { className: "text-right px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Faturamento" }), _jsx("th", { className: "text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase", children: "Status" }), _jsx("th", { className: "px-2 py-2" })] }) }), _jsxs("tbody", { children: [listaFiltrada.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-slate-500 text-sm", children: "Nenhum projeto encontrado para os filtros selecionados." }) })), listaFiltrada.map(p => {
                                                    const isSelected = selecionado?.codParc === p.codParc && selecionado?.codProduto === p.codProduto;
                                                    return (_jsxs("tr", { onClick: () => setSelecionado(isSelected ? null : {
                                                            codParc: p.codParc,
                                                            codProduto: p.codProduto,
                                                            razaoSocial: p.razaoSocial,
                                                            nomeProduto: p.nomeProduto,
                                                        }), className: `border-b border-slate-700/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-slate-700/40'}`, children: [_jsx("td", { className: "px-4 py-2.5 text-white font-medium text-xs max-w-[160px] truncate", children: p.razaoSocial }), _jsx("td", { className: "px-4 py-2.5 text-slate-300 text-xs max-w-[140px] truncate", children: p.nomeProduto }), _jsx("td", { className: "px-4 py-2.5 text-slate-400 text-xs", children: p.nomeVendedor }), _jsx("td", { className: "px-4 py-2.5 text-slate-400 text-xs", children: p.mesAbertura ? formatMes(p.mesAbertura) : '—' }), _jsx("td", { className: "px-4 py-2.5 text-right text-white text-xs font-medium", children: formatCurrency(Number(p.faturamento)) }), _jsx("td", { className: "px-4 py-2.5", children: _jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.statusAtual === 'RECORRENTES'
                                                                        ? 'bg-green-900/40 text-green-400'
                                                                        : 'bg-blue-900/40 text-blue-400'}`, children: p.statusAtual === 'RECORRENTES' ? 'Recorrente' : 'Novo Projeto' }) }), _jsx("td", { className: "px-2 py-2.5 text-slate-500", children: _jsx(ChevronRight, { className: "w-3.5 h-3.5" }) })] }, `${p.codParc}-${p.codProduto}`));
                                                })] })] }) })] }), selecionado && (_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl w-80 shrink-0", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-700 flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-semibold text-white truncate", children: selecionado.razaoSocial }), _jsx("p", { className: "text-xs text-slate-400 truncate", children: selecionado.nomeProduto })] }), _jsx("button", { onClick: () => setSelecionado(null), className: "text-slate-500 hover:text-white transition-colors shrink-0", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-xs text-slate-400 mb-3", children: "Evolu\u00E7\u00E3o do faturamento desde a abertura" }), evolucaoLoading ? (_jsx("p", { className: "text-xs text-slate-500 text-center py-8", children: "Carregando..." })) : evolucaoError ? (_jsx("p", { className: "text-xs text-red-400 text-center py-8", children: "Erro ao carregar dados." })) : evolucaoFormatada.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: evolucaoFormatada, margin: { top: 4, right: 4, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { dataKey: "mes", tickFormatter: formatMes, tick: { fill: '#94a3b8', fontSize: 10 } }), _jsx(YAxis, { tick: { fill: '#94a3b8', fontSize: 10 }, tickFormatter: v => formatCurrencyK(v) }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }, labelFormatter: formatMes, formatter: (v) => [formatCurrency(v)] }), _jsx(Legend, { iconSize: 8, wrapperStyle: { fontSize: 11 } }), _jsx(Line, { dataKey: "novoProjeto", name: "Novo Projeto", stroke: COLOR_NP, dot: false, strokeWidth: 2 }), _jsx(Line, { dataKey: "recorrente", name: "Recorrente", stroke: COLOR_REC, dot: false, strokeWidth: 2 })] }) })) : (_jsx("p", { className: "text-xs text-slate-500 text-center py-8", children: "Sem dados para este projeto." })), evolucao && evolucaoFormatada.length > 0 && (_jsxs("div", { className: "mt-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { className: "text-slate-400", children: "Faturamento total" }), _jsx("span", { className: "text-white font-medium", children: formatCurrency(evolucaoFormatada.reduce((s, r) => s + r.novoProjeto + r.recorrente, 0)) })] }), _jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { className: "text-slate-400", children: "Meses com faturamento" }), _jsx("span", { className: "text-white font-medium", children: evolucaoFormatada.length })] })] }))] })] }))] })] }));
}
function KpiCard({ icon, label, value, sub }) {
    return (_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0", children: icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs text-slate-400 truncate", children: label }), _jsx("p", { className: "text-lg font-bold text-white leading-tight", children: value }), _jsx("p", { className: "text-xs text-slate-500", children: sub })] })] }));
}
