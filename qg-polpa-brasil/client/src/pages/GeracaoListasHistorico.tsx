import { useState } from 'react'
import { useLocation } from 'wouter'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ListChecks, Search } from 'lucide-react'
import { listarGeracaoListasCards, excluirGeracaoListasCard, getCurrentUser } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { StatusBadge, Skeleton, resultadoResumo } from '../components/GeracaoListasUi'

function formatDataHora(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function GeracaoListasHistorico() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()
  const [verTodas, setVerTodas] = useState(false)

  const userQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: getCurrentUser, staleTime: Infinity })
  const isAdmin = userQuery.data?.role === 'ADMIN'

  const query = useQuery({
    queryKey: ['geracao-listas', 'cards', isAdmin && verTodas],
    queryFn: () => listarGeracaoListasCards({ todas: isAdmin && verTodas }),
  })

  const deleteMutation = useMutation({
    mutationFn: excluirGeracaoListasCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['geracao-listas', 'cards'] }),
  })

  function handleExcluir(id: number) {
    if (!confirm('Excluir esta lista? Essa ação não pode ser desfeita.')) return
    deleteMutation.mutate(id)
  }

  function podeExcluir(createdBy: string | null): boolean {
    if (!userQuery.data) return false
    return isAdmin || createdBy === userQuery.data.name
  }

  const cards = query.data ?? []

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Geração de Listas</h1>
          <p className="text-sm text-muted-foreground">Deduplicação de prospecção — histórico de listas geradas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verTodas}
                onChange={(e) => setVerTodas(e.target.checked)}
                className="accent-primary"
              />
              Ver todas
            </label>
          )}
          <Button variant="outline" onClick={() => navigate('/geracao-listas/buscar')}>
            <Search className="w-4 h-4 mr-2" />
            Busca avulsa
          </Button>
          <Button onClick={() => navigate('/geracao-listas/novo')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova lista
          </Button>
        </div>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {query.error && !query.isLoading && (
        <Card className="border border-destructive/40 bg-card">
          <CardContent className="p-4 text-sm text-destructive">
            Não foi possível carregar o histórico. {query.error.message}
          </CardContent>
        </Card>
      )}

      {!query.isLoading && !query.error && (
        <Card className="border border-border bg-card">
          <CardContent className="p-0">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <ListChecks className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhuma lista gerada ainda.</p>
                <Button onClick={() => navigate('/geracao-listas/novo')} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar a primeira lista
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título / segmento</TableHead>
                    <TableHead>Vendedora</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map(card => (
                    <TableRow key={card.id} className="cursor-pointer" onClick={() => navigate(`/geracao-listas/${card.id}`)}>
                      <TableCell className="font-medium">{card.titulo || card.segmento || 'Sem título'}</TableCell>
                      <TableCell>{card.createdBy ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDataHora(card.createdAt)}</TableCell>
                      <TableCell><StatusBadge status={card.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{resultadoResumo(card)}</TableCell>
                      <TableCell className="text-right">
                        {podeExcluir(card.createdBy) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExcluir(card.id) }}
                            disabled={deleteMutation.isPending}
                            title="Excluir"
                            className="text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
