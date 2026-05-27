import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
const SelectContext = React.createContext({
    open: false, setOpen: () => { }
});
function Select({ value, onValueChange, children }) {
    const [open, setOpen] = React.useState(false);
    return (_jsx(SelectContext.Provider, { value: { value, onValueChange, open, setOpen }, children: _jsx("div", { className: "relative", children: children }) }));
}
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext);
    return (_jsxs("button", { ref: ref, type: "button", onClick: () => setOpen(!open), className: cn("flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50", className), ...props, children: [children, _jsx(ChevronDown, { className: cn("h-4 w-4 opacity-50 transition-transform ml-1", open && "rotate-180") })] }));
});
SelectTrigger.displayName = "SelectTrigger";
function SelectValue({ placeholder }) {
    const { value } = React.useContext(SelectContext);
    return _jsx("span", { children: value || _jsx("span", { className: "text-muted-foreground", children: placeholder }) });
}
function SelectContent({ children, className }) {
    const { open, setOpen } = React.useContext(SelectContext);
    const ref = React.useRef(null);
    React.useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        if (open)
            document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, setOpen]);
    if (!open)
        return null;
    return (_jsx("div", { ref: ref, className: cn("absolute top-full mt-1 z-50 min-w-[8rem] max-h-60 overflow-auto rounded-md border border-border bg-card p-1 shadow-xl", className), children: children }));
}
function SelectItem({ value, children, className }) {
    const { onValueChange, setOpen, value: selected } = React.useContext(SelectContext);
    return (_jsx("div", { role: "option", onClick: () => { onValueChange?.(value); setOpen(false); }, className: cn("relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent transition-colors", selected === value && "bg-accent font-medium", className), children: children }));
}
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
