import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, X, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
  placeholder?: string
  className?: string
  searchable?: boolean
  renderExpand?: (option: string) => React.ReactNode
}

export default function MultiSelect({ options, selected, onChange, placeholder = "Selecionar...", className, searchable, renderExpand }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState("")
  const [expandido, setExpandido] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (!open) { setBusca(""); setExpandido(null) }
  }, [open])

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  const showSearch = searchable ?? options.length > 8
  const filteredOptions = showSearch && busca.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(busca.trim().toLowerCase()))
    : options

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
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[220px] max-h-72 rounded-lg border border-border bg-card shadow-xl flex flex-col">
          {showSearch && (
            <div className="relative shrink-0 p-1.5 border-b border-border">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-7 pl-7 pr-2 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
          )}
          <div className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">{options.length === 0 ? "Sem opções" : "Nenhum resultado"}</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt)
                const isExpandido = expandido === opt
                return (
                  <div key={opt}>
                    <div className="flex items-center w-full">
                      <button
                        type="button"
                        onClick={() => toggle(opt)}
                        className="flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                      >
                        <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-border")}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                      {renderExpand && (
                        <button
                          type="button"
                          onClick={() => setExpandido((v) => (v === opt ? null : opt))}
                          className="shrink-0 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver produtos do grupo"
                        >
                          <ChevronRight className={cn("w-3 h-3 transition-transform", isExpandido && "rotate-90")} />
                        </button>
                      )}
                    </div>
                    {renderExpand && isExpandido && (
                      <div className="pl-8 pr-3 pb-1.5">{renderExpand(opt)}</div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
