import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, Calendar } from "lucide-react";
import MultiSelect from "@/components/MultiSelect";
const MESES = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Fev" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Abr" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Ago" },
    { value: "09", label: "Set" },
    { value: "10", label: "Out" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dez" },
];
const ANOS = ["2024", "2025", "2026", "2027"];
const TIPOS_RECEITA = [
    { value: "VENDA_FIRME", label: "Venda Firme" },
    { value: "FORECAST", label: "Forecast" },
    { value: "NOVO_PROJETO", label: "Novo Projeto" },
];
const ATALHOS = [
    { label: "2026", get: () => ({ dataInicio: "2026-01-01", dataFim: "2026-12-31" }) },
    { label: "2025", get: () => ({ dataInicio: "2025-01-01", dataFim: "2025-12-31" }) },
    { label: "1º Sem 2026", get: () => ({ dataInicio: "2026-01-01", dataFim: "2026-06-30" }) },
    { label: "2º Sem 2026", get: () => ({ dataInicio: "2026-07-01", dataFim: "2026-12-31" }) },
    {
        label: "Próx. 3 meses",
        get: () => {
            const now = new Date();
            const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
            const fim = new Date(now.getFullYear(), now.getMonth() + 3, 0);
            return { dataInicio: inicio.toISOString().split("T")[0], dataFim: fim.toISOString().split("T")[0] };
        },
    },
];
function ultimoDia(ano, mes) {
    return new Date(parseInt(ano), parseInt(mes), 0).getDate();
}
function parseMesAno(iso) {
    if (!iso)
        return { mes: "", ano: "" };
    const parts = iso.split("-");
    return { ano: parts[0] ?? "", mes: parts[1] ?? "" };
}
function labelPeriodo(filtros) {
    const mesNome = (iso) => MESES.find((x) => x.value === iso?.split("-")[1])?.label ?? "";
    const anoStr = (iso) => iso?.split("-")[0] ?? "";
    if (filtros.dataInicio && filtros.dataFim) {
        const ai = anoStr(filtros.dataInicio);
        const af = anoStr(filtros.dataFim);
        if (ai === af && filtros.dataInicio === `${ai}-01-01` && filtros.dataFim === `${af}-12-31`)
            return `Ano ${ai}`;
        return `${mesNome(filtros.dataInicio)}/${ai.slice(2)} – ${mesNome(filtros.dataFim)}/${af.slice(2)}`;
    }
    return "Período";
}
// ─── Seletor de período por meses (estilo Excel) ─────────────────────────────
function PeriodoPicker({ filtros, onChange }) {
    const [open, setOpen] = useState(false);
    const [ano, setAno] = useState(() => filtros.dataInicio?.split("-")[0] ?? "2026");
    const ref = useRef(null);
    // Meses selecionados no estado interno (antes de confirmar)
    const mesesSelecionados = () => {
        const ini = filtros.dataInicio;
        const fim2 = filtros.dataFim;
        if (!ini || !fim2)
            return MESES.map(m => m.value);
        const anoIni = ini.split("-")[0];
        const anoFim = fim2.split("-")[0];
        if (anoIni !== anoFim || anoIni !== ano)
            return MESES.map(m => m.value);
        return MESES.filter(m => {
            const cur = `${ano}-${m.value}`;
            return cur >= ini.slice(0, 7) && cur <= fim2.slice(0, 7);
        }).map(m => m.value);
    };
    const [selecionados, setSelecionados] = useState(mesesSelecionados);
    useEffect(() => { setSelecionados(mesesSelecionados()); }, [filtros.dataInicio, filtros.dataFim, ano]);
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    const todosSelecionados = selecionados.length === MESES.length;
    function toggleTodos() {
        setSelecionados(todosSelecionados ? [] : MESES.map(m => m.value));
    }
    function toggleMes(mes) {
        setSelecionados(prev => prev.includes(mes) ? prev.filter(m => m !== mes) : [...prev, mes].sort());
    }
    function aplicar() {
        if (selecionados.length === 0)
            return;
        const sorted = [...selecionados].sort();
        const ini = sorted[0];
        const fim2 = sorted[sorted.length - 1];
        const dia = ultimoDia(ano, fim2);
        onChange({ ...filtros, dataInicio: `${ano}-${ini}-01`, dataFim: `${ano}-${fim2}-${String(dia).padStart(2, "0")}` });
        setOpen(false);
    }
    const label = labelPeriodo(filtros);
    return (_jsxs("div", { className: "relative", ref: ref, children: [_jsxs("button", { onClick: () => setOpen(o => !o), className: "flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors", children: [_jsx(Calendar, { className: "w-3.5 h-3.5 shrink-0" }), _jsx("span", { children: label })] }), open && (_jsxs("div", { className: "absolute top-9 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl w-[200px] overflow-hidden", children: [_jsx("div", { className: "flex border-b border-border", children: ANOS.map(a => (_jsx("button", { onClick: () => setAno(a), className: `flex-1 text-[10px] font-semibold py-1.5 transition-colors ${ano === a ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`, children: a }, a))) }), _jsxs("div", { className: "py-1", children: [_jsxs("label", { className: "flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: todosSelecionados, onChange: toggleTodos, className: "w-3.5 h-3.5 accent-primary" }), _jsx("span", { className: "text-xs text-foreground font-medium", children: "Selecionar tudo" })] }), _jsx("div", { className: "h-px bg-border mx-2 my-1" }), MESES.map(m => (_jsxs("label", { className: "flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selecionados.includes(m.value), onChange: () => toggleMes(m.value), className: "w-3.5 h-3.5 accent-primary" }), _jsxs("span", { className: "text-xs text-foreground", children: [m.label, "/", ano.slice(2)] })] }, m.value)))] }), _jsx("div", { className: "border-t border-border p-2", children: _jsx("button", { onClick: aplicar, disabled: selecionados.length === 0, className: "w-full text-xs py-1.5 rounded-md bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-colors disabled:opacity-40", children: "OK" }) })] }))] }));
}
// ─── Componente principal ────────────────────────────────────────────────────
export default function FiltrosGlobais({ filtros, onChange, showTipoReceita = true }) {
    const { data: disponiveis } = trpc.filtros.disponiveis.useQuery();
    const limpar = () => onChange({ dataInicio: "2026-01-01", dataFim: "2026-12-31" });
    const temFiltrosExtras = Object.entries(filtros).some(([k, v]) => {
        if (k === "codParc" || k === "dataInicio" || k === "dataFim" || k === "codProduto" || k === "uf")
            return false;
        if (Array.isArray(v))
            return v.length > 0;
        return v !== undefined && v !== "";
    });
    const temFiltros = temFiltrosExtras ||
        filtros.dataInicio !== "2026-01-01" ||
        filtros.dataFim !== "2026-12-31";
    const isAtalhoAtivo = (atalho) => {
        const { dataInicio, dataFim } = atalho.get();
        return filtros.dataInicio === dataInicio && filtros.dataFim === dataFim;
    };
    const aplicarAtalho = (atalho) => {
        const { dataInicio, dataFim } = atalho.get();
        if (isAtalhoAtivo(atalho)) {
            onChange({ ...filtros, dataInicio: "2026-01-01", dataFim: "2026-12-31" });
        }
        else {
            onChange({ ...filtros, dataInicio, dataFim });
        }
    };
    const periodo = labelPeriodo(filtros);
    return (_jsxs("div", { className: "rounded-xl border border-border bg-card px-4 py-3 space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(SlidersHorizontal, { className: "w-3.5 h-3.5 text-muted-foreground" }), _jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-widest", children: "Filtros" }), _jsx("span", { className: "text-xs text-muted-foreground/50", children: "\u00B7 Previs\u00E3o de Entrega (Embarque)" }), periodo && periodo !== "Período" && (_jsx("span", { className: "ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium", children: periodo })), temFiltros && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: limpar, className: "ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2", children: [_jsx(X, { className: "w-3 h-3" }), "Limpar filtros"] }))] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(MultiSelect, { options: (disponiveis?.mercados ?? []).filter(Boolean), selected: filtros.mercados ?? [], onChange: (vals) => onChange({ ...filtros, mercados: vals, mercado: vals[0] }), placeholder: "Todos os mercados", className: "flex-1 min-w-[130px] max-w-[200px]" }), _jsx(MultiSelect, { options: (disponiveis?.vendedores ?? []).filter(Boolean), selected: filtros.vendedores ?? [], onChange: (vals) => onChange({ ...filtros, vendedores: vals, vendedor: vals[0] }), placeholder: "Todos os vendedores", className: "flex-1 min-w-[140px] max-w-[210px]" }), _jsx(MultiSelect, { options: (disponiveis?.projetos ?? []).filter(Boolean), selected: filtros.projetos ?? [], onChange: (vals) => onChange({ ...filtros, projetos: vals, projeto: vals[0] }), placeholder: "Todos os projetos", className: "flex-1 min-w-[130px] max-w-[190px]" }), _jsx(MultiSelect, { options: (disponiveis?.grupos ?? []).filter(Boolean), selected: filtros.gruposProduto ?? [], onChange: (vals) => onChange({ ...filtros, gruposProduto: vals, grupoProduto: vals[0] }), placeholder: "Todos os grupos", className: "flex-1 min-w-[130px] max-w-[190px]" }), showTipoReceita && (_jsx(MultiSelect, { options: TIPOS_RECEITA.map((t) => t.label), selected: (filtros.tiposReceita ?? []).map((v) => TIPOS_RECEITA.find((t) => t.value === v)?.label ?? v), onChange: (labels) => {
                            const vals = labels.map((l) => TIPOS_RECEITA.find((t) => t.label === l)?.value ?? l);
                            onChange({ ...filtros, tiposReceita: vals, tipoReceita: vals[0] });
                        }, placeholder: "Todos os tipos", className: "flex-1 min-w-[120px] max-w-[170px]" }))] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("div", { className: "flex items-center gap-1.5 flex-wrap", children: ATALHOS.map((atalho) => (_jsx("button", { onClick: () => aplicarAtalho(atalho), className: `h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${isAtalhoAtivo(atalho)
                                ? "bg-primary/20 border-primary/50 text-primary"
                                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent"}`, children: atalho.label }, atalho.label))) }), _jsx("div", { className: "w-px h-5 bg-border/60 mx-1 shrink-0" }), _jsx(PeriodoPicker, { filtros: filtros, onChange: onChange })] })] }));
}
