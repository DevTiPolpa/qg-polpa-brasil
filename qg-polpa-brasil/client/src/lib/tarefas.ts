// Fonte de verdade única para a feature de Tarefas: status, tipos de ocorrência por
// tela de origem e helpers de exibição — mesmo espírito de lib/colors.ts.
import type { ApiTask, TaskOrigem, TaskStatus } from './api'

export const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_RETORNO: 'Aguardando Retorno',
  CONCLUIDA: 'Concluída',
}

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  PENDENTE: 'bg-slate-700/50 text-slate-300',
  EM_ANALISE: 'bg-blue-900/40 text-blue-300',
  AGUARDANDO_RETORNO: 'bg-amber-900/40 text-amber-300',
  CONCLUIDA: 'bg-green-900/40 text-green-300',
}

export const VENCIDA_BADGE_CLASS = 'bg-red-900/40 text-red-300'
export const VENCIDA_LABEL = 'Vencida'

export const ORIGEM_LABEL: Record<TaskOrigem, string> = {
  COMPARATIVO_SEMANAL: 'Comparativo Semanal',
  MOVIMENTACAO_CLIENTES_PRODUTOS: 'Movimentação de Clientes e Produtos',
  RECORRENTES_RXO: 'Recorrentes R x O',
}

export const ORIGEM_ROTA: Record<TaskOrigem, string> = {
  COMPARATIVO_SEMANAL: '/snapshot',
  MOVIMENTACAO_CLIENTES_PRODUTOS: '/movimentacao',
  RECORRENTES_RXO: '/recorrentes',
}

export const TIPOS_OCORRENCIA_POR_ORIGEM: Record<TaskOrigem, string[]> = {
  COMPARATIVO_SEMANAL: ['Novo Forecast', 'Aumento', 'Redução', 'Cancelamento', 'Postergação', 'Adiantamento'],
  MOVIMENTACAO_CLIENTES_PRODUTOS: ['Cliente Aberto', 'Cliente Perdido', 'Produto Lançado', 'Produto Descontinuado'],
  RECORRENTES_RXO: [
    'Acima do Orçado',
    'Abaixo do Orçado',
    'Volume Acima do Orçado',
    'Volume Abaixo do Orçado',
    'Faturamento Acima do Orçado',
    'Faturamento Abaixo do Orçado',
  ],
}

/** Vencida é um estado derivado (nunca gravado no banco): prazo já passou e a tarefa
 * ainda não foi concluída. */
export function isVencida(task: Pick<ApiTask, 'prazo' | 'status'>): boolean {
  if (task.status === 'CONCLUIDA') return false
  const hoje = new Date().toISOString().slice(0, 10)
  return task.prazo < hoje
}

export function tarefaKey(codParc?: number | null, codProduto?: number | null): string {
  return `${codParc ?? ''}-${codProduto ?? ''}`
}
