import { useLocation } from 'wouter'
import { ArrowLeft, MessageSquare, ClipboardCheck, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'

export default function GeracaoListasNovo() {
  const [, navigate] = useLocation()

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/geracao-listas')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao histórico
        </button>
        <h1 className="text-xl font-bold text-foreground">Nova lista</h1>
        <p className="text-sm text-muted-foreground">Como você quer começar?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          onClick={() => navigate('/geracao-listas/novo/chat')}
          className="border border-border bg-card hover:border-primary/60 hover:bg-muted/40 cursor-pointer transition-colors"
        >
          <CardContent className="p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg icon-green flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">Gerar lista com o chat</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground">
              Descreva o que você quer prospectar num chat de briefing. O sistema monta um prompt
              pronto pra Manus, já excluindo quem já é cliente ou está no CRM.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/geracao-listas/novo/validar')}
          className="border border-border bg-card hover:border-primary/60 hover:bg-muted/40 cursor-pointer transition-colors"
        >
          <CardContent className="p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg icon-amber flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">Só validar uma lista existente</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground">
              Já tem uma lista pronta (da Manus ou de outra fonte)? Pule o briefing e vá direto
              pra etapa de upload e classificação.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
