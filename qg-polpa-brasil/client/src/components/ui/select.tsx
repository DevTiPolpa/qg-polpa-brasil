import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const SelectContext = React.createContext<{ value?: string; onValueChange?: (v: string) => void; open: boolean; setOpen: (v: boolean) => void }>({
  open: false, setOpen: () => {}
})

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn("flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform ml-1", open && "rotate-180")} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || <span className="text-muted-foreground">{placeholder}</span>}</span>
}

function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = React.useContext(SelectContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, setOpen])

  if (!open) return null
  return (
    <div ref={ref} className={cn("absolute top-full mt-1 z-50 min-w-[8rem] max-h-60 overflow-auto rounded-md border border-border bg-card p-1 shadow-xl", className)}>
      {children}
    </div>
  )
}

function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { onValueChange, setOpen, value: selected } = React.useContext(SelectContext)
  return (
    <div
      role="option"
      onClick={() => { onValueChange?.(value); setOpen(false) }}
      className={cn("relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent transition-colors", selected === value && "bg-accent font-medium", className)}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
