import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const Dialog = ({ open, onOpenChange, children }) => {
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "fixed inset-0 bg-slate-950/70 backdrop-blur-sm", onClick: () => onOpenChange?.(false) }), children] }));
};
const DialogContent = React.forwardRef(({ className, children, onOpenChange, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("relative z-50 w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl", className), ...props, children: children })));
DialogContent.displayName = "DialogContent";
const DialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col space-y-1.5 mb-4", className), ...props }));
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h2", { ref: ref, className: cn("text-lg font-semibold leading-none tracking-tight", className), ...props })));
DialogTitle.displayName = "DialogTitle";
export { Dialog, DialogContent, DialogHeader, DialogTitle };
