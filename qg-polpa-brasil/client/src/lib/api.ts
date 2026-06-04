const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010'

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`

    try {
      const errorBody = await response.json()
      message = errorBody?.detail ?? errorBody?.message ?? message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export type UserRole = 'ADMIN' | 'VENDEDOR'

export type ApiUser = {
  id: number
  name: string
  email: string
  role: UserRole
  ativo: boolean
  must_change_password: boolean
  created_at: string | null
  updated_at: string | null
  last_signed_in: string | null
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  mustChangePassword: boolean
}

export type ApiUsersResponse = {
  status: 'ok'
  count: number
  users: ApiUser[]
}

export type CreateUserPayload = {
  name: string
  email: string
  role: UserRole
}

export type CreateUserResponse = {
  status: 'ok'
  id: number
  tempPassword: string
}

export type UpdateUserPayload = {
  name?: string
  role?: UserRole
  ativo?: boolean
}

export type ApiMessageResponse = {
  status: 'ok'
  message: string
}

export type ResetPasswordResponse = {
  status: 'ok'
  tempPassword: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type ChangePasswordPayload = {
  newPassword: string
}

export type LogoutResponse = {
  success: boolean
}

export type ApiMeta2026 = {
  id: number
  nomeVendedor: string
  mes: string
  valorMeta: number
  projeto: string | null
  mercadoVendas: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ApiMetas2026Response = {
  status: 'ok'
  count: number
  metas: ApiMeta2026[]
}

export type UpsertMeta2026Payload = {
  nomeVendedor: string
  mes: string
  valorMeta: number
  projeto?: string | null
  mercadoVendas?: string | null
}

export async function getUsers(limit = 100): Promise<ApiUser[]> {
  const data = await apiRequest<ApiUsersResponse>(`/api/users?limit=${limit}`)
  return data.users
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  return apiRequest<CreateUserResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function resetUserPassword(userId: number): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>(`/api/users/${userId}/reset-password`, {
    method: 'POST',
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return apiRequest<AuthUser | null>('/api/auth/me')
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function changePassword(payload: ChangePasswordPayload): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMetas2026(ano = '2026'): Promise<ApiMeta2026[]> {
  const data = await apiRequest<ApiMetas2026Response>(`/api/metas?ano=${encodeURIComponent(ano)}`)
  return data.metas
}

export async function upsertMeta2026(payload: UpsertMeta2026Payload): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>('/api/metas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteMeta2026(id: number): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/metas/${id}`, {
    method: 'DELETE',
  })
}

export type VendedoresOriginalFiltros = {
  dataInicio?: string
  dataFim?: string
  mercados?: string[]
  vendedores?: string[]
  projetos?: string[]
  gruposProduto?: string[]
  tiposReceita?: string[]
  uf?: string
  codParc?: number
  codProduto?: number
  limitClientes?: number
}

export type VendedoresOriginalKpis = {
  faturamentoTotal: number
  volumeTotal: number
  precoMedio: number
  clientesAtivos: number
  produtosVendidos: number
  totalRegistros: number
  vendaFirme: number
  forecast: number
  novoProjeto: number
}

export type VendedoresOriginalEvolucao = {
  mes: string
  faturamento: number
  volume?: number
  vendaFirme?: number
  forecast?: number
  novoProjeto?: number
  clientes?: number
}

export type VendedoresOriginalEvolucaoTipo = {
  mes: string
  tipoReceita: string
  faturamento: number
}

export type VendedoresOriginalPerformance = {
  nomeVendedor: string
  faturamento: number
  volume: number
  clientes: number
  produtos: number
  vendaFirme: number
  forecast: number
  novoProjeto: number
  fatNovoProjeto: number
  fatRecorrente: number
}

export type VendedoresOriginalCliente = {
  codParc: number
  razaoSocial: string | null
  perfilParceiro: string | null
  uf: string | null
  faturamento: number
  volume: number
  ultimaCompra: string | null
}

export type VendedoresOriginalClienteMix = {
  codProduto: number
  nomeProduto: string | null
  grupoProduto: string | null
  faturamento: number
  volume: number
  pedidos: number
  ultimaCompra: string | null
}

export type VendedoresOriginalMeta = {
  nomeVendedor: string
  mes: string
  valorMeta: number
  projeto: string | null
  mercadoVendas: string | null
}

export type VendedoresOriginalOrcamentoKpis = {
  faturamentoTotal: number
  volumeTotal: number
  precoMedio: number
  totalRegistros: number
  clientesUnicos: number
  produtosUnicos: number
}

export type VendedoresOriginalOrcamentoMensal = {
  mes: string
  faturamento: number
  volume: number
}

export type VendedoresOriginalCrmMapping = {
  id?: number
  crmUserId?: number
  nome?: string
  nomeFaturamento?: string
}

export type VendedoresOriginalCrmKpis = {
  crmUserId: number
  emAndamento: number
  valorAndamento: number
  ganhos: number
  valorGanho: number
  perdidos: number
  taxaConversao: number
  cicloGanhos: number
}

export type VendedoresOriginalResumo = {
  kpis: VendedoresOriginalKpis
  evolucaoMensal: VendedoresOriginalEvolucao[]
  evolucaoPorTipo: VendedoresOriginalEvolucaoTipo[]
  vendedores: VendedoresOriginalPerformance[]
  clientesConsolidados: VendedoresOriginalCliente[]
  metas: VendedoresOriginalMeta[]
  orcamentoKpis: VendedoresOriginalOrcamentoKpis
  orcamentoMensal: VendedoresOriginalOrcamentoMensal[]
  crmMapping: VendedoresOriginalCrmMapping[]
  crmKpis: VendedoresOriginalCrmKpis[]
}

function appendArrayParam(params: URLSearchParams, key: string, values?: string[]) {
  for (const value of values ?? []) {
    if (value != null && String(value).trim()) params.append(key, String(value).trim())
  }
}

export async function getVendedoresOriginalResumo(filtros: VendedoresOriginalFiltros = {}): Promise<VendedoresOriginalResumo> {
  const params = new URLSearchParams()
  params.set('dataInicio', filtros.dataInicio || '2026-01-01')
  params.set('dataFim', filtros.dataFim || '2026-12-31')
  params.set('limitClientes', String(filtros.limitClientes ?? 50))
  appendArrayParam(params, 'mercados', filtros.mercados)
  appendArrayParam(params, 'vendedores', filtros.vendedores)
  appendArrayParam(params, 'projetos', filtros.projetos)
  appendArrayParam(params, 'gruposProduto', filtros.gruposProduto)
  appendArrayParam(params, 'tiposReceita', filtros.tiposReceita)
  if (filtros.uf) params.set('uf', filtros.uf)
  if (filtros.codParc != null) params.set('codParc', String(filtros.codParc))
  if (filtros.codProduto != null) params.set('codProduto', String(filtros.codProduto))
  return apiRequest<VendedoresOriginalResumo>(`/api/vendedores-original/resumo?${params.toString()}`)
}

export async function getVendedoresOriginalClienteMix(codParc: number, filtros: VendedoresOriginalFiltros = {}): Promise<VendedoresOriginalClienteMix[]> {
  const params = new URLSearchParams()
  params.set('dataInicio', filtros.dataInicio || '2026-01-01')
  params.set('dataFim', filtros.dataFim || '2026-12-31')
  appendArrayParam(params, 'mercados', filtros.mercados)
  appendArrayParam(params, 'vendedores', filtros.vendedores)
  appendArrayParam(params, 'projetos', filtros.projetos)
  appendArrayParam(params, 'gruposProduto', filtros.gruposProduto)
  appendArrayParam(params, 'tiposReceita', filtros.tiposReceita)
  if (filtros.uf) params.set('uf', filtros.uf)
  if (filtros.codProduto != null) params.set('codProduto', String(filtros.codProduto))
  return apiRequest<VendedoresOriginalClienteMix[]>(`/api/vendedores-original/clientes/${codParc}/mix?${params.toString()}`)
}



export type DashboardOriginalFiltros = {
  dataInicio?: string
  dataFim?: string
  mercados?: string[]
  vendedores?: string[]
  projetos?: string[]
  gruposProduto?: string[]
  tiposReceita?: string[]
  mercado?: string
  vendedor?: string
  projeto?: string
  grupoProduto?: string
  tipoReceita?: string
  uf?: string
  codParc?: number
  codProduto?: number
}

export type DashboardOriginalKpis = {
  faturamentoTotal: number
  volumeTotal: number
  precoMedio: number
  faturamentoDevolucao: number
  volumeDevolucao: number
  clientesAtivos: number
  produtosVendidos: number
  totalRegistros: number
}

export type DashboardOriginalEvolucao = {
  mes: string
  faturamento: number
  volume: number
  vendaFirme: number
  forecast: number
  novoProjeto: number
}

export type DashboardOriginalEvolucaoAnoAnterior = {
  mes: string
  faturamento: number
  volume: number
  mesAlinhado: string
  mesOriginal: string
}

export type DashboardOriginalKpiTipo = {
  tipoReceita: string
  faturamento: number
  volume: number
  clientes: number
  registros: number
}

export type DashboardOriginalSegmento = {
  segmento: string | null
  faturamento: number
  volume: number
  clientes: number
  produtos: number
}

export type DashboardOriginalProjeto = {
  projeto: string | null
  faturamento: number
  volume: number
  clientes: number
}

export type DashboardOriginalClienteTop = {
  codParc: number
  razaoSocial: string | null
  faturamento: number
  volume: number
  produtos: number
}

export type DashboardOriginalOrcamentoKpis = {
  faturamentoTotal: number
  volumeTotal: number
  totalRegistros: number
  clientesUnicos: number
  produtosUnicos: number
}

export type DashboardOriginalOrcamentoMensal = {
  mes: string
  faturamento: number
  volume: number
}

export type DashboardOriginalDrilldown = {
  codParc: number
  razaoSocial: string | null
  codProduto: number
  nomeProduto: string | null
  grupoProduto: string | null
  nomeVendedor: string | null
  faturamento: number
  volume: number
  registros: number
  dtPrevEntrega: string | null
}

export type DashboardOriginalClienteMix = {
  codProduto: number
  nomeProduto: string | null
  grupoProduto: string | null
  faturamento: number
  volume: number
}

export type DashboardOriginalFiltrosDisponiveis = {
  mercados: string[]
  vendedores: string[]
  projetos: string[]
  grupos: string[]
  clientes: Array<{ codParc: number; razaoSocial: string | null }>
}

export type DashboardOriginalResumo = {
  kpis: DashboardOriginalKpis
  kpisAnoAnterior: DashboardOriginalKpis
  evolucaoMensal: DashboardOriginalEvolucao[]
  evolucaoMensalAnoAnterior: DashboardOriginalEvolucaoAnoAnterior[]
  kpisPorTipo: DashboardOriginalKpiTipo[]
  totalVendas: number
  segmentos: DashboardOriginalSegmento[]
  projetos: DashboardOriginalProjeto[]
  clientesTop: DashboardOriginalClienteTop[]
  orcamentoKpis: DashboardOriginalOrcamentoKpis
  orcamentoMensal: DashboardOriginalOrcamentoMensal[]
}

function appendDashboardFiltros(params: URLSearchParams, filtros: DashboardOriginalFiltros = {}) {
  params.set('dataInicio', filtros.dataInicio || '2026-01-01')
  params.set('dataFim', filtros.dataFim || '2026-12-31')
  appendArrayParam(params, 'mercados', filtros.mercados ?? (filtros.mercado ? [filtros.mercado] : undefined))
  appendArrayParam(params, 'vendedores', filtros.vendedores ?? (filtros.vendedor ? [filtros.vendedor] : undefined))
  appendArrayParam(params, 'projetos', filtros.projetos ?? (filtros.projeto ? [filtros.projeto] : undefined))
  appendArrayParam(params, 'gruposProduto', filtros.gruposProduto ?? (filtros.grupoProduto ? [filtros.grupoProduto] : undefined))
  appendArrayParam(params, 'tiposReceita', filtros.tiposReceita ?? (filtros.tipoReceita ? [filtros.tipoReceita] : undefined))
  if (filtros.uf) params.set('uf', filtros.uf)
  if (filtros.codParc != null) params.set('codParc', String(filtros.codParc))
  if (filtros.codProduto != null) params.set('codProduto', String(filtros.codProduto))
}

export async function getDashboardOriginalResumo(filtros: DashboardOriginalFiltros = {}, limitClientes?: number): Promise<DashboardOriginalResumo> {
  const params = new URLSearchParams()
  appendDashboardFiltros(params, filtros)
  if (limitClientes != null && limitClientes > 0) params.set('limitClientes', String(limitClientes))
  return apiRequest<DashboardOriginalResumo>(`/api/dashboard-original/resumo?${params.toString()}`)
}

export async function getDashboardOriginalDrilldown(tipoReceita: string, filtros: DashboardOriginalFiltros = {}): Promise<DashboardOriginalDrilldown[]> {
  const params = new URLSearchParams()
  appendDashboardFiltros(params, filtros)
  return apiRequest<DashboardOriginalDrilldown[]>(`/api/dashboard-original/drilldown/${encodeURIComponent(tipoReceita)}?${params.toString()}`)
}

export async function getDashboardOriginalClienteMix(codParc: number, filtros: DashboardOriginalFiltros = {}, limit = 30): Promise<DashboardOriginalClienteMix[]> {
  const params = new URLSearchParams()
  appendDashboardFiltros(params, filtros)
  params.set('limit', String(limit))
  return apiRequest<DashboardOriginalClienteMix[]>(`/api/dashboard-original/clientes/${codParc}/mix?${params.toString()}`)
}

export async function getDashboardOriginalFiltrosDisponiveis(): Promise<DashboardOriginalFiltrosDisponiveis> {
  return apiRequest<DashboardOriginalFiltrosDisponiveis>('/api/dashboard-original/filtros-disponiveis')
}


// ============================================================
// Novos Projetos (/projetos) - API REST
// ============================================================

export type NovosProjetosFiltros = {
  dataInicio?: string
  dataFim?: string
  mercados?: string[]
  vendedores?: string[]
  projetos?: string[]
  gruposProduto?: string[]
  tiposReceita?: string[]
  uf?: string | null
  codParc?: number | null
  codProduto?: number | null
  modoCard?: 'abertos' | 'totais' | null
}

export type NovosProjetosKpis = {
  projetosAbertos: number
  projetosTotais: number
  faturamentoTotal: number
  taxaConversao: number
  taxaConversaoTotal: number
  taxaConversaoConvertidos: number
  ticketMedio: number
}

export type NovosProjetosPorMesItem = {
  mes: string
  projetos: number
  faturamento: number
}

export type NovosProjetosItem = {
  codParc: number
  razaoSocial: string
  codProduto: string
  nomeProduto: string
  nomeVendedor: string
  dtPrimeiro: string
  mesAtualCiclo: number
  ultimaCompra: string
  volumeTotal: number
  faturamentoTotal: number
  status: string
  origem: string
}

function appendNovosProjetosArrayParam(params: URLSearchParams, key: string, values?: string[] | null) {
  for (const value of values ?? []) {
    if (value) params.append(key, value)
  }
}

function buildNovosProjetosParams(filtros: NovosProjetosFiltros = {}, extra?: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams()

  if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio)
  if (filtros.dataFim) params.set('dataFim', filtros.dataFim)
  if (filtros.uf) params.set('uf', filtros.uf)
  if (filtros.codParc) params.set('codParc', String(filtros.codParc))
  if (filtros.codProduto) params.set('codProduto', String(filtros.codProduto))
  if (filtros.modoCard) params.set('modoCard', filtros.modoCard)

  appendNovosProjetosArrayParam(params, 'mercados', filtros.mercados)
  appendNovosProjetosArrayParam(params, 'vendedores', filtros.vendedores)
  appendNovosProjetosArrayParam(params, 'projetos', filtros.projetos)
  appendNovosProjetosArrayParam(params, 'gruposProduto', filtros.gruposProduto)
  appendNovosProjetosArrayParam(params, 'tiposReceita', filtros.tiposReceita)

  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function getNovosProjetosKpis(filtros: NovosProjetosFiltros = {}): Promise<NovosProjetosKpis> {
  return apiRequest<NovosProjetosKpis>(`/api/novos-projetos/kpis${buildNovosProjetosParams(filtros)}`)
}

export async function getNovosProjetosPorMes(filtros: NovosProjetosFiltros = {}): Promise<NovosProjetosPorMesItem[]> {
  return apiRequest<NovosProjetosPorMesItem[]>(`/api/novos-projetos/por-mes${buildNovosProjetosParams(filtros)}`)
}

export async function getNovosProjetosLista(filtros: NovosProjetosFiltros = {}): Promise<NovosProjetosItem[]> {
  return apiRequest<NovosProjetosItem[]>(`/api/novos-projetos/lista${buildNovosProjetosParams(filtros)}`)
}

export async function getNovosProjetosDrilldown(mes: string, filtros: NovosProjetosFiltros = {}): Promise<NovosProjetosItem[]> {
  return apiRequest<NovosProjetosItem[]>(`/api/novos-projetos/drilldown${buildNovosProjetosParams(filtros, { mes })}`)
}

// ============================================================
// Histórico Clientes / Produtos (/historico-clientes) - API REST
// ============================================================

export type HistoricoClientesFiltros = {
  anos?: number[]
  meses?: number[]
  codParcs?: number[]
  mercados?: string[]
  gruposProduto?: string[]
  vendedores?: string[]
  ufs?: string[]
  codProdutos?: string[]
}

export type HistoricoClientesFiltrosDisponiveis = {
  anos: number[]
  clientes: Array<{ codParc: number; razaoSocial: string }>
  mercados: string[]
  gruposProduto: string[]
  vendedores: string[]
}

export type HistoricoClientesKpis = {
  totalValor: number
  totalVolume: number
  precoMedio: number
  qtdProdutos: number
  qtdClientes: number
  pctFaturamento: number
  pctVolume: number
}

export type HistoricoClienteItem = {
  codParc: number
  razaoSocial: string
  valor: number
  volume: number
  precoMedio: number
  qtdProdutos: number
  pctValor: number
  pctVolume: number
}

export type HistoricoClientesEvolucaoItem = {
  mes: number
  volume: number
  precoMedio: number
  valor: number
}

export type HistoricoClientesEstadoItem = {
  uf: string
  valor: number
  volume: number
  pct: number
}

export type HistoricoClientesSegmentoItem = {
  segmento: string
  valor: number
  volume: number
  pct: number
}

export type HistoricoClienteProdutoItem = {
  codProduto: string
  nomeProduto: string
  volume: number
  valor: number
  precoMedio: number
  dtUltimaCompra: string | null
}

function appendHistoricoClientesArrayParam(params: URLSearchParams, key: string, values?: Array<string | number> | null) {
  for (const value of values ?? []) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      params.append(key, String(value).trim())
    }
  }
}

function buildHistoricoClientesParams(filtros: HistoricoClientesFiltros = {}) {
  const params = new URLSearchParams()
  appendHistoricoClientesArrayParam(params, 'anos', filtros.anos)
  appendHistoricoClientesArrayParam(params, 'meses', filtros.meses)
  appendHistoricoClientesArrayParam(params, 'codParcs', filtros.codParcs)
  appendHistoricoClientesArrayParam(params, 'mercados', filtros.mercados)
  appendHistoricoClientesArrayParam(params, 'gruposProduto', filtros.gruposProduto)
  appendHistoricoClientesArrayParam(params, 'vendedores', filtros.vendedores)
  appendHistoricoClientesArrayParam(params, 'ufs', filtros.ufs)
  appendHistoricoClientesArrayParam(params, 'codProdutos', filtros.codProdutos)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function getHistoricoClientesFiltros(): Promise<HistoricoClientesFiltrosDisponiveis> {
  return apiRequest<HistoricoClientesFiltrosDisponiveis>('/api/historico-clientes/filtros')
}

export async function getHistoricoClientesKpis(filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClientesKpis> {
  return apiRequest<HistoricoClientesKpis>(`/api/historico-clientes/kpis${buildHistoricoClientesParams(filtros)}`)
}

export async function getHistoricoClientesLista(filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClienteItem[]> {
  return apiRequest<HistoricoClienteItem[]>(`/api/historico-clientes/clientes${buildHistoricoClientesParams(filtros)}`)
}

export async function getHistoricoClientesEvolucaoMensal(filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClientesEvolucaoItem[]> {
  return apiRequest<HistoricoClientesEvolucaoItem[]>(`/api/historico-clientes/evolucao-mensal${buildHistoricoClientesParams(filtros)}`)
}

export async function getHistoricoClientesPorEstado(filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClientesEstadoItem[]> {
  return apiRequest<HistoricoClientesEstadoItem[]>(`/api/historico-clientes/por-estado${buildHistoricoClientesParams(filtros)}`)
}

export async function getHistoricoClientesPorSegmento(filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClientesSegmentoItem[]> {
  return apiRequest<HistoricoClientesSegmentoItem[]>(`/api/historico-clientes/por-segmento${buildHistoricoClientesParams(filtros)}`)
}

export async function getHistoricoClienteProdutos(codParc: number, filtros: HistoricoClientesFiltros = {}): Promise<HistoricoClienteProdutoItem[]> {
  return apiRequest<HistoricoClienteProdutoItem[]>(`/api/historico-clientes/clientes/${codParc}/produtos${buildHistoricoClientesParams(filtros)}`)
}



// ============================================================
// Comparativo Semanal / Snapshot (/snapshot) - API REST
// ============================================================

export type SnapshotFiltros = {
  dataInicio?: string
  dataFim?: string
  mercados?: string[]
  vendedores?: string[]
  projetos?: string[]
  gruposProduto?: string[]
  tiposReceita?: string[]
  uf?: string | null
  codParc?: number | null
}

export type SnapshotInfo = {
  snapshotDate: string
  totalRows: number
}

export type SnapshotValorVolume = {
  valor: number
  volume: number
}

export type SnapshotClienteRow = {
  codParc: number
  razaoSocial: string
  snapshots: Record<string, SnapshotValorVolume>
  currValor: number
  currVolume: number
  dtEntrega: string | null
}

export type SnapshotProdutoRow = {
  codProduto: number
  nomeProduto: string
  snapshots: Record<string, SnapshotValorVolume>
  currValor: number
  currVolume: number
  dtEntrega: string | null
}

export type SnapshotHistoricoResponse<T> = {
  dates: string[]
  rows: T[]
}

export type SnapshotCriarResponse = {
  inserted: number
  snapshotDate: string
}

function buildSnapshotParams(filtros: SnapshotFiltros = {}) {
  const params = new URLSearchParams()
  if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio)
  if (filtros.dataFim) params.set('dataFim', filtros.dataFim)
  if (filtros.uf) params.set('uf', filtros.uf)
  if (filtros.codParc != null) params.set('codParc', String(filtros.codParc))
  appendArrayParam(params, 'mercados', filtros.mercados)
  appendArrayParam(params, 'vendedores', filtros.vendedores)
  appendArrayParam(params, 'projetos', filtros.projetos)
  appendArrayParam(params, 'gruposProduto', filtros.gruposProduto)
  appendArrayParam(params, 'tiposReceita', filtros.tiposReceita)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function getSnapshotDatas(): Promise<SnapshotInfo[]> {
  return apiRequest<SnapshotInfo[]>('/api/snapshot/datas')
}

export async function getSnapshotHistorico(filtros: SnapshotFiltros = {}): Promise<SnapshotHistoricoResponse<SnapshotClienteRow>> {
  return apiRequest<SnapshotHistoricoResponse<SnapshotClienteRow>>(`/api/snapshot/historico${buildSnapshotParams(filtros)}`)
}

export async function getSnapshotHistoricoProdutos(codParc: number, filtros: SnapshotFiltros = {}): Promise<SnapshotHistoricoResponse<SnapshotProdutoRow>> {
  return apiRequest<SnapshotHistoricoResponse<SnapshotProdutoRow>>(`/api/snapshot/historico-produtos/${codParc}${buildSnapshotParams(filtros)}`)
}

export async function criarSnapshotManual(): Promise<SnapshotCriarResponse> {
  return apiRequest<SnapshotCriarResponse>('/api/snapshot/criar', { method: 'POST' })
}


// ============================================================
// Recorrentes R x O (/recorrentes) - API REST
// ============================================================

export type RecorrentesFiltros = {
  dataInicio?: string
  dataFim?: string
  mercados?: string[]
  vendedores?: string[]
  codParc?: number | null
}

export type RecorrentesFiltrosDisponiveis = {
  mercados: string[]
  vendedores: string[]
}

export type RecorrentesKpis = {
  fatAtual: number
  volAtual: number
  orcVal: number
  orcKg: number
}

export type RecorrentesClienteRow = {
  codParc: number
  razaoSocial: string
  volAtual: number
  orcKg: number
  fatAtual: number
  orcVal: number
}

export type RecorrentesProdutoRow = {
  codProduto: number
  nomeProduto: string
  volAtual: number
  orcKg: number
  fatAtual: number
  orcVal: number
}

function buildRecorrentesParams(filtros: RecorrentesFiltros = {}) {
  const params = new URLSearchParams()
  params.set('dataInicio', filtros.dataInicio || '2026-01-01')
  params.set('dataFim', filtros.dataFim || '2026-12-31')
  appendArrayParam(params, 'mercados', filtros.mercados)
  appendArrayParam(params, 'vendedores', filtros.vendedores)
  if (filtros.codParc != null) params.set('codParc', String(filtros.codParc))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function getRecorrentesFiltros(): Promise<RecorrentesFiltrosDisponiveis> {
  return apiRequest<RecorrentesFiltrosDisponiveis>('/api/recorrentes/filtros')
}

export async function getRecorrentesKpis(filtros: RecorrentesFiltros = {}): Promise<RecorrentesKpis> {
  return apiRequest<RecorrentesKpis>(`/api/recorrentes/kpis${buildRecorrentesParams(filtros)}`)
}

export async function getRecorrentesTabela(filtros: RecorrentesFiltros = {}): Promise<RecorrentesClienteRow[]> {
  return apiRequest<RecorrentesClienteRow[]>(`/api/recorrentes/tabela${buildRecorrentesParams(filtros)}`)
}

export async function getRecorrentesProdutos(codParc: number, filtros: RecorrentesFiltros = {}): Promise<RecorrentesProdutoRow[]> {
  return apiRequest<RecorrentesProdutoRow[]>(`/api/recorrentes/produtos/${codParc}${buildRecorrentesParams(filtros)}`)
}