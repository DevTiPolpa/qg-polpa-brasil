import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { trpc } from '../lib/trpc';
import FiltrosGlobais from '../components/FiltrosGlobais';
import { formatCurrency, formatNumber, formatKg, formatMes } from '../lib/utils';
import { TAILWIND, BORDER_L_COLOR } from '../lib/colors';
import { ChevronRight, ChevronDown, ExternalLink, Target, DollarSign } from 'lucide-react';
function ClienteRow({ c, selected, filtros }) {
    const [expanded, setExpanded] = useState(false);
    const { data: mix } = trpc.clientes.mix.useQuery({ codParc: c.codParc, filtros }, { enabled: expanded });
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { className: "hover:bg-slate-700/30 transition-colors cursor-pointer", onClick: () => setExpanded(e => !e), children: [_jsx("td", { className: "px-2 py-2 text-white font-medium", children: _jsxs("span", { className: "flex items-center gap-1", children: [expanded ? _jsx(ChevronDown, { className: "w-3 h-3 shrink-0 text-slate-400" }) : _jsx(ChevronRight, { className: "w-3 h-3 shrink-0 text-slate-400" }), _jsx("span", { className: "truncate", children: c.razaoSocial ?? `Cliente ${c.codParc}` })] }) }), _jsx("td", { className: "px-2 py-2 text-slate-400 uppercase text-[10px]", children: _jsx("span", { className: "block truncate", children: c.perfilParceiro ?? '—' }) }), _jsx("td", { className: "px-2 py-2 text-slate-400 text-center", children: c.uf ?? '—' }), !selected && _jsx("td", { className: "px-2 py-2 text-slate-300", children: _jsx("span", { className: "block truncate", children: c.nomeVendedor ?? '—' }) }), _jsx("td", { className: "px-2 py-2 text-green-400 font-semibold text-right", children: formatCurrency(Number(c.faturamento)) }), _jsx("td", { className: "px-2 py-2 text-slate-400 text-right", children: Math.round(Number(c.volume)).toLocaleString('pt-BR') }), _jsx("td", { className: "px-2 py-2 text-slate-400 text-right", children: c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—' }), _jsx("td", { className: "px-2 py-2 text-right", children: _jsx("button", { className: "text-slate-500 hover:text-slate-300 transition-colors text-[10px] flex items-center gap-0.5 ml-auto", children: _jsx(ExternalLink, { className: "w-3 h-3" }) }) })] }), expanded && (mix ?? []).map((p) => (_jsxs("tr", { className: "bg-slate-900/60 border-l-2 border-l-slate-600", children: [_jsx("td", { className: "pl-7 pr-2 py-1.5 text-slate-300 text-[11px]", children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" }), _jsx("span", { className: "truncate", children: p.nomeProduto ?? `Produto ${p.codProduto}` })] }) }), _jsx("td", { className: "px-2 py-1.5 text-slate-500 text-[10px] uppercase", children: _jsx("span", { className: "block truncate", children: p.grupoProduto ?? '—' }) }), _jsx("td", { className: "px-2 py-1.5" }), !selected && _jsx("td", { className: "px-2 py-1.5" }), _jsx("td", { className: "px-2 py-1.5 text-green-500/80 text-[11px] text-right", children: formatCurrency(Number(p.faturamento)) }), _jsx("td", { className: "px-2 py-1.5 text-slate-500 text-[11px] text-right", children: Math.round(Number(p.volume)).toLocaleString('pt-BR') }), _jsx("td", { className: "px-2 py-1.5 text-slate-500 text-[11px] text-right", children: p.ultimaCompra ? new Date(p.ultimaCompra).toLocaleDateString('pt-BR') : '—' }), _jsx("td", { className: "px-2 py-1.5" })] }, p.codProduto)))] }));
}
const DEFAULT_FILTROS = { dataInicio: '2026-01-01', dataFim: '2026-12-31' };
export default function Vendedores() {
    const [filtros, setFiltros] = useState(DEFAULT_FILTROS);
    const [selected, setSelected] = useState(null);
    const [tipoAtivo, setTipoAtivo] = useState(null);
    const [projetoAtivo, setProjetoAtivo] = useState(null);
    const filtrosComTipo = (() => {
        let f = filtros;
        if (tipoAtivo)
            f = { ...f, tiposReceita: [tipoAtivo], tipoReceita: tipoAtivo };
        if (projetoAtivo)
            f = { ...f, projetos: [projetoAtivo], projeto: projetoAtivo };
        return f;
    })();
    // Quando um vendedor está selecionado, os cards KPI refletem apenas esse vendedor
    const filtrosKpi = selected
        ? { ...filtrosComTipo, vendedores: [selected], vendedor: selected }
        : filtrosComTipo;
    const { data: kpisTipo } = trpc.dashboard.kpisPorTipo.useQuery(filtrosKpi);
    const { data: kpisAnt } = trpc.dashboard.kpisAnoAnterior.useQuery(filtrosKpi);
    // Filtros para metas: projeto, mercado e vendedor (metas não têm tipoReceita)
    const filtrosMeta = {
        projetos: projetoAtivo ? [projetoAtivo] : filtros.projetos,
        mercados: filtros.mercados,
        vendedores: selected ? [selected] : filtros.vendedores,
    };
    const { data: metasRaw } = trpc.vendedores.metas.useQuery(filtrosMeta);
    const { data: lista } = trpc.vendedores.lista.useQuery(filtrosComTipo);
    const { data: projetos } = trpc.vendedores.projetos.useQuery({ filtros: filtrosComTipo, nomeVendedor: selected ?? undefined });
    const { data: evolucaoConsolidada } = trpc.vendedores.evolucaoConsolidada.useQuery(filtrosComTipo, { enabled: !selected });
    const { data: clientesConsolidados } = trpc.vendedores.clientesConsolidados.useQuery(filtrosComTipo, { enabled: !selected });
    const { data: evolucaoVendedor } = trpc.vendedores.evolucao.useQuery({ nomeVendedor: selected, filtros: filtrosComTipo }, { enabled: !!selected });
    const { data: clientesVendedor } = trpc.vendedores.clientes.useQuery({ nomeVendedor: selected, filtros: filtrosComTipo }, { enabled: !!selected });
    // Metas: filtrar pelo período selecionado (projeto/mercado já vêm filtrados do servidor)
    const metasPorVendedor = useMemo(() => {
        const map = {};
        for (const m of metasRaw ?? []) {
            const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null;
            const fim = filtros.dataFim ? filtros.dataFim.slice(0, 7) : null;
            if (ini && m.mes < ini)
                continue;
            if (fim && m.mes > fim)
                continue;
            map[m.nomeVendedor] = (map[m.nomeVendedor] ?? 0) + Number(m.valorMeta);
        }
        return map;
    }, [metasRaw, filtros.dataInicio, filtros.dataFim]);
    const metasPorMes = useMemo(() => {
        const map = {};
        for (const m of metasRaw ?? []) {
            const ini = filtros.dataInicio ? filtros.dataInicio.slice(0, 7) : null;
            const fim = filtros.dataFim ? filtros.dataFim.slice(0, 7) : null;
            if (ini && m.mes < ini)
                continue;
            if (fim && m.mes > fim)
                continue;
            map[m.mes] = (map[m.mes] ?? 0) + Number(m.valorMeta);
        }
        return map;
    }, [metasRaw, filtros.dataInicio, filtros.dataFim]);
    const totalMeta = Object.values(metasPorVendedor).reduce((s, v) => s + v, 0);
    const totalFat = selected
        ? Number((lista ?? []).find(v => v.nomeVendedor === selected)?.faturamento ?? 0)
        : (lista ?? []).reduce((s, v) => s + Number(v.faturamento), 0);
    const totalProj = (projetos ?? []).reduce((s, p) => s + Number(p.faturamento), 0);
    const kpiVendaFirme = kpisTipo?.find(k => k.tipoReceita === 'VENDA_FIRME');
    const kpiForecast = kpisTipo?.find(k => k.tipoReceita === 'FORECAST');
    const kpiNovoProjeto = kpisTipo?.find(k => k.tipoReceita === 'NOVO_PROJETO');
    const evolucao = selected ? evolucaoVendedor : evolucaoConsolidada;
    const clientes = selected ? clientesVendedor : clientesConsolidados;
    const tituloEvolucao = selected ? `Evolução — ${selected}` : 'Evolução Consolidada — Todos os Vendedores';
    const tituloClientes = selected ? `Clientes — ${selected}` : 'Top Clientes — Todos os Vendedores';
    // Mede a altura da coluna esquerda e aplica como maxHeight na coluna direita
    // para que o bottom do Top Clientes alinhe com o bottom do Representatividade
    const leftColRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(undefined);
    useEffect(() => {
        const el = leftColRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver(() => setLeftColHeight(el.getBoundingClientRect().height));
        ro.observe(el);
        setLeftColHeight(el.getBoundingClientRect().height);
        return () => ro.disconnect();
    }, []);
    const DEFAULT_FILTROS_OBJ = DEFAULT_FILTROS;
    const temFiltrosGlobais = filtros.dataInicio !== DEFAULT_FILTROS_OBJ.dataInicio ||
        filtros.dataFim !== DEFAULT_FILTROS_OBJ.dataFim ||
        (filtros.mercados?.length ?? 0) > 0 ||
        (filtros.vendedores?.length ?? 0) > 0 ||
        (filtros.projetos?.length ?? 0) > 0 ||
        (filtros.gruposProduto?.length ?? 0) > 0 ||
        (filtros.tiposReceita?.length ?? 0) > 0;
    const temQualquerFiltro = temFiltrosGlobais || !!tipoAtivo || !!projetoAtivo || !!selected;
    const limparTudo = () => {
        setFiltros(DEFAULT_FILTROS);
        setTipoAtivo(null);
        setProjetoAtivo(null);
        setSelected(null);
    };
    // Badges dos filtros ativos
    const badges = [];
    if (selected)
        badges.push({ label: `Vendedor: ${selected.replace(/^\d+ - /, '')}`, onRemove: () => setSelected(null) });
    if (tipoAtivo) {
        const labels = { VENDA_FIRME: 'Venda Firme', FORECAST: 'Forecast', NOVO_PROJETO: 'Novo Projeto' };
        badges.push({ label: `Tipo: ${labels[tipoAtivo] ?? tipoAtivo}`, onRemove: () => setTipoAtivo(null) });
    }
    if (projetoAtivo)
        badges.push({ label: `Projeto: ${projetoAtivo}`, onRemove: () => setProjetoAtivo(null) });
    (filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }));
    (filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }));
    (filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }));
    (filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }));
    (filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }));
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "An\u00E1lise por Vendedor" }), _jsx("p", { className: "text-slate-400 text-sm mt-0.5", children: "Performance individual, carteira de clientes e evolu\u00E7\u00E3o" })] }), _jsx(FiltrosGlobais, { filtros: filtros, onChange: setFiltros }), temQualquerFiltro && (_jsxs("div", { className: "flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0", children: "Filtros ativos" }), _jsx("div", { className: "flex items-center gap-1.5 flex-wrap flex-1", children: badges.map((b, i) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-[11px] text-slate-200", children: [b.label, _jsx("button", { onClick: b.onRemove, className: "text-slate-400 hover:text-white ml-0.5 leading-none", children: "\u00D7" })] }, i))) }), _jsx("button", { onClick: limparTudo, className: "shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1", children: "Limpar tudo" })] })), _jsxs("div", { className: "grid grid-cols-5 gap-4", children: [(() => {
                        const fatAtual = totalFat;
                        const fatAnt = Number(kpisAnt?.faturamentoTotal ?? 0);
                        const pct = fatAnt > 0 ? ((fatAtual - fatAnt) / fatAnt) * 100 : null;
                        const positivo = pct != null && pct >= 0;
                        return (_jsxs("div", { className: "text-left rounded-xl border border-l-4 border-l-green-500 bg-slate-800 px-5 py-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "Faturamento" }), _jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-500/15", children: _jsx(DollarSign, { className: "w-3.5 h-3.5 text-green-400" }) })] }), _jsx("p", { className: "text-xl font-bold text-white leading-none", children: formatCurrency(fatAtual) }), pct != null && (_jsx("div", { className: "mt-1.5", children: _jsxs("span", { className: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${positivo ? 'text-green-400 bg-green-500/12' : 'text-red-400 bg-red-500/12'}`, children: [positivo ? '↑' : '↓', " ", Math.abs(pct).toFixed(1), "%"] }) }))] }));
                    })(), [
                        { key: 'VENDA_FIRME', label: 'Venda Firme', kpi: kpiVendaFirme },
                        { key: 'FORECAST', label: 'Forecast', kpi: kpiForecast },
                        { key: 'NOVO_PROJETO', label: 'Novo Projeto', kpi: kpiNovoProjeto },
                    ].map(({ key, label, kpi }) => {
                        const isActive = tipoAtivo === key;
                        return (_jsxs("button", { onClick: () => setTipoAtivo(isActive ? null : key), className: `text-left rounded-xl border border-l-4 ${BORDER_L_COLOR[key]} bg-slate-800 px-5 py-5 transition-all duration-150 ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-white/20 shadow-lg' : 'hover:bg-slate-700/60 cursor-pointer'}`, children: [_jsxs("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3", children: [label, isActive && _jsx("span", { className: `ml-1.5 ${TAILWIND[key].text}`, children: "\u25CF" })] }), _jsx("p", { className: "text-xl font-bold text-white leading-none", children: formatCurrency(Number(kpi?.faturamento ?? 0)) }), _jsxs("p", { className: "text-xs text-slate-500 mt-1.5", children: [formatKg(Number(kpi?.volume ?? 0)), " \u00B7 ", formatNumber(Number(kpi?.clientes ?? 0), 0), " clientes"] })] }, key));
                    }), _jsxs("div", { className: "text-left rounded-xl border border-l-4 border-l-orange-500 bg-slate-800 px-5 py-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Target, { className: "w-3.5 h-3.5 text-orange-400" }), _jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "Meta 2026" })] }), _jsx("p", { className: "text-xl font-bold text-white leading-none", children: formatCurrency(totalMeta) }), totalMeta > 0 && totalFat > 0 && (_jsxs("div", { className: "mt-1.5 space-y-0.5", children: [_jsxs("span", { className: `text-xs ${totalFat >= totalMeta ? 'text-green-400' : 'text-orange-400'}`, children: [((totalFat / totalMeta) * 100).toFixed(1), "% atingido"] }), totalFat < totalMeta && (_jsxs("p", { className: "text-xs text-slate-500", children: ["Faltam ", _jsx("span", { className: "text-slate-300", children: formatCurrency(totalMeta - totalFat) })] }))] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch", children: [_jsxs("div", { ref: leftColRef, className: "lg:col-span-2 flex flex-col gap-4", children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-slate-700", children: _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Resultado Vendedores" }), _jsxs("div", { className: "flex items-center gap-3 text-[11px] text-slate-400", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `w-2 h-2 rounded-sm inline-block ${TAILWIND.VENDA_FIRME.bg}` }), "Venda Firme"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `w-2 h-2 rounded-sm inline-block ${TAILWIND.FORECAST.bg}` }), "Forecast"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `w-2 h-2 rounded-sm inline-block ${TAILWIND.NOVO_PROJETO.bg}` }), "Novo Projeto"] })] })] }) }), _jsx("div", { className: "flex flex-col gap-3 p-3", children: (lista ?? []).map(v => {
                                            const pct = totalFat > 0 ? (Number(v.faturamento) / totalFat) * 100 : 0;
                                            const base = Math.max(Number(v.faturamento), 1);
                                            const pVF = (Number(v.vendaFirme) / base) * 100;
                                            const pFC = (Number(v.forecast) / base) * 100;
                                            const pNP = (Number(v.novoProjeto) / base) * 100;
                                            const isSelected = selected === v.nomeVendedor;
                                            return (_jsxs("button", { onClick: () => setSelected(isSelected ? null : v.nomeVendedor), className: `w-full text-left px-4 py-4 hover:bg-slate-700/40 transition-colors group rounded-lg ${isSelected ? 'bg-green-900/20 border border-green-600/50 border-l-4 border-l-green-500' : 'border-2 border-slate-600'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2.5", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-white truncate leading-tight", children: v.nomeVendedor ?? 'Sem vendedor' }), _jsxs("p", { className: "text-xs text-slate-400 mt-0.5", children: [v.clientes, " clientes"] })] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0 ml-2", children: [_jsx("p", { className: "text-sm font-bold text-white", children: formatCurrency(Number(v.faturamento)) }), _jsx(ChevronRight, { className: "w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" })] })] }), _jsxs("div", { className: "relative mb-2 group/bar", children: [_jsxs("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden flex", children: [_jsx("div", { className: `h-full transition-all ${TAILWIND.VENDA_FIRME.bg}`, style: { width: `${pVF}%` } }), _jsx("div", { className: `h-full transition-all ${TAILWIND.FORECAST.bg}`, style: { width: `${pFC}%` } }), _jsx("div", { className: `h-full transition-all ${TAILWIND.NOVO_PROJETO.bg}`, style: { width: `${pNP}%` } })] }), _jsxs("div", { className: "pointer-events-none absolute top-full left-0 mt-1.5 hidden group-hover/bar:flex flex-col gap-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 z-50 shadow-xl min-w-[180px] text-[11px]", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-slate-300", children: [_jsx("span", { className: `w-2 h-2 rounded-sm ${TAILWIND.VENDA_FIRME.bg}` }), "Venda Firme"] }), _jsx("span", { className: "text-white font-semibold", children: formatCurrency(Number(v.vendaFirme)) })] }), _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-slate-300", children: [_jsx("span", { className: `w-2 h-2 rounded-sm ${TAILWIND.FORECAST.bg}` }), "Forecast"] }), _jsx("span", { className: "text-white font-semibold", children: formatCurrency(Number(v.forecast)) })] }), _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-slate-300", children: [_jsx("span", { className: `w-2 h-2 rounded-sm ${TAILWIND.NOVO_PROJETO.bg}` }), "Novo Projeto"] }), _jsx("span", { className: "text-white font-semibold", children: formatCurrency(Number(v.novoProjeto)) })] })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 text-[11px] text-slate-500", children: [_jsxs("span", { children: [pct.toFixed(1), "% do total"] }), _jsx("span", { children: "\u00B7" }), _jsx("span", { children: formatKg(Number(v.volume)) })] }), metasPorVendedor[v.nomeVendedor ?? ''] != null && (() => {
                                                        const meta = metasPorVendedor[v.nomeVendedor ?? ''];
                                                        const fat = Number(v.faturamento);
                                                        const pctMeta = meta > 0 ? Math.min((fat / meta) * 100, 100) : 0;
                                                        const ratio = meta > 0 ? fat / meta : 0;
                                                        // Escala de cores: 0–40% vermelho, 40–70% amarelo, 70–100% verde
                                                        const barColor = (() => {
                                                            if (ratio < 0.4) {
                                                                // vermelho escuro → vermelho vivo
                                                                const t = ratio / 0.4;
                                                                const r = Math.round(180 + t * 55);
                                                                const g = Math.round(30 + t * 20);
                                                                return `rgb(${r},${g},30)`;
                                                            }
                                                            else if (ratio < 0.7) {
                                                                // vermelho → amarelo
                                                                const t = (ratio - 0.4) / 0.3;
                                                                const r = Math.round(235 - t * 10);
                                                                const g = Math.round(50 + t * 165);
                                                                return `rgb(${r},${g},20)`;
                                                            }
                                                            else {
                                                                // amarelo → verde
                                                                const t = (ratio - 0.7) / 0.3;
                                                                const r = Math.round(225 - t * 190);
                                                                const g = Math.round(215 + t * 40);
                                                                return `rgb(${r},${g},20)`;
                                                            }
                                                        })();
                                                        const textColor = ratio >= 1 ? 'text-green-400' : ratio >= 0.7 ? 'text-green-400' : ratio >= 0.4 ? 'text-yellow-400' : 'text-red-400';
                                                        return (_jsxs("div", { className: "mt-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-[10px] mb-0.5", children: [_jsxs("span", { className: "text-slate-500", children: ["Meta: ", formatCurrency(meta)] }), _jsxs("span", { className: textColor, children: [((fat / meta) * 100).toFixed(1), "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${pctMeta}%`, backgroundColor: barColor } }) })] }));
                                                    })()] }, v.nomeVendedor));
                                        }) })] }), _jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Representatividade \u2014 Projeto" }), projetoAtivo && (_jsx("button", { onClick: () => setProjetoAtivo(null), className: "text-[10px] text-slate-400 hover:text-white transition-colors", children: "Limpar filtro \u00D7" }))] }), _jsx("p", { className: "text-[11px] text-slate-500 mb-3", children: "Clique em uma barra para filtrar toda a tela" }), _jsx("div", { className: "space-y-3", children: (projetos ?? []).map(p => {
                                            const isAtivo = projetoAtivo === p.projeto;
                                            const isDimmed = projetoAtivo !== null && !isAtivo;
                                            const pct = totalProj > 0 ? (Number(p.faturamento) / totalProj) * 100 : 0;
                                            return (_jsxs("button", { onClick: () => setProjetoAtivo(isAtivo ? null : p.projeto), className: `w-full text-left transition-opacity ${isDimmed ? 'opacity-35' : 'opacity-100'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("span", { className: `text-[11px] font-semibold uppercase tracking-wide ${isAtivo ? 'text-green-400' : 'text-slate-300'}`, children: [p.projeto, isAtivo && _jsx("span", { className: "ml-1.5 text-green-500", children: "\u25CF" })] }), _jsxs("div", { className: "flex items-center gap-2 text-[11px] text-slate-400", children: [_jsxs("span", { children: [pct.toFixed(1), "%"] }), _jsx("span", { className: isAtivo ? 'text-white font-semibold' : '', children: formatCurrency(Number(p.faturamento)) })] })] }), _jsx("div", { className: "h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all ${isAtivo ? 'bg-green-400' : 'bg-green-600'}`, style: { width: `${pct}%` } }) })] }, p.projeto));
                                        }) })] })] }), _jsxs("div", { className: "lg:col-span-3 flex flex-col gap-4 overflow-hidden", style: leftColHeight ? { maxHeight: leftColHeight } : undefined, children: [_jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: tituloEvolucao }), !selected && _jsx("span", { className: "text-[11px] text-slate-500", children: "Clique em um vendedor para filtrar" })] }), _jsx(ResponsiveContainer, { width: "100%", height: 230, children: _jsxs(LineChart, { data: (evolucao ?? []).map(r => ({
                                                mes: formatMes(r.mes),
                                                Faturamento: Number(r.faturamento),
                                                Meta: metasPorMes[r.mes] ?? null,
                                            })), margin: { top: 10, right: 10, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#0f1d30", vertical: false }), _jsx(XAxis, { dataKey: "mes", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tickFormatter: v => `R$${(v / 1000).toFixed(0)}k`, tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false, width: 58 }), _jsx(Tooltip, { contentStyle: { background: '#0f1d30', border: '1px solid #1e3454', borderRadius: 8, fontSize: 12 }, formatter: (v, name) => [formatCurrency(v), name], labelStyle: { color: '#f8fafc', marginBottom: 4 }, itemStyle: { color: '#fff' } }), _jsx(Line, { type: "monotone", dataKey: "Faturamento", stroke: "#16a34a", strokeWidth: 2, dot: { fill: '#16a34a', r: 3, strokeWidth: 0 }, activeDot: { r: 5, fill: '#22c55e' } }), _jsx(Line, { type: "monotone", dataKey: "Meta", stroke: "#f97316", strokeWidth: 1.5, strokeDasharray: "5 4", dot: false, activeDot: { r: 4, fill: '#f97316' }, connectNulls: true })] }) }), _jsxs("div", { className: "flex items-center gap-3 mt-1", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-4 h-0.5 bg-green-500 inline-block rounded" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Faturamento" })] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-4 border-t border-dashed border-orange-500 inline-block" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Meta" })] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col bg-slate-800 border border-slate-700 rounded-xl overflow-hidden min-h-0", children: [_jsx("div", { className: "px-4 py-3 border-b border-slate-700 shrink-0", children: _jsx("p", { className: "text-sm font-semibold text-white", children: tituloClientes }) }), _jsx("div", { className: "flex-1 overflow-y-auto min-h-0", children: _jsxs("table", { className: "w-full table-fixed text-xs", children: [_jsxs("colgroup", { children: [_jsx("col", { className: "w-[22%]" }), _jsx("col", { className: "w-[13%]" }), _jsx("col", { className: "w-[6%]" }), !selected && _jsx("col", { className: "w-[13%]" }), _jsx("col", { className: "w-[14%]" }), _jsx("col", { className: "w-[12%]" }), _jsx("col", { className: "w-[11%]" }), _jsx("col", { className: "w-[9%]" })] }), _jsx("thead", { className: "sticky top-0 z-10 bg-slate-800", children: _jsxs("tr", { className: "border-b border-slate-700 text-slate-500", children: [_jsx("th", { className: "text-left px-2 py-2 font-medium", children: "Cliente" }), _jsx("th", { className: "text-left px-2 py-2 font-medium", children: "Segmento" }), _jsx("th", { className: "text-left px-2 py-2 font-medium", children: "UF" }), !selected && _jsx("th", { className: "text-left px-2 py-2 font-medium", children: "Vendedor" }), _jsx("th", { className: "text-right px-2 py-2 font-medium", children: "Faturamento" }), _jsx("th", { className: "text-right px-2 py-2 font-medium", children: "Volume" }), _jsx("th", { className: "text-right px-2 py-2 font-medium", children: "\u00DAlt. Compra" }), _jsx("th", { className: "text-right px-2 py-2 font-medium", children: "A\u00E7\u00E3o" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-700/40", children: (clientes ?? []).map((c, i) => (_jsx(ClienteRow, { c: c, selected: selected, filtros: filtrosComTipo }, `${c.codParc}-${i}`))) })] }) })] })] })] })] }));
}
