import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { getComentarios, createComentario, type TaskOrigem } from '../lib/api'
import { ORIGEM_LABEL } from '../lib/tarefas'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  origem: TaskOrigem
  motivos: string[]
  codParc?: number
  razaoSocial?: string
  codProduto?: number
  nomeProduto?: string
  onAdded?: () => void
}

// Timestamps vêm do backend em UTC sem sufixo de fuso (SYSUTCDATETIME().isoformat()) —
// anexar "Z" antes de parsear garante que o navegador converta corretamente para o
// horário local, em vez de tratar o valor como se já fosse local (mesma classe de bug
// já corrigida em "Última Compra").
function formatDataHora(iso: string | null): string {
  if (!iso) return '-'
  const data = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(data.getTime())) return '-'
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ComentariosModal({
  open,
  onClose,
  origem,
  motivos,
  codParc,
  razaoSocial,
  codProduto,
  nomeProduto,
  onAdded,
}: Props) {
  const { data: comentarios = [], isLoading, refetch } = useQuery({
    queryKey: ['comentarios', origem, codParc, codProduto],
    queryFn: () => getComentarios({ origem, codParc, codProduto }),
    enabled: open,
  })

  const [motivo, setMotivo] = useState(motivos[0] ?? '')
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) {
      setError('Escreva o comentário.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createComentario({
        origem,
        codParc,
        razaoSocial,
        codProduto,
        nomeProduto,
        motivo,
        comentario: texto.trim(),
      })
      setTexto('')
      await refetch()
      onAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar comentário.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">Comentários</DialogTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p><span className="font-semibold text-foreground">Origem:</span> {ORIGEM_LABEL[origem]}</p>
            {razaoSocial && <p className="break-words"><span className="font-semibold text-foreground">Cliente:</span> {razaoSocial}{codParc != null && <span> (Cód. {codParc})</span>}</p>}
            {nomeProduto && <p className="break-words"><span className="font-semibold text-foreground">Produto:</span> {nomeProduto}{codProduto != null && <span> (Cód. {codProduto})</span>}</p>}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Motivo</label>
              <select
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {motivos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Comentário *</label>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={3}
                placeholder="Escreva o comentário..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[oklch(0.65_0.20_145)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
              >
                {saving ? 'Salvando...' : 'Adicionar comentário'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico {comentarios.length > 0 && `(${comentarios.length})`}
            </h3>
            {isLoading && <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>}
            {!isLoading && comentarios.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum comentário ainda.</p>
            )}
            {!isLoading && comentarios.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {comentarios.map(c => (
                  <div key={c.id} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground">{c.autorNome ?? '—'}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{c.motivo}</span>
                        {formatDataHora(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground break-words whitespace-pre-wrap">{c.comentario}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
