import { useState } from 'react'
import { useLocation } from 'wouter'
import { ClipboardPlus, ClipboardList } from 'lucide-react'
import CriarTarefaModal from './CriarTarefaModal'
import type { TaskOrigem } from '../lib/api'
import { ORIGEM_ROTA } from '../lib/tarefas'

interface Props {
  origem: TaskOrigem
  tiposOcorrencia: string[]
  tipoOcorrenciaSugerido: string
  codParc?: number
  razaoSocial?: string
  codProduto?: number
  nomeProduto?: string
  infoVariacao: string
  contagem: number
  onCreated?: () => void
}

/** Célula compacta usada nas 3 telas de origem: badge "📋 N tarefas" (navega para a
 * tela Tarefas já filtrada por essa linha) + botão "Criar Tarefa". Sempre chamar com
 * stopPropagation no clique, pois as linhas das 3 telas expandem ao clicar. */
export default function TarefaIndicador({
  origem,
  tiposOcorrencia,
  tipoOcorrenciaSugerido,
  codParc,
  razaoSocial,
  codProduto,
  nomeProduto,
  infoVariacao,
  contagem,
  onCreated,
}: Props) {
  const [, navigate] = useLocation()
  const [modalAberto, setModalAberto] = useState(false)

  function verTarefas(e: React.MouseEvent) {
    e.stopPropagation()
    const params = new URLSearchParams({ origem })
    if (codParc != null) params.set('codParc', String(codParc))
    if (codProduto != null) params.set('codProduto', String(codProduto))
    navigate(`/tarefas?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {contagem > 0 && (
        <button
          type="button"
          onClick={verTarefas}
          title="Ver tarefas desta linha"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70 transition whitespace-nowrap"
        >
          <ClipboardList className="w-3 h-3" /> {contagem}
        </button>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setModalAberto(true) }}
        title="Criar Tarefa"
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
      >
        <ClipboardPlus className="w-3.5 h-3.5" />
      </button>

      <CriarTarefaModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        origem={origem}
        tiposOcorrencia={tiposOcorrencia}
        tipoOcorrenciaSugerido={tipoOcorrenciaSugerido}
        codParc={codParc}
        razaoSocial={razaoSocial}
        codProduto={codProduto}
        nomeProduto={nomeProduto}
        infoVariacao={infoVariacao}
        origemUrl={ORIGEM_ROTA[origem]}
        onCreated={onCreated}
      />
    </div>
  )
}
