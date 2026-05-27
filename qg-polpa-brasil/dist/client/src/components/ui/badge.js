import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function Badge({ className, variant = "default", ...props }) {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
    };
    return (_jsx("div", { className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className), ...props }));
}
export { Badge };
