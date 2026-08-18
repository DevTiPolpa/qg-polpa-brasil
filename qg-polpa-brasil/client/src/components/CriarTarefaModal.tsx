import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { createTask, getUsers, type ApiUser, type TaskOrigem } from '../lib/api'
import { ORIGEM_LABEL } from '../lib/tarefas'

interface Props {
  open: boolean
  onClose: () => void
  origem: TaskOrigem
  tiposOcorrencia: string[]
  tipoOcorrenciaSugerido: string
  codParc?: number
  razaoSocial?: string
  codProduto?: number
  nomeProduto?: string
  infoVariacao: string
  origemUrl: string
  onCreated?: () => void
}

export default function CriarTarefaModal({
  open,
  onClose,
  origem,
  tiposOcorrencia,
  tipoOcorrenciaSugerido,
  codParc,
  razaoSocial,
  codProduto,
  nomeProduto,
  infoVariacao,
  origemUrl,
  onCreated,
}: Props) {
  const [usuarios, setUsuarios] = useState<ApiUser[]>([])
  const [tipoOcorrencia, setTipoOcorrencia] = useState(tipoOcorrenciaSugerido)
  const [responsavelId, setResponsavelId] = useState<number | ''>('')
  const [prazo, setPrazo] = useState('')
  const [fato, setFato] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTipoOcorrencia(tipoOcorrenciaSugerido)
    setResponsavelId('')
    setPrazo('')
    setFato('')
    setError('')
    getUsers().then(setUsuarios).catch(() => setUsuarios([]))
  }, [open, tipoOcorrenciaSugerido])

  const usuariosAtivos = usuarios.filter(u => u.ativo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!responsavelId) {
      setError('Selecione um responsável.')
      return
    }
    if (!prazo) {
      setError('Informe o prazo.')
      return
    }
    if (!fato.trim()) {
      setError('Descreva o fato identificado.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createTask({
        origem,
        tipoOcorrencia,
        codParc,
        razaoSocial,
        codProduto,
        nomeProduto,
        infoVariacao,
        origemUrl,
        fato: fato.trim(),
        responsavelId: Number(responsavelId),
        prazo,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Criar Tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origem — somente leitura, carregada automaticamente da linha de origem */}
          <div className="rounded-lg border border-border bg-background/40 p-3 space-y-1.5 text-xs min-w-0 break-words">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Origem:</span> {ORIGEM_LABEL[origem]}
            </p>
            {razaoSocial && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Cliente:</span> {razaoSocial}
                {codParc != null && <span> (Cód. {codParc})</span>}
              </p>
            )}
            {nomeProduto && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Produto:</span> {nomeProduto}
                {codProduto != null && <span> (Cód. {codProduto})</span>}
              </p>
            )}
            {infoVariacao && (
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Situação identificada:</span> {infoVariacao}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Tipo de Ocorrência</label>
            <select
              value={tipoOcorrencia}
              onChange={e => setTipoOcorrencia(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {tiposOcorrencia.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável *</label>
              <select
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Selecione...</option>
                {usuariosAtivos.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Prazo *</label>
              <input
                type="date"
                value={prazo}
                onChange={e => setPrazo(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Fato *</label>
            <textarea
              value={fato}
              onChange={e => setFato(e.target.value)}
              required
              rows={3}
              placeholder="Ex: Cliente reduziu o forecast em R$ 180 mil em relação à semana anterior."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[oklch(0.65_0.20_145)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
              {saving ? 'Criando...' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
