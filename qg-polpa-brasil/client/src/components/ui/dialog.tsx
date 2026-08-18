import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

// Renderizado via portal direto em document.body: garante que o modal fique sempre
// centralizado e cubra a viewport inteira, mesmo quando aberto a partir de um
// componente aninhado dentro de containers com scroll/overflow (ex.: dentro de uma
// tabela) — nesses casos, position:fixed sem portal pode ficar contido pelo ancestral
// em vez do viewport, cortando ou deslocando o conteúdo do modal.
const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      {children}
    </div>,
    document.body
  )
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onOpenChange?: (v: boolean) => void }>(
  ({ className, children, onOpenChange, ...props }, ref) => (
    <div ref={ref} className={cn("relative z-50 w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl", className)} {...props}>
      {children}
    </div>
  )
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
)

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
