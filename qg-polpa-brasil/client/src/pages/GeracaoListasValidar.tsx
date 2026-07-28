import { useState } from 'react'
import { useLocation } from 'wouter'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { criarGeracaoListasCardValidacao } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function GeracaoListasValidar() {
  const [, navigate] = useLocation()
  const [titulo, setTitulo] = useState('')

  const mutation = useMutation({
    mutationFn: criarGeracaoListasCardValidacao,
    onSuccess: (data) => navigate(`/geracao-listas/${data.cardId}`),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ titulo: titulo.trim() || undefined })
  }

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div>
        <button
          onClick={() => navigate('/geracao-listas/novo')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-foreground">Validar lista existente</h1>
        <p className="text-sm text-muted-foreground">Pula o briefing — o próximo passo é fazer o upload da lista.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Título da lista (opcional)</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Indústrias de sucos — SP"
                autoFocus
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">Não foi possível criar a lista. Tente novamente.</p>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando...' : 'Criar e continuar'}
              {!mutation.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
