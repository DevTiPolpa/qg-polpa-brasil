import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getComentarios, type TaskOrigem } from '../lib/api'
import { tarefaKey } from '../lib/tarefas'

/** Busca, uma única vez por tela, todos os comentários de uma origem — evita 1
 * request por linha. Expõe um lookup de contagem por (codParc, codProduto) para
 * o indicador de comentários de cada linha das 3 telas de análise. */
export function useComentariosPorOrigem(origem: TaskOrigem) {
  const { data: comentarios = [], isLoading, refetch } = useQuery({
    queryKey: ['comentarios-por-origem', origem],
    queryFn: () => getComentarios({ origem }),
    staleTime: 30_000,
  })

  const contagemPorChave = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const c of comentarios) {
      const chave = tarefaKey(c.codParc, c.codProduto)
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
    }
    return mapa
  }, [comentarios])

  function contagem(codParc?: number | null, codProduto?: number | null): number {
    return contagemPorChave.get(tarefaKey(codParc, codProduto)) ?? 0
  }

  return { comentarios, isLoading, contagem, refetch }
}
