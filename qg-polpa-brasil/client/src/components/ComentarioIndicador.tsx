import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ComentariosModal from './ComentariosModal'
import type { TaskOrigem } from '../lib/api'

interface Props {
  origem: TaskOrigem
  motivos: string[]
  codParc?: number
  razaoSocial?: string
  codProduto?: number
  nomeProduto?: string
  contagem: number
  onAdded?: () => void
}

/** Célula "Comentários" usada nas 3 telas de análise: um botão único por linha
 * (ícone + contagem) que abre o modal de histórico/inclusão. Sempre chamar com
 * stopPropagation no clique, pois as linhas das 3 telas expandem ao clicar. */
export default function ComentarioIndicador({
  origem,
  motivos,
  codParc,
  razaoSocial,
  codProduto,
  nomeProduto,
  contagem,
  onAdded,
}: Props) {
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        title="Comentários"
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium transition whitespace-nowrap ${
          contagem > 0
            ? 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70'
            : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
        }`}
      >
        <MessageSquare className="w-3 h-3" /> {contagem}
      </button>

      <ComentariosModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        origem={origem}
        motivos={motivos}
        codParc={codParc}
        razaoSocial={razaoSocial}
        codProduto={codProduto}
        nomeProduto={nomeProduto}
        onAdded={onAdded}
      />
    </div>
  )
}
