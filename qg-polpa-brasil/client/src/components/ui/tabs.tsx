import type { ElementType } from "react"
import { cn } from "@/lib/utils"

export interface TabItem<T extends string = string> {
  value: T
  label: string
  icon?: ElementType
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string = string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn("inline-flex items-center gap-1 bg-background/60 border border-border rounded-lg p-0.5", className)}>
      {tabs.map(tab => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
