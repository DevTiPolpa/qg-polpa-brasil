// Schema SQL Server - tabelas criadas via migrate_flat_to_star.sql
// Este arquivo define os tipos TypeScript que espelham o banco

export interface User {
  id: number
  name: string
  email: string
  passwordHash: string
  role: 'ADMIN' | 'VENDEDOR'
  ativo: boolean
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
  lastSignedIn: Date | null
}

export interface DimCliente {
  id: number
  codParc: number
  razaoSocial: string
  perfilParceiro: string | null
  cidade: string | null
  uf: string | null
  pais: string | null
  tippessoa: string | null
}

export interface DimProduto {
  id: number
  codProduto: number
  nomeProduto: string
  grupoProduto: string | null
  ncm: string | null
  descricao: string | null
  descricaoSabor: string | null
  formatoProduto: string | null
}

export interface DimVendedor {
  id: number
  nomeVendedor: string
}

export interface FatoVendas {
  id: number
  uploadId: number | null
  nroUnico: number
  nroNota: number | null
  tipmov: 'V' | 'D' | 'P'
  tipoReceita: 'VENDA_FIRME' | 'FORECAST' | 'NOVO_PROJETO' | 'DEVOLUCAO'
  dtNeg: Date | null
  dtPrevEntregaEmbarque: Date | null
  dtEntregaCliente: Date | null
  dtEmbarqueOriginal: Date | null
  dtMov: Date | null
  codParc: number
  codProduto: number
  nomeVendedor: string | null
  codTop: number | null
  top: string | null
  projeto: string | null
  mercadoVendas: string | null
  grupoProduto: string | null
  perfilParceiro: string | null
  uf: string | null
  qtdNegociada: number | null
  qtdPendenteKg: number | null
  valorPendente: number | null
  valorIcms: number | null
  valorPis: number | null
  valorCofins: number | null
  vlrSt: number | null
  percDescBonificado: number | null
  flagDevolucao: boolean
}

export interface Orcamento2026 {
  id: number
  grupoProduto: string | null
  mercadoVendas: string | null
  codParc: number | null
  razaoSocial: string | null
  codProduto: number | null
  nomeProduto: string | null
  codTop: number | null
  top: string | null
  projeto: string | null
  dtPrevEntregaEmbarque: Date | null
  qtdNegociada: number | null
  qtdPendente: number | null
  qtdPendenteKg: number | null
  valorPendente: number | null
  uf: string | null
  cidade: string | null
}

export interface Upload {
  id: number
  nomeArquivo: string
  status: 'processando' | 'concluido' | 'erro'
  totalRegistros: number
  registrosImportados: number
  registrosErro: number
  erroMensagem: string | null
  uploadedBy: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Insight {
  id: number
  tipoInsight: string
  codParc: number | null
  nomeCliente: string | null
  nomeVendedor: string | null
  codProduto: number | null
  nomeProduto: string | null
  segmento: string | null
  descricao: string
  impactoEstimadoR: number | null
  impactoEstimadoKg: number | null
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'DESCARTADO'
  geradoEm: Date
  updatedAt: Date
}

export interface Task {
  id: number
  titulo: string
  descricao: string | null
  status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  responsavel: string | null
  prazo: Date | null
  criadoPor: string | null
  criadoPorId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: number
  sessionId: string
  userId: number | null
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}
