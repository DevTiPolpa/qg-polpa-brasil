import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTasks, type TaskOrigem } from '../lib/api'
import { tarefaKey } from '../lib/tarefas'

/** Busca, uma única vez por tela, todas as tarefas de uma origem — evita 1 request
 * por linha. Expõe um lookup de contagem por (codParc, codProduto) para o indicador
 * "📋 N tarefas" de cada linha das 3 telas de origem. */
export function useTarefasPorOrigem(origem: TaskOrigem) {
  const { data: tarefas = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks-por-origem', origem],
    queryFn: () => getTasks({ origem }),
    staleTime: 30_000,
  })

  const contagemPorChave = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const tarefa of tarefas) {
      const chave = tarefaKey(tarefa.codParc, tarefa.codProduto)
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
    }
    return mapa
  }, [tarefas])

  function contagem(codParc?: number | null, codProduto?: number | null): number {
    return contagemPorChave.get(tarefaKey(codParc, codProduto)) ?? 0
  }

  return { tarefas, isLoading, contagem, refetch }
}
