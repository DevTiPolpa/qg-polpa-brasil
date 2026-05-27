import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
  placeholder?: string
  className?: string
}

export default function MultiSelect({ options, selected, onChange, placeholder = "Selecionar...", className }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selecionados`

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full h-7 px-2.5 rounded-md border border-border bg-background text-xs text-foreground gap-1.5 hover:bg-accent transition-colors"
      >
        <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[180px] max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Sem opções</p>
          ) : (
            options.map((opt) => {
              const isSelected = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                >
                  <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-border")}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{opt}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
