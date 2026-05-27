export type UserRole = 'ADMIN' | 'VENDEDOR'

export interface UserSession {
  id: number
  name: string
  email: string
  role: UserRole
  mustChangePassword: boolean
}

export interface FiltrosGlobais {
  dataInicio: string
  dataFim: string
  mercados?: string[]
  vendedores?: string[]
  projetos?: string[]
  gruposProduto?: string[]
  tiposReceita?: string[]
}

export type TipoReceita = 'VENDA_FIRME' | 'FORECAST' | 'NOVO_PROJETO' | 'DEVOLUCAO'
export type TipoMov = 'V' | 'D' | 'P'
export type StatusInsight = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'DESCARTADO'
export type PrioridadeInsight = 'ALTA' | 'MEDIA' | 'BAIXA'
export type TipoInsight =
  | 'POTENCIAL_NAO_EXPLORADO'
  | 'RISCO_QUEDA'
  | 'PRODUTO_CRESCIMENTO'
  | 'OPORTUNIDADE_VOLUME'
  | 'EXPANSAO_MIX'
  | 'SEGMENTO_EXPANSAO'
  | 'SEGMENTO_RETRACAO'
  | 'CLIENTE_INATIVO'

export type StatusTarefa = 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
