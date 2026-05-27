import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
export default function MultiSelect({ options, selected, onChange, placeholder = "Selecionar...", className }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);
    const toggle = (val) => {
        onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
    };
    const label = selected.length === 0
        ? placeholder
        : selected.length === 1
            ? selected[0]
            : `${selected.length} selecionados`;
    return (_jsxs("div", { ref: ref, className: cn("relative", className), children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), className: "flex items-center justify-between w-full h-7 px-2.5 rounded-md border border-border bg-background text-xs text-foreground gap-1.5 hover:bg-accent transition-colors", children: [_jsx("span", { className: cn("truncate", selected.length === 0 && "text-muted-foreground"), children: label }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [selected.length > 0 && (_jsx("button", { type: "button", onClick: (e) => { e.stopPropagation(); onChange([]); }, className: "text-muted-foreground hover:text-foreground transition-colors", children: _jsx(X, { className: "w-3 h-3" }) })), _jsx(ChevronDown, { className: cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180") })] })] }), open && (_jsx("div", { className: "absolute top-full mt-1 left-0 z-50 min-w-[180px] max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl", children: options.length === 0 ? (_jsx("p", { className: "px-3 py-2 text-xs text-muted-foreground", children: "Sem op\u00E7\u00F5es" })) : (options.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (_jsxs("button", { type: "button", onClick: () => toggle(opt), className: "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors", children: [_jsx("div", { className: cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-border"), children: isSelected && _jsx(Check, { className: "w-2.5 h-2.5 text-primary-foreground" }) }), _jsx("span", { className: "truncate", children: opt })] }, opt));
                })) }))] }));
}
