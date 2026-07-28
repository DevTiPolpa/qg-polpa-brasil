import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { GeracaoListasClasse, GeracaoListasStatus } from '../lib/api'

const CLASSE_INFO: Record<GeracaoListasClasse, { label: string; icon: typeof CheckCircle2; className: string }> = {
  LIVRE:     { label: 'Livre',     icon: CheckCircle2,  className: 'icon-green' },
  REVISAR:   { label: 'Revisar',   icon: AlertTriangle, className: 'icon-amber' },
  BLOQUEADA: { label: 'Bloqueada', icon: XCircle,       className: 'icon-red' },
}

export function ClasseBadge({ classe }: { classe: GeracaoListasClasse }) {
  const info = CLASSE_INFO[classe]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${info.className}`}>
      <info.icon className="w-3 h-3" />
      {info.label}
    </span>
  )
}

const STATUS_LABEL: Record<GeracaoListasStatus, string> = {
  BRIEFING: 'Em briefing',
  PROMPT_GERADO: 'Prompt gerado',
  AGUARDANDO_UPLOAD: 'Aguardando upload',
  LISTA_CLASSIFICADA: 'Classificada',
}

export function StatusBadge({ status }: { status: GeracaoListasStatus }) {
  const isDone = status === 'LISTA_CLASSIFICADA'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
      isDone ? 'icon-green' : 'bg-muted text-muted-foreground'
    }`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

export function downloadBase64File(nomeArquivo: string, conteudoBase64: string) {
  const binary = atob(conteudoBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function resultadoResumo(card: { status: GeracaoListasStatus; totalLivre: number | null; totalRevisar: number | null; totalBloqueada: number | null }): string {
  if (card.status !== 'LISTA_CLASSIFICADA' || card.totalLivre == null) return '—'
  return `${card.totalLivre} livre / ${card.totalRevisar ?? 0} revisar / ${card.totalBloqueada ?? 0} bloqueada`
}
